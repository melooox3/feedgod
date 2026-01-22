import { BuilderType, ParsedPrompt } from '@/types/switchboard'

export interface DetectedIntent {
  module: BuilderType
  confidence: number // 0-100
  parsed: ParsedPrompt & { query: string }
  label: string
  icon: string
}

interface ScoredMatch {
  module: BuilderType
  score: number
  parsed: ParsedPrompt & { query: string }
  label: string
  icon: string
}

// Module metadata for labels and icons
const MODULE_INFO: Record<BuilderType, { label: string; icon: string }> = {
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

// Pattern configuration for each module
interface PatternConfig {
  patterns: RegExp[]
  baseScore: number
  extract?: (prompt: string, promptLower: string, match?: RegExpMatchArray) => Partial<ParsedPrompt>
  scoreModifier?: (parsed: Partial<ParsedPrompt>) => number
}

const PATTERN_REGISTRY: Partial<Record<BuilderType, PatternConfig>> = {
  'ai-judge': {
    patterns: [
      /ai\s*(judge|resolve|decide)/i,
      /let\s*ai\s*(decide|judge|resolve)/i,
      /ai\s*oracle/i,
      /intelligent\s*oracle/i,
      /natural\s*language/i,
    ],
    baseScore: 85,
  },

  'custom-api': {
    patterns: [
      /https?:\/\/[^\s]+/i, // Actual URL
      /(api|endpoint|json|fetch|http|url)/i,
      /custom\s*(api|data|endpoint)/i,
      /any\s*api/i,
      /oracle\s*(any|custom)/i,
    ],
    baseScore: 75,
    extract: (prompt) => {
      const urlMatch = prompt.match(/https?:\/\/[^\s]+/i)
      return urlMatch ? { url: urlMatch[0] } : {}
    },
    scoreModifier: (parsed) => parsed.url ? 95 : 75,
  },

  'prediction': {
    patterns: [
      /(polymarket|kalshi)/i,
      /(election|trump|biden|president|vote|voting)/i,
      /(odds|betting|predict|will .+ win|who will win)/i,
      /(resolve|settlement|outcome)\s*(market|bet)?/i,
      /prediction\s*market/i,
      /betting\s*odds/i,
      /(democrat|republican|congress|senate)/i,
    ],
    baseScore: 80,
    extract: (prompt) => {
      const searchQuery = prompt
        .replace(/(polymarket|kalshi|odds|betting|predict|prediction|market)/gi, '')
        .trim()
      return { market: searchQuery || prompt }
    },
  },

  'weather': {
    patterns: [
      /(weather|temperature|temp|rain|snow|humidity|forecast)/i,
      /(hot|cold|degrees|celsius|fahrenheit)\s*(in|at|for)?/i,
      /did it (rain|snow)/i,
      /is it (raining|snowing|sunny|cloudy)/i,
      /what's the weather/i,
      /climate\s*(data|oracle)?/i,
    ],
    baseScore: 85,
    extract: (_, promptLower) => {
      const city = extractCity(promptLower)
      return city ? { city } : {}
    },
  },

  'sports': {
    patterns: [
      /(nba|nfl|nhl|mlb|mls|premier league|champions league|la liga|bundesliga|serie a|ligue 1)/i,
      /(game|match|score|winner|vs|versus|playing)/i,
      // NBA teams
      /(lakers|warriors|celtics|heat|bulls|nets|knicks|76ers|bucks|suns|mavericks|clippers)/i,
      // NFL teams
      /(chiefs|eagles|49ers|cowboys|patriots|bills|ravens|dolphins|jets|giants|packers|bears)/i,
      // Soccer teams
      /(manchester|barcelona|real madrid|liverpool|arsenal|chelsea|psg|bayern|juventus|inter)/i,
      // Esports
      /(cs2|csgo|dota|league of legends|valorant|fortnite|esports|overwatch)/i,
      /who won (the|last night)/i,
      /tonight's game/i,
    ],
    baseScore: 80,
    extract: (_, promptLower) => {
      const league = extractLeague(promptLower)
      return league ? { league } : {}
    },
  },

  'social': {
    patterns: [
      /@(\w+)/i, // @username
      /(twitter|x\.com|youtube|tiktok|instagram)/i,
      /(followers?|following|subscribers?|subs)/i,
      /(follower count|sub count|views|likes|retweets)/i,
      /(elon|musk|elonmusk)/i,
      /(mrbeast|pewdiepie|khaby|charli)/i,
      /how many (followers|subscribers|subs)/i,
      /track .+ (followers|subscribers)/i,
    ],
    baseScore: 75,
    extract: (prompt, promptLower) => {
      const usernameMatch = prompt.match(/@(\w+)/i)
      const platform = extractPlatform(promptLower)
      return {
        username: usernameMatch?.[1],
        platform,
      }
    },
    scoreModifier: (parsed) => parsed.username ? 90 : 75,
  },

  'feed': {
    patterns: [
      /(\w+)\s*[\/\-]\s*(usd|usdt|usdc|btc|eth)/i, // "BTC/USD", "sol-usdt"
      /(bitcoin|btc)\s*(price|feed)?/i,
      /(ethereum|eth)\s*(price|feed)?/i,
      /(solana|sol)\s*(price|feed)?/i,
      /price\s*(of|for)?\s*(\w+)/i, // "price of ETH"
      /(\w+)\s*price\s*(feed)?/i, // "BTC price feed"
      /token\s*price/i,
      /crypto\s*price/i,
      /\$([A-Z]{2,10})\s*(price|feed)?/i, // "$SOL price"
    ],
    baseScore: 60,
    extract: (prompt, promptLower) => {
      const { base, quote } = extractTokenPair(prompt, promptLower)
      return {
        baseToken: base,
        quoteToken: quote,
        symbol: base ? `${base}/${quote}` : undefined,
      }
    },
    scoreModifier: (parsed) => parsed.baseToken ? 85 : 60,
  },
}

// Helper: Extract city from prompt
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

function extractCity(promptLower: string): string | undefined {
  // Check aliases first
  for (const [alias, city] of Object.entries(CITY_ALIASES)) {
    if (promptLower.includes(alias)) {
      return city
    }
  }
  // Then check known cities
  return KNOWN_CITIES.find(c => promptLower.includes(c))
}

// Helper: Extract league from prompt
function extractLeague(promptLower: string): string | undefined {
  if (/(nba|basketball)/i.test(promptLower)) return 'NBA'
  if (/(nfl|football)/i.test(promptLower) && !/(soccer)/i.test(promptLower)) return 'NFL'
  if (/(premier league|epl)/i.test(promptLower)) return 'EPL'
  if (/(champions league|ucl)/i.test(promptLower)) return 'UCL'
  if (/(cs2|csgo|dota|lol|valorant|esports)/i.test(promptLower)) return 'Esports'
  return undefined
}

// Helper: Extract platform from prompt
function extractPlatform(promptLower: string): 'twitter' | 'youtube' | 'tiktok' | undefined {
  if (/(twitter|x\.com|tweet|elon)/i.test(promptLower)) return 'twitter'
  if (/(youtube|subscriber|mrbeast|pewdiepie)/i.test(promptLower)) return 'youtube'
  if (/(tiktok|khaby|charli)/i.test(promptLower)) return 'tiktok'
  return undefined
}

// Helper: Extract token pair from prompt
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

function extractTokenPair(prompt: string, promptLower: string): { base?: string; quote: string } {
  let base: string | undefined
  let quote = 'USD'

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
      base = (TOKEN_ALIASES[tokenName] || tokenName).toUpperCase()
    }

    // Check for $SYMBOL format
    const symbolMatch = prompt.match(/\$([A-Z]{2,10})/i)
    if (symbolMatch) {
      base = symbolMatch[1].toUpperCase()
    }
  }

  return { base, quote }
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

  // Check each module's patterns and collect scored matches
  const scores: ScoredMatch[] = []

  for (const [module, config] of Object.entries(PATTERN_REGISTRY) as [BuilderType, PatternConfig][]) {
    const hasMatch = config.patterns.some(p => p.test(promptLower))

    if (hasMatch) {
      // Extract parsed data
      const extracted = config.extract?.(prompt, promptLower) || {}
      const parsed: ParsedPrompt & { query: string } = { query: prompt, ...extracted }

      // Calculate score
      let score = config.baseScore
      if (config.scoreModifier) {
        score = config.scoreModifier(parsed)
      }

      const { label, icon } = MODULE_INFO[module]

      scores.push({
        module,
        score,
        parsed,
        label,
        icon,
      })
    }
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
  return MODULE_INFO[module] || { label: 'Oracle', icon: '📈' }
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
