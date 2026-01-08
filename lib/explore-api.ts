import { Oracle, OracleFilters, OracleStats, OracleType } from '@/types/oracle'

// Mock data representing deployed oracles
const mockOracles: Oracle[] = [
  // Price Feeds
  {
    id: '1',
    name: 'BTC/USD Price Feed',
    type: 'feed',
    symbol: 'BTC/USD',
    network: 'solana-mainnet',
    publicKey: 'SWBbtc1USDfeed7xKXa9dF2mNoPqRsTuVwXyZ123ABC',
    lastUpdate: '2025-01-06T12:00:00Z',
    currentValue: 98542.50,
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
    lastUpdate: '2025-01-06T12:00:00Z',
    currentValue: 3687.25,
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
    lastUpdate: '2025-01-06T12:01:00Z',
    currentValue: 215.80,
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
    lastUpdate: '2025-01-06T12:00:30Z',
    currentValue: 0.00003245,
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
    lastUpdate: '2025-01-06T11:59:45Z',
    currentValue: 0.892,
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
    lastUpdate: '2025-01-06T12:00:15Z',
    currentValue: 2.15,
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
    lastUpdate: '2025-01-06T11:30:00Z',
    currentValue: 0.68,
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
    lastUpdate: '2025-01-06T11:45:00Z',
    currentValue: 0.15,
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
    lastUpdate: '2025-01-06T12:00:00Z',
    currentValue: 0.72,
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
    lastUpdate: '2025-01-06T12:00:00Z',
    currentValue: 38,
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
    lastUpdate: '2025-01-06T11:00:00Z',
    currentValue: 2.5,
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
    lastUpdate: '2025-01-06T12:00:00Z',
    currentValue: 78,
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
    lastUpdate: '2025-01-06T11:58:00Z',
    currentValue: null,
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
    lastUpdate: '2025-01-06T10:30:00Z',
    currentValue: null,
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
    lastUpdate: '2025-01-06T00:00:00Z',
    currentValue: null,
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
    lastUpdate: '2025-01-06T11:00:00Z',
    currentValue: 5420000,
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
    lastUpdate: '2025-01-06T10:00:00Z',
    currentValue: 12500,
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
    lastUpdate: '2025-01-05T22:30:00Z',
    currentValue: 1,
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
    lastUpdate: '2025-01-06T12:00:00Z',
    currentValue: 22.45,
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
    lastUpdate: '2025-01-06T12:00:00Z',
    currentValue: 8.92,
    sources: ['coingecko', 'kraken'],
    creator: '9tUVwx901YZAbcd234EFGhi567JKLmno890',
    createdAt: '2024-09-15T00:00:00Z',
    description: 'Render Network token price',
    updateInterval: 60,
    decimals: 2,
    status: 'active'
  },
]

/**
 * Fetch all oracles with optional filtering
 */
export async function fetchAllOracles(filters?: OracleFilters): Promise<Oracle[]> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 300))
  
  let oracles = [...mockOracles]
  
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
          // For mock data, we'll sort by how "complete" they look (has description, more sources, etc.)
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
  await new Promise(resolve => setTimeout(resolve, 100))
  return mockOracles.find(o => o.id === id) || null
}

/**
 * Get oracle statistics
 */
export async function fetchOracleStats(): Promise<OracleStats> {
  await new Promise(resolve => setTimeout(resolve, 100))
  
  return {
    totalOracles: mockOracles.length,
    totalFeeds: mockOracles.filter(o => o.type === 'feed').length,
    totalPredictions: mockOracles.filter(o => o.type === 'prediction').length,
    totalVRF: mockOracles.filter(o => o.type === 'vrf').length,
    totalWeather: mockOracles.filter(o => o.type === 'weather').length,
    totalFunctions: mockOracles.filter(o => o.type === 'function').length,
  }
}

/**
 * Format oracle value for display
 */
export function formatOracleValue(oracle: Oracle): string {
  if (oracle.currentValue === null) return 'On-demand'
  
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


