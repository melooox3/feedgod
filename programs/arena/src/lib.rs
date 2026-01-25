use anchor_lang::prelude::*;
use anchor_spl::token::{self, Mint, Token, TokenAccount, Transfer};
use switchboard_solana::AggregatorAccountData;

declare_id!("ArenaXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX");

/// $SWTCH token mint address
/// Verify at: https://solscan.io/token/SW1TCH7qEPTdLsDHRgPuMQjbQxKdH2aBStViMFnt64f
pub const SWTCH_MINT: &str = "SW1TCH7qEPTdLsDHRgPuMQjbQxKdH2aBStViMFnt64f";

/// Protocol fee in basis points (500 = 5%)
pub const DEFAULT_PROTOCOL_FEE_BPS: u16 = 500;

/// Minimum bet amount (1 $SWTCH with 6 decimals)
pub const MIN_BET_AMOUNT: u64 = 1_000_000;

/// Maximum bet amount (10,000 $SWTCH with 6 decimals)
pub const MAX_BET_AMOUNT: u64 = 10_000_000_000;

#[program]
pub mod feedgod_arena {
    use super::*;

    /// Initialize the arena program
    /// Only called once by the deployer
    pub fn initialize(
        ctx: Context<Initialize>,
        protocol_fee_bps: u16,
    ) -> Result<()> {
        require!(
            protocol_fee_bps <= 1000, // Max 10%
            ArenaError::InvalidFeePercentage
        );

        let arena_state = &mut ctx.accounts.arena_state;
        arena_state.authority = ctx.accounts.authority.key();
        arena_state.treasury = ctx.accounts.treasury.key();
        arena_state.swtch_mint = ctx.accounts.swtch_mint.key();
        arena_state.total_volume = 0;
        arena_state.total_markets = 0;
        arena_state.protocol_fee_bps = protocol_fee_bps;
        arena_state.bump = ctx.bumps.arena_state;

        emit!(ArenaInitialized {
            authority: arena_state.authority,
            treasury: arena_state.treasury,
            protocol_fee_bps,
        });

        Ok(())
    }

    /// User deposits $SWTCH tokens into their arena account
    pub fn deposit(ctx: Context<Deposit>, amount: u64) -> Result<()> {
        require!(amount > 0, ArenaError::InvalidAmount);

        // Transfer tokens from user to vault
        let cpi_accounts = Transfer {
            from: ctx.accounts.user_token_account.to_account_info(),
            to: ctx.accounts.vault.to_account_info(),
            authority: ctx.accounts.user.to_account_info(),
        };
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
        token::transfer(cpi_ctx, amount)?;

        // Update user account
        let user_account = &mut ctx.accounts.user_account;
        user_account.user = ctx.accounts.user.key();
        user_account.balance = user_account.balance.checked_add(amount)
            .ok_or(ArenaError::Overflow)?;
        user_account.bump = ctx.bumps.user_account;

        emit!(Deposited {
            user: ctx.accounts.user.key(),
            amount,
            new_balance: user_account.balance,
        });

        Ok(())
    }

    /// User withdraws $SWTCH tokens from their arena account
    pub fn withdraw(ctx: Context<Withdraw>, amount: u64) -> Result<()> {
        require!(amount > 0, ArenaError::InvalidAmount);
        
        let user_account = &mut ctx.accounts.user_account;
        require!(
            user_account.balance >= amount,
            ArenaError::InsufficientBalance
        );

        // Update balance first (checks-effects-interactions)
        user_account.balance = user_account.balance.checked_sub(amount)
            .ok_or(ArenaError::Underflow)?;

        // Transfer tokens from vault to user
        let arena_state = &ctx.accounts.arena_state;
        let seeds = &[
            b"arena_state".as_ref(),
            &[arena_state.bump],
        ];
        let signer_seeds = &[&seeds[..]];

        let cpi_accounts = Transfer {
            from: ctx.accounts.vault.to_account_info(),
            to: ctx.accounts.user_token_account.to_account_info(),
            authority: ctx.accounts.arena_state.to_account_info(),
        };
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer_seeds);
        token::transfer(cpi_ctx, amount)?;

        emit!(Withdrawn {
            user: ctx.accounts.user.key(),
            amount,
            new_balance: user_account.balance,
        });

        Ok(())
    }

    /// Create a new prediction market
    /// Only authority can create markets
    pub fn create_market(
        ctx: Context<CreateMarket>,
        oracle_feed: Pubkey,
        description: String,
        category: String,
        resolution_time: i64,
    ) -> Result<()> {
        require!(
            description.len() <= 200,
            ArenaError::DescriptionTooLong
        );
        require!(
            category.len() <= 50,
            ArenaError::CategoryTooLong
        );

        let clock = Clock::get()?;
        require!(
            resolution_time > clock.unix_timestamp,
            ArenaError::InvalidResolutionTime
        );

        // Read current value from oracle
        let feed = &ctx.accounts.oracle_feed;
        let feed_data = feed.load()?;
        let start_value = feed_data.get_result()?.try_into()?;

        let arena_state = &mut ctx.accounts.arena_state;
        let market_id = arena_state.total_markets;
        arena_state.total_markets = arena_state.total_markets.checked_add(1)
            .ok_or(ArenaError::Overflow)?;

        let market = &mut ctx.accounts.market;
        market.id = market_id;
        market.oracle_feed = oracle_feed;
        market.description = description.clone();
        market.category = category.clone();
        market.start_value = start_value;
        market.resolution_time = resolution_time;
        market.total_up_pool = 0;
        market.total_down_pool = 0;
        market.resolved = false;
        market.outcome = None;
        market.bump = ctx.bumps.market;

        emit!(MarketCreated {
            market_id,
            oracle_feed,
            description,
            category,
            start_value,
            resolution_time,
        });

        Ok(())
    }

    /// Place a bet on a market
    pub fn place_bet(
        ctx: Context<PlaceBet>,
        prediction: bool, // true = UP, false = DOWN
        amount: u64,
    ) -> Result<()> {
        require!(
            amount >= MIN_BET_AMOUNT,
            ArenaError::BetTooSmall
        );
        require!(
            amount <= MAX_BET_AMOUNT,
            ArenaError::BetTooLarge
        );

        let market = &ctx.accounts.market;
        require!(!market.resolved, ArenaError::MarketAlreadyResolved);

        let clock = Clock::get()?;
        require!(
            clock.unix_timestamp < market.resolution_time,
            ArenaError::BettingClosed
        );

        // Check user has enough balance
        let user_account = &mut ctx.accounts.user_account;
        require!(
            user_account.balance >= amount,
            ArenaError::InsufficientBalance
        );

        // Deduct from user balance
        user_account.balance = user_account.balance.checked_sub(amount)
            .ok_or(ArenaError::Underflow)?;
        user_account.total_wagered = user_account.total_wagered.checked_add(amount)
            .ok_or(ArenaError::Overflow)?;

        // Update market pools
        let market = &mut ctx.accounts.market;
        if prediction {
            market.total_up_pool = market.total_up_pool.checked_add(amount)
                .ok_or(ArenaError::Overflow)?;
        } else {
            market.total_down_pool = market.total_down_pool.checked_add(amount)
                .ok_or(ArenaError::Overflow)?;
        }

        // Update arena volume
        let arena_state = &mut ctx.accounts.arena_state;
        arena_state.total_volume = arena_state.total_volume.checked_add(amount)
            .ok_or(ArenaError::Overflow)?;

        // Create position
        let position = &mut ctx.accounts.position;
        position.user = ctx.accounts.user.key();
        position.market = market.key();
        position.prediction = prediction;
        position.amount = amount;
        position.claimed = false;
        position.bump = ctx.bumps.position;

        emit!(BetPlaced {
            user: ctx.accounts.user.key(),
            market: market.key(),
            prediction,
            amount,
            total_up_pool: market.total_up_pool,
            total_down_pool: market.total_down_pool,
        });

        Ok(())
    }

    /// Resolve a market by reading the oracle
    /// Can be called by anyone after resolution time
    pub fn resolve_market(ctx: Context<ResolveMarket>) -> Result<()> {
        let market = &mut ctx.accounts.market;
        
        require!(!market.resolved, ArenaError::MarketAlreadyResolved);

        let clock = Clock::get()?;
        require!(
            clock.unix_timestamp >= market.resolution_time,
            ArenaError::ResolutionTimeNotReached
        );

        // Read current value from oracle
        let feed = &ctx.accounts.oracle_feed;
        let feed_data = feed.load()?;
        let current_value: i128 = feed_data.get_result()?.try_into()?;

        // Determine outcome: UP wins if value increased
        let outcome = current_value > market.start_value;
        
        market.resolved = true;
        market.outcome = Some(outcome);

        emit!(MarketResolved {
            market: market.key(),
            start_value: market.start_value,
            end_value: current_value,
            outcome,
            total_pool: market.total_up_pool + market.total_down_pool,
        });

        Ok(())
    }

    /// Claim winnings from a resolved market
    pub fn claim_winnings(ctx: Context<ClaimWinnings>) -> Result<()> {
        let market = &ctx.accounts.market;
        let position = &mut ctx.accounts.position;
        
        require!(market.resolved, ArenaError::MarketNotResolved);
        require!(!position.claimed, ArenaError::AlreadyClaimed);
        
        let outcome = market.outcome.ok_or(ArenaError::MarketNotResolved)?;
        
        // Check if user won
        let user_won = position.prediction == outcome;
        
        if user_won {
            let total_pool = market.total_up_pool
                .checked_add(market.total_down_pool)
                .ok_or(ArenaError::Overflow)?;
            
            let winning_pool = if outcome {
                market.total_up_pool
            } else {
                market.total_down_pool
            };

            // Calculate protocol fee (5%)
            let arena_state = &ctx.accounts.arena_state;
            let fee_amount = total_pool
                .checked_mul(arena_state.protocol_fee_bps as u64)
                .ok_or(ArenaError::Overflow)?
                .checked_div(10_000)
                .ok_or(ArenaError::DivisionByZero)?;
            
            let pool_after_fee = total_pool
                .checked_sub(fee_amount)
                .ok_or(ArenaError::Underflow)?;

            // Calculate user's share
            // payout = (user_wager / winning_pool) * pool_after_fee
            let user_payout = (position.amount as u128)
                .checked_mul(pool_after_fee as u128)
                .ok_or(ArenaError::Overflow)?
                .checked_div(winning_pool as u128)
                .ok_or(ArenaError::DivisionByZero)? as u64;

            // Transfer fee to treasury
            let seeds = &[
                b"arena_state".as_ref(),
                &[arena_state.bump],
            ];
            let signer_seeds = &[&seeds[..]];

            if fee_amount > 0 {
                let cpi_accounts = Transfer {
                    from: ctx.accounts.vault.to_account_info(),
                    to: ctx.accounts.treasury.to_account_info(),
                    authority: ctx.accounts.arena_state.to_account_info(),
                };
                let cpi_program = ctx.accounts.token_program.to_account_info();
                let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer_seeds);
                token::transfer(cpi_ctx, fee_amount)?;
            }

            // Credit user account
            let user_account = &mut ctx.accounts.user_account;
            user_account.balance = user_account.balance.checked_add(user_payout)
                .ok_or(ArenaError::Overflow)?;
            user_account.total_won = user_account.total_won.checked_add(user_payout)
                .ok_or(ArenaError::Overflow)?;
            user_account.wins = user_account.wins.checked_add(1)
                .ok_or(ArenaError::Overflow)?;
            user_account.current_streak = user_account.current_streak.checked_add(1)
                .ok_or(ArenaError::Overflow)?;
            if user_account.current_streak > user_account.best_streak {
                user_account.best_streak = user_account.current_streak;
            }

            emit!(WinningsClaimed {
                user: ctx.accounts.user.key(),
                market: market.key(),
                payout: user_payout,
                fee: fee_amount,
            });
        } else {
            // User lost - update stats
            let user_account = &mut ctx.accounts.user_account;
            user_account.losses = user_account.losses.checked_add(1)
                .ok_or(ArenaError::Overflow)?;
            user_account.current_streak = 0;

            emit!(BetLost {
                user: ctx.accounts.user.key(),
                market: market.key(),
                amount_lost: position.amount,
            });
        }

        position.claimed = true;

        Ok(())
    }

    /// Update protocol fee (admin only)
    pub fn update_fee(ctx: Context<UpdateFee>, new_fee_bps: u16) -> Result<()> {
        require!(
            new_fee_bps <= 1000, // Max 10%
            ArenaError::InvalidFeePercentage
        );

        let arena_state = &mut ctx.accounts.arena_state;
        let old_fee = arena_state.protocol_fee_bps;
        arena_state.protocol_fee_bps = new_fee_bps;

        emit!(FeeUpdated {
            old_fee_bps: old_fee,
            new_fee_bps,
        });

        Ok(())
    }

    /// Transfer authority (admin only)
    pub fn transfer_authority(ctx: Context<TransferAuthority>, new_authority: Pubkey) -> Result<()> {
        let arena_state = &mut ctx.accounts.arena_state;
        let old_authority = arena_state.authority;
        arena_state.authority = new_authority;

        emit!(AuthorityTransferred {
            old_authority,
            new_authority,
        });

        Ok(())
    }
}

// ============================================================================
// ACCOUNTS
// ============================================================================

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(
        init,
        payer = authority,
        space = 8 + ArenaState::INIT_SPACE,
        seeds = [b"arena_state"],
        bump,
    )]
    pub arena_state: Account<'info, ArenaState>,

    #[account(
        init,
        payer = authority,
        token::mint = swtch_mint,
        token::authority = arena_state,
        seeds = [b"vault"],
        bump,
    )]
    pub vault: Account<'info, TokenAccount>,

    pub swtch_mint: Account<'info, Mint>,

    /// CHECK: Treasury wallet for fee collection
    pub treasury: UncheckedAccount<'info>,

    #[account(mut)]
    pub authority: Signer<'info>,

    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
pub struct Deposit<'info> {
    #[account(
        seeds = [b"arena_state"],
        bump = arena_state.bump,
    )]
    pub arena_state: Account<'info, ArenaState>,

    #[account(
        mut,
        seeds = [b"vault"],
        bump,
    )]
    pub vault: Account<'info, TokenAccount>,

    #[account(
        init_if_needed,
        payer = user,
        space = 8 + UserAccount::INIT_SPACE,
        seeds = [b"user_account", user.key().as_ref()],
        bump,
    )]
    pub user_account: Account<'info, UserAccount>,

    #[account(
        mut,
        constraint = user_token_account.owner == user.key(),
        constraint = user_token_account.mint == arena_state.swtch_mint,
    )]
    pub user_token_account: Account<'info, TokenAccount>,

    #[account(mut)]
    pub user: Signer<'info>,

    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Withdraw<'info> {
    #[account(
        seeds = [b"arena_state"],
        bump = arena_state.bump,
    )]
    pub arena_state: Account<'info, ArenaState>,

    #[account(
        mut,
        seeds = [b"vault"],
        bump,
    )]
    pub vault: Account<'info, TokenAccount>,

    #[account(
        mut,
        seeds = [b"user_account", user.key().as_ref()],
        bump = user_account.bump,
        constraint = user_account.user == user.key(),
    )]
    pub user_account: Account<'info, UserAccount>,

    #[account(
        mut,
        constraint = user_token_account.owner == user.key(),
        constraint = user_token_account.mint == arena_state.swtch_mint,
    )]
    pub user_token_account: Account<'info, TokenAccount>,

    #[account(mut)]
    pub user: Signer<'info>,

    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
#[instruction(oracle_feed: Pubkey, description: String, category: String)]
pub struct CreateMarket<'info> {
    #[account(
        mut,
        seeds = [b"arena_state"],
        bump = arena_state.bump,
        constraint = arena_state.authority == authority.key() @ ArenaError::Unauthorized,
    )]
    pub arena_state: Account<'info, ArenaState>,

    #[account(
        init,
        payer = authority,
        space = 8 + Market::INIT_SPACE,
        seeds = [b"market", arena_state.total_markets.to_le_bytes().as_ref()],
        bump,
    )]
    pub market: Account<'info, Market>,

    /// CHECK: Switchboard aggregator account
    #[account(
        constraint = oracle_feed.key() == oracle_feed @ ArenaError::InvalidOracle,
    )]
    pub oracle_feed: AccountLoader<'info, AggregatorAccountData>,

    #[account(mut)]
    pub authority: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct PlaceBet<'info> {
    #[account(
        mut,
        seeds = [b"arena_state"],
        bump = arena_state.bump,
    )]
    pub arena_state: Account<'info, ArenaState>,

    #[account(
        mut,
        seeds = [b"market", market.id.to_le_bytes().as_ref()],
        bump = market.bump,
    )]
    pub market: Account<'info, Market>,

    #[account(
        mut,
        seeds = [b"user_account", user.key().as_ref()],
        bump = user_account.bump,
        constraint = user_account.user == user.key(),
    )]
    pub user_account: Account<'info, UserAccount>,

    #[account(
        init,
        payer = user,
        space = 8 + Position::INIT_SPACE,
        seeds = [b"position", market.key().as_ref(), user.key().as_ref()],
        bump,
    )]
    pub position: Account<'info, Position>,

    #[account(mut)]
    pub user: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct ResolveMarket<'info> {
    #[account(
        seeds = [b"arena_state"],
        bump = arena_state.bump,
    )]
    pub arena_state: Account<'info, ArenaState>,

    #[account(
        mut,
        seeds = [b"market", market.id.to_le_bytes().as_ref()],
        bump = market.bump,
    )]
    pub market: Account<'info, Market>,

    /// CHECK: Switchboard aggregator account
    #[account(
        constraint = oracle_feed.key() == market.oracle_feed @ ArenaError::InvalidOracle,
    )]
    pub oracle_feed: AccountLoader<'info, AggregatorAccountData>,

    pub resolver: Signer<'info>,
}

#[derive(Accounts)]
pub struct ClaimWinnings<'info> {
    #[account(
        seeds = [b"arena_state"],
        bump = arena_state.bump,
    )]
    pub arena_state: Account<'info, ArenaState>,

    #[account(
        mut,
        seeds = [b"vault"],
        bump,
    )]
    pub vault: Account<'info, TokenAccount>,

    #[account(
        mut,
        constraint = treasury.key() == arena_state.treasury @ ArenaError::InvalidTreasury,
    )]
    pub treasury: Account<'info, TokenAccount>,

    #[account(
        seeds = [b"market", market.id.to_le_bytes().as_ref()],
        bump = market.bump,
    )]
    pub market: Account<'info, Market>,

    #[account(
        mut,
        seeds = [b"user_account", user.key().as_ref()],
        bump = user_account.bump,
        constraint = user_account.user == user.key(),
    )]
    pub user_account: Account<'info, UserAccount>,

    #[account(
        mut,
        seeds = [b"position", market.key().as_ref(), user.key().as_ref()],
        bump = position.bump,
        constraint = position.user == user.key() @ ArenaError::Unauthorized,
        constraint = position.market == market.key() @ ArenaError::InvalidPosition,
    )]
    pub position: Account<'info, Position>,

    #[account(mut)]
    pub user: Signer<'info>,

    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct UpdateFee<'info> {
    #[account(
        mut,
        seeds = [b"arena_state"],
        bump = arena_state.bump,
        constraint = arena_state.authority == authority.key() @ ArenaError::Unauthorized,
    )]
    pub arena_state: Account<'info, ArenaState>,

    pub authority: Signer<'info>,
}

#[derive(Accounts)]
pub struct TransferAuthority<'info> {
    #[account(
        mut,
        seeds = [b"arena_state"],
        bump = arena_state.bump,
        constraint = arena_state.authority == authority.key() @ ArenaError::Unauthorized,
    )]
    pub arena_state: Account<'info, ArenaState>,

    pub authority: Signer<'info>,
}

// ============================================================================
// STATE
// ============================================================================

#[account]
#[derive(InitSpace)]
pub struct ArenaState {
    pub authority: Pubkey,
    pub treasury: Pubkey,
    pub swtch_mint: Pubkey,
    pub total_volume: u64,
    pub total_markets: u64,
    pub protocol_fee_bps: u16,
    pub bump: u8,
}

#[account]
#[derive(InitSpace)]
pub struct Market {
    pub id: u64,
    pub oracle_feed: Pubkey,
    #[max_len(200)]
    pub description: String,
    #[max_len(50)]
    pub category: String,
    pub start_value: i128,
    pub resolution_time: i64,
    pub total_up_pool: u64,
    pub total_down_pool: u64,
    pub resolved: bool,
    pub outcome: Option<bool>,
    pub bump: u8,
}

#[account]
#[derive(InitSpace)]
pub struct Position {
    pub user: Pubkey,
    pub market: Pubkey,
    pub prediction: bool,
    pub amount: u64,
    pub claimed: bool,
    pub bump: u8,
}

#[account]
#[derive(InitSpace)]
pub struct UserAccount {
    pub user: Pubkey,
    pub balance: u64,
    pub total_wagered: u64,
    pub total_won: u64,
    pub wins: u32,
    pub losses: u32,
    pub current_streak: u32,
    pub best_streak: u32,
    pub bump: u8,
}

// ============================================================================
// EVENTS
// ============================================================================

#[event]
pub struct ArenaInitialized {
    pub authority: Pubkey,
    pub treasury: Pubkey,
    pub protocol_fee_bps: u16,
}

#[event]
pub struct Deposited {
    pub user: Pubkey,
    pub amount: u64,
    pub new_balance: u64,
}

#[event]
pub struct Withdrawn {
    pub user: Pubkey,
    pub amount: u64,
    pub new_balance: u64,
}

#[event]
pub struct MarketCreated {
    pub market_id: u64,
    pub oracle_feed: Pubkey,
    pub description: String,
    pub category: String,
    pub start_value: i128,
    pub resolution_time: i64,
}

#[event]
pub struct BetPlaced {
    pub user: Pubkey,
    pub market: Pubkey,
    pub prediction: bool,
    pub amount: u64,
    pub total_up_pool: u64,
    pub total_down_pool: u64,
}

#[event]
pub struct MarketResolved {
    pub market: Pubkey,
    pub start_value: i128,
    pub end_value: i128,
    pub outcome: bool,
    pub total_pool: u64,
}

#[event]
pub struct WinningsClaimed {
    pub user: Pubkey,
    pub market: Pubkey,
    pub payout: u64,
    pub fee: u64,
}

#[event]
pub struct BetLost {
    pub user: Pubkey,
    pub market: Pubkey,
    pub amount_lost: u64,
}

#[event]
pub struct FeeUpdated {
    pub old_fee_bps: u16,
    pub new_fee_bps: u16,
}

#[event]
pub struct AuthorityTransferred {
    pub old_authority: Pubkey,
    pub new_authority: Pubkey,
}

// ============================================================================
// ERRORS
// ============================================================================

#[error_code]
pub enum ArenaError {
    #[msg("Unauthorized access")]
    Unauthorized,

    #[msg("Invalid amount")]
    InvalidAmount,

    #[msg("Insufficient balance")]
    InsufficientBalance,

    #[msg("Arithmetic overflow")]
    Overflow,

    #[msg("Arithmetic underflow")]
    Underflow,

    #[msg("Division by zero")]
    DivisionByZero,

    #[msg("Invalid fee percentage (max 10%)")]
    InvalidFeePercentage,

    #[msg("Description too long (max 200 characters)")]
    DescriptionTooLong,

    #[msg("Category too long (max 50 characters)")]
    CategoryTooLong,

    #[msg("Invalid resolution time")]
    InvalidResolutionTime,

    #[msg("Market already resolved")]
    MarketAlreadyResolved,

    #[msg("Market not resolved yet")]
    MarketNotResolved,

    #[msg("Betting is closed for this market")]
    BettingClosed,

    #[msg("Resolution time not reached")]
    ResolutionTimeNotReached,

    #[msg("Bet amount too small (minimum 1 $SWTCH)")]
    BetTooSmall,

    #[msg("Bet amount too large (maximum 10,000 $SWTCH)")]
    BetTooLarge,

    #[msg("Already claimed winnings")]
    AlreadyClaimed,

    #[msg("Invalid oracle feed")]
    InvalidOracle,

    #[msg("Invalid treasury account")]
    InvalidTreasury,

    #[msg("Invalid position")]
    InvalidPosition,
}
