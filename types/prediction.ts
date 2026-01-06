import { Blockchain, Network } from './feed'

export type PredictionPlatform = 'polymarket' | 'kalshi'

export type MarketStatus = 'active' | 'closed' | 'resolved'

export interface MarketOutcome {
  id: string
  name: string
  price: number // 0-1 representing probability
}

export interface PredictionMarket {
  id: string
  title: string
  description: string
  outcomes: MarketOutcome[]
  endDate: Date
  platform: PredictionPlatform
  currentPrices: Record<string, number> // outcome id -> price
  volume?: number
  liquidity?: number
  status: MarketStatus
  category?: string
  imageUrl?: string
  marketUrl?: string
}

export interface PredictionOracleConfig {
  id?: string
  name: string
  description?: string
  market: PredictionMarket
  selectedOutcome?: string // For multi-outcome markets, which outcome to track
  resolutionType: 'binary' | 'multi-outcome' | 'scalar'
  // Binary: outputs 1 for YES, 0 for NO
  // Multi-outcome: outputs index of winning outcome (0, 1, 2, ...)
  // Scalar: outputs the final value
  blockchain: Blockchain
  network: Network
  updateInterval: number // seconds - how often to check market status
  autoResolve: boolean // automatically resolve when market closes
  createdAt?: Date
  updatedAt?: Date
}

export interface MarketSearchFilters {
  platform?: PredictionPlatform
  category?: string
  status?: MarketStatus
  searchQuery?: string
  minVolume?: number
  minLiquidity?: number
}

