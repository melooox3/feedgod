# FeedGod Arena - Solana Smart Contract

A prediction market smart contract for FeedGod Arena, powered by Switchboard oracles.

## Overview

FeedGod Arena allows users to:
- Deposit $SWTCH tokens
- Bet on prediction markets (UP or DOWN)
- Win payouts based on oracle-resolved outcomes
- Compete on leaderboards with win streaks

## Architecture

### State Accounts

| Account | Description |
|---------|-------------|
| `ArenaState` | Global program state (authority, treasury, fees, volume) |
| `Market` | Individual prediction market (oracle, pools, resolution) |
| `Position` | User's bet on a specific market |
| `UserAccount` | User's deposited balance and stats |

### Instructions

| Instruction | Access | Description |
|-------------|--------|-------------|
| `initialize` | Admin | Set up the arena program |
| `deposit` | User | Deposit $SWTCH tokens |
| `withdraw` | User | Withdraw $SWTCH tokens |
| `create_market` | Admin | Create a new prediction market |
| `place_bet` | User | Bet UP or DOWN on a market |
| `resolve_market` | Anyone | Resolve market by reading oracle |
| `claim_winnings` | User | Claim payout from resolved market |
| `update_fee` | Admin | Update protocol fee |
| `transfer_authority` | Admin | Transfer admin rights |

## Payout Logic

1. Market resolves by reading Switchboard oracle
2. If current value > start value → UP wins
3. If current value < start value → DOWN wins
4. Total pool = up_pool + down_pool
5. Protocol takes 5% fee
6. Winners split remaining 95% proportionally

**Formula:**
```
user_payout = (user_wager / winning_pool) * (total_pool * 0.95)
```

## $SWTCH Token

- **Mint:** `SW1TCH7qEPTdLsDHRgPuMQjbQxKdH2aBStViMFnt64f`
- **Decimals:** 6
- **Min Bet:** 1 $SWTCH (1,000,000 lamports)
- **Max Bet:** 10,000 $SWTCH (10,000,000,000 lamports)

## Security Features

- ✅ User can only withdraw their own balance
- ✅ Bets locked after placement until resolution
- ✅ Only authority can create markets
- ✅ Time checks prevent betting after resolution time
- ✅ Checks-effects-interactions pattern for reentrancy protection
- ✅ Overflow/underflow protection with checked math
- ✅ PDA seeds for all derived accounts

## Development

### Prerequisites

- Rust 1.70+
- Solana CLI 1.16+
- Anchor CLI 0.29+

### Build

```bash
anchor build
```

### Test

```bash
anchor test
```

### Deploy

```bash
# Devnet
anchor deploy --provider.cluster devnet

# Mainnet
anchor deploy --provider.cluster mainnet
```

## Program IDs

| Network | Program ID |
|---------|------------|
| Localnet | `ArenaXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX` |
| Devnet | TBD |
| Mainnet | TBD |

## Events

The program emits events for all major actions:

- `ArenaInitialized` - Program initialized
- `Deposited` - User deposited tokens
- `Withdrawn` - User withdrew tokens
- `MarketCreated` - New market created
- `BetPlaced` - User placed a bet
- `MarketResolved` - Market resolved with outcome
- `WinningsClaimed` - User claimed winnings
- `BetLost` - User lost their bet

## Integration

### Reading Markets (Frontend)

```typescript
const markets = await program.account.market.all();
```

### Placing a Bet

```typescript
await program.methods
  .placeBet(true, new BN(amount)) // true = UP
  .accounts({
    arenaState,
    market,
    userAccount,
    position,
    user: wallet.publicKey,
  })
  .rpc();
```

### Resolving a Market

```typescript
await program.methods
  .resolveMarket()
  .accounts({
    arenaState,
    market,
    oracleFeed: market.oracleFeed,
    resolver: wallet.publicKey,
  })
  .rpc();
```

## License

MIT
