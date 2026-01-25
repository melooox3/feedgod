import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { FeedgodArena } from "../target/types/feedgod_arena";
import {
  PublicKey,
  Keypair,
  SystemProgram,
  LAMPORTS_PER_SOL,
} from "@solana/web3.js";
import {
  TOKEN_PROGRAM_ID,
  createMint,
  createAccount,
  mintTo,
  getAccount,
} from "@solana/spl-token";
import { expect } from "chai";

describe("feedgod-arena", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.FeedgodArena as Program<FeedgodArena>;
  
  // Test accounts
  let swtchMint: PublicKey;
  let treasury: Keypair;
  let treasuryTokenAccount: PublicKey;
  let user1: Keypair;
  let user1TokenAccount: PublicKey;
  let user2: Keypair;
  let user2TokenAccount: PublicKey;
  
  // PDAs
  let arenaStatePda: PublicKey;
  let vaultPda: PublicKey;
  let user1AccountPda: PublicKey;
  let user2AccountPda: PublicKey;
  let marketPda: PublicKey;
  let positionPda: PublicKey;

  // Mock oracle (in real tests, use Switchboard On-Demand PullFeed)
  let mockOracleFeed: Keypair;

  const PROTOCOL_FEE_BPS = 500; // 5%
  const DEPOSIT_AMOUNT = 1_000_000_000; // 1000 $SWTCH
  const BET_AMOUNT = 100_000_000; // 100 $SWTCH

  before(async () => {
    // Create test keypairs
    treasury = Keypair.generate();
    user1 = Keypair.generate();
    user2 = Keypair.generate();
    mockOracleFeed = Keypair.generate();

    // Airdrop SOL to test accounts
    await provider.connection.requestAirdrop(
      treasury.publicKey,
      2 * LAMPORTS_PER_SOL
    );
    await provider.connection.requestAirdrop(
      user1.publicKey,
      2 * LAMPORTS_PER_SOL
    );
    await provider.connection.requestAirdrop(
      user2.publicKey,
      2 * LAMPORTS_PER_SOL
    );
    
    // Wait for airdrops to confirm
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Create $SWTCH mock mint
    swtchMint = await createMint(
      provider.connection,
      (provider.wallet as anchor.Wallet).payer,
      provider.wallet.publicKey,
      null,
      6 // 6 decimals like real $SWTCH
    );

    // Create token accounts
    treasuryTokenAccount = await createAccount(
      provider.connection,
      (provider.wallet as anchor.Wallet).payer,
      swtchMint,
      treasury.publicKey
    );

    user1TokenAccount = await createAccount(
      provider.connection,
      (provider.wallet as anchor.Wallet).payer,
      swtchMint,
      user1.publicKey
    );

    user2TokenAccount = await createAccount(
      provider.connection,
      (provider.wallet as anchor.Wallet).payer,
      swtchMint,
      user2.publicKey
    );

    // Mint tokens to users
    await mintTo(
      provider.connection,
      (provider.wallet as anchor.Wallet).payer,
      swtchMint,
      user1TokenAccount,
      provider.wallet.publicKey,
      10_000_000_000 // 10,000 $SWTCH
    );

    await mintTo(
      provider.connection,
      (provider.wallet as anchor.Wallet).payer,
      swtchMint,
      user2TokenAccount,
      provider.wallet.publicKey,
      10_000_000_000 // 10,000 $SWTCH
    );

    // Derive PDAs
    [arenaStatePda] = PublicKey.findProgramAddressSync(
      [Buffer.from("arena_state")],
      program.programId
    );

    [vaultPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("vault")],
      program.programId
    );

    [user1AccountPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("user_account"), user1.publicKey.toBuffer()],
      program.programId
    );

    [user2AccountPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("user_account"), user2.publicKey.toBuffer()],
      program.programId
    );
  });

  describe("initialize", () => {
    it("should initialize the arena", async () => {
      await program.methods
        .initialize(PROTOCOL_FEE_BPS)
        .accounts({
          arenaState: arenaStatePda,
          vault: vaultPda,
          swtchMint: swtchMint,
          treasury: treasuryTokenAccount,
          authority: provider.wallet.publicKey,
          tokenProgram: TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
          rent: anchor.web3.SYSVAR_RENT_PUBKEY,
        })
        .rpc();

      const arenaState = await program.account.arenaState.fetch(arenaStatePda);
      
      expect(arenaState.authority.toString()).to.equal(
        provider.wallet.publicKey.toString()
      );
      expect(arenaState.protocolFeeBps).to.equal(PROTOCOL_FEE_BPS);
      expect(arenaState.totalVolume.toNumber()).to.equal(0);
      expect(arenaState.totalMarkets.toNumber()).to.equal(0);
    });

    it("should reject invalid fee percentage", async () => {
      try {
        await program.methods
          .initialize(1500) // 15% - too high
          .accounts({
            arenaState: arenaStatePda,
            vault: vaultPda,
            swtchMint: swtchMint,
            treasury: treasuryTokenAccount,
            authority: provider.wallet.publicKey,
            tokenProgram: TOKEN_PROGRAM_ID,
            systemProgram: SystemProgram.programId,
            rent: anchor.web3.SYSVAR_RENT_PUBKEY,
          })
          .rpc();
        
        expect.fail("Should have thrown error");
      } catch (err) {
        expect(err.message).to.include("InvalidFeePercentage");
      }
    });
  });

  describe("deposit", () => {
    it("should deposit tokens", async () => {
      const balanceBefore = await getAccount(
        provider.connection,
        user1TokenAccount
      );

      await program.methods
        .deposit(new anchor.BN(DEPOSIT_AMOUNT))
        .accounts({
          arenaState: arenaStatePda,
          vault: vaultPda,
          userAccount: user1AccountPda,
          userTokenAccount: user1TokenAccount,
          user: user1.publicKey,
          tokenProgram: TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
        })
        .signers([user1])
        .rpc();

      const userAccount = await program.account.userAccount.fetch(user1AccountPda);
      expect(userAccount.balance.toNumber()).to.equal(DEPOSIT_AMOUNT);
      expect(userAccount.user.toString()).to.equal(user1.publicKey.toString());

      const balanceAfter = await getAccount(
        provider.connection,
        user1TokenAccount
      );
      expect(Number(balanceAfter.amount)).to.equal(
        Number(balanceBefore.amount) - DEPOSIT_AMOUNT
      );
    });

    it("should reject zero deposit", async () => {
      try {
        await program.methods
          .deposit(new anchor.BN(0))
          .accounts({
            arenaState: arenaStatePda,
            vault: vaultPda,
            userAccount: user1AccountPda,
            userTokenAccount: user1TokenAccount,
            user: user1.publicKey,
            tokenProgram: TOKEN_PROGRAM_ID,
            systemProgram: SystemProgram.programId,
          })
          .signers([user1])
          .rpc();
        
        expect.fail("Should have thrown error");
      } catch (err) {
        expect(err.message).to.include("InvalidAmount");
      }
    });
  });

  describe("withdraw", () => {
    it("should withdraw tokens", async () => {
      const withdrawAmount = 100_000_000; // 100 $SWTCH
      
      const userAccountBefore = await program.account.userAccount.fetch(user1AccountPda);
      
      await program.methods
        .withdraw(new anchor.BN(withdrawAmount))
        .accounts({
          arenaState: arenaStatePda,
          vault: vaultPda,
          userAccount: user1AccountPda,
          userTokenAccount: user1TokenAccount,
          user: user1.publicKey,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .signers([user1])
        .rpc();

      const userAccountAfter = await program.account.userAccount.fetch(user1AccountPda);
      expect(userAccountAfter.balance.toNumber()).to.equal(
        userAccountBefore.balance.toNumber() - withdrawAmount
      );
    });

    it("should reject withdrawal exceeding balance", async () => {
      try {
        await program.methods
          .withdraw(new anchor.BN(999_999_999_999)) // Way more than balance
          .accounts({
            arenaState: arenaStatePda,
            vault: vaultPda,
            userAccount: user1AccountPda,
            userTokenAccount: user1TokenAccount,
            user: user1.publicKey,
            tokenProgram: TOKEN_PROGRAM_ID,
          })
          .signers([user1])
          .rpc();
        
        expect.fail("Should have thrown error");
      } catch (err) {
        expect(err.message).to.include("InsufficientBalance");
      }
    });
  });

  // Note: Market creation and betting tests require a mock Switchboard oracle
  // In production, use @switchboard-xyz/on-demand testing utilities
  
  describe("create_market (requires mock oracle)", () => {
    it.skip("should create a market", async () => {
      // This test requires setting up a mock Switchboard PullFeed
      // Use @switchboard-xyz/on-demand for proper testing
      
      const resolutionTime = Math.floor(Date.now() / 1000) + 3600; // 1 hour from now
      
      [marketPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("market"), Buffer.from([0, 0, 0, 0, 0, 0, 0, 0])], // market id 0
        program.programId
      );

      await program.methods
        .createMarket(
          mockOracleFeed.publicKey,
          "Will BTC go up?",
          "crypto",
          new anchor.BN(resolutionTime)
        )
        .accounts({
          arenaState: arenaStatePda,
          market: marketPda,
          oracleFeed: mockOracleFeed.publicKey,
          authority: provider.wallet.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      const market = await program.account.market.fetch(marketPda);
      expect(market.description).to.equal("Will BTC go up?");
      expect(market.category).to.equal("crypto");
      expect(market.resolved).to.equal(false);
    });
  });

  describe("place_bet (requires active market)", () => {
    it.skip("should place a bet", async () => {
      // This test requires an active market created in previous test
      
      [positionPda] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("position"),
          marketPda.toBuffer(),
          user1.publicKey.toBuffer(),
        ],
        program.programId
      );

      await program.methods
        .placeBet(true, new anchor.BN(BET_AMOUNT)) // true = UP
        .accounts({
          arenaState: arenaStatePda,
          market: marketPda,
          userAccount: user1AccountPda,
          position: positionPda,
          user: user1.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([user1])
        .rpc();

      const position = await program.account.position.fetch(positionPda);
      expect(position.prediction).to.equal(true);
      expect(position.amount.toNumber()).to.equal(BET_AMOUNT);
      expect(position.claimed).to.equal(false);
    });
  });

  describe("admin functions", () => {
    it("should update fee", async () => {
      const newFee = 300; // 3%
      
      await program.methods
        .updateFee(newFee)
        .accounts({
          arenaState: arenaStatePda,
          authority: provider.wallet.publicKey,
        })
        .rpc();

      const arenaState = await program.account.arenaState.fetch(arenaStatePda);
      expect(arenaState.protocolFeeBps).to.equal(newFee);
    });

    it("should reject fee update from non-authority", async () => {
      try {
        await program.methods
          .updateFee(200)
          .accounts({
            arenaState: arenaStatePda,
            authority: user1.publicKey, // Not the authority
          })
          .signers([user1])
          .rpc();
        
        expect.fail("Should have thrown error");
      } catch (err) {
        expect(err.message).to.include("Unauthorized");
      }
    });

    it("should transfer authority", async () => {
      const newAuthority = Keypair.generate();
      
      await program.methods
        .transferAuthority(newAuthority.publicKey)
        .accounts({
          arenaState: arenaStatePda,
          authority: provider.wallet.publicKey,
        })
        .rpc();

      const arenaState = await program.account.arenaState.fetch(arenaStatePda);
      expect(arenaState.authority.toString()).to.equal(
        newAuthority.publicKey.toString()
      );

      // Transfer back for other tests
      await program.methods
        .transferAuthority(provider.wallet.publicKey)
        .accounts({
          arenaState: arenaStatePda,
          authority: newAuthority.publicKey,
        })
        .signers([newAuthority])
        .rpc();
    });
  });
});
