import { BuilderType } from '@/types/switchboard'

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
  icon: string
}

// Pattern definitions for each module type
const PRICE_PATTERNS = [
  /(\w+)\s*[\/\-]\s*(usd|usdt|usdc|btc|eth)/i, // "BTC/USD", "sol-usdt"
  /(bitcoin|btc)\s*(price|feed)?/i,
  /(ethereum|eth)\s*(price|feed)?/i,
  /(solana|sol)\s*(price|feed)?/i,
  /price\s*(of|for)?\s*(\w+)/i, // "price of ETH"
  /(\w+)\s*price\s*(feed)?/i, // "BTC price feed"
  /token\s*price/i,
  /crypto\s*price/i,
  /\$([A-Z]{2,10})\s*(price|feed)?/i, // "$SOL price"
]

const PREDICTION_PATTERNS = [
  /(polymarket|kalshi)/i,
  /(election|trump|biden|president|vote|voting)/i,
  /(odds|betting|predict|will .+ win|who will win)/i,
  /(resolve|settlement|outcome)\s*(market|bet)?/i,
  /prediction\s*market/i,
  /betting\s*odds/i,
  /(democrat|republican|congress|senate)/i,
]

const WEATHER_PATTERNS = [
  /(weather|temperature|temp|rain|snow|humidity|forecast)/i,
  /(hot|cold|degrees|celsius|fahrenheit)\s*(in|at|for)?/i,
  /did it (rain|snow)/i,
  /is it (raining|snowing|sunny|cloudy)/i,
  /what's the weather/i,
  /climate\s*(data|oracle)?/i,
]

const SPORTS_PATTERNS = [
  /(nba|nfl|nhl|mlb|mls|premier league|champions league|la liga|bundesliga|serie a|ligue 1)/i,
  /(game|match|score|winner|vs|versus|playing)/i,
  // Team names
  /(lakers|warriors|celtics|heat|bulls|nets|knicks|76ers|bucks|suns|mavericks|clippers)/i, // NBA
  /(chiefs|eagles|49ers|cowboys|patriots|bills|ravens|dolphins|jets|giants|packers|bears)/i, // NFL
  /(manchester|barcelona|real madrid|liverpool|arsenal|chelsea|psg|bayern|juventus|inter)/i, // Soccer
  /(cs2|csgo|dota|league of legends|valorant|fortnite|esports|overwatch)/i,
  /who won (the|last night)/i,
  /tonight's game/i,
]

const SOCIAL_PATTERNS = [
  /@(\w+)/i, // @username
  /(twitter|x\.com|youtube|tiktok|instagram)/i,
  /(followers?|following|subscribers?|subs)/i,
  /(follower count|sub count|views|likes|retweets)/i,
  // Common social figures
  /(elon|musk|elonmusk)/i,
  /(mrbeast|pewdiepie|khaby|charli)/i,
  /how many (followers|subscribers|subs)/i,
  /track .+ (followers|subscribers)/i,
]

const CUSTOM_API_PATTERNS = [
  /(api|endpoint|json|fetch|http|url)/i,
  /https?:\/\/[^\s]+/i, // Actual URL
  /custom\s*(api|data|endpoint)/i,
  /any\s*api/i,
  /oracle\s*(any|custom)/i,
]

const AI_JUDGE_PATTERNS = [
  /ai\s*(judge|resolve|decide)/i,
  /let\s*ai\s*(decide|judge|resolve)/i,
  /ai\s*oracle/i,
  /intelligent\s*oracle/i,
  /natural\s*language/i,
]

// City name mappings for weather
const CITY_ALIASES: Record<string, string> = {
  'nyc': 'new york',
  'ny': 'new york',
  'la': 'los angeles',
  'sf': 'san francisco',
  'dc': 'washington',
  'vegas': 'las vegas',
}

const KNOWN_CITIES = [
  'tokyo', 'new york', 'london', 'paris', 'dubai', 'singapore', 'sydney', 
  'hong kong', 'seoul', 'beijing', 'shanghai', 'mumbai', 'delhi', 'bangkok',
  'berlin', 'madrid', 'rome', 'amsterdam', 'zurich', 'toronto', 'vancouver',
  'chicago', 'miami', 'seattle', 'denver', 'boston', 'austin', 'atlanta',
  'los angeles', 'san francisco', 'las vegas', 'washington', 'houston',
  'phoenix', 'dallas', 'philadelphia', 'san diego', 'detroit', 'portland',
]

// Token symbol mappings
const TOKEN_ALIASES: Record<string, string> = {
  'bitcoin': 'btc',
  'ethereum': 'eth',
  'solana': 'sol',
  'dogecoin': 'doge',
  'cardano': 'ada',
  'polkadot': 'dot',
  'chainlink': 'link',
  'avalanche': 'avax',
  'polygon': 'matic',
}

/**
 * Detect user intent from a natural language prompt
 */
export function detectIntent(prompt: string): DetectedIntent {
  const promptLower = prompt.toLowerCase().trim()
  
  // Default result
  const defaultResult: DetectedIntent = {
    module: 'feed',
    confidence: 30,
    parsed: { query: prompt },
    label: 'Price Feed',
    icon: '📊',
  }
  
  if (!prompt || prompt.length < 2) {
    return defaultResult
  }
  
  // Check each category with scoring
  const scores: { module: BuilderType; score: number; parsed: any; label: string; icon: string }[] = []
  
  // AI Judge
  if (AI_JUDGE_PATTERNS.some(p => p.test(promptLower))) {
    scores.push({
      module: 'ai-judge',
      score: 85,
      parsed: { query: prompt },
      label: 'AI Judge',
      icon: '🧠',
    })
  }
  
  // Custom API - check for URLs first (highest priority if URL present)
  const urlMatch = prompt.match(/https?:\/\/[^\s]+/i)
  if (urlMatch) {
    scores.push({
      module: 'custom-api',
      score: 95,
      parsed: { query: prompt, url: urlMatch[0] },
      label: 'Custom API',
      icon: '🌐',
    })
  } else if (CUSTOM_API_PATTERNS.some(p => p.test(promptLower))) {
    scores.push({
      module: 'custom-api',
      score: 75,
      parsed: { query: prompt },
      label: 'Custom API',
      icon: '🌐',
    })
  }
  
  // Prediction Markets
  if (PREDICTION_PATTERNS.some(p => p.test(promptLower))) {
    const searchQuery = prompt
      .replace(/(polymarket|kalshi|odds|betting|predict|prediction|market)/gi, '')
      .trim()
    scores.push({
      module: 'prediction',
      score: 80,
      parsed: { query: prompt, market: searchQuery || prompt },
      label: 'Prediction Market',
      icon: '🎯',
    })
  }
  
  // Weather
  if (WEATHER_PATTERNS.some(p => p.test(promptLower))) {
    // Try to extract city
    let foundCity: string | undefined
    
    // Check aliases first
    for (const [alias, city] of Object.entries(CITY_ALIASES)) {
      if (promptLower.includes(alias)) {
        foundCity = city
        break
      }
    }
    
    // Then check known cities
    if (!foundCity) {
      foundCity = KNOWN_CITIES.find(c => promptLower.includes(c))
    }
    
    scores.push({
      module: 'weather',
      score: 85,
      parsed: { query: prompt, city: foundCity },
      label: 'Weather',
      icon: '🌤️',
    })
  }
  
  // Sports
  if (SPORTS_PATTERNS.some(p => p.test(promptLower))) {
    // Try to detect league
    let league: string | undefined
    if (/(nba|basketball)/i.test(promptLower)) league = 'NBA'
    else if (/(nfl|football)/i.test(promptLower) && !/(soccer)/i.test(promptLower)) league = 'NFL'
    else if (/(premier league|epl)/i.test(promptLower)) league = 'EPL'
    else if (/(champions league|ucl)/i.test(promptLower)) league = 'UCL'
    else if (/(cs2|csgo|dota|lol|valorant|esports)/i.test(promptLower)) league = 'Esports'
    
    scores.push({
      module: 'sports',
      score: 80,
      parsed: { query: prompt, league },
      label: 'Sports',
      icon: '🏆',
    })
  }
  
  // Social Media
  const usernameMatch = prompt.match(/@(\w+)/i)
  if (usernameMatch || SOCIAL_PATTERNS.some(p => p.test(promptLower))) {
    // Detect platform
    let platform: 'twitter' | 'youtube' | 'tiktok' | undefined
    if (/(twitter|x\.com|tweet|elon)/i.test(promptLower)) platform = 'twitter'
    else if (/(youtube|subscriber|mrbeast|pewdiepie)/i.test(promptLower)) platform = 'youtube'
    else if (/(tiktok|khaby|charli)/i.test(promptLower)) platform = 'tiktok'
    
    scores.push({
      module: 'social',
      score: usernameMatch ? 90 : 75,
      parsed: { 
        query: prompt, 
        username: usernameMatch?.[1],
        platform,
      },
      label: 'Social Media',
      icon: '👥',
    })
  }
  
  // Price Feeds
  if (PRICE_PATTERNS.some(p => p.test(promptLower))) {
    // Extract token pair
    let base: string | undefined
    let quote: string = 'USD'
    
    // Check for explicit pair like BTC/USD
    const pairMatch = prompt.match(/(\w+)\s*[\/\-]\s*(usd|usdt|usdc|btc|eth)/i)
    if (pairMatch) {
      base = pairMatch[1].toUpperCase()
      quote = pairMatch[2].toUpperCase()
    } else {
      // Check for token name mentions
      const tokenMatch = promptLower.match(/(bitcoin|btc|ethereum|eth|solana|sol|doge|ada|dot|link|avax|matic)/i)
      if (tokenMatch) {
        const tokenName = tokenMatch[1].toLowerCase()
        base = TOKEN_ALIASES[tokenName] || tokenName
        base = base.toUpperCase()
      }
      
      // Check for $SYMBOL format
      const symbolMatch = prompt.match(/\$([A-Z]{2,10})/i)
      if (symbolMatch) {
        base = symbolMatch[1].toUpperCase()
      }
    }
    
    scores.push({
      module: 'feed',
      score: base ? 85 : 60,
      parsed: { query: prompt, base, quote },
      label: 'Price Feed',
      icon: '📊',
    })
  }
  
  // Return highest scoring match
  if (scores.length > 0) {
    scores.sort((a, b) => b.score - a.score)
    const best = scores[0]
    return {
      module: best.module,
      confidence: best.score,
      parsed: best.parsed,
      label: best.label,
      icon: best.icon,
    }
  }
  
  return defaultResult
}

/**
 * Get module label and icon
 */
export function getModuleInfo(module: BuilderType): { label: string; icon: string } {
  const moduleInfo: Record<BuilderType, { label: string; icon: string }> = {
    'feed': { label: 'Price Feed', icon: '📊' },
    'prediction': { label: 'Prediction Market', icon: '🎯' },
    'weather': { label: 'Weather', icon: '🌤️' },
    'sports': { label: 'Sports', icon: '🏆' },
    'social': { label: 'Social Media', icon: '👥' },
    'custom-api': { label: 'Custom API', icon: '🌐' },
    'ai-judge': { label: 'AI Judge', icon: '🧠' },
    'function': { label: 'Function', icon: '⚡' },
    'vrf': { label: 'VRF', icon: '🎲' },
    'secret': { label: 'Secret', icon: '🔐' },
  }
  return moduleInfo[module] || { label: 'Oracle', icon: '📈' }
}

/**
 * Example prompts for quick selection
 */
export const EXAMPLE_PROMPTS = [
  { text: 'BTC/USD price', module: 'feed' as BuilderType, icon: '📊' },
  { text: 'Trump election odds', module: 'prediction' as BuilderType, icon: '🎯' },
  { text: 'Weather in Tokyo', module: 'weather' as BuilderType, icon: '🌤️' },
  { text: '@elonmusk followers', module: 'social' as BuilderType, icon: '👥' },
  { text: 'Lakers vs Warriors', module: 'sports' as BuilderType, icon: '🏆' },
  { text: 'Any API endpoint', module: 'custom-api' as BuilderType, icon: '🌐' },
]

