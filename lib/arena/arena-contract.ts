/**
 * FeedGod Arena Smart Contract Client
 * 
 * TypeScript bindings for the FeedGod Arena Solana program.
 * Handles deposits, withdrawals, betting, and claiming winnings.
 * 
 * Currently running in DEMO MODE with localStorage persistence.
 */

import { 
  PublicKey, 
  Connection, 
  Transaction,
} from '@solana/web3.js'
import { 
  TOKEN_PROGRAM_ID, 
  getAssociatedTokenAddress,
  getAccount,
} from '@solana/spl-token'
import { BN } from 'bn.js'

// ============================================================================
// DEMO MODE - Set to false when contract is deployed
// ============================================================================
export const DEMO_MODE = true

// Program ID - replace 'YOUR_PROGRAM_ID_HERE' when deployed
export const ARENA_PROGRAM_ID = DEMO_MODE 
  ? null 
  : new PublicKey('YOUR_PROGRAM_ID_HERE')

// $SWTCH Token Mint (this one is real)
export const SWTCH_MINT = new PublicKey('SW1TCH7qEPTdLsDHRgPuMQjbQxKdH2aBStViMFnt64f')

// USDC Mint
export const USDC_MINT = new PublicKey('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v')

// Constants
export const MIN_BET_AMOUNT = 1_000_000 // 1 $SWTCH (6 decimals)
export const MAX_BET_AMOUNT = 10_000_000_000 // 10,000 $SWTCH
export const PROTOCOL_FEE_BPS = 500 // 5%
export const SWTCH_DECIMALS = 6
export const INITIAL_DEMO_BALANCE = 1000_000_000 // 1000 $SWTCH in smallest units

// ============================================================================
// DEMO MODE STORAGE HELPERS
// ============================================================================

const DEMO_BALANCE_KEY = 'arena_demo_balance'
const DEMO_BETS_KEY = 'arena_demo_bets'
const DEMO_POSITIONS_KEY = 'arena_demo_positions'
const DEMO_STATS_KEY = 'arena_demo_stats'

export interface DemoBet {
  id: string
  marketId: string
  marketTitle: string
  prediction: boolean // true = UP, false = DOWN
  amount: number
  timestamp: number
  resolveAt: number
  resolved: boolean
  won?: boolean
  payout?: number
}

export interface DemoStats {
  totalWagered: number
  totalWon: number
  wins: number
  losses: number
  currentStreak: number
  bestStreak: number
}

export function getDemoBalance(): number {
  if (typeof window === 'undefined') return INITIAL_DEMO_BALANCE
  const stored = localStorage.getItem(DEMO_BALANCE_KEY)
  if (stored === null) {
    // First time - give user 1000 demo points
    setDemoBalance(INITIAL_DEMO_BALANCE)
    return INITIAL_DEMO_BALANCE
  }
  return Number(stored)
}

export function setDemoBalance(balance: number): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(DEMO_BALANCE_KEY, balance.toString())
}

export function getDemoBets(): DemoBet[] {
  if (typeof window === 'undefined') return []
  const stored = localStorage.getItem(DEMO_BETS_KEY)
  return stored ? JSON.parse(stored) : []
}

export function setDemoBets(bets: DemoBet[]): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(DEMO_BETS_KEY, JSON.stringify(bets))
}

export function getDemoStats(): DemoStats {
  if (typeof window === 'undefined') {
    return { totalWagered: 0, totalWon: 0, wins: 0, losses: 0, currentStreak: 0, bestStreak: 0 }
  }
  const stored = localStorage.getItem(DEMO_STATS_KEY)
  return stored ? JSON.parse(stored) : {
    totalWagered: 0,
    totalWon: 0,
    wins: 0,
    losses: 0,
    currentStreak: 0,
    bestStreak: 0,
  }
}

export function setDemoStats(stats: DemoStats): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(DEMO_STATS_KEY, JSON.stringify(stats))
}

export function resetDemoData(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(DEMO_BALANCE_KEY)
  localStorage.removeItem(DEMO_BETS_KEY)
  localStorage.removeItem(DEMO_STATS_KEY)
}

// ============================================================================
// TYPES
// ============================================================================

export interface ArenaState {
  authority: PublicKey
  treasury: PublicKey
  swtchMint: PublicKey
  totalVolume: BN
  totalMarkets: BN
  protocolFeeBps: number
  bump: number
}

export interface OnChainMarket {
  id: BN
  oracleFeed: PublicKey
  description: string
  category: string
  startValue: BN
  resolutionTime: BN
  totalUpPool: BN
  totalDownPool: BN
  resolved: boolean
  outcome: boolean | null
  bump: number
}

export interface Position {
  user: PublicKey
  market: PublicKey
  prediction: boolean
  amount: BN
  claimed: boolean
  bump: number
}

export interface UserAccount {
  user: PublicKey
  balance: BN
  totalWagered: BN
  totalWon: BN
  wins: number
  losses: number
  currentStreak: number
  bestStreak: number
  bump: number
}

export interface LeaderboardEntry {
  user: PublicKey | string
  nickname: string
  points: number
  wins: number
  losses: number
  winRate: number
  longestStreak: number
  volume: number
  score: number
  rank: number
}

export interface TransactionResult {
  success: boolean
  demo: boolean
  signature?: string
  error?: string
}

// ============================================================================
// ARENA CLIENT
// ============================================================================

export class ArenaClient {
  connection: Connection
  
  constructor(connection: Connection) {
    this.connection = connection
  }

  // --------------------------------------------------------------------------
  // Token Account Helpers
  // --------------------------------------------------------------------------

  async getUserSwtchTokenAccount(user: PublicKey): Promise<PublicKey> {
    return getAssociatedTokenAddress(SWTCH_MINT, user)
  }

  async getUserUsdcTokenAccount(user: PublicKey): Promise<PublicKey> {
    return getAssociatedTokenAddress(USDC_MINT, user)
  }

  async getSwtchBalance(user: PublicKey): Promise<number> {
    if (DEMO_MODE) {
      return getDemoBalance()
    }
    try {
      const tokenAccount = await this.getUserSwtchTokenAccount(user)
      const account = await getAccount(this.connection, tokenAccount)
      return Number(account.amount)
    } catch {
      return 0
    }
  }

  async getUsdcBalance(user: PublicKey): Promise<number> {
    try {
      const tokenAccount = await this.getUserUsdcTokenAccount(user)
      const account = await getAccount(this.connection, tokenAccount)
      return Number(account.amount)
    } catch {
      return 0
    }
  }

  // --------------------------------------------------------------------------
  // Account Fetching
  // --------------------------------------------------------------------------

  async getUserAccount(user: PublicKey): Promise<UserAccount | null> {
    if (DEMO_MODE) {
      const stats = getDemoStats()
      const balance = getDemoBalance()
      return {
        user,
        balance: new BN(balance),
        totalWagered: new BN(stats.totalWagered),
        totalWon: new BN(stats.totalWon),
        wins: stats.wins,
        losses: stats.losses,
        currentStreak: stats.currentStreak,
        bestStreak: stats.bestStreak,
        bump: 0,
      }
    }
    // Production: fetch from on-chain
    return null
  }

  async getUserPositions(user: PublicKey): Promise<DemoBet[]> {
    if (DEMO_MODE) {
      return getDemoBets()
    }
    return []
  }

  // --------------------------------------------------------------------------
  // Transactions
  // --------------------------------------------------------------------------

  async deposit(
    user: PublicKey,
    amount: number,
    signTransaction?: (tx: Transaction) => Promise<Transaction>
  ): Promise<TransactionResult> {
    if (DEMO_MODE) {
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      const balance = getDemoBalance()
      setDemoBalance(balance + amount)
      
      return { success: true, demo: true }
    }

    // Production: real contract call
    // const tx = await program.methods.deposit(new BN(amount))...
    return { success: false, demo: false, error: 'Contract not deployed' }
  }

  async withdraw(
    user: PublicKey,
    amount: number,
    signTransaction?: (tx: Transaction) => Promise<Transaction>
  ): Promise<TransactionResult> {
    if (DEMO_MODE) {
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      const balance = getDemoBalance()
      if (amount > balance) {
        return { success: false, demo: true, error: 'Insufficient balance' }
      }
      setDemoBalance(balance - amount)
      
      return { success: true, demo: true }
    }

    return { success: false, demo: false, error: 'Contract not deployed' }
  }

  async placeBet(
    user: PublicKey,
    marketId: string,
    marketTitle: string,
    prediction: boolean,
    amount: number,
    resolveAt: number,
    signTransaction?: (tx: Transaction) => Promise<Transaction>
  ): Promise<TransactionResult> {
    if (DEMO_MODE) {
      await new Promise(resolve => setTimeout(resolve, 800))
      
      const balance = getDemoBalance()
      if (amount > balance) {
        return { success: false, demo: true, error: 'Insufficient balance' }
      }

      // Deduct from balance
      setDemoBalance(balance - amount)

      // Store the bet
      const bets = getDemoBets()
      const newBet: DemoBet = {
        id: `bet_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        marketId,
        marketTitle,
        prediction,
        amount,
        timestamp: Date.now(),
        resolveAt,
        resolved: false,
      }
      bets.push(newBet)
      setDemoBets(bets)

      // Update stats
      const stats = getDemoStats()
      stats.totalWagered += amount
      setDemoStats(stats)

      return { success: true, demo: true }
    }

    return { success: false, demo: false, error: 'Contract not deployed' }
  }

  async claimWinnings(
    user: PublicKey,
    betId: string,
    signTransaction?: (tx: Transaction) => Promise<Transaction>
  ): Promise<TransactionResult> {
    if (DEMO_MODE) {
      await new Promise(resolve => setTimeout(resolve, 800))
      
      const bets = getDemoBets()
      const betIndex = bets.findIndex(b => b.id === betId)
      
      if (betIndex === -1) {
        return { success: false, demo: true, error: 'Bet not found' }
      }

      const bet = bets[betIndex]
      if (!bet.resolved || !bet.won) {
        return { success: false, demo: true, error: 'Cannot claim this bet' }
      }

      // Add payout to balance
      const balance = getDemoBalance()
      setDemoBalance(balance + (bet.payout || 0))

      // Mark as claimed by removing from active bets
      bets.splice(betIndex, 1)
      setDemoBets(bets)

      return { success: true, demo: true }
    }

    return { success: false, demo: false, error: 'Contract not deployed' }
  }

  // --------------------------------------------------------------------------
  // Demo Mode: Resolve Bets
  // --------------------------------------------------------------------------

  resolveDemoBet(betId: string, won: boolean, multiplier: number = 1.9): void {
    if (!DEMO_MODE) return

    const bets = getDemoBets()
    const betIndex = bets.findIndex(b => b.id === betId)
    
    if (betIndex === -1) return

    const bet = bets[betIndex]
    bet.resolved = true
    bet.won = won
    
    if (won) {
      // Calculate payout (after 5% fee)
      bet.payout = Math.floor(bet.amount * multiplier * 0.95)
    } else {
      bet.payout = 0
    }

    bets[betIndex] = bet
    setDemoBets(bets)

    // Update stats
    const stats = getDemoStats()
    if (won) {
      stats.wins++
      stats.totalWon += bet.payout || 0
      stats.currentStreak++
      if (stats.currentStreak > stats.bestStreak) {
        stats.bestStreak = stats.currentStreak
      }
    } else {
      stats.losses++
      stats.currentStreak = 0
    }
    setDemoStats(stats)
  }

  // --------------------------------------------------------------------------
  // Calculations
  // --------------------------------------------------------------------------

  calculatePotentialPayout(
    betAmount: number,
    prediction: boolean,
    upPool: number,
    downPool: number
  ): number {
    const totalPool = upPool + downPool + betAmount
    const winningPool = prediction ? upPool + betAmount : downPool + betAmount
    
    const poolAfterFee = totalPool * (1 - PROTOCOL_FEE_BPS / 10000)
    const payout = (betAmount / winningPool) * poolAfterFee
    
    return Math.floor(payout)
  }

  calculateMultiplier(prediction: boolean, upPool: number, downPool: number): number {
    const totalPool = upPool + downPool
    const winningPool = prediction ? upPool : downPool
    
    if (winningPool === 0) return 2.0
    
    const poolAfterFee = totalPool * (1 - PROTOCOL_FEE_BPS / 10000)
    return poolAfterFee / winningPool
  }

  calculateLeaderboardScore(stats: DemoStats): number {
    const winRate = stats.wins + stats.losses > 0 
      ? (stats.wins / (stats.wins + stats.losses)) * 100 
      : 0
    const volume = stats.totalWagered / 1_000_000

    return Math.floor(
      (stats.wins * 10) + 
      (winRate * 100) + 
      (stats.bestStreak * 5) + 
      (volume / 100)
    )
  }
}

// ============================================================================
// UTILITIES
// ============================================================================

/**
 * Format $SWTCH amount for display (6 decimals)
 */
export function formatSwtch(amount: number | BN): string {
  const value = typeof amount === 'number' ? amount : amount.toNumber()
  const swtch = value / 1_000_000
  
  if (swtch >= 1000000) {
    return (swtch / 1000000).toFixed(2) + 'M'
  }
  if (swtch >= 1000) {
    return (swtch / 1000).toFixed(1) + 'k'
  }
  return swtch.toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })
}

/**
 * Parse $SWTCH amount from user input to smallest unit
 */
export function parseSwtch(amount: string): number {
  const value = parseFloat(amount)
  if (isNaN(value)) throw new Error('Invalid amount')
  return Math.floor(value * 1_000_000)
}

/**
 * Convert smallest unit to $SWTCH
 */
export function toSwtch(amount: number): number {
  return amount / 1_000_000
}

/**
 * Shorten a public key for display
 */
export function shortenAddress(address: PublicKey | string, chars = 4): string {
  const str = typeof address === 'string' ? address : address.toBase58()
  return `${str.slice(0, chars)}...${str.slice(-chars)}`
}

// ============================================================================
// JUPITER INTEGRATION (USDC -> $SWTCH swap)
// ============================================================================

export interface SwapQuote {
  inAmount: number
  outAmount: number
  priceImpact: number
  route: any
}

export class JupiterSwap {
  connection: Connection

  constructor(connection: Connection) {
    this.connection = connection
  }

  async getQuote(usdcAmount: number): Promise<SwapQuote | null> {
    try {
      // Mock quote for demo/development
      const mockRate = 2.5 // 1 USDC = 2.5 $SWTCH
      return {
        inAmount: usdcAmount,
        outAmount: Math.floor(usdcAmount * mockRate),
        priceImpact: 0.1,
        route: null,
      }
    } catch (err) {
      console.error('Jupiter quote error:', err)
      return null
    }
  }

  async swap(
    user: PublicKey,
    usdcAmount: number,
    signTransaction: (tx: Transaction) => Promise<Transaction>
  ): Promise<{ signature: string; swtchReceived: number } | null> {
    try {
      const quote = await this.getQuote(usdcAmount)
      if (!quote) throw new Error('Failed to get quote')

      if (DEMO_MODE) {
        await new Promise(resolve => setTimeout(resolve, 1500))
        return {
          signature: 'demo_swap_' + Date.now(),
          swtchReceived: quote.outAmount,
        }
      }

      // Production: use Jupiter SDK
      return null
    } catch (err) {
      console.error('Jupiter swap error:', err)
      return null
    }
  }

  async swapAndDeposit(
    user: PublicKey,
    usdcAmount: number,
    arenaClient: ArenaClient,
    signTransaction: (tx: Transaction) => Promise<Transaction>
  ): Promise<TransactionResult> {
    try {
      const swapResult = await this.swap(user, usdcAmount, signTransaction)
      if (!swapResult) {
        return { success: false, demo: DEMO_MODE, error: 'Swap failed' }
      }

      const depositResult = await arenaClient.deposit(
        user,
        swapResult.swtchReceived,
        signTransaction
      )

      return depositResult
    } catch (err: any) {
      return { success: false, demo: DEMO_MODE, error: err.message }
    }
  }
}

// ============================================================================
// SINGLETON INSTANCES
// ============================================================================

let arenaClientInstance: ArenaClient | null = null
let jupiterSwapInstance: JupiterSwap | null = null

export function getArenaClient(connection: Connection): ArenaClient {
  if (!arenaClientInstance) {
    arenaClientInstance = new ArenaClient(connection)
  }
  return arenaClientInstance
}

export function getJupiterSwap(connection: Connection): JupiterSwap {
  if (!jupiterSwapInstance) {
    jupiterSwapInstance = new JupiterSwap(connection)
  }
  return jupiterSwapInstance
}

export default ArenaClient
