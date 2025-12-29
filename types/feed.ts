export interface DataSource {
  id: string
  name: string
  type: 'api' | 'on-chain' | 'aggregator'
  url?: string
  weight?: number
  enabled: boolean
}

export interface AggregatorConfig {
  type: 'median' | 'mean' | 'weighted' | 'custom'
  minSources?: number
  deviationThreshold?: number
}

export type Blockchain = 'solana' | 'ethereum' | 'monad'
export type Network = 'mainnet' | 'devnet' | 'testnet'

export interface FeedConfig {
  id?: string
  name: string
  symbol: string
  description?: string
  dataSources: DataSource[]
  aggregator: AggregatorConfig
  updateInterval: number // seconds
  decimals: number
  blockchain: Blockchain
  network: Network
  enabled: boolean
  createdAt?: Date
  updatedAt?: Date
  isFavorite?: boolean
  userId?: string
}

export interface FeedPreview {
  currentPrice: number
  lastUpdate: Date
  sources: {
    [key: string]: {
      price: number
      timestamp: Date
      status: 'active' | 'error' | 'pending'
    }
  }
  aggregatedPrice: number
}




