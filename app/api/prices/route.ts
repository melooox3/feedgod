import { NextResponse } from 'next/server'

// CoinGecko ID mappings for common tokens
const COINGECKO_IDS: Record<string, string> = {
  'BTC': 'bitcoin',
  'ETH': 'ethereum',
  'SOL': 'solana',
  'USDC': 'usd-coin',
  'USDT': 'tether',
  'BONK': 'bonk',
  'JUP': 'jupiter-exchange-solana',
  'WIF': 'dogwifcoin',
  'LINK': 'chainlink',
  'RNDR': 'render-token',
  'AVAX': 'avalanche-2',
  'MATIC': 'matic-network',
  'DOT': 'polkadot',
  'ADA': 'cardano',
  'DOGE': 'dogecoin',
  'SHIB': 'shiba-inu',
  'XRP': 'ripple',
  'LTC': 'litecoin',
  'UNI': 'uniswap',
  'AAVE': 'aave',
  'ARB': 'arbitrum',
  'OP': 'optimism',
  'APT': 'aptos',
  'SUI': 'sui',
  'SEI': 'sei-network',
  'TIA': 'celestia',
  'INJ': 'injective-protocol',
  'PYTH': 'pyth-network',
  'RAY': 'raydium',
  'ORCA': 'orca',
  'MSOL': 'marinade-staked-sol',
  'JITOSOL': 'jito-staked-sol',
}

export interface PriceData {
  id: string
  symbol: string
  price: number
  change24h: number
  lastUpdated: string
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const symbolsParam = searchParams.get('symbols')
  
  if (!symbolsParam) {
    return NextResponse.json({ error: 'Missing symbols parameter' }, { status: 400 })
  }
  
  const symbols = symbolsParam.split(',').map(s => s.trim().toUpperCase())
  
  // Map symbols to CoinGecko IDs
  const coinIds = symbols
    .map(s => {
      // Handle pairs like BTC/USD -> BTC
      const baseSymbol = s.split('/')[0]
      return COINGECKO_IDS[baseSymbol] || baseSymbol.toLowerCase()
    })
    .filter(Boolean)
  
  if (coinIds.length === 0) {
    return NextResponse.json({ error: 'No valid symbols found' }, { status: 400 })
  }
  
  try {
    const response = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${coinIds.join(',')}&vs_currencies=usd&include_24hr_change=true&include_last_updated_at=true`,
      {
        headers: {
          'Accept': 'application/json',
        },
        next: { revalidate: 30 } // Cache for 30 seconds
      }
    )
    
    if (!response.ok) {
      // If rate limited, return cached/default data
      if (response.status === 429) {
        console.warn('CoinGecko rate limited, returning cached data')
        return NextResponse.json({ 
          error: 'Rate limited', 
          prices: {},
          cached: true 
        }, { status: 200 })
      }
      throw new Error(`CoinGecko API error: ${response.status}`)
    }
    
    const data = await response.json()
    
    // Map back to original symbols
    const prices: Record<string, PriceData> = {}
    
    symbols.forEach(symbol => {
      const baseSymbol = symbol.split('/')[0]
      const coinId = COINGECKO_IDS[baseSymbol] || baseSymbol.toLowerCase()
      const coinData = data[coinId]
      
      if (coinData) {
        prices[symbol] = {
          id: coinId,
          symbol: symbol,
          price: coinData.usd || 0,
          change24h: coinData.usd_24h_change || 0,
          lastUpdated: coinData.last_updated_at 
            ? new Date(coinData.last_updated_at * 1000).toISOString()
            : new Date().toISOString()
        }
      }
    })
    
    return NextResponse.json({ 
      prices,
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    console.error('Failed to fetch prices:', error)
    return NextResponse.json(
      { error: 'Failed to fetch prices', message: String(error) },
      { status: 500 }
    )
  }
}
