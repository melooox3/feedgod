// Arena Internal Wallet System
// USDC on Solana - Single source of truth for user balance
// All betting uses this internal balance - no wallet popups per bet

export const DEMO_MODE = true

// Storage keys
const STORAGE_KEYS = {
  WALLET: 'arena_wallet_v2',
  BALANCE: 'arena_balance_v2',
}

// Config
export const WALLET_CONFIG = {
  STARTING_BALANCE: 100, // $100 USDC for demo
  MIN_DEPOSIT: 1,
  MAX_DEPOSIT: 100000,
  CURRENCY: 'USDC',
  CHAIN: 'Solana',
}

export interface ArenaWallet {
  address: string
  createdAt: number
  userId: string
}

// Generate a realistic Solana address for demo
export const generateDepositAddress = (): string => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz123456789'
  let address = ''
  for (let i = 0; i < 44; i++) {
    address += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return address
}

// Get user ID (from connected wallet or generate anonymous)
export const getUserId = (connectedAddress?: string | null): string => {
  if (connectedAddress) {
    return connectedAddress
  }
  
  // For demo/anonymous users, use a persistent ID
  if (typeof window === 'undefined') return 'anonymous'
  
  let anonId = localStorage.getItem('arena_anon_id')
  if (!anonId) {
    anonId = 'anon_' + Math.random().toString(36).substring(2, 15)
    localStorage.setItem('arena_anon_id', anonId)
  }
  return anonId
}

// Get or create user's Arena wallet
export const getArenaWallet = (userId: string): ArenaWallet | null => {
  if (typeof window === 'undefined') return null
  
  const key = `${STORAGE_KEYS.WALLET}_${userId}`
  const stored = localStorage.getItem(key)
  
  if (stored) {
    return JSON.parse(stored)
  }
  
  // Create new wallet for user
  const wallet: ArenaWallet = {
    address: generateDepositAddress(),
    createdAt: Date.now(),
    userId
  }
  localStorage.setItem(key, JSON.stringify(wallet))
  return wallet
}

// Get user's USDC balance
export const getArenaBalance = (userId: string): number => {
  if (typeof window === 'undefined') return 0
  const key = `${STORAGE_KEYS.BALANCE}_${userId}`
  const balance = localStorage.getItem(key)
  
  // If no balance exists, initialize with starting balance (demo)
  if (balance === null && DEMO_MODE) {
    setArenaBalance(userId, WALLET_CONFIG.STARTING_BALANCE)
    return WALLET_CONFIG.STARTING_BALANCE
  }
  
  return Number(balance || '0')
}

// Set user's balance
export const setArenaBalance = (userId: string, balance: number): void => {
  if (typeof window === 'undefined') return
  const key = `${STORAGE_KEYS.BALANCE}_${userId}`
  localStorage.setItem(key, Math.max(0, balance).toString())
}

// Add to balance (deposit or winnings)
export const addToBalance = (userId: string, amount: number): number => {
  const current = getArenaBalance(userId)
  const newBalance = current + amount
  setArenaBalance(userId, newBalance)
  return newBalance
}

// Subtract from balance (withdraw or bet)
export const subtractFromBalance = (userId: string, amount: number): boolean => {
  const current = getArenaBalance(userId)
  if (amount > current) return false
  setArenaBalance(userId, current - amount)
  return true
}

// Check if user has sufficient balance
export const hasSufficientBalance = (userId: string, amount: number): boolean => {
  return getArenaBalance(userId) >= amount
}

// Initialize new user with starting balance if needed
export const initializeUserBalance = (userId: string): number => {
  return getArenaBalance(userId) // This auto-initializes if needed
}

// Reset user's arena wallet (for demo reset)
export const resetArenaWallet = (userId: string): void => {
  if (typeof window === 'undefined') return
  localStorage.removeItem(`${STORAGE_KEYS.WALLET}_${userId}`)
  localStorage.removeItem(`${STORAGE_KEYS.BALANCE}_${userId}`)
}

// Format USDC for display
export const formatUsdc = (amount: number): string => {
  if (amount >= 1000000) {
    return `$${(amount / 1000000).toFixed(2)}M`
  }
  if (amount >= 1000) {
    return `$${(amount / 1000).toFixed(1)}k`
  }
  return `$${amount.toFixed(2)}`
}

// Format without $ prefix
export const formatUsdcAmount = (amount: number): string => {
  if (amount >= 1000000) {
    return `${(amount / 1000000).toFixed(2)}M USDC`
  }
  if (amount >= 1000) {
    return `${(amount / 1000).toFixed(1)}k USDC`
  }
  return `${amount.toFixed(2)} USDC`
}
