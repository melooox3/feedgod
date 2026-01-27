import { NextResponse } from 'next/server'
import { getCoinGeckoId } from '@/lib/constants/coin-ids'
import { SurgeClient, normalizeSymbol } from '@/lib/api/surge-client'

export interface PriceData {
  id: string
  symbol: string
  price: number
  change24h: number
  lastUpdated: string
  source?: 'coingecko' | 'surge' | 'crossbar'
}

// Surge client singleton for this API route
let surgeClient: SurgeClient | null = null

function getSurgeClient(): SurgeClient {
  if (!surgeClient) {
    surgeClient = new SurgeClient({
      serverUrl: process.env.SURGE_API_URL,
      apiKey: process.env.SURGE_API_KEY,
      useCrossbarFallback: true,
    })
  }
  return surgeClient
}

async function fetchFromSurge(symbols: string[]): Promise<Record<string, PriceData>> {
  const client = getSurgeClient()
  const prices: Record<string, PriceData> = {}

  try {
    const surgeResults = await client.getPrices(symbols)

    surgeResults.forEach((data, symbol) => {
      // Map back to the original symbol format the user requested
      const originalSymbol = symbols.find(
        s => normalizeSymbol(s) === symbol || s.toUpperCase() === symbol
      ) || symbol

      prices[originalSymbol] = {
        id: data.feedId,
        symbol: originalSymbol,
        price: data.price,
        change24h: 0, // Surge doesn't provide 24h change
        lastUpdated: new Date(data.timestamp).toISOString(),
        source: data.source === 'surge-server' ? 'surge' : 'crossbar',
      }
    })
  } catch (error) {
    console.warn('Surge fetch failed:', error)
  }

  return prices
}

async function fetchFromCoinGecko(symbols: string[]): Promise<Record<string, PriceData>> {
  const coinIds = symbols.map(s => getCoinGeckoId(s)).filter(Boolean)

  if (coinIds.length === 0) {
    return {}
  }

  const response = await fetch(
    `https://api.coingecko.com/api/v3/simple/price?ids=${coinIds.join(',')}&vs_currencies=usd&include_24hr_change=true&include_last_updated_at=true`,
    {
      headers: {
        'Accept': 'application/json',
      },
      next: { revalidate: 30 },
    }
  )

  if (!response.ok) {
    if (response.status === 429) {
      console.warn('CoinGecko rate limited')
      return {}
    }
    throw new Error(`CoinGecko API error: ${response.status}`)
  }

  const data = await response.json()
  const prices: Record<string, PriceData> = {}

  symbols.forEach(symbol => {
    const coinId = getCoinGeckoId(symbol)
    const coinData = data[coinId]

    if (coinData) {
      prices[symbol] = {
        id: coinId,
        symbol: symbol,
        price: coinData.usd || 0,
        change24h: coinData.usd_24h_change || 0,
        lastUpdated: coinData.last_updated_at
          ? new Date(coinData.last_updated_at * 1000).toISOString()
          : new Date().toISOString(),
        source: 'coingecko',
      }
    }
  })

  return prices
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const symbolsParam = searchParams.get('symbols')
  const sourceParam = searchParams.get('source') // 'surge', 'coingecko', or 'auto' (default)

  if (!symbolsParam) {
    return NextResponse.json({ error: 'Missing symbols parameter' }, { status: 400 })
  }

  const symbols = symbolsParam.split(',').map(s => s.trim().toUpperCase())
  const source = sourceParam || 'auto'

  if (symbols.length === 0) {
    return NextResponse.json({ error: 'No valid symbols found' }, { status: 400 })
  }

  try {
    let prices: Record<string, PriceData> = {}

    if (source === 'surge') {
      // Use Surge only
      prices = await fetchFromSurge(symbols)
    } else if (source === 'coingecko') {
      // Use CoinGecko only
      prices = await fetchFromCoinGecko(symbols)
    } else {
      // Auto: Try Surge first for oracle-verified prices, fall back to CoinGecko
      prices = await fetchFromSurge(symbols)

      // Find symbols not covered by Surge
      const missingSymbols = symbols.filter(s => !prices[s])

      if (missingSymbols.length > 0) {
        const cgPrices = await fetchFromCoinGecko(missingSymbols)
        prices = { ...prices, ...cgPrices }
      }
    }

    return NextResponse.json({
      prices,
      source,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Failed to fetch prices:', error)
    return NextResponse.json(
      { error: 'Failed to fetch prices', message: String(error) },
      { status: 500 }
    )
  }
}
