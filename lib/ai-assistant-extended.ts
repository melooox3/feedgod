import { FeedConfig } from '@/types/feed'
import { FunctionConfig, VRFConfig, SecretConfig, BuilderType } from '@/types/switchboard'

export async function generateFromPrompt(
  prompt: string,
  type: BuilderType
): Promise<FeedConfig | FunctionConfig | VRFConfig | SecretConfig> {
  // Simulate AI processing
  await new Promise(resolve => setTimeout(resolve, 1500))

  const lowerPrompt = prompt.toLowerCase()

  switch (type) {
    case 'feed':
      return generateFeedFromPrompt(prompt)
    case 'function':
      return generateFunctionFromPrompt(prompt)
    case 'vrf':
      return generateVRFFromPrompt(prompt)
    case 'secret':
      return generateSecretFromPrompt(prompt)
    default:
      throw new Error(`Unknown builder type: ${type}`)
  }
}

async function generateFeedFromPrompt(prompt: string): Promise<FeedConfig> {
  // Import existing feed generator
  const { generateFeedFromPrompt } = await import('./ai-assistant')
  return generateFeedFromPrompt(prompt)
}

async function generateFunctionFromPrompt(prompt: string): Promise<FunctionConfig> {
  const lowerPrompt = prompt.toLowerCase()

  // Extract function purpose
  let code = `// AI-generated function\n`
  let language: FunctionConfig['language'] = 'javascript'
  let runtime: FunctionConfig['runtime'] = 'node'

  if (lowerPrompt.includes('arbitrage') || lowerPrompt.includes('trading')) {
    code += `// Arbitrage bot function
async function findArbitrage() {
  // Fetch prices from multiple exchanges
  const prices = await Promise.all([
    fetch('https://api.binance.com/api/v3/ticker/price?symbol=BTCUSDT'),
    fetch('https://api.coinbase.com/v2/exchange-rates?currency=BTC'),
  ])
  
  const [binance, coinbase] = await Promise.all(prices.map(p => p.json()))
  
  // Calculate arbitrage opportunity
  const binancePrice = parseFloat(binance.price)
  const coinbasePrice = parseFloat(coinbase.data.rates.USD)
  const spread = Math.abs(binancePrice - coinbasePrice)
  const opportunity = spread / Math.min(binancePrice, coinbasePrice) * 100
  
  return {
    opportunity: opportunity > 0.5, // > 0.5% spread
    spread,
    binancePrice,
    coinbasePrice,
  }
}

export default findArbitrage`
    language = 'typescript'
  } else if (lowerPrompt.includes('scrape') || lowerPrompt.includes('web')) {
    code += `// Web scraping function
async function scrapeData() {
  const response = await fetch('https://example.com/data')
  const html = await response.text()
  
  // Extract data using regex or parsing
  const matches = html.match(/<price>(.*?)<\\/price>/g)
  const prices = matches?.map(m => parseFloat(m.replace(/<\\/?price>/g, ''))) || []
  
  return {
    average: prices.reduce((a, b) => a + b, 0) / prices.length,
    count: prices.length,
  }
}

export default scrapeData`
  } else if (lowerPrompt.includes('ml') || lowerPrompt.includes('machine learning')) {
    code += `// ML prediction function
async function predictPrice() {
  // Load model and make prediction
  // This is a simplified example
  const historicalData = await fetchHistoricalData()
  const prediction = await runMLModel(historicalData)
  
  return {
    predictedPrice: prediction,
    confidence: 0.85,
  }
}

export default predictPrice`
  } else {
    code += `// Custom compute function
async function customFunction() {
  // Your custom logic here
  return { result: 'computed' }
}

export default customFunction`
  }

  // Extract trigger type
  let trigger: FunctionConfig['trigger'] = 'on-demand'
  if (lowerPrompt.includes('cron') || lowerPrompt.includes('schedule')) {
    trigger = 'cron'
  } else if (lowerPrompt.includes('event')) {
    trigger = 'event'
  }

  // Extract schedule if cron
  let schedule = '0 */5 * * * *' // Every 5 minutes default
  const cronMatch = lowerPrompt.match(/(every|each)\s+(\d+)\s*(minute|hour|second)/i)
  if (cronMatch) {
    const value = parseInt(cronMatch[2])
    const unit = cronMatch[3].toLowerCase()
    if (unit.includes('minute')) {
      schedule = `0 */${value} * * * *`
    } else if (unit.includes('hour')) {
      schedule = `0 0 */${value} * * *`
    } else if (unit.includes('second')) {
      schedule = `*/${value} * * * * *`
    }
  }

  // Extract timeout
  const timeoutMatch = lowerPrompt.match(/(\d+)\s*(second|minute)\s*timeout/i)
  const timeout = timeoutMatch ? parseInt(timeoutMatch[1]) * (timeoutMatch[2].includes('minute') ? 60 : 1) : 30

  // Extract memory
  const memoryMatch = lowerPrompt.match(/(\d+)\s*(mb|gb)\s*memory/i)
  const memory = memoryMatch
    ? parseInt(memoryMatch[1]) * (memoryMatch[2].includes('gb') ? 1024 : 1)
    : 512

  return {
    name: extractName(prompt) || 'AI Generated Function',
    description: `AI-generated function: ${prompt}`,
    code,
    language,
    runtime,
    trigger,
    schedule: trigger === 'cron' ? schedule : undefined,
    timeout,
    memory,
    environment: {},
    secrets: [],
    blockchain: 'solana',
    network: 'mainnet',
    enabled: true,
  }
}

async function generateVRFFromPrompt(prompt: string): Promise<VRFConfig> {
  const lowerPrompt = prompt.toLowerCase()

  // Extract number range
  let min = 0
  let max = 100
  const rangeMatch = lowerPrompt.match(/(\d+)\s*to\s*(\d+)|between\s*(\d+)\s*and\s*(\d+)/i)
  if (rangeMatch) {
    min = parseInt(rangeMatch[1] || rangeMatch[3] || '0')
    max = parseInt(rangeMatch[2] || rangeMatch[4] || '100')
  }

  // Extract number of words
  let numWords = 1
  const wordsMatch = lowerPrompt.match(/(\d+)\s*(word|number|value)/i)
  if (wordsMatch) {
    numWords = parseInt(wordsMatch[1])
  }

  // Extract use case
  let name = 'VRF Generator'
  if (lowerPrompt.includes('nft') || lowerPrompt.includes('mint')) {
    name = 'NFT Mint Randomizer'
  } else if (lowerPrompt.includes('game') || lowerPrompt.includes('gaming')) {
    name = 'Gaming Random Number'
  } else if (lowerPrompt.includes('lottery')) {
    name = 'Lottery Randomizer'
  } else if (lowerPrompt.includes('launch')) {
    name = 'Fair Launch Randomizer'
  }

  return {
    name,
    description: `AI-generated VRF: ${prompt}`,
    min,
    max,
    numWords,
    batchSize: 1,
    blockchain: 'solana',
    network: 'mainnet',
    enabled: true,
  }
}

async function generateSecretFromPrompt(prompt: string): Promise<SecretConfig> {
  const lowerPrompt = prompt.toLowerCase()

  // Determine secret type
  let type: SecretConfig['type'] = 'api_key'
  let name = 'API Key'
  let key = 'API_KEY'

  if (lowerPrompt.includes('api key') || lowerPrompt.includes('apikey')) {
    type = 'api_key'
    name = 'API Key'
    key = 'API_KEY'
  } else if (lowerPrompt.includes('private key') || lowerPrompt.includes('privatekey')) {
    type = 'private_key'
    name = 'Private Key'
    key = 'PRIVATE_KEY'
  } else if (lowerPrompt.includes('webhook') || lowerPrompt.includes('url')) {
    type = 'webhook_url'
    name = 'Webhook URL'
    key = 'WEBHOOK_URL'
  } else if (lowerPrompt.includes('database') || lowerPrompt.includes('db')) {
    type = 'database_url'
    name = 'Database URL'
    key = 'DATABASE_URL'
  }

  // Extract service name
  const serviceMatch = lowerPrompt.match(/(coingecko|binance|coinbase|kraken|openai|anthropic)/i)
  if (serviceMatch) {
    name = `${serviceMatch[1]} ${name}`
    key = `${serviceMatch[1].toUpperCase()}_${key}`
  }

  // Extract scope
  let scope: SecretConfig['scope'] = 'global'
  if (lowerPrompt.includes('function')) {
    scope = 'function'
  } else if (lowerPrompt.includes('feed')) {
    scope = 'feed'
  }

  return {
    name,
    description: `AI-generated secret: ${prompt}`,
    key,
    value: '', // User will enter this
    type,
    scope,
    associatedResources: [],
    blockchain: 'solana',
    network: 'mainnet',
    enabled: true,
  }
}

function extractName(prompt: string): string | null {
  // Try to extract a name from the prompt
  const nameMatch = prompt.match(/create\s+(?:a|an)\s+([^,\.]+?)(?:\s+(?:for|that|which|using))?/i)
  if (nameMatch) {
    return nameMatch[1].trim()
  }
  return null
}

