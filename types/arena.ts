// Arena Types

export type MarketCategory = 'shopping' | 'gaming' | 'travel' | 'weather' | 'social' | 'food' | 'crypto' | 'commodities' | 'sports'

export type MarketStatus = 'open' | 'locked' | 'resolved'

export type PredictionDirection = 'up' | 'down'

export interface Market {
  id: string
  title: string
  description: string
  category: MarketCategory
  currentValue: number
  previousValue: number
  unit: string
  threshold?: number // For binary markets (e.g., "Will X exceed Y?")
  thresholdDirection?: 'above' | 'below'
  resolveAt: Date
  status: MarketStatus
  totalUpPoints: number
  totalDownPoints: number
  upPredictors: number
  downPredictors: number
  payoutMultiplier: number
  iconName: MarketIconName
  source: string
  isDemo: boolean
  resolvedDirection?: PredictionDirection
  resolvedValue?: number
  feedPublicKey?: string // Switchboard oracle public key
}

export interface Prediction {
  id: string
  marketId: string
  marketTitle?: string
  direction: PredictionDirection
  amountWagered: number // USDC wagered
  placedAt: Date
  potentialPayout: number // USDC payout
  pointsEarned?: number // Points earned on win
  status: 'pending' | 'won' | 'lost'
  actualPayout?: number
  claimed?: boolean // Whether winnings have been claimed
}

export interface ArenaUser {
  id: string
  nickname: string
  swtchBalance: number // $SWTCH for betting (deposited)
  points: number // Points (earned through playing, for leaderboard)
  totalWins: number
  totalLosses: number
  currentStreak: number
  longestStreak: number
  totalVolume: number // Total $SWTCH wagered
  lastLoginDate: string
  predictions: Prediction[]
  createdAt: string
}

export interface LeaderboardEntry {
  rank: number
  id: string
  nickname: string
  points: number // Points for leaderboard ranking
  totalVolume: number // Total $SWTCH wagered
  winRate: number
  longestStreak: number
}

export type MarketIconName = 
  | 'ShoppingCart'
  | 'Gamepad2'
  | 'Plane'
  | 'Cloud'
  | 'Users'
  | 'UtensilsCrossed'
  | 'Package'
  | 'Monitor'
  | 'Twitch'
  | 'Fuel'
  | 'Thermometer'
  | 'Droplets'
  | 'Youtube'
  | 'Ticket'
  | 'Hamburger'
  | 'TrendingUp'

export const CATEGORY_INFO: Record<MarketCategory, { label: string; iconName: MarketIconName; color: string }> = {
  shopping: { label: 'Shopping', iconName: 'ShoppingCart', color: 'from-orange-500 to-amber-500' },
  gaming: { label: 'Gaming', iconName: 'Gamepad2', color: 'from-purple-500 to-violet-500' },
  travel: { label: 'Travel', iconName: 'Plane', color: 'from-sky-500 to-blue-500' },
  weather: { label: 'Weather', iconName: 'Cloud', color: 'from-cyan-500 to-teal-500' },
  social: { label: 'Social', iconName: 'Users', color: 'from-pink-500 to-rose-500' },
  food: { label: 'Food', iconName: 'UtensilsCrossed', color: 'from-green-500 to-emerald-500' },
  crypto: { label: 'Crypto', iconName: 'TrendingUp', color: 'from-yellow-500 to-orange-500' },
  commodities: { label: 'Commodities', iconName: 'Package', color: 'from-amber-500 to-yellow-500' },
  sports: { label: 'Sports', iconName: 'Monitor', color: 'from-green-500 to-lime-500' },
}

// Arena configuration
export const ARENA_CONFIG = {
  // Betting config (USDC-based)
  STARTING_BALANCE: 100, // Starting USDC balance for demo ($100)
  MIN_BET: 1, // Min bet in USDC ($1)
  MAX_BET: 1000, // Max bet in USDC ($1000)
  
  // Protocol fees
  PROTOCOL_FEE_PERCENT: 5, // 5% fee on winnings
  JUPITER_SWAP_FEE: 0.3, // ~0.3% Jupiter swap fee
  
  // Points rewards config (for leaderboard ranking)
  POINTS_PER_WIN: 100, // Base points for winning
  POINTS_STREAK_BONUS: 25, // Extra points per streak level
  POINTS_VOLUME_MULTIPLIER: 0.1, // Points = wager * this
  
  // Bonuses
  DAILY_LOGIN_POINTS: 50, // Daily login points bonus
  DAILY_BALANCE_BONUS: 10, // Daily USDC bonus (demo only)
  
  STREAK_THRESHOLD: 3, // Streak count for bonus
}

// Supported deposit tokens
export type DepositToken = 'USDC' | 'SWTCH'

// Token addresses (Solana mainnet)
export const TOKEN_ADDRESSES = {
  USDC: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', // USDC on Solana
  SWTCH: 'SWTCHPHBwn5xNBNXMxEqhKKqJsHxp4nzMqKZfnz2wKi', // $SWTCH token
}

// Legacy alias
export const POINTS_CONFIG = ARENA_CONFIG
