export type OracleType = 'feed' | 'function' | 'vrf' | 'prediction' | 'weather'

export interface Oracle {
  id: string
  name: string
  type: OracleType
  symbol: string
  network: string
  publicKey: string
  lastUpdate: string
  currentValue: number | null
  sources: string[]
  creator: string
  createdAt: string
  description?: string
  updateInterval?: number
  decimals?: number
  status?: 'active' | 'paused' | 'deprecated'
}

export interface OracleFilters {
  type?: OracleType | 'all'
  network?: string
  search?: string
  sortBy?: 'newest' | 'oldest' | 'popular' | 'alphabetical'
}

export interface OracleStats {
  totalOracles: number
  totalFeeds: number
  totalPredictions: number
  totalVRF: number
  totalWeather: number
  totalFunctions: number
}


