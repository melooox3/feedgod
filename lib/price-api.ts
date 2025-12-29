// Real-time price fetching from CoinGecko API

export interface PriceData {
  price: number
  volume24h: number
  priceChange24h: number
  lastUpdate: Date
}

export interface SourcePrice {
  price: number
  status: 'active' | 'error'
  timestamp: Date
}

const COINGECKO_API = 'https://api.coingecko.com/api/v3'

// Map symbols to CoinGecko IDs
const SYMBOL_TO_ID: Record<string, string> = {
  'BTC/USD': 'bitcoin',
  'ETH/USD': 'ethereum',
  'SOL/USD': 'solana',
  'BNB/USD': 'binancecoin',
  'ADA/USD': 'cardano',
  'XRP/USD': 'ripple',
  'DOGE/USD': 'dogecoin',
  'DOT/USD': 'polkadot',
  'MATIC/USD': 'matic-network',
  'AVAX/USD': 'avalanche-2',
}

export async function fetchCoinGeckoPrice(symbol: string): Promise<PriceData | null> {
  try {
    const coinId = SYMBOL_TO_ID[symbol] || symbol.toLowerCase().split('/')[0]
    
    const response = await fetch(
      `${COINGECKO_API}/simple/price?ids=${coinId}&vs_currencies=usd&include_24hr_vol=true&include_24hr_change=true`
    )
    
    if (!response.ok) {
      throw new Error('Failed to fetch price')
    }
    
    const data = await response.json()
    const coinData = data[coinId]
    
    if (!coinData) {
      return null
    }
    
    return {
      price: coinData.usd,
      volume24h: coinData.usd_24h_vol || 0,
      priceChange24h: coinData.usd_24h_change || 0,
      lastUpdate: new Date(),
    }
  } catch (error) {
    console.error('Error fetching CoinGecko price:', error)
    return null
  }
}

export async function fetchBinancePrice(symbol: string): Promise<SourcePrice | null> {
  try {
    // Convert BTC/USD to BTCUSDT for Binance
    const baseCurrency = symbol.split('/')[0]
    const binanceSymbol = `${baseCurrency}USDT`
    
    const response = await fetch(
      `https://api.binance.com/api/v3/ticker/24hr?symbol=${binanceSymbol}`
    )
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(`Failed to fetch Binance price: ${errorData.msg || response.statusText}`)
    }
    
    const data = await response.json()
    
    if (!data.lastPrice) {
      throw new Error('Invalid Binance response')
    }
    
    const price = parseFloat(data.lastPrice)
    
    if (isNaN(price) || price <= 0) {
      throw new Error('Invalid price from Binance')
    }
    
    return {
      price,
      status: 'active',
      timestamp: new Date(),
    }
  } catch (error) {
    console.error('Error fetching Binance price:', error)
    return {
      price: 0,
      status: 'error',
      timestamp: new Date(),
    }
  }
}

export async function fetchCoinbasePrice(symbol: string): Promise<SourcePrice | null> {
  try {
    // Convert BTC/USD to BTC-USD for Coinbase
    const baseCurrency = symbol.split('/')[0]
    const coinbasePair = `${baseCurrency}-USD`
    
    const response = await fetch(
      `https://api.coinbase.com/v2/exchange-rates?currency=${baseCurrency}`
    )
    
    if (!response.ok) {
      throw new Error('Failed to fetch Coinbase price')
    }
    
    const data = await response.json()
    if (!data.data || !data.data.rates || !data.data.rates.USD) {
      throw new Error('Invalid Coinbase response')
    }
    
    const rate = parseFloat(data.data.rates.USD)
    
    if (isNaN(rate) || rate <= 0) {
      throw new Error('Invalid price from Coinbase')
    }
    
    return {
      price: rate,
      status: 'active',
      timestamp: new Date(),
    }
  } catch (error) {
    console.error('Error fetching Coinbase price:', error)
    return {
      price: 0,
      status: 'error',
      timestamp: new Date(),
    }
  }
}

export async function fetchKrakenPrice(symbol: string): Promise<SourcePrice | null> {
  try {
    // Convert BTC/USD to XBTUSD for Kraken
    const krakenSymbol = symbol.replace('BTC', 'XBT').replace('/', '')
    
    const response = await fetch(
      `https://api.kraken.com/0/public/Ticker?pair=${krakenSymbol}`
    )
    
    if (!response.ok) {
      throw new Error('Failed to fetch Kraken price')
    }
    
    const data = await response.json()
    const pairKey = Object.keys(data.result)[0]
    const price = parseFloat(data.result[pairKey].c[0])
    
    return {
      price,
      status: 'active',
      timestamp: new Date(),
    }
  } catch (error) {
    console.error('Error fetching Kraken price:', error)
    return {
      price: 0,
      status: 'error',
      timestamp: new Date(),
    }
  }
}

// Fetch price from a specific source
export async function fetchSourcePrice(sourceId: string, symbol: string): Promise<SourcePrice | null> {
  switch (sourceId) {
    case 'coingecko':
      const cgData = await fetchCoinGeckoPrice(symbol)
      if (!cgData) return null
      return {
        price: cgData.price,
        status: 'active',
        timestamp: cgData.lastUpdate,
      }
    case 'binance':
      return await fetchBinancePrice(symbol)
    case 'coinbase':
      return await fetchCoinbasePrice(symbol)
    case 'kraken':
      return await fetchKrakenPrice(symbol)
    default:
      return null
  }
}

// Generate historical price data for chart (using current price as baseline)
export function generateChartData(currentPrice: number, hours: number = 24): Array<{ time: number; price: number }> {
  const data: Array<{ time: number; price: number }> = []
  const now = Date.now()
  
  // Generate realistic price movements
  let price = currentPrice * 0.95 // Start 5% lower
  const volatility = currentPrice * 0.02 // 2% volatility
  
  for (let i = hours; i >= 0; i--) {
    const time = now - i * 3600000 // 1 hour intervals
    // Random walk with slight upward trend
    const change = (Math.random() - 0.45) * volatility
    price = Math.max(price + change, currentPrice * 0.9) // Don't go below 90% of current
    data.push({ time, price })
  }
  
  return data
}

