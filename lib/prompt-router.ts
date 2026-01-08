import { BuilderType } from '@/types/switchboard'

// Icon names from Lucide for modules
export type ModuleIconName = 
  | 'BarChart3' 
  | 'Target' 
  | 'Cloud' 
  | 'Trophy' 
  | 'Users' 
  | 'Globe' 
  | 'Brain' 
  | 'Code' 
  | 'Dices' 
  | 'Key'
  | 'TrendingUp'
  | 'Landmark'

export interface DetectedIntent {
  module: BuilderType
  confidence: number // 0-100
  parsed: {
    query: string
    // Feed-specific
    base?: string
    quote?: string
    // Weather-specific
    city?: string
    // Social-specific
    username?: string
    platform?: 'twitter' | 'youtube' | 'tiktok'
    // Sports-specific
    league?: string
    team?: string
    // Prediction-specific
    market?: string
    // Custom API-specific
    url?: string
  }
  label: string
  iconName: ModuleIconName
}

// Pattern definitions for each module type
const PRICE_PATTERNS = [
  /(\w+)\s*[\/\-]\s*(usd|usdt|usdc|btc|eth)/i, // "BTC/USD", "sol-usdt"
  /price\s*(?:of|for)?\s*(\w+)/i, // "price of ETH"
  /(\w+)\s+price/i, // "bitcoin price"
  /^(btc|eth|sol|bnb|xrp|ada|doge|avax|matic|link|uni|atom|dot)$/i, // Just the symbol
]

const WEATHER_PATTERNS = [
  /weather\s*(?:in|for|at)?\s*(.+)/i,
  /temperature\s*(?:in|for|at)?\s*(.+)/i,
  /(.+)\s+weather/i,
  /how\s+(?:hot|cold|warm)\s+(?:is|in)\s*(.+)/i,
]

const SOCIAL_PATTERNS = [
  /@(\w+)(?:\s+(?:followers?|following|tweets?))?/i, // @elonmusk followers
  /(?:twitter|x)\s*[@]?(\w+)/i, // twitter @elonmusk
  /youtube\s*[@]?(\w+)/i,
  /tiktok\s*[@]?(\w+)/i,
  /followers?\s*(?:for|of|count)?\s*@?(\w+)/i,
]

const SPORTS_PATTERNS = [
  /(\w+)\s+vs\.?\s+(\w+)/i, // "Lakers vs Warriors"
  /(nba|nfl|mlb|nhl|soccer|football|basketball)/i,
  /score\s+(?:for|of)?\s*(.+)/i,
  /(premier\s+league|la\s+liga|serie\s+a|bundesliga)/i,
]

const PREDICTION_PATTERNS = [
  /(?:odds|probability|chances?|prediction)\s*(?:of|for|that)?\s*(.+)/i,
  /will\s+(.+)\s+(?:happen|win|pass|occur)/i,
  /polymarket|kalshi|election|trump|biden|harris/i,
  /(?:yes|no)\s+(?:or|\/)\s+(?:yes|no)/i,
]

const API_PATTERNS = [
  /https?:\/\/[^\s]+/i,
  /api\s+(?:endpoint|url|call)/i,
  /json\s+(?:api|endpoint|url)/i,
  /fetch\s+(?:from|data)/i,
]

const AI_JUDGE_PATTERNS = [
  /^did\s+/i,
  /^has\s+/i,
  /^is\s+(?!it|there)/i,
  /^will\s+/i,
  /^who\s+(?:won|will)/i,
  /^what\s+(?:was|is|were)/i,
  /\?$/,
  /ai\s+(?:judge|resolve|decide)/i,
]

// City database for weather
const POPULAR_CITIES = [
  'new york', 'los angeles', 'chicago', 'houston', 'phoenix', 'philadelphia',
  'san antonio', 'san diego', 'dallas', 'san jose', 'austin', 'jacksonville',
  'london', 'paris', 'tokyo', 'sydney', 'dubai', 'singapore', 'hong kong',
  'toronto', 'vancouver', 'miami', 'seattle', 'boston', 'denver', 'atlanta',
  'berlin', 'amsterdam', 'madrid', 'rome', 'barcelona', 'munich', 'vienna',
  'seoul', 'beijing', 'shanghai', 'bangkok', 'mumbai', 'delhi', 'jakarta',
]

// Crypto symbols
const CRYPTO_SYMBOLS = [
  'btc', 'eth', 'sol', 'bnb', 'xrp', 'ada', 'doge', 'avax', 'matic', 'link',
  'uni', 'atom', 'dot', 'ltc', 'bch', 'xlm', 'algo', 'near', 'apt', 'arb',
  'op', 'sui', 'sei', 'jup', 'pyth', 'bonk', 'wif', 'jto', 'rndr', 'fil',
]

/**
 * Detect user intent from natural language prompt
 */
export function detectIntent(prompt: string): DetectedIntent {
  const lowercasePrompt = prompt.toLowerCase().trim()
  
  // Default result
  const defaultResult: DetectedIntent = {
    module: 'feed',
    confidence: 30,
    parsed: { query: prompt },
    label: 'Oracle Feed',
    iconName: 'BarChart3',
  }
  
  // Check for API URL first (highest priority for URLs)
  if (API_PATTERNS[0].test(prompt)) {
    const urlMatch = prompt.match(API_PATTERNS[0])
    return {
      module: 'custom-api',
      confidence: 95,
      parsed: { query: prompt, url: urlMatch?.[0] },
      label: 'Custom API',
      iconName: 'Globe',
    }
  }
  
  // Check for prediction markets
  for (const pattern of PREDICTION_PATTERNS) {
    const match = prompt.match(pattern)
    if (match) {
      return {
        module: 'prediction',
        confidence: 80,
        parsed: { query: prompt, market: match[1] || prompt },
        label: 'Prediction Market',
        iconName: 'Target',
      }
    }
  }
  
  // Check for AI judge (questions)
  for (const pattern of AI_JUDGE_PATTERNS) {
    if (pattern.test(prompt)) {
      // Filter out price/weather questions that should go elsewhere
      if (PRICE_PATTERNS.some(p => p.test(prompt))) break
      if (WEATHER_PATTERNS.some(p => p.test(prompt))) break
      
      return {
        module: 'ai-judge',
        confidence: 75,
        parsed: { query: prompt },
        label: 'AI Judge',
        iconName: 'Brain',
      }
    }
  }
  
  // Check for social media
  for (const pattern of SOCIAL_PATTERNS) {
    const match = prompt.match(pattern)
    if (match) {
      const platform = lowercasePrompt.includes('youtube') ? 'youtube' :
                       lowercasePrompt.includes('tiktok') ? 'tiktok' : 'twitter'
      return {
        module: 'social',
        confidence: 85,
        parsed: { query: prompt, username: match[1], platform },
        label: 'Social Media',
        iconName: 'Users',
      }
    }
  }
  
  // Check for sports
  for (const pattern of SPORTS_PATTERNS) {
    const match = prompt.match(pattern)
    if (match) {
      return {
        module: 'sports',
        confidence: 80,
        parsed: { 
          query: prompt, 
          team: match[1],
          league: match[2] || undefined 
        },
        label: 'Sports',
        iconName: 'Trophy',
      }
    }
  }
  
  // Check for weather
  for (const pattern of WEATHER_PATTERNS) {
    const match = prompt.match(pattern)
    if (match) {
      const cityGuess = match[1]?.trim()
      return {
        module: 'weather',
        confidence: 85,
        parsed: { query: prompt, city: cityGuess },
        label: 'Weather',
        iconName: 'Cloud',
      }
    }
  }
  
  // Check if prompt contains a city name (weather intent)
  const foundCity = POPULAR_CITIES.find(city => lowercasePrompt.includes(city))
  if (foundCity && !CRYPTO_SYMBOLS.some(c => lowercasePrompt.includes(c))) {
    return {
      module: 'weather',
      confidence: 85,
      parsed: { query: prompt, city: foundCity },
      label: 'Weather',
      iconName: 'Cloud',
    }
  }
  
  // Check for price feeds
  for (const pattern of PRICE_PATTERNS) {
    const match = prompt.match(pattern)
    if (match) {
      const base = match[1]?.toUpperCase()
      const quote = match[2]?.toUpperCase() || 'USD'
      return {
        module: 'feed',
        confidence: 90,
        parsed: { query: prompt, base, quote },
        label: 'Price Feed',
        iconName: 'BarChart3',
      }
    }
  }
  
  // Check if it's a known crypto symbol
  if (CRYPTO_SYMBOLS.includes(lowercasePrompt)) {
    return {
      module: 'feed',
      confidence: 90,
      parsed: { query: prompt, base: prompt.toUpperCase(), quote: 'USD' },
      label: 'Price Feed',
      iconName: 'BarChart3',
    }
  }
  
  // Check for API-related keywords
  for (let i = 1; i < API_PATTERNS.length; i++) {
    if (API_PATTERNS[i].test(prompt)) {
      return {
        module: 'custom-api',
        confidence: 70,
        parsed: { query: prompt },
        label: 'Custom API',
        iconName: 'Globe',
      }
    }
  }
  
  return defaultResult
}

/**
 * Get module label and icon name
 */
export function getModuleInfo(module: BuilderType): { label: string; iconName: ModuleIconName } {
  const moduleInfo: Record<BuilderType, { label: string; iconName: ModuleIconName }> = {
    'feed': { label: 'Price Feed', iconName: 'BarChart3' },
    'prediction': { label: 'Prediction Market', iconName: 'Target' },
    'weather': { label: 'Weather', iconName: 'Cloud' },
    'sports': { label: 'Sports', iconName: 'Trophy' },
    'social': { label: 'Social Media', iconName: 'Users' },
    'custom-api': { label: 'Custom API', iconName: 'Globe' },
    'ai-judge': { label: 'AI Judge', iconName: 'Brain' },
    'function': { label: 'Function', iconName: 'Code' },
    'vrf': { label: 'VRF', iconName: 'Dices' },
    'secret': { label: 'Secret', iconName: 'Key' },
    'governance': { label: 'Governance', iconName: 'Landmark' },
  }
  return moduleInfo[module] || { label: 'Oracle', iconName: 'TrendingUp' }
}

/**
 * Example prompts for quick selection
 */
export const EXAMPLE_PROMPTS: { text: string; module: BuilderType; iconName: ModuleIconName }[] = [
  { text: 'BTC/USD price', module: 'feed', iconName: 'BarChart3' },
  { text: 'Trump election odds', module: 'prediction', iconName: 'Target' },
  { text: 'Weather in Tokyo', module: 'weather', iconName: 'Cloud' },
  { text: '@elonmusk followers', module: 'social', iconName: 'Users' },
  { text: 'Lakers vs Warriors', module: 'sports', iconName: 'Trophy' },
  { text: 'Any API endpoint', module: 'custom-api', iconName: 'Globe' },
]

