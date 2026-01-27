import { Market, MarketCategory } from '@/types/arena'
import { getArenaMarketsFromApproved } from './arena-markets'

// Calculate payout multiplier based on pool odds (parimutuel style)
// The more lopsided the betting, the better odds for the minority
function calculateDisplayMultiplier(upPool: number, downPool: number, direction: 'up' | 'down'): number {
  const totalPool = upPool + downPool
  const yourPool = direction === 'up' ? upPool : downPool
  
  if (yourPool === 0 || totalPool === 0) return 5.0 // Default when no bets
  
  // Parimutuel: payout = total pool / winning pool (minus 5% fee)
  const multiplier = (totalPool * 0.95) / yourPool
  
  // Cap between 1.1x and 10x
  return Math.max(1.1, Math.min(10, Math.round(multiplier * 10) / 10))
}

// Generate realistic-looking price fluctuation
function fluctuateValue(baseValue: number, volatilityPercent: number = 5): number {
  const change = (Math.random() - 0.5) * 2 * (volatilityPercent / 100) * baseValue
  return Math.round((baseValue + change) * 100) / 100
}

// Generate mock markets with realistic data
export function generateMockMarkets(): Market[] {
  const now = new Date()
  
  const markets: Market[] = [
    // SHOPPING
    {
      id: 'ps5-price',
      title: 'PlayStation 5 Price',
      description: 'Will PS5 Disc Edition price on Amazon drop below $450?',
      category: 'shopping',
      currentValue: 479,
      previousValue: 499,
      unit: '$',
      threshold: 450,
      thresholdDirection: 'below',
      resolveAt: new Date(now.getTime() + 24 * 60 * 60 * 1000),
      status: 'open',
      totalUpPoints: Math.floor(Math.random() * 5000) + 1000,
      totalDownPoints: Math.floor(Math.random() * 5000) + 1000,
      upPredictors: Math.floor(Math.random() * 50) + 10,
      downPredictors: Math.floor(Math.random() * 50) + 10,
      payoutMultiplier: 15,
      iconName: 'Package',
      source: 'Amazon',
      isDemo: true,
    },
    {
      id: 'airpods-sale',
      title: 'AirPods Pro Sale',
      description: 'Will AirPods Pro 2 go on sale (under $200) this week?',
      category: 'shopping',
      currentValue: 229,
      previousValue: 249,
      unit: '$',
      threshold: 200,
      thresholdDirection: 'below',
      resolveAt: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
      status: 'open',
      totalUpPoints: Math.floor(Math.random() * 3000) + 500,
      totalDownPoints: Math.floor(Math.random() * 3000) + 500,
      upPredictors: Math.floor(Math.random() * 30) + 5,
      downPredictors: Math.floor(Math.random() * 30) + 5,
      payoutMultiplier: 25,
      iconName: 'ShoppingCart',
      source: 'Amazon',
      isDemo: true,
    },
    
    // GAMING
    {
      id: 'cs2-players',
      title: 'CS2 Player Count',
      description: 'Will CS2 have 1M+ concurrent players tomorrow peak?',
      category: 'gaming',
      currentValue: 987543,
      previousValue: 1023456,
      unit: ' players',
      threshold: 1000000,
      thresholdDirection: 'above',
      resolveAt: new Date(now.getTime() + 18 * 60 * 60 * 1000),
      status: 'open',
      totalUpPoints: Math.floor(Math.random() * 8000) + 2000,
      totalDownPoints: Math.floor(Math.random() * 8000) + 2000,
      upPredictors: Math.floor(Math.random() * 80) + 20,
      downPredictors: Math.floor(Math.random() * 80) + 20,
      payoutMultiplier: 12,
      iconName: 'Monitor',
      source: 'Steam',
      isDemo: false,
    },
    {
      id: 'fortnite-vs-minecraft',
      title: 'Fortnite vs Minecraft',
      description: 'Will Fortnite beat Minecraft in Twitch viewers this weekend?',
      category: 'gaming',
      currentValue: 145000,
      previousValue: 132000,
      unit: ' viewers',
      resolveAt: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000),
      status: 'open',
      totalUpPoints: Math.floor(Math.random() * 6000) + 1500,
      totalDownPoints: Math.floor(Math.random() * 6000) + 1500,
      upPredictors: Math.floor(Math.random() * 60) + 15,
      downPredictors: Math.floor(Math.random() * 60) + 15,
      payoutMultiplier: 20,
      iconName: 'Gamepad2',
      source: 'Twitch',
      isDemo: true,
    },
    {
      id: 'gta6-steam',
      title: 'GTA Online Players',
      description: 'Will GTA Online hit 200K players today?',
      category: 'gaming',
      currentValue: 178432,
      previousValue: 165000,
      unit: ' players',
      threshold: 200000,
      thresholdDirection: 'above',
      resolveAt: new Date(now.getTime() + 8 * 60 * 60 * 1000),
      status: 'open',
      totalUpPoints: Math.floor(Math.random() * 4000) + 800,
      totalDownPoints: Math.floor(Math.random() * 4000) + 800,
      upPredictors: Math.floor(Math.random() * 40) + 10,
      downPredictors: Math.floor(Math.random() * 40) + 10,
      payoutMultiplier: 18,
      iconName: 'Monitor',
      source: 'Steam',
      isDemo: false,
    },
    
    // TRAVEL
    {
      id: 'nyc-miami-flight',
      title: 'NYC → Miami Flights',
      description: 'Will cheapest NYC to Miami flight drop below $120?',
      category: 'travel',
      currentValue: 147,
      previousValue: 159,
      unit: '$',
      threshold: 120,
      thresholdDirection: 'below',
      resolveAt: new Date(now.getTime() + 48 * 60 * 60 * 1000),
      status: 'open',
      totalUpPoints: Math.floor(Math.random() * 2500) + 500,
      totalDownPoints: Math.floor(Math.random() * 2500) + 500,
      upPredictors: Math.floor(Math.random() * 25) + 5,
      downPredictors: Math.floor(Math.random() * 25) + 5,
      payoutMultiplier: 35,
      iconName: 'Plane',
      source: 'Skyscanner',
      isDemo: true,
    },
    {
      id: 'gas-price-la',
      title: 'LA Gas Prices',
      description: 'Will average LA gas price exceed $5.00/gal?',
      category: 'travel',
      currentValue: 4.87,
      previousValue: 4.79,
      unit: '$/gal',
      threshold: 5.0,
      thresholdDirection: 'above',
      resolveAt: new Date(now.getTime() + 24 * 60 * 60 * 1000),
      status: 'open',
      totalUpPoints: Math.floor(Math.random() * 3500) + 700,
      totalDownPoints: Math.floor(Math.random() * 3500) + 700,
      upPredictors: Math.floor(Math.random() * 35) + 8,
      downPredictors: Math.floor(Math.random() * 35) + 8,
      payoutMultiplier: 22,
      iconName: 'Fuel',
      source: 'GasBuddy',
      isDemo: true,
    },
    
    // WEATHER
    {
      id: 'tokyo-rain',
      title: 'Tokyo Rain',
      description: 'Will it rain in Tokyo tomorrow?',
      category: 'weather',
      currentValue: 35,
      previousValue: 25,
      unit: '% chance',
      threshold: 50,
      thresholdDirection: 'above',
      resolveAt: new Date(now.getTime() + 20 * 60 * 60 * 1000),
      status: 'open',
      totalUpPoints: Math.floor(Math.random() * 4000) + 1000,
      totalDownPoints: Math.floor(Math.random() * 4000) + 1000,
      upPredictors: Math.floor(Math.random() * 45) + 12,
      downPredictors: Math.floor(Math.random() * 45) + 12,
      payoutMultiplier: 14,
      iconName: 'Droplets',
      source: 'Open-Meteo',
      isDemo: false,
    },
    {
      id: 'dubai-temp',
      title: 'Dubai Temperature',
      description: 'Will Dubai hit 45°C this week?',
      category: 'weather',
      currentValue: 42,
      previousValue: 41,
      unit: '°C',
      threshold: 45,
      thresholdDirection: 'above',
      resolveAt: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000),
      status: 'open',
      totalUpPoints: Math.floor(Math.random() * 2000) + 400,
      totalDownPoints: Math.floor(Math.random() * 2000) + 400,
      upPredictors: Math.floor(Math.random() * 20) + 5,
      downPredictors: Math.floor(Math.random() * 20) + 5,
      payoutMultiplier: 40,
      iconName: 'Thermometer',
      source: 'Open-Meteo',
      isDemo: false,
    },
    
    // SOCIAL
    {
      id: 'mrbeast-subs',
      title: 'MrBeast Subscribers',
      description: 'Will MrBeast hit 350M YouTube subs this month?',
      category: 'social',
      currentValue: 342000000,
      previousValue: 340500000,
      unit: ' subs',
      threshold: 350000000,
      thresholdDirection: 'above',
      resolveAt: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000),
      status: 'open',
      totalUpPoints: Math.floor(Math.random() * 7000) + 1500,
      totalDownPoints: Math.floor(Math.random() * 7000) + 1500,
      upPredictors: Math.floor(Math.random() * 70) + 18,
      downPredictors: Math.floor(Math.random() * 70) + 18,
      payoutMultiplier: 28,
      iconName: 'Youtube',
      source: 'YouTube',
      isDemo: true,
    },
    {
      id: 'elon-followers',
      title: 'Elon Musk Followers',
      description: 'Will Elon gain 1M X followers this week?',
      category: 'social',
      currentValue: 196500000,
      previousValue: 196200000,
      unit: ' followers',
      resolveAt: new Date(now.getTime() + 6 * 24 * 60 * 60 * 1000),
      status: 'open',
      totalUpPoints: Math.floor(Math.random() * 5500) + 1200,
      totalDownPoints: Math.floor(Math.random() * 5500) + 1200,
      upPredictors: Math.floor(Math.random() * 55) + 14,
      downPredictors: Math.floor(Math.random() * 55) + 14,
      payoutMultiplier: 32,
      iconName: 'Users',
      source: 'X',
      isDemo: true,
    },
    
    // FOOD
    {
      id: 'big-mac-index',
      title: 'Big Mac Index',
      description: 'Will US Big Mac price increase this month?',
      category: 'food',
      currentValue: 5.69,
      previousValue: 5.58,
      unit: '$',
      resolveAt: new Date(now.getTime() + 21 * 24 * 60 * 60 * 1000),
      status: 'open',
      totalUpPoints: Math.floor(Math.random() * 1800) + 350,
      totalDownPoints: Math.floor(Math.random() * 1800) + 350,
      upPredictors: Math.floor(Math.random() * 18) + 4,
      downPredictors: Math.floor(Math.random() * 18) + 4,
      payoutMultiplier: 16,
      iconName: 'UtensilsCrossed',
      source: 'The Economist',
      isDemo: true,
    },
    {
      id: 'starbucks-psl',
      title: 'Starbucks PSL Launch',
      description: 'Will Pumpkin Spice Latte return before Sept 1?',
      category: 'food',
      currentValue: 0,
      previousValue: 0,
      unit: '',
      resolveAt: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000),
      status: 'open',
      totalUpPoints: Math.floor(Math.random() * 2200) + 450,
      totalDownPoints: Math.floor(Math.random() * 2200) + 450,
      upPredictors: Math.floor(Math.random() * 22) + 6,
      downPredictors: Math.floor(Math.random() * 22) + 6,
      payoutMultiplier: 50,
      iconName: 'UtensilsCrossed',
      source: 'Starbucks',
      isDemo: true,
    },
  ]
  
  // Calculate proper payout multipliers based on pools
  return markets.map(market => ({
    ...market,
    payoutMultiplier: calculateDisplayMultiplier(market.totalUpPoints, market.totalDownPoints, 'up'),
  }))
}

// Fetch Steam player count (this actually works!)
export async function fetchSteamPlayerCount(appId: string): Promise<number | null> {
  try {
    // Use proxy to avoid CORS
    const response = await fetch(`/api/steam-players?appId=${appId}`)
    if (!response.ok) return null
    const data = await response.json()
    return data.playerCount || null
  } catch {
    return null
  }
}

// Simulate market value updates
export function updateMarketValue(market: Market): Market {
  const volatility = {
    shopping: 2,
    gaming: 8,
    travel: 5,
    weather: 10,
    social: 3,
    food: 1,
    crypto: 12,
    commodities: 4,
    sports: 6,
  }[market.category] || 5
  
  const newValue = fluctuateValue(market.currentValue, volatility)
  
  // Update pools with new betting activity
  const newUpPoints = market.totalUpPoints + Math.floor(Math.random() * 100)
  const newDownPoints = market.totalDownPoints + Math.floor(Math.random() * 100)
  
  // Recalculate payout multiplier based on new pools
  const newPayoutMultiplier = calculateDisplayMultiplier(newUpPoints, newDownPoints, 'up')
  
  return {
    ...market,
    previousValue: market.currentValue,
    currentValue: newValue,
    totalUpPoints: newUpPoints,
    totalDownPoints: newDownPoints,
    upPredictors: market.upPredictors + (Math.random() > 0.7 ? 1 : 0),
    downPredictors: market.downPredictors + (Math.random() > 0.7 ? 1 : 0),
    payoutMultiplier: newPayoutMultiplier,
  }
}

// Get markets filtered by category
export function getMarketsByCategory(markets: Market[], category: MarketCategory | 'all'): Market[] {
  if (category === 'all') return markets
  return markets.filter(m => m.category === category)
}

// Calculate time remaining string
export function getTimeRemaining(resolveAt: Date | string): string {
  const now = new Date()
  const resolveDate = resolveAt instanceof Date ? resolveAt : new Date(resolveAt)
  const diff = resolveDate.getTime() - now.getTime()
  
  if (diff <= 0) return 'Resolving...'
  
  const days = Math.floor(diff / (24 * 60 * 60 * 1000))
  const hours = Math.floor((diff % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000))
  const minutes = Math.floor((diff % (60 * 60 * 1000)) / (60 * 1000))
  
  if (days > 0) return `${days}d ${hours}h`
  if (hours > 0) return `${hours}h ${minutes}m`
  return `${minutes}m`
}

// Format large numbers
export function formatValue(value: number, unit: string): string {
  if (unit === ' players' || unit === ' viewers' || unit === ' subs' || unit === ' followers') {
    if (value >= 1000000000) return `${(value / 1000000000).toFixed(1)}B`
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`
    if (value >= 1000) return `${(value / 1000).toFixed(0)}K`
  }
  
  if (unit === '$' || unit === '$/gal') {
    return `$${value.toFixed(2)}`
  }
  
  if (unit === '°C' || unit === '% chance') {
    return `${value}${unit}`
  }
  
  return `${value.toLocaleString()}${unit}`
}

// Calculate potential payout using parimutuel betting odds
// The more people bet on your side, the lower the payout
// The more people bet against you, the higher the payout
export function calculatePotentialPayout(
  amountWagered: number,
  market: Market,
  direction: 'up' | 'down'
): number {
  const totalPool = market.totalUpPoints + market.totalDownPoints + amountWagered
  const yourPool = (direction === 'up' ? market.totalUpPoints : market.totalDownPoints) + amountWagered
  const oppositePool = direction === 'up' ? market.totalDownPoints : market.totalUpPoints
  
  // Protocol fee (5%)
  const FEE_RATE = 0.05
  const poolAfterFee = totalPool * (1 - FEE_RATE)
  
  // Your share of the winnings if you win
  // If you bet 100 and your side has 1000 total, you get 10% of the pool
  const yourShare = amountWagered / yourPool
  const payout = yourShare * poolAfterFee
  
  // Minimum 1.1x, maximum 10x (capped for realism)
  const multiplier = payout / amountWagered
  const clampedMultiplier = Math.max(1.1, Math.min(10, multiplier))
  
  return Math.floor(amountWagered * clampedMultiplier)
}

// Calculate the current odds/multiplier for display
export function calculateOdds(market: Market, direction: 'up' | 'down'): number {
  const totalPool = market.totalUpPoints + market.totalDownPoints
  const yourPool = direction === 'up' ? market.totalUpPoints : market.totalDownPoints
  
  if (yourPool === 0) return 10 // Max odds if no one has bet on this side
  if (totalPool === 0) return 2 // Default 2x
  
  const FEE_RATE = 0.05
  const poolAfterFee = totalPool * (1 - FEE_RATE)
  const multiplier = poolAfterFee / yourPool
  
  return Math.max(1.1, Math.min(10, multiplier))
}

// ============ CURATED MARKETS ============

/**
 * Get all Arena markets - CURATED ONLY
 * 
 * Arena markets are hand-picked and approved to prevent manipulation.
 * Users can create any oracle feed for their own projects,
 * but Arena markets must be approved by the FeedGod team.
 * 
 * To suggest a new market, join our Discord!
 */
export function getAllMarkets(): Market[] {
  // Get curated, approved markets only
  const approvedMarkets = getArenaMarketsFromApproved()
  
  // Calculate proper payout multipliers based on pools
  return approvedMarkets.map(market => ({
    ...market,
    payoutMultiplier: calculateDisplayMultiplier(market.totalUpPoints, market.totalDownPoints, 'up'),
  }))
}

/**
 * Check if a market is from the curated list
 */
export function isCuratedMarket(marketId: string): boolean {
  const markets = getArenaMarketsFromApproved()
  return markets.some(m => m.id === marketId)
}
