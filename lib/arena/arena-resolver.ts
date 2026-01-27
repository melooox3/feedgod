// Arena Market Resolution Logic (Demo Mode)
// Handles automatic market resolution and prediction settlement

import { Market, PredictionDirection } from '@/types/arena'

// Storage key for resolved markets
const RESOLVED_MARKETS_KEY = 'arena_resolved_markets_v1'

// Get list of already-resolved market IDs
export function getResolvedMarketIds(): Set<string> {
  if (typeof window === 'undefined') return new Set()
  const stored = localStorage.getItem(RESOLVED_MARKETS_KEY)
  return stored ? new Set(JSON.parse(stored)) : new Set()
}

// Mark a market as resolved
export function markMarketResolved(marketId: string): void {
  if (typeof window === 'undefined') return
  const resolved = getResolvedMarketIds()
  resolved.add(marketId)
  localStorage.setItem(RESOLVED_MARKETS_KEY, JSON.stringify([...resolved]))
}

// Check if a market should be resolved (past resolution time)
export function shouldResolveMarket(market: Market): boolean {
  if (market.status !== 'open') return false
  const now = Date.now()
  const resolveTime = new Date(market.resolveAt).getTime()
  return now >= resolveTime
}

// Determine the winning direction for a market
// In demo mode, we simulate based on current vs threshold with some randomness
export function determineWinningDirection(market: Market): PredictionDirection {
  // For threshold-based markets (binary outcomes)
  if (market.threshold !== undefined && market.thresholdDirection) {
    // Calculate trend bias - if current is moving toward threshold, slightly favor that direction
    const trendBias = market.thresholdDirection === 'above'
      ? (market.currentValue > market.previousValue ? 0.6 : 0.4)
      : (market.currentValue < market.previousValue ? 0.6 : 0.4)

    // Simulate whether threshold will be met
    const willMeetThreshold = Math.random() < trendBias

    // "up" means threshold will be met, "down" means it won't
    return willMeetThreshold ? 'up' : 'down'
  }

  // For value-change markets (will X go up or down?)
  // Use trend with some randomness
  const trendBias = market.currentValue > market.previousValue ? 0.55 : 0.45
  return Math.random() < trendBias ? 'up' : 'down'
}

// Calculate the resolved value (simulated final value)
export function calculateResolvedValue(market: Market, winningDirection: PredictionDirection): number {
  // Simulate a realistic price change
  const changePercent = (Math.random() * 10 + 2) * (winningDirection === 'up' ? 1 : -1)
  const resolvedValue = market.currentValue * (1 + changePercent / 100)

  // Round appropriately based on the original value magnitude
  if (market.currentValue >= 1000) {
    return Math.round(resolvedValue)
  } else if (market.currentValue >= 1) {
    return Math.round(resolvedValue * 100) / 100
  }
  return Math.round(resolvedValue * 10000) / 10000
}

// Resolve expired markets and return updated market list
export function resolveExpiredMarkets(markets: Market[]): {
  markets: Market[]
  newlyResolved: Array<{ market: Market; winningDirection: PredictionDirection }>
} {
  const resolvedIds = getResolvedMarketIds()
  const newlyResolved: Array<{ market: Market; winningDirection: PredictionDirection }> = []

  const updatedMarkets = markets.map(market => {
    // Skip already resolved markets
    if (resolvedIds.has(market.id)) {
      return market.status === 'resolved' ? market : { ...market, status: 'resolved' as const }
    }

    // Check if this market should be resolved
    if (!shouldResolveMarket(market)) {
      return market
    }

    // Determine outcome
    const winningDirection = determineWinningDirection(market)
    const resolvedValue = calculateResolvedValue(market, winningDirection)

    // Mark as resolved
    markMarketResolved(market.id)

    const resolvedMarket: Market = {
      ...market,
      status: 'resolved',
      resolvedDirection: winningDirection,
      resolvedValue,
    }

    newlyResolved.push({ market: resolvedMarket, winningDirection })

    return resolvedMarket
  })

  return { markets: updatedMarkets, newlyResolved }
}

// Calculate payout for a winning prediction
export function calculatePayout(
  wagerAmount: number,
  upPool: number,
  downPool: number,
  winningDirection: PredictionDirection,
  userDirection: PredictionDirection
): number {
  // If user picked wrong direction, no payout
  if (userDirection !== winningDirection) return 0

  const totalPool = upPool + downPool
  const winningPool = winningDirection === 'up' ? upPool : downPool

  // Parimutuel payout: (your bet / winning pool) * total pool * (1 - fee)
  const fee = 0.05 // 5% protocol fee
  const share = wagerAmount / winningPool
  const payout = share * totalPool * (1 - fee)

  // Ensure minimum 1.1x payout on win
  return Math.max(wagerAmount * 1.1, payout)
}

// Clear resolved markets (for testing/reset)
export function clearResolvedMarkets(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(RESOLVED_MARKETS_KEY)
}
