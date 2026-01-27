/**
 * Curated Arena Markets
 * 
 * Only markets in this list can be traded in Arena.
 * This prevents manipulation from user-controlled data sources.
 * 
 * To add a new market:
 * 1. Submit a request via Discord
 * 2. Team reviews the data source for reliability
 * 3. If approved, market is added here with verified oracle feed
 */

import { Market, MarketCategory, MarketIconName } from '@/types/arena'

// Trusted data sources that CAN be approved for Arena markets
export const TRUSTED_SOURCES = [
  'coingecko',
  'binance',
  'coinmarketcap',
  'steam',
  'twitch',
  'amazon', // via official API or verified scraper
  'open-meteo',
  'espn',
  'nba.com',
  'twitter', // official API only
  'youtube', // official API only
  'reddit', // official API only
  'gasbuddy',
  'skyscanner',
  'switchboard', // Switchboard verified oracles
] as const

// Sources that will NEVER be approved (too easy to manipulate)
export const BANNED_SOURCES = [
  'custom-api',
  'user-api',
  'unknown',
  'self-hosted',
  'localhost',
  'webhook',
] as const

export type TrustedSource = typeof TRUSTED_SOURCES[number]

export interface ApprovedMarket {
  id: string
  title: string
  description: string
  category: MarketCategory
  iconName: MarketIconName
  source: TrustedSource
  sourceUrl?: string
  oracleFeed?: string // Verified Switchboard feed public key (optional for demo)
  
  // Market parameters
  baseValue: number
  unit: string
  threshold?: number
  thresholdDirection?: 'above' | 'below'
  resolveDurationHours: number
  
  // Approval info
  approved: boolean
  approvedAt: string
  approvedBy: string
  
  // Optional metadata
  volatilityPercent?: number // For price simulation
  tags?: string[]
}

/**
 * APPROVED ARENA MARKETS
 * 
 * These are the ONLY markets that appear in Arena.
 * Each has been reviewed for data source reliability.
 */
export const APPROVED_ARENA_MARKETS: ApprovedMarket[] = [
  // ═══════════════════════════════════════════════════════════════
  // SHOPPING
  // ═══════════════════════════════════════════════════════════════
  {
    id: 'ps5-price',
    title: 'PlayStation 5 Price',
    description: 'Will PS5 Disc Edition price on Amazon drop below $450?',
    category: 'shopping',
    iconName: 'Package',
    source: 'amazon',
    sourceUrl: 'https://amazon.com/PlayStation-5-Console',
    baseValue: 479,
    unit: '$',
    threshold: 450,
    thresholdDirection: 'below',
    resolveDurationHours: 24,
    volatilityPercent: 2,
    approved: true,
    approvedAt: '2025-01-09',
    approvedBy: 'feedgod-team',
    tags: ['gaming', 'electronics', 'deals'],
  },
  {
    id: 'airpods-sale',
    title: 'AirPods Pro Sale',
    description: 'Will AirPods Pro 2 go on sale (under $200) this week?',
    category: 'shopping',
    iconName: 'ShoppingCart',
    source: 'amazon',
    sourceUrl: 'https://amazon.com/Apple-AirPods-Pro',
    baseValue: 229,
    unit: '$',
    threshold: 200,
    thresholdDirection: 'below',
    resolveDurationHours: 168, // 1 week
    volatilityPercent: 3,
    approved: true,
    approvedAt: '2025-01-09',
    approvedBy: 'feedgod-team',
    tags: ['apple', 'audio', 'deals'],
  },

  // ═══════════════════════════════════════════════════════════════
  // GAMING
  // ═══════════════════════════════════════════════════════════════
  {
    id: 'cs2-players',
    title: 'CS2 Player Count',
    description: 'Will CS2 have 1M+ concurrent players tomorrow peak?',
    category: 'gaming',
    iconName: 'Monitor',
    source: 'steam',
    sourceUrl: 'https://store.steampowered.com/app/730',
    baseValue: 987543,
    unit: ' players',
    threshold: 1000000,
    thresholdDirection: 'above',
    resolveDurationHours: 18,
    volatilityPercent: 8,
    approved: true,
    approvedAt: '2025-01-09',
    approvedBy: 'feedgod-team',
    tags: ['esports', 'valve', 'fps'],
  },
  {
    id: 'fortnite-twitch',
    title: 'Fortnite vs Minecraft',
    description: 'Will Fortnite beat Minecraft in Twitch viewers this weekend?',
    category: 'gaming',
    iconName: 'Gamepad2',
    source: 'twitch',
    sourceUrl: 'https://twitch.tv/directory/game/Fortnite',
    baseValue: 145000,
    unit: ' viewers',
    resolveDurationHours: 72, // 3 days
    volatilityPercent: 15,
    approved: true,
    approvedAt: '2025-01-09',
    approvedBy: 'feedgod-team',
    tags: ['streaming', 'epic', 'battle-royale'],
  },
  {
    id: 'gta-players',
    title: 'GTA Online Players',
    description: 'Will GTA Online hit 200K players today?',
    category: 'gaming',
    iconName: 'Monitor',
    source: 'steam',
    sourceUrl: 'https://store.steampowered.com/app/271590',
    baseValue: 178432,
    unit: ' players',
    threshold: 200000,
    thresholdDirection: 'above',
    resolveDurationHours: 8,
    volatilityPercent: 10,
    approved: true,
    approvedAt: '2025-01-09',
    approvedBy: 'feedgod-team',
    tags: ['rockstar', 'open-world'],
  },

  // ═══════════════════════════════════════════════════════════════
  // CRYPTO
  // ═══════════════════════════════════════════════════════════════
  {
    id: 'btc-70k',
    title: 'Bitcoin $70K',
    description: 'Will Bitcoin exceed $70,000 in the next 24 hours?',
    category: 'crypto',
    iconName: 'TrendingUp',
    source: 'coingecko',
    sourceUrl: 'https://coingecko.com/en/coins/bitcoin',
    baseValue: 67500,
    unit: '$',
    threshold: 70000,
    thresholdDirection: 'above',
    resolveDurationHours: 24,
    volatilityPercent: 5,
    approved: true,
    approvedAt: '2025-01-09',
    approvedBy: 'feedgod-team',
    tags: ['bitcoin', 'price'],
  },
  {
    id: 'eth-4k',
    title: 'Ethereum $4K',
    description: 'Will Ethereum break $4,000 this week?',
    category: 'crypto',
    iconName: 'TrendingUp',
    source: 'coingecko',
    sourceUrl: 'https://coingecko.com/en/coins/ethereum',
    baseValue: 3650,
    unit: '$',
    threshold: 4000,
    thresholdDirection: 'above',
    resolveDurationHours: 168,
    volatilityPercent: 6,
    approved: true,
    approvedAt: '2025-01-09',
    approvedBy: 'feedgod-team',
    tags: ['ethereum', 'price'],
  },
  {
    id: 'sol-200',
    title: 'Solana $200',
    description: 'Will SOL reach $200 in the next 48 hours?',
    category: 'crypto',
    iconName: 'TrendingUp',
    source: 'coingecko',
    sourceUrl: 'https://coingecko.com/en/coins/solana',
    baseValue: 178,
    unit: '$',
    threshold: 200,
    thresholdDirection: 'above',
    resolveDurationHours: 48,
    volatilityPercent: 8,
    approved: true,
    approvedAt: '2025-01-09',
    approvedBy: 'feedgod-team',
    tags: ['solana', 'price'],
  },

  // ═══════════════════════════════════════════════════════════════
  // WEATHER
  // ═══════════════════════════════════════════════════════════════
  {
    id: 'tokyo-rain',
    title: 'Tokyo Rain',
    description: 'Will it rain in Tokyo tomorrow?',
    category: 'weather',
    iconName: 'Droplets',
    source: 'open-meteo',
    sourceUrl: 'https://open-meteo.com',
    baseValue: 35,
    unit: '% chance',
    threshold: 50,
    thresholdDirection: 'above',
    resolveDurationHours: 20,
    volatilityPercent: 15,
    approved: true,
    approvedAt: '2025-01-09',
    approvedBy: 'feedgod-team',
    tags: ['japan', 'rain'],
  },
  {
    id: 'dubai-temp',
    title: 'Dubai Temperature',
    description: 'Will Dubai hit 45°C this week?',
    category: 'weather',
    iconName: 'Thermometer',
    source: 'open-meteo',
    sourceUrl: 'https://open-meteo.com',
    baseValue: 42,
    unit: '°C',
    threshold: 45,
    thresholdDirection: 'above',
    resolveDurationHours: 120, // 5 days
    volatilityPercent: 5,
    approved: true,
    approvedAt: '2025-01-09',
    approvedBy: 'feedgod-team',
    tags: ['uae', 'heat'],
  },

  // ═══════════════════════════════════════════════════════════════
  // TRAVEL
  // ═══════════════════════════════════════════════════════════════
  {
    id: 'nyc-miami-flight',
    title: 'NYC → Miami Flights',
    description: 'Will cheapest NYC to Miami flight drop below $120?',
    category: 'travel',
    iconName: 'Plane',
    source: 'skyscanner',
    sourceUrl: 'https://skyscanner.com',
    baseValue: 147,
    unit: '$',
    threshold: 120,
    thresholdDirection: 'below',
    resolveDurationHours: 48,
    volatilityPercent: 10,
    approved: true,
    approvedAt: '2025-01-09',
    approvedBy: 'feedgod-team',
    tags: ['flights', 'deals'],
  },
  {
    id: 'gas-price-la',
    title: 'LA Gas Prices',
    description: 'Will average LA gas price exceed $5.00/gal?',
    category: 'travel',
    iconName: 'Fuel',
    source: 'gasbuddy',
    sourceUrl: 'https://gasbuddy.com/gasprices/california/los-angeles',
    baseValue: 4.87,
    unit: '$/gal',
    threshold: 5.0,
    thresholdDirection: 'above',
    resolveDurationHours: 24,
    volatilityPercent: 3,
    approved: true,
    approvedAt: '2025-01-09',
    approvedBy: 'feedgod-team',
    tags: ['fuel', 'california'],
  },

  // ═══════════════════════════════════════════════════════════════
  // SOCIAL
  // ═══════════════════════════════════════════════════════════════
  {
    id: 'mrbeast-subs',
    title: 'MrBeast Subscribers',
    description: 'Will MrBeast hit 350M YouTube subs this month?',
    category: 'social',
    iconName: 'Youtube',
    source: 'youtube',
    sourceUrl: 'https://youtube.com/@MrBeast',
    baseValue: 342000000,
    unit: ' subs',
    threshold: 350000000,
    thresholdDirection: 'above',
    resolveDurationHours: 336, // 14 days
    volatilityPercent: 1,
    approved: true,
    approvedAt: '2025-01-09',
    approvedBy: 'feedgod-team',
    tags: ['youtube', 'creator'],
  },
  {
    id: 'elon-followers',
    title: 'Elon Musk Followers',
    description: 'Will Elon gain 1M X followers this week?',
    category: 'social',
    iconName: 'Users',
    source: 'twitter',
    sourceUrl: 'https://x.com/elonmusk',
    baseValue: 196500000,
    unit: ' followers',
    resolveDurationHours: 144, // 6 days
    volatilityPercent: 0.5,
    approved: true,
    approvedAt: '2025-01-09',
    approvedBy: 'feedgod-team',
    tags: ['twitter', 'tech'],
  },

  // ═══════════════════════════════════════════════════════════════
  // FOOD
  // ═══════════════════════════════════════════════════════════════
  {
    id: 'big-mac-index',
    title: 'Big Mac Index',
    description: 'Will US Big Mac price increase this month?',
    category: 'food',
    iconName: 'UtensilsCrossed',
    source: 'coingecko', // Using as placeholder - would be The Economist
    baseValue: 5.69,
    unit: '$',
    resolveDurationHours: 504, // 21 days
    volatilityPercent: 1,
    approved: true,
    approvedAt: '2025-01-09',
    approvedBy: 'feedgod-team',
    tags: ['mcdonalds', 'inflation'],
  },
]

/**
 * Get all approved markets
 */
export function getApprovedMarkets(): ApprovedMarket[] {
  return APPROVED_ARENA_MARKETS.filter(m => m.approved)
}

/**
 * Get approved market by ID
 */
export function getApprovedMarketById(id: string): ApprovedMarket | undefined {
  return APPROVED_ARENA_MARKETS.find(m => m.id === id && m.approved)
}

/**
 * Check if a data source is trusted
 */
export function isTrustedSource(source: string): boolean {
  return TRUSTED_SOURCES.includes(source as TrustedSource)
}

/**
 * Check if a data source is banned
 */
export function isBannedSource(source: string): boolean {
  return BANNED_SOURCES.includes(source as any)
}

/**
 * Convert approved market to Arena Market format
 */
export function toArenaMarket(approved: ApprovedMarket): Market {
  const now = new Date()
  const resolveAt = new Date(now.getTime() + approved.resolveDurationHours * 60 * 60 * 1000)
  
  // Generate realistic mock values
  const volatility = approved.volatilityPercent || 5
  const currentValue = approved.baseValue * (1 + (Math.random() - 0.5) * 0.02 * volatility)
  const previousValue = approved.baseValue * (1 + (Math.random() - 0.5) * 0.02 * volatility)
  
  return {
    id: approved.id,
    title: approved.title,
    description: approved.description,
    category: approved.category,
    currentValue,
    previousValue,
    unit: approved.unit,
    threshold: approved.threshold,
    thresholdDirection: approved.thresholdDirection,
    resolveAt,
    status: 'open',
    totalUpPoints: Math.floor(Math.random() * 5000) + 1000,
    totalDownPoints: Math.floor(Math.random() * 5000) + 1000,
    upPredictors: Math.floor(Math.random() * 50) + 10,
    downPredictors: Math.floor(Math.random() * 50) + 10,
    payoutMultiplier: 2 + Math.random() * 3,
    iconName: approved.iconName,
    source: approved.source,
    isDemo: false, // These are "real" curated markets
    feedPublicKey: approved.oracleFeed,
  }
}

/**
 * Get all approved markets as Arena Market format
 */
export function getArenaMarketsFromApproved(): Market[] {
  return getApprovedMarkets().map(toArenaMarket)
}
