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
  
  // Token database with market cap ranking and well-known projects
  // Format: { symbol, fullNames[], marketCapRank, projectName }
  // Lower market cap rank = higher market cap (1 = Bitcoin, 2 = Ethereum, etc.)
  const tokenDatabase: Array<{
    symbol: string
    fullNames: string[]
    marketCapRank: number
    projectName: string
  }> = [
    { symbol: 'BTC', fullNames: ['bitcoin', 'btc'], marketCapRank: 1, projectName: 'Bitcoin' },
    { symbol: 'ETH', fullNames: ['ethereum', 'eth'], marketCapRank: 2, projectName: 'Ethereum' },
    { symbol: 'USDT', fullNames: ['tether', 'usdt'], marketCapRank: 3, projectName: 'Tether' },
    { symbol: 'BNB', fullNames: ['binance', 'bnb', 'binance coin'], marketCapRank: 4, projectName: 'Binance Coin' },
    { symbol: 'SOL', fullNames: ['solana', 'sol'], marketCapRank: 5, projectName: 'Solana' },
    { symbol: 'USDC', fullNames: ['usd coin', 'usdc'], marketCapRank: 6, projectName: 'USD Coin' },
    { symbol: 'XRP', fullNames: ['ripple', 'xrp'], marketCapRank: 7, projectName: 'Ripple' },
    { symbol: 'ADA', fullNames: ['cardano', 'ada'], marketCapRank: 8, projectName: 'Cardano' },
    { symbol: 'DOGE', fullNames: ['dogecoin', 'doge'], marketCapRank: 9, projectName: 'Dogecoin' },
    { symbol: 'AVAX', fullNames: ['avalanche', 'avax'], marketCapRank: 10, projectName: 'Avalanche' },
    { symbol: 'DOT', fullNames: ['polkadot', 'dot'], marketCapRank: 11, projectName: 'Polkadot' },
    { symbol: 'MATIC', fullNames: ['polygon', 'matic'], marketCapRank: 12, projectName: 'Polygon' },
    { symbol: 'MON', fullNames: ['monad', 'mon'], marketCapRank: 50, projectName: 'Monad' },
    { symbol: 'HYPE', fullNames: ['hyperliquid', 'hype'], marketCapRank: 100, projectName: 'Hyperliquid' },
  ]
  
  // Create symbol map from token database (for backward compatibility)
  // When multiple tokens share a symbol, prefer the one with lower market cap rank (higher market cap)
  const symbolMap: Record<string, string> = {}
  const symbolToTokenMap: Record<string, typeof tokenDatabase[0]> = {}
  
  // Build maps, prioritizing higher market cap tokens for ambiguous symbols
  tokenDatabase.forEach(token => {
    token.fullNames.forEach(name => {
      const lowerName = name.toLowerCase()
      // Only add if not already present, or if this token has a better (lower) market cap rank
      if (!symbolMap[lowerName] || 
          (symbolToTokenMap[symbolMap[lowerName]]?.marketCapRank ?? Infinity) > token.marketCapRank) {
        symbolMap[lowerName] = token.symbol
        symbolToTokenMap[token.symbol] = token
      }
    })
    // Also map symbol directly
    const lowerSymbol = token.symbol.toLowerCase()
    if (!symbolMap[lowerSymbol] || 
        (symbolToTokenMap[symbolMap[lowerSymbol]]?.marketCapRank ?? Infinity) > token.marketCapRank) {
      symbolMap[lowerSymbol] = token.symbol
      symbolToTokenMap[token.symbol] = token
    }
  })
  
  // Helper function to find token by symbol or name, defaulting to highest market cap
  const findToken = (input: string): string | null => {
    const lowerInput = input.toLowerCase().trim()
    
    // Direct symbol match
    if (symbolToTokenMap[lowerInput.toUpperCase()]) {
      return symbolToTokenMap[lowerInput.toUpperCase()].symbol
    }
    
    // Check full names
    for (const token of tokenDatabase) {
      if (token.fullNames.some(name => name.toLowerCase() === lowerInput)) {
        return token.symbol
      }
    }
    
    // Partial match (e.g., "hyper" matches "hyperliquid")
    const partialMatches = tokenDatabase.filter(token => 
      token.fullNames.some(name => name.toLowerCase().includes(lowerInput)) ||
      token.symbol.toLowerCase().includes(lowerInput) ||
      lowerInput.includes(token.symbol.toLowerCase())
    )
    
    if (partialMatches.length > 0) {
      // Return the token with the lowest market cap rank (highest market cap)
      partialMatches.sort((a, b) => a.marketCapRank - b.marketCapRank)
      return partialMatches[0].symbol
    }
    
    // If no match found, try uppercase as-is (for unknown tokens)
    return input.toUpperCase()
  }
  
  // Extract symbol - handle many variations
  // Patterns: BTC/USD, BTC-USD, BTC USD, btc usd, mon usdt, mon/usdt, monad usdt, etc.
  let symbol = 'BTC/USD' // Default
  let baseSymbol = ''
  let quoteSymbol = 'USD'
  
  // Pattern 1: Symbol with separator (/, -, or space) followed by quote currency
  // Matches: HYPE/USDT, HYPE-USDT, HYPE USDT, HYPERLIQUID/USDT, etc.
  const allTokenNames = tokenDatabase.flatMap(t => [...t.fullNames, t.symbol.toLowerCase()])
  const separatorPattern = new RegExp(
    `(?:^|\\s)(?:${allTokenNames.join('|')})\\s*[\\/\\-\\s]+\\s*(${validQuoteCurrencies.join('|')})(?:\\s|$)`,
    'i'
  )
  const separatorMatch = lowerPrompt.match(separatorPattern)
  if (separatorMatch) {
    const baseMatch = lowerPrompt.match(new RegExp(`(?:^|\\s)(${allTokenNames.join('|')})\\s*[\\/\\-\\s]+`, 'i'))
    if (baseMatch) {
      const foundToken = findToken(baseMatch[1])
      if (foundToken) {
        baseSymbol = foundToken
        quoteSymbol = separatorMatch[1].toUpperCase()
        symbol = `${baseSymbol}/${quoteSymbol}`
      }
    }
  }
  
  // Pattern 2: Two consecutive words where first is base, second is quote
  // Matches: "hype usdt", "hyperliquid usdt", "btc eth", etc.
  if (symbol === 'BTC/USD') {
    const words = lowerPrompt.split(/\s+/)
    for (let i = 0; i < words.length - 1; i++) {
      const word1 = words[i].replace(/[^a-z0-9]/g, '')
      const word2 = words[i + 1].replace(/[^a-z0-9]/g, '')
      
      const foundToken = findToken(word1)
      if (foundToken && validQuoteCurrencies.includes(word2)) {
        baseSymbol = foundToken
        quoteSymbol = word2.toUpperCase()
        symbol = `${baseSymbol}/${quoteSymbol}`
        break
      }
    }
  }
  
  // Pattern 3: Symbol with slash or dash separator
  // Matches: HYPE/USDT, HYPE-USDT, BTC/ETH, etc.
  if (symbol === 'BTC/USD') {
    const slashPattern = new RegExp(
      `(${allTokenNames.join('|')})\\s*[\\/\\-]\\s*(${validQuoteCurrencies.join('|')})`,
      'i'
    )
    const slashMatch = lowerPrompt.match(slashPattern)
    if (slashMatch) {
      const foundToken = findToken(slashMatch[1])
      if (foundToken) {
        baseSymbol = foundToken
        quoteSymbol = slashMatch[2].toUpperCase()
        symbol = `${baseSymbol}/${quoteSymbol}`
      }
    }
  }
  
  // Pattern 4: Just base symbol mentioned (default to USD)
  // Use token recognition with market cap priority
  if (symbol === 'BTC/USD') {
    // Try to find any token mentioned in the prompt
    const words = lowerPrompt.split(/\s+/)
    const foundTokens: Array<{ token: string, rank: number }> = []
    
    for (const word of words) {
      const cleanWord = word.replace(/[^a-z0-9]/g, '').toLowerCase()
      if (cleanWord.length >= 2) {
        const foundToken = findToken(cleanWord)
        if (foundToken && symbolToTokenMap[foundToken]) {
          foundTokens.push({
            token: foundToken,
            rank: symbolToTokenMap[foundToken].marketCapRank
          })
        }
      }
    }
    
    // If multiple tokens found, prefer the one with lowest market cap rank (highest market cap)
    if (foundTokens.length > 0) {
      foundTokens.sort((a, b) => a.rank - b.rank)
      baseSymbol = foundTokens[0].token
      quoteSymbol = 'USD'
      symbol = `${baseSymbol}/${quoteSymbol}`
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




