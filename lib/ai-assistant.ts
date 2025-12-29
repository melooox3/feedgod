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
  
  // Valid quote currencies (keep USDT and USDC as separate pairs)
  const validQuoteCurrencies = ['usd', 'usdt', 'usdc', 'eur', 'btc', 'eth', 'sol', 'bnb', 'ada', 'xrp', 'doge', 'dot', 'matic', 'avax']
  
  // Base symbol mapping (full names to tickers)
  const symbolMap: Record<string, string> = {
    'bitcoin': 'BTC',
    'btc': 'BTC',
    'ethereum': 'ETH',
    'eth': 'ETH',
    'solana': 'SOL',
    'sol': 'SOL',
    'monad': 'MON',
    'mon': 'MON',
    'cardano': 'ADA',
    'ada': 'ADA',
    'ripple': 'XRP',
    'xrp': 'XRP',
    'dogecoin': 'DOGE',
    'doge': 'DOGE',
    'polkadot': 'DOT',
    'dot': 'DOT',
    'matic': 'MATIC',
    'polygon': 'MATIC',
    'avalanche': 'AVAX',
    'avax': 'AVAX',
    'binance': 'BNB',
    'bnb': 'BNB',
  }
  
  // Extract symbol - handle many variations
  // Patterns: BTC/USD, BTC-USD, BTC USD, btc usd, mon usdt, mon/usdt, monad usdt, etc.
  let symbol = 'BTC/USD' // Default
  let baseSymbol = ''
  let quoteSymbol = 'USD'
  
  // Pattern 1: Symbol with separator (/, -, or space) followed by quote currency
  // Matches: MON/USDT, MON-USDT, MON USDT, MONAD/USDT, etc.
  const separatorPattern = new RegExp(
    `(?:^|\\s)(?:${Object.keys(symbolMap).join('|')})\\s*[\\/\\-\\s]+\\s*(${validQuoteCurrencies.join('|')})(?:\\s|$)`,
    'i'
  )
  const separatorMatch = lowerPrompt.match(separatorPattern)
  if (separatorMatch) {
    const baseMatch = lowerPrompt.match(new RegExp(`(?:^|\\s)(${Object.keys(symbolMap).join('|')})\\s*[\\/\\-\\s]+`, 'i'))
    if (baseMatch) {
      baseSymbol = symbolMap[baseMatch[1].toLowerCase()] || baseMatch[1].toUpperCase()
      quoteSymbol = separatorMatch[1].toUpperCase()
      symbol = `${baseSymbol}/${quoteSymbol}`
    }
  }
  
  // Pattern 2: Two consecutive words where first is base, second is quote
  // Matches: "mon usdt", "monad usdt", "btc eth", etc.
  if (symbol === 'BTC/USD') {
    const words = lowerPrompt.split(/\s+/)
    for (let i = 0; i < words.length - 1; i++) {
      const word1 = words[i].replace(/[^a-z]/g, '')
      const word2 = words[i + 1].replace(/[^a-z]/g, '')
      
      if (symbolMap[word1] && validQuoteCurrencies.includes(word2)) {
        baseSymbol = symbolMap[word1]
        quoteSymbol = word2.toUpperCase()
        symbol = `${baseSymbol}/${quoteSymbol}`
        break
      }
    }
  }
  
  // Pattern 3: Symbol with slash or dash separator
  // Matches: MON/USDT, MON-USDT, BTC/ETH, etc.
  if (symbol === 'BTC/USD') {
    const slashPattern = new RegExp(
      `(${Object.keys(symbolMap).join('|')})\\s*[\\/\\-]\\s*(${validQuoteCurrencies.join('|')})`,
      'i'
    )
    const slashMatch = lowerPrompt.match(slashPattern)
    if (slashMatch) {
      baseSymbol = symbolMap[slashMatch[1].toLowerCase()] || slashMatch[1].toUpperCase()
      quoteSymbol = slashMatch[2].toUpperCase()
      symbol = `${baseSymbol}/${quoteSymbol}`
    }
  }
  
  // Pattern 4: Just base symbol mentioned (default to USD)
  if (symbol === 'BTC/USD') {
    for (const [key, value] of Object.entries(symbolMap)) {
      if (lowerPrompt.includes(key) && key.length >= 2) {
        baseSymbol = value
        quoteSymbol = 'USD'
        symbol = `${baseSymbol}/${quoteSymbol}`
        break
      }
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




