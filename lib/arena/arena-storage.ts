import { ArenaUser, Prediction, LeaderboardEntry, ARENA_CONFIG, Market, PredictionDirection } from '@/types/arena'
import { calculatePayout } from './arena-resolver'

const STORAGE_KEYS = {
  USER: 'arena_user_v4', // Versioned to avoid conflicts with old data
  LEADERBOARD: 'arena_leaderboard_v4',
}

// Generate a random ID
const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

// Generate a random nickname
const generateNickname = () => {
  const adjectives = ['Swift', 'Bold', 'Lucky', 'Wise', 'Clever', 'Sharp', 'Quick', 'Brave', 'Keen', 'Bright']
  const nouns = ['Oracle', 'Trader', 'Prophet', 'Seer', 'Sage', 'Master', 'Wizard', 'Hunter', 'Wolf', 'Hawk']
  const adj = adjectives[Math.floor(Math.random() * adjectives.length)]
  const noun = nouns[Math.floor(Math.random() * nouns.length)]
  const num = Math.floor(Math.random() * 999)
  return `${adj}${noun}${num}`
}

// Get or create user
export function getArenaUser(): ArenaUser {
  if (typeof window === 'undefined') {
    return createNewUser()
  }
  
  const stored = localStorage.getItem(STORAGE_KEYS.USER)
  if (stored) {
    const user = JSON.parse(stored) as ArenaUser
    
    // Check for daily bonus
    const today = new Date().toDateString()
    if (user.lastLoginDate !== today) {
      // Daily points bonus
      user.points += ARENA_CONFIG.DAILY_LOGIN_POINTS
      user.lastLoginDate = today
      saveArenaUser(user)
    }
    
    return user
  }
  
  const newUser = createNewUser()
  saveArenaUser(newUser)
  return newUser
}

function createNewUser(): ArenaUser {
  return {
    id: generateId(),
    nickname: generateNickname(),
    swtchBalance: 0, // This is now managed by arena-wallet.ts
    points: 0, // Start with 0 points, earned through playing
    totalWins: 0,
    totalLosses: 0,
    currentStreak: 0,
    longestStreak: 0,
    totalVolume: 0,
    lastLoginDate: new Date().toDateString(),
    predictions: [],
    createdAt: new Date().toISOString(),
  }
}

export function saveArenaUser(user: ArenaUser): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user))
  updateLeaderboard(user)
}

export function updateNickname(nickname: string): ArenaUser {
  const user = getArenaUser()
  user.nickname = nickname
  saveArenaUser(user)
  return user
}

// Points operations (separate from USDC balance)
export function getPoints(): number {
  const user = getArenaUser()
  return user.points
}

export function addPoints(amount: number): ArenaUser {
  const user = getArenaUser()
  user.points += amount
  saveArenaUser(user)
  return user
}

// Calculate points reward for a win
export function calculatePointsReward(wagerAmount: number, streak: number): number {
  const basePoints = ARENA_CONFIG.POINTS_PER_WIN
  const volumePoints = Math.floor(wagerAmount * ARENA_CONFIG.POINTS_VOLUME_MULTIPLIER)
  const streakPoints = Math.max(0, (streak - 1) * ARENA_CONFIG.POINTS_STREAK_BONUS)
  return basePoints + volumePoints + streakPoints
}

// Prediction operations (balance is handled by arena-wallet.ts)
export function placePrediction(prediction: Omit<Prediction, 'id' | 'placedAt' | 'status' | 'pointsEarned'>): Prediction | null {
  const user = getArenaUser()
  
  // Check if user already has a pending prediction for this market
  const existingPrediction = user.predictions.find(
    p => p.marketId === prediction.marketId && p.status === 'pending'
  )
  if (existingPrediction) return null
  
  const newPrediction: Prediction = {
    id: generateId(),
    ...prediction,
    placedAt: new Date(),
    status: 'pending',
  }
  
  // Update user stats
  user.predictions.push(newPrediction)
  user.totalVolume += prediction.amountWagered
  
  saveArenaUser(user)
  return newPrediction
}

// Resolve a prediction (balance payout handled by arena-wallet.ts)
export function resolvePrediction(predictionId: string, won: boolean): ArenaUser {
  const user = getArenaUser()
  const prediction = user.predictions.find(p => p.id === predictionId)
  
  if (!prediction || prediction.status !== 'pending') {
    return user
  }
  
  prediction.status = won ? 'won' : 'lost'
  
  if (won) {
    // Update win stats
    user.totalWins++
    user.currentStreak++
    if (user.currentStreak > user.longestStreak) {
      user.longestStreak = user.currentStreak
    }
    
    // Calculate and award points
    const pointsEarned = calculatePointsReward(prediction.amountWagered, user.currentStreak)
    prediction.pointsEarned = pointsEarned
    user.points += pointsEarned
  } else {
    // Update loss stats
    user.totalLosses++
    user.currentStreak = 0
  }
  
  saveArenaUser(user)
  return user
}

export function getUserPredictions(): Prediction[] {
  const user = getArenaUser()
  return user.predictions.sort((a, b) => 
    new Date(b.placedAt).getTime() - new Date(a.placedAt).getTime()
  )
}

export function getPendingPredictionForMarket(marketId: string): Prediction | null {
  const user = getArenaUser()
  return user.predictions.find(
    p => p.marketId === marketId && p.status === 'pending'
  ) || null
}

export function markPredictionClaimed(predictionId: string): void {
  const user = getArenaUser()
  const prediction = user.predictions.find(p => p.id === predictionId)
  if (prediction) {
    prediction.claimed = true
  }
  saveArenaUser(user)
}

// Leaderboard operations (ranked by points)
export function getLeaderboard(): LeaderboardEntry[] {
  if (typeof window === 'undefined') return generateMockLeaderboard()
  
  const stored = localStorage.getItem(STORAGE_KEYS.LEADERBOARD)
  if (stored) {
    return JSON.parse(stored) as LeaderboardEntry[]
  }
  
  // Generate initial leaderboard with mock data
  const mockLeaderboard = generateMockLeaderboard()
  localStorage.setItem(STORAGE_KEYS.LEADERBOARD, JSON.stringify(mockLeaderboard))
  return mockLeaderboard
}

function generateMockLeaderboard(): LeaderboardEntry[] {
  const mockNames = [
    'CryptoWizard99', 'OracleKing', 'MarketMaster', 'SwiftTrader', 'LuckyCharm77',
    'DataProphet', 'BullRunner', 'BearHunter', 'AlphaSeeker', 'DeltaNeutral',
    'GammaSurge', 'ThetaDecay', 'VegaRider', 'RhoWatcher', 'ImpVol_Trader',
    'MoonShot420', 'DiamondHands', 'PaperHands', 'WhaleWatcher', 'ShrimpStack'
  ]
  
  return mockNames.map((name, i) => ({
    id: `mock-${i + 1}`,
    rank: i + 1,
    nickname: name,
    points: Math.floor(10000 - (i * 400) + Math.random() * 100),
    totalVolume: Math.floor(5000 - (i * 200) + Math.random() * 500),
    winRate: Math.floor(70 - i * 2 + Math.random() * 10),
    longestStreak: Math.floor(10 - i * 0.4 + Math.random() * 3),
  }))
}

function updateLeaderboard(user: ArenaUser): void {
  if (typeof window === 'undefined') return
  
  const leaderboard = getLeaderboard()
  
  // Find or add current user
  const existingIndex = leaderboard.findIndex(e => e.nickname === user.nickname)
  const userEntry: LeaderboardEntry = {
    id: user.id || `user-${Date.now()}`,
    rank: 0,
    nickname: user.nickname,
    points: user.points,
    totalVolume: user.totalVolume,
    winRate: user.totalWins + user.totalLosses > 0 
      ? Math.round((user.totalWins / (user.totalWins + user.totalLosses)) * 100)
      : 0,
    longestStreak: user.currentStreak || 0,
  }
  
  if (existingIndex >= 0) {
    leaderboard[existingIndex] = userEntry
  } else {
    leaderboard.push(userEntry)
  }
  
  // Sort by points and assign ranks
  leaderboard.sort((a, b) => b.points - a.points)
  leaderboard.forEach((entry, index) => {
    entry.rank = index + 1
  })
  
  // Keep top 100
  const trimmed = leaderboard.slice(0, 100)
  localStorage.setItem(STORAGE_KEYS.LEADERBOARD, JSON.stringify(trimmed))
}

export function getUserRank(): number {
  const user = getArenaUser()
  const leaderboard = getLeaderboard()
  const entry = leaderboard.find(e => e.nickname === user.nickname)
  return entry?.rank || leaderboard.length + 1
}

export function getUserStats() {
  const user = getArenaUser()
  const rank = getUserRank()
  const totalGames = user.totalWins + user.totalLosses
  const winRate = totalGames > 0 ? Math.round((user.totalWins / totalGames) * 100) : 0
  
  return {
    swtchBalance: 0, // Now managed by arena-wallet.ts
    points: user.points,
    totalVolume: user.totalVolume,
    totalGames,
    totalWins: user.totalWins,
    totalLosses: user.totalLosses,
    winRate,
    currentStreak: user.currentStreak,
    longestStreak: user.longestStreak,
    rank,
  }
}

export function resetDemoData(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(STORAGE_KEYS.USER)
  localStorage.removeItem(STORAGE_KEYS.LEADERBOARD)
}

// Format functions
export function formatUsdc(amount: number): string {
  if (amount >= 1000000) {
    return `$${(amount / 1000000).toFixed(2)}M`
  }
  if (amount >= 1000) {
    return `$${(amount / 1000).toFixed(1)}k`
  }
  return `$${amount.toFixed(2)}`
}

export function formatPoints(points: number): string {
  if (points >= 1000000) {
    return `${(points / 1000000).toFixed(1)}M`
  }
  if (points >= 1000) {
    return `${(points / 1000).toFixed(1)}k`
  }
  return points.toString()
}

// Legacy alias for compatibility
export const formatSwtch = formatUsdc

// Resolve all pending predictions for a market
export function resolvePredictionsForMarket(
  marketId: string,
  winningDirection: PredictionDirection,
  market: Market
): void {
  const user = getArenaUser()
  let hasChanges = false

  user.predictions.forEach(prediction => {
    if (prediction.marketId === marketId && prediction.status === 'pending') {
      const won = prediction.direction === winningDirection
      hasChanges = true

      if (won) {
        // Calculate payout using parimutuel formula
        const payout = calculatePayout(
          prediction.amountWagered,
          market.totalUpPoints,
          market.totalDownPoints,
          winningDirection,
          prediction.direction
        )

        prediction.status = 'won'
        prediction.actualPayout = payout

        // Update win stats
        user.totalWins++
        user.currentStreak++
        if (user.currentStreak > user.longestStreak) {
          user.longestStreak = user.currentStreak
        }

        // Calculate and award points
        const pointsEarned = calculatePointsReward(prediction.amountWagered, user.currentStreak)
        prediction.pointsEarned = pointsEarned
        user.points += pointsEarned

        // Credit winnings to wallet balance (will be claimed by user)
        // Note: we don't auto-add to balance; user must click "Claim"
      } else {
        prediction.status = 'lost'
        prediction.actualPayout = 0

        // Update loss stats
        user.totalLosses++
        user.currentStreak = 0
      }
    }
  })

  if (hasChanges) {
    saveArenaUser(user)
  }
}
