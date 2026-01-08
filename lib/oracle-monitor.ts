import { Blockchain, Network } from '@/types/feed'

export type OracleStatus = 'healthy' | 'stale' | 'error' | 'loading'

export interface OracleDataPoint {
  timestamp: Date
  value: number
}

export interface MonitoredOracle {
  id: string
  name: string
  symbol: string
  type: 'feed' | 'prediction' | 'weather' | 'sports' | 'social' | 'ai-judge' | 'custom-api'
  blockchain: Blockchain
  network: Network
  publicKey: string
  currentValue: number
  previousValue: number
  change24h: number // percentage
  changeDirection: 'up' | 'down' | 'neutral'
  status: OracleStatus
  lastUpdate: Date
  updateInterval: number // seconds
  history: OracleDataPoint[] // Last 24 hours
  alerts: OracleAlert[]
  source?: string
}

export interface OracleAlert {
  id: string
  type: 'threshold_high' | 'threshold_low' | 'stale' | 'error' | 'deviation'
  message: string
  severity: 'info' | 'warning' | 'critical'
  timestamp: Date
  acknowledged: boolean
}

export interface AlertThreshold {
  oracleId: string
  type: 'above' | 'below' | 'change_percent'
  value: number
  enabled: boolean
}

// Generate mock historical data
function generateHistory(currentValue: number, volatility: number = 0.02): OracleDataPoint[] {
  const points: OracleDataPoint[] = []
  const now = new Date()
  let value = currentValue * (1 - volatility * 10 * Math.random()) // Start slightly lower
  
  // Generate 288 points (24 hours at 5-minute intervals)
  for (let i = 287; i >= 0; i--) {
    const timestamp = new Date(now.getTime() - i * 5 * 60 * 1000)
    
    // Random walk with trend toward current value
    const trendBias = (currentValue - value) * 0.01
    const change = (Math.random() - 0.5) * volatility * value + trendBias
    value = Math.max(0.01, value + change)
    
    points.push({ timestamp, value })
  }
  
  // Ensure last point is current value
  points[points.length - 1].value = currentValue
  
  return points
}

// Calculate 24h change from history
function calculate24hChange(history: OracleDataPoint[]): number {
  if (history.length < 2) return 0
  const oldest = history[0].value
  const newest = history[history.length - 1].value
  return ((newest - oldest) / oldest) * 100
}

// Mock deployed oracles data
export function getMockDeployedOracles(): MonitoredOracle[] {
  const now = new Date()
  
  const oracles: Omit<MonitoredOracle, 'history' | 'change24h' | 'changeDirection'>[] = [
    {
      id: 'btc-usd-1',
      name: 'BTC/USD Price Feed',
      symbol: 'BTC/USD',
      type: 'feed',
      blockchain: 'solana',
      network: 'mainnet',
      publicKey: '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU',
      currentValue: 97542.50,
      previousValue: 97380.25,
      status: 'healthy',
      lastUpdate: new Date(now.getTime() - 15000),
      updateInterval: 30,
      alerts: [],
      source: 'CoinGecko',
    },
    {
      id: 'eth-usd-1',
      name: 'ETH/USD Price Feed',
      symbol: 'ETH/USD',
      type: 'feed',
      blockchain: 'solana',
      network: 'mainnet',
      publicKey: '9aBC2defGHIjk3LmNoPQrStUv4WxYz56Ab78CdEf90Gh',
      currentValue: 3542.18,
      previousValue: 3498.90,
      status: 'healthy',
      lastUpdate: new Date(now.getTime() - 22000),
      updateInterval: 30,
      alerts: [],
      source: 'CoinGecko',
    },
    {
      id: 'sol-usd-1',
      name: 'SOL/USD Price Feed',
      symbol: 'SOL/USD',
      type: 'feed',
      blockchain: 'solana',
      network: 'mainnet',
      publicKey: '3mNoPQrStUv4WxYz56Ab78CdEf90GhIjK2LmNoPQrStU',
      currentValue: 189.45,
      previousValue: 185.20,
      status: 'healthy',
      lastUpdate: new Date(now.getTime() - 8000),
      updateInterval: 30,
      alerts: [],
      source: 'Binance, Coinbase',
    },
    {
      id: 'trump-win-1',
      name: 'Trump 2028 Election',
      symbol: 'TRUMP-WIN',
      type: 'prediction',
      blockchain: 'solana',
      network: 'mainnet',
      publicKey: '5pQrStUv4WxYz56Ab78CdEf90GhIjK2LmNoPQrStUv4W',
      currentValue: 0.42,
      previousValue: 0.38,
      status: 'healthy',
      lastUpdate: new Date(now.getTime() - 300000),
      updateInterval: 3600,
      alerts: [],
      source: 'Polymarket',
    },
    {
      id: 'btc-100k-1',
      name: 'BTC Above $100K Jan 2026',
      symbol: 'BTC-100K',
      type: 'prediction',
      blockchain: 'solana',
      network: 'mainnet',
      publicKey: '8vWxYz56Ab78CdEf90GhIjK2LmNoPQrStUv4WxYz56Ab',
      currentValue: 0.78,
      previousValue: 0.72,
      status: 'healthy',
      lastUpdate: new Date(now.getTime() - 180000),
      updateInterval: 3600,
      alerts: [
        {
          id: 'alert-1',
          type: 'threshold_high',
          message: 'Value crossed above 75% threshold',
          severity: 'info',
          timestamp: new Date(now.getTime() - 3600000),
          acknowledged: false,
        }
      ],
      source: 'Kalshi',
    },
    {
      id: 'nyc-temp-1',
      name: 'NYC Temperature',
      symbol: 'NYC-TEMP',
      type: 'weather',
      blockchain: 'solana',
      network: 'mainnet',
      publicKey: '2yZ56Ab78CdEf90GhIjK2LmNoPQrStUv4WxYz56Ab78C',
      currentValue: 38,
      previousValue: 35,
      status: 'healthy',
      lastUpdate: new Date(now.getTime() - 900000),
      updateInterval: 3600,
      alerts: [],
      source: 'Open-Meteo',
    },
    {
      id: 'elon-followers-1',
      name: 'Elon Musk Followers',
      symbol: 'ELON-FLLW',
      type: 'social',
      blockchain: 'solana',
      network: 'devnet',
      publicKey: '4bCdEf90GhIjK2LmNoPQrStUv4WxYz56Ab78CdEf90Gh',
      currentValue: 195800000,
      previousValue: 195750000,
      status: 'healthy',
      lastUpdate: new Date(now.getTime() - 3600000),
      updateInterval: 3600,
      alerts: [],
      source: 'Twitter/X',
    },
    {
      id: 'github-stars-1',
      name: 'Solana Repo Stars',
      symbol: 'SOL-STARS',
      type: 'custom-api',
      blockchain: 'solana',
      network: 'mainnet',
      publicKey: '6fGhIjK2LmNoPQrStUv4WxYz56Ab78CdEf90GhIjK2Lm',
      currentValue: 12450,
      previousValue: 12380,
      status: 'healthy',
      lastUpdate: new Date(now.getTime() - 1800000),
      updateInterval: 3600,
      alerts: [],
      source: 'GitHub API',
    },
    {
      id: 'stale-oracle-1',
      name: 'Stale Test Oracle',
      symbol: 'STALE',
      type: 'feed',
      blockchain: 'solana',
      network: 'devnet',
      publicKey: '9jK2LmNoPQrStUv4WxYz56Ab78CdEf90GhIjK2LmNoPQ',
      currentValue: 1.05,
      previousValue: 1.05,
      status: 'stale',
      lastUpdate: new Date(now.getTime() - 7200000), // 2 hours ago
      updateInterval: 60,
      alerts: [
        {
          id: 'alert-2',
          type: 'stale',
          message: 'Oracle has not updated in over 2 hours',
          severity: 'warning',
          timestamp: new Date(now.getTime() - 3600000),
          acknowledged: false,
        }
      ],
      source: 'Custom',
    },
  ]
  
  // Add history and calculate changes
  return oracles.map(oracle => {
    const volatility = oracle.type === 'feed' ? 0.015 : 
                       oracle.type === 'prediction' ? 0.05 :
                       oracle.type === 'social' ? 0.001 : 0.02
    const history = generateHistory(oracle.currentValue, volatility)
    const change24h = calculate24hChange(history)
    
    return {
      ...oracle,
      history,
      change24h,
      changeDirection: change24h > 0.01 ? 'up' : change24h < -0.01 ? 'down' : 'neutral' as const,
    }
  })
}

// Simulate real-time value updates
export function simulateValueUpdate(oracle: MonitoredOracle): MonitoredOracle {
  const volatility = oracle.type === 'feed' ? 0.002 : 
                     oracle.type === 'prediction' ? 0.01 :
                     oracle.type === 'social' ? 0.0001 : 0.005
  
  const change = (Math.random() - 0.5) * volatility * oracle.currentValue
  const newValue = Math.max(0.01, oracle.currentValue + change)
  
  const now = new Date()
  const newHistory = [...oracle.history.slice(1), { timestamp: now, value: newValue }]
  const change24h = calculate24hChange(newHistory)
  
  return {
    ...oracle,
    previousValue: oracle.currentValue,
    currentValue: newValue,
    history: newHistory,
    change24h,
    changeDirection: change24h > 0.01 ? 'up' : change24h < -0.01 ? 'down' : 'neutral',
    lastUpdate: now,
    status: 'healthy',
  }
}

// Format value based on oracle type
export function formatOracleValue(value: number, type: MonitoredOracle['type'], symbol?: string): string {
  if (type === 'prediction') {
    return `${(value * 100).toFixed(1)}%`
  }
  if (type === 'weather') {
    return `${value.toFixed(1)}°F`
  }
  if (type === 'social' && value > 1000000) {
    return `${(value / 1000000).toFixed(2)}M`
  }
  if (symbol?.includes('USD') || type === 'feed') {
    if (value >= 1000) {
      return `$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    }
    return `$${value.toFixed(value < 1 ? 6 : 2)}`
  }
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(2)}M`
  }
  if (value >= 1000) {
    return value.toLocaleString(undefined, { maximumFractionDigits: 0 })
  }
  return value.toFixed(2)
}

// Get status color
export function getStatusColor(status: OracleStatus): string {
  switch (status) {
    case 'healthy': return 'text-emerald-500'
    case 'stale': return 'text-amber-500'
    case 'error': return 'text-red-500'
    case 'loading': return 'text-gray-400'
  }
}

// Get status background
export function getStatusBg(status: OracleStatus): string {
  switch (status) {
    case 'healthy': return 'bg-emerald-500'
    case 'stale': return 'bg-amber-500'
    case 'error': return 'bg-red-500'
    case 'loading': return 'bg-gray-400'
  }
}

// Check for threshold alerts
export function checkThresholdAlerts(
  oracle: MonitoredOracle, 
  thresholds: AlertThreshold[]
): OracleAlert[] {
  const alerts: OracleAlert[] = []
  const now = new Date()
  
  for (const threshold of thresholds) {
    if (!threshold.enabled || threshold.oracleId !== oracle.id) continue
    
    if (threshold.type === 'above' && oracle.currentValue > threshold.value) {
      alerts.push({
        id: `alert-${Date.now()}`,
        type: 'threshold_high',
        message: `Value (${oracle.currentValue.toFixed(2)}) crossed above ${threshold.value}`,
        severity: 'warning',
        timestamp: now,
        acknowledged: false,
      })
    }
    
    if (threshold.type === 'below' && oracle.currentValue < threshold.value) {
      alerts.push({
        id: `alert-${Date.now()}`,
        type: 'threshold_low',
        message: `Value (${oracle.currentValue.toFixed(2)}) dropped below ${threshold.value}`,
        severity: 'warning',
        timestamp: now,
        acknowledged: false,
      })
    }
    
    if (threshold.type === 'change_percent' && Math.abs(oracle.change24h) > threshold.value) {
      alerts.push({
        id: `alert-${Date.now()}`,
        type: 'deviation',
        message: `24h change (${oracle.change24h.toFixed(2)}%) exceeded ${threshold.value}%`,
        severity: oracle.change24h > 0 ? 'info' : 'warning',
        timestamp: now,
        acknowledged: false,
      })
    }
  }
  
  return alerts
}

// Get time since last update
export function getTimeSinceUpdate(lastUpdate: Date): string {
  const seconds = Math.floor((Date.now() - lastUpdate.getTime()) / 1000)
  
  if (seconds < 60) return `${seconds}s ago`
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
  return `${Math.floor(seconds / 86400)}d ago`
}

// Get type icon
export function getTypeIcon(type: MonitoredOracle['type']): string {
  switch (type) {
    case 'feed': return '📊'
    case 'prediction': return '🎯'
    case 'weather': return '🌤️'
    case 'sports': return '🏆'
    case 'social': return '👥'
    case 'ai-judge': return '🧠'
    case 'custom-api': return '🌐'
    default: return '📈'
  }
}

// Calculate dashboard stats
export function calculateDashboardStats(oracles: MonitoredOracle[]) {
  return {
    total: oracles.length,
    healthy: oracles.filter(o => o.status === 'healthy').length,
    stale: oracles.filter(o => o.status === 'stale').length,
    error: oracles.filter(o => o.status === 'error').length,
    totalAlerts: oracles.reduce((sum, o) => sum + o.alerts.filter(a => !a.acknowledged).length, 0),
    byType: {
      feed: oracles.filter(o => o.type === 'feed').length,
      prediction: oracles.filter(o => o.type === 'prediction').length,
      weather: oracles.filter(o => o.type === 'weather').length,
      social: oracles.filter(o => o.type === 'social').length,
      'custom-api': oracles.filter(o => o.type === 'custom-api').length,
    },
    byChain: {
      solana: oracles.filter(o => o.blockchain === 'solana').length,
      ethereum: oracles.filter(o => o.blockchain === 'ethereum').length,
      monad: oracles.filter(o => o.blockchain === 'monad').length,
    },
  }
}


