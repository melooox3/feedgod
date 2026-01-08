import { Oracle, OracleFilters, OracleStats, OracleType } from '@/types/oracle'

// Oracle metadata (without prices - prices fetched separately)
const oracleMetadata: Omit<Oracle, 'currentValue'>[] = [
  // Price Feeds
  {
    id: '1',
    name: 'BTC/USD Price Feed',
    type: 'feed',
    symbol: 'BTC/USD',
    network: 'solana-mainnet',
    publicKey: 'SWBbtc1USDfeed7xKXa9dF2mNoPqRsTuVwXyZ123ABC',
    lastUpdate: new Date().toISOString(),
    sources: ['coingecko', 'binance', 'kraken'],
    creator: '7xKXa9dF2mNoPqRsTuVwXyZ123ABCdef456GHI',
    createdAt: '2024-06-15T00:00:00Z',
    description: 'Aggregated Bitcoin price from multiple exchanges',
    updateInterval: 30,
    decimals: 2,
    status: 'active'
  },
  {
    id: '2',
    name: 'ETH/USD Price Feed',
    type: 'feed',
    symbol: 'ETH/USD',
    network: 'solana-mainnet',
    publicKey: 'SWBeth1USDfeedDEF456UVWxyz789QRStuv012MNO',
    lastUpdate: new Date().toISOString(),
    sources: ['coingecko', 'kraken', 'coinbase'],
    creator: '9aBCdef123GHI456jklMNO789pqrSTU012vwx',
    createdAt: '2024-07-01T00:00:00Z',
    description: 'Ethereum price aggregated with median filtering',
    updateInterval: 30,
    decimals: 2,
    status: 'active'
  },
  {
    id: '3',
    name: 'SOL/USD Price Feed',
    type: 'feed',
    symbol: 'SOL/USD',
    network: 'solana-mainnet',
    publicKey: 'SWBsol1USDfeedGHI789RSTuvw012XYZabc345DEF',
    lastUpdate: new Date().toISOString(),
    sources: ['coingecko', 'binance', 'jupiter'],
    creator: '2xYZabc345DEF678ghiJKL901mnoPQR234stu',
    createdAt: '2024-05-20T00:00:00Z',
    description: 'Solana native token price feed',
    updateInterval: 15,
    decimals: 2,
    status: 'active'
  },
  {
    id: '4',
    name: 'BONK/USD Price Feed',
    type: 'feed',
    symbol: 'BONK/USD',
    network: 'solana-mainnet',
    publicKey: 'SWBbonkUSDfeedJKL012MNOpqr345STUvwx678YZA',
    lastUpdate: new Date().toISOString(),
    sources: ['jupiter', 'raydium', 'coingecko'],
    creator: '5mNOpqr234STU567vwxYZA890bcDEF123ghi',
    createdAt: '2024-08-10T00:00:00Z',
    description: 'BONK memecoin price aggregated from DEXs',
    updateInterval: 60,
    decimals: 10,
    status: 'active'
  },
  {
    id: '5',
    name: 'JUP/USD Price Feed',
    type: 'feed',
    symbol: 'JUP/USD',
    network: 'solana-mainnet',
    publicKey: 'SWBjup1USDfeedMNO345PQRstu678VWXyza901BCD',
    lastUpdate: new Date().toISOString(),
    sources: ['jupiter', 'coingecko', 'binance'],
    creator: '8qRStuv567WXYza890BCDef123GHIjkl456mno',
    createdAt: '2024-09-05T00:00:00Z',
    description: 'Jupiter token price feed',
    updateInterval: 30,
    decimals: 4,
    status: 'active'
  },
  {
    id: '6',
    name: 'WIF/USD Price Feed',
    type: 'feed',
    symbol: 'WIF/USD',
    network: 'solana-mainnet',
    publicKey: 'SWBwif1USDfeedPQR678STUvwx901YZAbcd234EFG',
    lastUpdate: new Date().toISOString(),
    sources: ['jupiter', 'raydium', 'birdeye'],
    creator: '3dEFghi789JKLmno012PQRstu345VWXyza678',
    createdAt: '2024-10-01T00:00:00Z',
    description: 'dogwifhat memecoin aggregated price',
    updateInterval: 60,
    decimals: 4,
    status: 'active'
  },
  
  // Prediction Markets
  {
    id: '7',
    name: 'Super Bowl Winner 2025',
    type: 'prediction',
    symbol: 'SB-2025',
    network: 'solana-mainnet',
    publicKey: 'SWBpredSB25feedSTU901VWXyza234BCDef567GHI',
    lastUpdate: new Date().toISOString(),
    sources: ['polymarket'],
    creator: '6gHIjkl012MNOpqr345STUvwx678YZAbcd901',
    createdAt: '2024-11-15T00:00:00Z',
    description: 'Will the Kansas City Chiefs win Super Bowl LIX?',
    updateInterval: 300,
    decimals: 4,
    status: 'active'
  },
  {
    id: '8',
    name: 'Fed Rate Decision Jan 2025',
    type: 'prediction',
    symbol: 'FED-JAN25',
    network: 'solana-mainnet',
    publicKey: 'SWBpredFEDfeedVWX234YZAbc567DEFgh890IJK',
    lastUpdate: new Date().toISOString(),
    sources: ['kalshi'],
    creator: '9jKLmno345PQRstu678VWXyza901BCDef234',
    createdAt: '2024-12-01T00:00:00Z',
    description: 'Will the Fed cut rates in January 2025?',
    updateInterval: 300,
    decimals: 4,
    status: 'active'
  },
  {
    id: '9',
    name: 'Bitcoin $100K by Feb 2025',
    type: 'prediction',
    symbol: 'BTC-100K',
    network: 'solana-mainnet',
    publicKey: 'SWBpredBTC100feedYZA567BCDef890GHIjk123LMN',
    lastUpdate: new Date().toISOString(),
    sources: ['polymarket'],
    creator: '1mNOpqr678STUvwx901YZAbcd234EFGhi567',
    createdAt: '2024-10-15T00:00:00Z',
    description: 'Will Bitcoin reach $100,000 by February 1, 2025?',
    updateInterval: 300,
    decimals: 4,
    status: 'active'
  },
  
  // Weather Oracles
  {
    id: '10',
    name: 'NYC Daily Temperature',
    type: 'weather',
    symbol: 'NYC-TEMP',
    network: 'solana-mainnet',
    publicKey: 'SWBwthrNYCfeedBCD890EFGhi123JKLmn456OPQ',
    lastUpdate: new Date().toISOString(),
    sources: ['open-meteo'],
    creator: '4pQRstu901VWXyza234BCDef567GHIjkl890',
    createdAt: '2025-01-02T00:00:00Z',
    description: 'New York City daily max temperature in Fahrenheit',
    updateInterval: 3600,
    decimals: 1,
    status: 'active'
  },
  {
    id: '11',
    name: 'Tokyo Daily Precipitation',
    type: 'weather',
    symbol: 'TYO-RAIN',
    network: 'solana-mainnet',
    publicKey: 'SWBwthrTYOfeedEFG123HIJkl456MNOpr789QRS',
    lastUpdate: new Date().toISOString(),
    sources: ['open-meteo'],
    creator: '7sTUvwx234YZAbcd567EFGhi890JKLmno123',
    createdAt: '2025-01-03T00:00:00Z',
    description: 'Tokyo daily precipitation in millimeters',
    updateInterval: 3600,
    decimals: 1,
    status: 'active'
  },
  {
    id: '12',
    name: 'London Humidity Index',
    type: 'weather',
    symbol: 'LON-HUM',
    network: 'solana-mainnet',
    publicKey: 'SWBwthrLONfeedHIJ456KLMno789PQRst012UVW',
    lastUpdate: new Date().toISOString(),
    sources: ['open-meteo'],
    creator: '2vWXyza567BCDef890GHIjkl123MNOpqr456',
    createdAt: '2025-01-04T00:00:00Z',
    description: 'London relative humidity percentage',
    updateInterval: 3600,
    decimals: 0,
    status: 'active'
  },
  
  // VRF
  {
    id: '13',
    name: 'Gaming Random Generator',
    type: 'vrf',
    symbol: 'VRF-GAME',
    network: 'solana-mainnet',
    publicKey: 'SWBvrfGAMEfeedKLM789NOPqr012STUvw345XYZ',
    lastUpdate: new Date().toISOString(),
    sources: ['switchboard-vrf'],
    creator: '5yZAbcd890EFGhi123JKLmno456PQRstu789',
    createdAt: '2024-08-20T00:00:00Z',
    description: 'Verifiable random numbers for on-chain gaming',
    updateInterval: 0,
    decimals: 0,
    status: 'active'
  },
  {
    id: '14',
    name: 'NFT Mint Randomizer',
    type: 'vrf',
    symbol: 'VRF-NFT',
    network: 'solana-mainnet',
    publicKey: 'SWBvrfNFTfeedNOP012QRStu345VWXyz678ABC',
    lastUpdate: new Date().toISOString(),
    sources: ['switchboard-vrf'],
    creator: '8bCDef123GHIjkl456MNOpqr789STUvwx012',
    createdAt: '2024-09-10T00:00:00Z',
    description: 'Fair NFT trait randomization service',
    updateInterval: 0,
    decimals: 0,
    status: 'active'
  },
  {
    id: '15',
    name: 'Lottery Number Generator',
    type: 'vrf',
    symbol: 'VRF-LOTTO',
    network: 'solana-mainnet',
    publicKey: 'SWBvrfLOTTOfeedQRS345TUVwx678YZAbc901DEF',
    lastUpdate: new Date().toISOString(),
    sources: ['switchboard-vrf'],
    creator: '1eFGhi456JKLmno789PQRstu012VWXyza345',
    createdAt: '2024-07-25T00:00:00Z',
    description: 'Provably fair lottery number generation',
    updateInterval: 0,
    decimals: 0,
    status: 'active'
  },
  
  // Functions
  {
    id: '16',
    name: 'Twitter Follower Count',
    type: 'function',
    symbol: 'FUNC-TWTR',
    network: 'solana-mainnet',
    publicKey: 'SWBfuncTWTRfeedTUV678WXYza901BCDef234GHI',
    lastUpdate: new Date().toISOString(),
    sources: ['twitter-api'],
    creator: '4hIJkl789MNOpqr012STUvwx345YZAbcd678',
    createdAt: '2024-11-01T00:00:00Z',
    description: 'Fetch and verify Twitter follower counts on-chain',
    updateInterval: 3600,
    decimals: 0,
    status: 'active'
  },
  {
    id: '17',
    name: 'GitHub Stars Counter',
    type: 'function',
    symbol: 'FUNC-GH',
    network: 'solana-mainnet',
    publicKey: 'SWBfuncGHfeedWXY901ZABcd234EFGhi567JKL',
    lastUpdate: new Date().toISOString(),
    sources: ['github-api'],
    creator: '7kLMno012PQRstu345VWXyza678BCDef901',
    createdAt: '2024-12-15T00:00:00Z',
    description: 'Track GitHub repository star counts',
    updateInterval: 3600,
    decimals: 0,
    status: 'active'
  },
  {
    id: '18',
    name: 'CS2 Match Results',
    type: 'function',
    symbol: 'FUNC-CS2',
    network: 'solana-mainnet',
    publicKey: 'SWBfuncCS2feedZAB234CDEfg567HIJkl890MNO',
    lastUpdate: new Date().toISOString(),
    sources: ['hltv-api'],
    creator: '3nOPqr345STUvwx678YZAbcd901EFGhi234',
    createdAt: '2024-10-20T00:00:00Z',
    description: 'Fetch CS2 esports match outcomes',
    updateInterval: 300,
    decimals: 0,
    status: 'active'
  },
  
  // More feeds for variety
  {
    id: '19',
    name: 'LINK/USD Price Feed',
    type: 'feed',
    symbol: 'LINK/USD',
    network: 'solana-mainnet',
    publicKey: 'SWBlinkUSDfeedCDE567FGHij890KLMno123PQR',
    lastUpdate: new Date().toISOString(),
    sources: ['coingecko', 'binance'],
    creator: '6qRStu678VWXyza901BCDef234GHIjkl567',
    createdAt: '2024-08-01T00:00:00Z',
    description: 'Chainlink token price feed',
    updateInterval: 60,
    decimals: 2,
    status: 'active'
  },
  {
    id: '20',
    name: 'RNDR/USD Price Feed',
    type: 'feed',
    symbol: 'RNDR/USD',
    network: 'solana-mainnet',
    publicKey: 'SWBrndrUSDfeedFGH890IJKlm123NOPqr456STU',
    lastUpdate: new Date().toISOString(),
    sources: ['coingecko', 'kraken'],
    creator: '9tUVwx901YZAbcd234EFGhi567JKLmno890',
    createdAt: '2024-09-15T00:00:00Z',
    description: 'Render Network token price',
    updateInterval: 60,
    decimals: 2,
    status: 'active'
  },
]

// Default placeholder values for non-price oracles
const DEFAULT_VALUES: Record<string, number | null> = {
  'SB-2025': 0.68,
  'FED-JAN25': 0.15,
  'BTC-100K': 0.72,
  'NYC-TEMP': 38,
  'TYO-RAIN': 2.5,
  'LON-HUM': 78,
  'VRF-GAME': null,
  'VRF-NFT': null,
  'VRF-LOTTO': null,
  'FUNC-TWTR': 5420000,
  'FUNC-GH': 12500,
  'FUNC-CS2': 1,
}

// Cache for real-time prices
let priceCache: Record<string, { price: number; change24h: number; timestamp: number }> = {}
const PRICE_CACHE_TTL = 30000 // 30 seconds

/**
 * Get all symbols that are price feeds
 */
export function getPriceFeedSymbols(): string[] {
  return oracleMetadata
    .filter(o => o.type === 'feed')
    .map(o => o.symbol)
}

/**
 * Fetch real prices from our API
 */
export async function fetchRealPrices(symbols: string[]): Promise<Record<string, { price: number; change24h: number }>> {
  try {
    const response = await fetch(`/api/prices?symbols=${symbols.join(',')}`)
    if (!response.ok) throw new Error('Failed to fetch prices')
    
    const data = await response.json()
    const prices: Record<string, { price: number; change24h: number }> = {}
    
    for (const symbol of symbols) {
      if (data.prices?.[symbol]) {
        prices[symbol] = {
          price: data.prices[symbol].price,
          change24h: data.prices[symbol].change24h,
        }
        // Update cache
        priceCache[symbol] = {
          ...prices[symbol],
          timestamp: Date.now(),
        }
      }
    }
    
    return prices
  } catch (error) {
    console.error('Failed to fetch real prices:', error)
    return {}
  }
}

/**
 * Get cached price or fetch if stale
 */
export function getCachedPrice(symbol: string): number | null {
  const cached = priceCache[symbol]
  if (cached && Date.now() - cached.timestamp < PRICE_CACHE_TTL) {
    return cached.price
  }
  return null
}

/**
 * Update price cache directly (for use by components that have fresh prices)
 */
export function updatePriceCache(symbol: string, price: number, change24h: number = 0) {
  priceCache[symbol] = {
    price,
    change24h,
    timestamp: Date.now(),
  }
}

/**
 * Fetch all oracles with optional filtering
 * Prices will be placeholder values - use usePrices hook to get real prices
 */
export async function fetchAllOracles(filters?: OracleFilters): Promise<Oracle[]> {
  // Small delay to simulate API
  await new Promise(resolve => setTimeout(resolve, 100))
  
  // Build oracles with current values
  let oracles: Oracle[] = oracleMetadata.map(meta => {
    let currentValue: number | null = null
    
    if (meta.type === 'feed') {
      // Check cache first, otherwise use placeholder
      const cached = priceCache[meta.symbol]
      if (cached && Date.now() - cached.timestamp < PRICE_CACHE_TTL) {
        currentValue = cached.price
      } else {
        // Placeholder - will be updated by real prices
        currentValue = 0
      }
    } else {
      // Non-price oracles use default values
      currentValue = DEFAULT_VALUES[meta.symbol] ?? null
    }
    
    return {
      ...meta,
      currentValue,
      lastUpdate: new Date().toISOString(),
    } as Oracle
  })
  
  // Apply filters
  if (filters) {
    // Filter by type
    if (filters.type && filters.type !== 'all') {
      oracles = oracles.filter(o => o.type === filters.type)
    }
    
    // Filter by network
    if (filters.network) {
      oracles = oracles.filter(o => o.network === filters.network)
    }
    
    // Search by name or symbol
    if (filters.search) {
      const query = filters.search.toLowerCase()
      oracles = oracles.filter(o => 
        o.name.toLowerCase().includes(query) ||
        o.symbol.toLowerCase().includes(query) ||
        o.description?.toLowerCase().includes(query)
      )
    }
    
    // Sort
    if (filters.sortBy) {
      switch (filters.sortBy) {
        case 'newest':
          oracles.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          break
        case 'oldest':
          oracles.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
          break
        case 'alphabetical':
          oracles.sort((a, b) => a.name.localeCompare(b.name))
          break
        case 'popular':
          oracles.sort((a, b) => (b.sources.length + (b.description ? 1 : 0)) - (a.sources.length + (a.description ? 1 : 0)))
          break
      }
    }
  }
  
  return oracles
}

/**
 * Fetch a single oracle by ID
 */
export async function fetchOracleById(id: string): Promise<Oracle | null> {
  await new Promise(resolve => setTimeout(resolve, 50))
  
  const meta = oracleMetadata.find(o => o.id === id)
  if (!meta) return null
  
  let currentValue: number | null = null
  
  if (meta.type === 'feed') {
    const cached = priceCache[meta.symbol]
    currentValue = cached?.price ?? 0
  } else {
    currentValue = DEFAULT_VALUES[meta.symbol] ?? null
  }
  
  return {
    ...meta,
    currentValue,
    lastUpdate: new Date().toISOString(),
  } as Oracle
}

/**
 * Get oracle statistics
 */
export async function fetchOracleStats(): Promise<OracleStats> {
  await new Promise(resolve => setTimeout(resolve, 50))
  
  return {
    totalOracles: oracleMetadata.length,
    totalFeeds: oracleMetadata.filter(o => o.type === 'feed').length,
    totalPredictions: oracleMetadata.filter(o => o.type === 'prediction').length,
    totalVRF: oracleMetadata.filter(o => o.type === 'vrf').length,
    totalWeather: oracleMetadata.filter(o => o.type === 'weather').length,
    totalFunctions: oracleMetadata.filter(o => o.type === 'function').length,
  }
}

/**
 * Format oracle value for display
 */
export function formatOracleValue(oracle: Oracle): string {
  if (oracle.currentValue === null) return 'On-demand'
  if (oracle.currentValue === 0 && oracle.type === 'feed') return 'Loading...'
  
  switch (oracle.type) {
    case 'feed':
      if (oracle.currentValue < 0.01) {
        return `$${oracle.currentValue.toFixed(oracle.decimals || 10)}`
      }
      return `$${oracle.currentValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    case 'prediction':
      return `${(oracle.currentValue * 100).toFixed(1)}%`
    case 'weather':
      if (oracle.symbol.includes('TEMP')) return `${oracle.currentValue}°F`
      if (oracle.symbol.includes('RAIN')) return `${oracle.currentValue}mm`
      if (oracle.symbol.includes('HUM')) return `${oracle.currentValue}%`
      return `${oracle.currentValue}`
    case 'function':
      return oracle.currentValue.toLocaleString()
    default:
      return String(oracle.currentValue)
  }
}

/**
 * Get oracle type label
 */
export function getOracleTypeLabel(type: OracleType): string {
  const labels: Record<OracleType, string> = {
    feed: 'Price Feed',
    prediction: 'Prediction',
    vrf: 'VRF',
    weather: 'Weather',
    function: 'Function',
  }
  return labels[type]
}

/**
 * Get oracle type color classes
 */
export function getOracleTypeColor(type: OracleType): string {
  const colors: Record<OracleType, string> = {
    feed: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
    prediction: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
    vrf: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
    weather: 'bg-sky-500/10 text-sky-500 border-sky-500/20',
    function: 'bg-pink-500/10 text-pink-500 border-pink-500/20',
  }
  return colors[type]
}
