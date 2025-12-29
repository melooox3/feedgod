import { FeedConfig, DataSource, AggregatorConfig } from '@/types/feed'

// Common data sources
const AVAILABLE_SOURCES: DataSource[] = [
  { id: 'coingecko', name: 'CoinGecko', type: 'api', enabled: true, weight: 1 },
  { id: 'binance', name: 'Binance', type: 'api', enabled: true, weight: 1 },
  { id: 'coinbase', name: 'Coinbase', type: 'api', enabled: true, weight: 1 },
  { id: 'kraken', name: 'Kraken', type: 'api', enabled: true, weight: 1 },
  { id: 'pyth', name: 'Pyth Network', type: 'on-chain', enabled: true, weight: 1 },
  { id: 'chainlink', name: 'Chainlink', type: 'on-chain', enabled: true, weight: 1 },
]

export async function generateFeedFromPrompt(prompt: string): Promise<FeedConfig> {
  // Simulate AI processing (in production, this would call an AI API)
  await new Promise(resolve => setTimeout(resolve, 1500))

  const lowerPrompt = prompt.toLowerCase()
  
  // Normalize common variations
  const normalizedPrompt = lowerPrompt
    .replace(/\bmon\b/g, 'mon') // Keep mon as is
    .replace(/\busdt\b/g, 'usd') // USDT -> USD
    .replace(/\busdc\b/g, 'usd') // USDC -> USD
    .replace(/\btether\b/g, 'usd') // Tether -> USD
    .replace(/\bcreate\b/g, '') // Remove "create"
    .replace(/\bfeed\b/g, '') // Remove "feed"
    .replace(/\bprice\b/g, '') // Remove "price"
    .replace(/\bfor\b/g, '') // Remove "for"
    .trim()

  // Extract symbol - handle many variations
  // Patterns: BTC/USD, BTC-USD, BTC USD, btc usd, mon usd, mon/usd, etc.
  let symbol = 'BTC/USD' // Default
  
  // Try to find symbol pairs
  const symbolPatterns = [
    /([a-z]{2,10})\s*[\/\-]\s*(usd|eur|btc|eth|usdt|usdc)/i, // BTC/USD, BTC-USD
    /([a-z]{2,10})\s+(usd|eur|btc|eth|usdt|usdc)/i, // BTC USD, mon usd
    /(bitcoin|btc|ethereum|eth|solana|sol|monad|mon|cardano|ada|ripple|xrp|dogecoin|doge|polkadot|dot|matic|polygon|avalanche|avax|binance|bnb)\s*(?:price|feed|usd|eur|usdt|usdc)?/i, // bitcoin, btc, monad, mon, etc.
  ]
  
  for (const pattern of symbolPatterns) {
    const match = normalizedPrompt.match(pattern) || lowerPrompt.match(pattern)
    if (match) {
      let baseSymbol = match[1].toUpperCase()
      let quoteSymbol = (match[2] || 'USD').toUpperCase()
      
      // Normalize symbol names
      const symbolMap: Record<string, string> = {
        'BITCOIN': 'BTC',
        'ETHEREUM': 'ETH',
        'SOLANA': 'SOL',
        'MONAD': 'MON',
        'CARDANO': 'ADA',
        'RIPPLE': 'XRP',
        'DOGECOIN': 'DOGE',
        'POLKADOT': 'DOT',
        'MATIC': 'MATIC',
        'POLYGON': 'MATIC',
        'AVALANCHE': 'AVAX',
        'BINANCE': 'BNB',
      }
      
      baseSymbol = symbolMap[baseSymbol] || baseSymbol
      
      // Normalize quote symbols
      if (quoteSymbol === 'USDT' || quoteSymbol === 'USDC' || quoteSymbol === 'TETHER') {
        quoteSymbol = 'USD'
      }
      
      symbol = `${baseSymbol}/${quoteSymbol}`
      break
    }
  }
  
  // If still default, try to extract just the base symbol
  if (symbol === 'BTC/USD') {
    const baseSymbolMatch = normalizedPrompt.match(/\b(btc|eth|sol|mon|ada|xrp|doge|dot|matic|avax|bnb)\b/i)
    if (baseSymbolMatch) {
      symbol = `${baseSymbolMatch[1].toUpperCase()}/USD`
    }
  }

  // Extract update interval
  const intervalMatch = lowerPrompt.match(/(\d+)\s*(second|minute|hour|s|m|h)/i)
  let updateInterval = 60 // default 60 seconds
  if (intervalMatch) {
    const value = parseInt(intervalMatch[1])
    const unit = intervalMatch[2].toLowerCase()
    if (unit.includes('second') || unit === 's') {
      updateInterval = value
    } else if (unit.includes('minute') || unit === 'm') {
      updateInterval = value * 60
    } else if (unit.includes('hour') || unit === 'h') {
      updateInterval = value * 3600
    }
  }

  // Extract data sources mentioned
  const mentionedSources: DataSource[] = []
  AVAILABLE_SOURCES.forEach(source => {
    if (lowerPrompt.includes(source.name.toLowerCase()) || 
        lowerPrompt.includes(source.id.toLowerCase())) {
      mentionedSources.push({ ...source })
    }
  })

  // Use mentioned sources or default to top 3
  const dataSources = mentionedSources.length > 0 
    ? mentionedSources.slice(0, 4)
    : AVAILABLE_SOURCES.slice(0, 3)

  // Determine aggregator type
  let aggregatorType: AggregatorConfig['type'] = 'median'
  if (lowerPrompt.includes('weighted') || lowerPrompt.includes('weight')) {
    aggregatorType = 'weighted'
  } else if (lowerPrompt.includes('mean') || lowerPrompt.includes('average')) {
    aggregatorType = 'mean'
  }

  const aggregator: AggregatorConfig = {
    type: aggregatorType,
    minSources: Math.max(2, Math.floor(dataSources.length * 0.6)),
    deviationThreshold: 0.05, // 5%
  }

  // Generate name
  const name = `${symbol.replace('/', ' ')} Price Feed`

  return {
    name,
    symbol,
    description: `AI-generated feed for ${symbol}`,
    dataSources,
    aggregator,
    updateInterval,
    decimals: 8,
    blockchain: 'solana', // Default blockchain
    network: 'mainnet',
    enabled: true,
  }
}




