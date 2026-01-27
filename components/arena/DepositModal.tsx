'use client'

import { useState, useEffect } from 'react'
import { X, Copy, Check, AlertCircle, Wallet, Loader2, Plus } from 'lucide-react'
import { useAppKitAccount } from '@reown/appkit/react'
import { 
  getArenaWallet,
  getArenaBalance,
  addToBalance,
  getUserId,
  formatUsdc,
  DEMO_MODE,
  WALLET_CONFIG
} from '@/lib/arena/arena-wallet'
import { playPickupSound } from '@/lib/utils/sound-utils'

interface DepositModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  currentArenaBalance: number
}

// Demo mode quick add amounts
const DEMO_AMOUNTS = [100, 500, 1000, 5000]

export default function DepositModal({
  isOpen,
  onClose,
  onSuccess,
  currentArenaBalance,
}: DepositModalProps) {
  const { address } = useAppKitAccount()
  const publicKey = address ? { toString: () => address } : null
  
  const [amount, setAmount] = useState('')
  const [copied, setCopied] = useState(false)
  const [walletAddress, setWalletAddress] = useState<string>('')
  const [balance, setBalance] = useState(currentArenaBalance)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Get user ID and load wallet data
  useEffect(() => {
    if (!isOpen) return
    
    const userId = getUserId(publicKey?.toString())
    const wallet = getArenaWallet(userId)
    
    if (wallet) {
      setWalletAddress(wallet.address)
    }
    
    setBalance(getArenaBalance(userId))
    setError(null)
    setAmount('')
  }, [isOpen, publicKey])

  const copyAddress = () => {
    if (walletAddress) {
      navigator.clipboard.writeText(walletAddress)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleQuickDeposit = async (depositAmount: number) => {
    setIsLoading(true)
    setError(null)
    playPickupSound()

    try {
      await new Promise(resolve => setTimeout(resolve, 300))
      
      const userId = getUserId(publicKey?.toString())
      const newBalance = addToBalance(userId, depositAmount)
      setBalance(newBalance)
      
      onSuccess()
      onClose()
    } catch (err: any) {
      setError(err.message || 'Failed to add funds')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCustomDeposit = async () => {
    const depositAmount = parseFloat(amount)
    if (isNaN(depositAmount) || depositAmount <= 0) {
      setError('Enter a valid amount')
      return
    }

    await handleQuickDeposit(depositAmount)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />
      
      <div className="relative w-full max-w-md bg-[#1D1E19] border border-[#3a3b35] rounded-lg shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-3 border-b border-[#3a3b35] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded bg-green-500/20 flex items-center justify-center">
              <Wallet className="w-4 h-4 text-green-400" />
            </div>
            <div>
              <h3 className="font-semibold text-white text-sm">Deposit USDC</h3>
              <p className="text-xs text-gray-500">
                {DEMO_MODE ? 'Demo Mode' : 'Solana Network'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-[#252620] rounded-md transition-colors"
          >
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>
        
        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Current Balance */}
          <div className="bg-[#252620] rounded-md p-3 text-center">
            <p className="text-xs text-gray-500 mb-0.5">Current Balance</p>
            <p className="text-xl font-semibold text-green-400">
              {formatUsdc(balance)}
            </p>
            <p className="text-[10px] text-gray-600">USDC</p>
          </div>

          {/* Deposit Address (for production) */}
          {!DEMO_MODE && (
            <div className="bg-[#252620] rounded-md p-3">
              <div className="flex justify-between items-center mb-1.5">
                <span className="text-gray-500 text-xs">Your Arena Wallet</span>
                <span className="text-[10px] text-blue-400 bg-blue-500/20 px-1.5 py-0.5 rounded">Solana</span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-white font-mono text-xs truncate">
                  {walletAddress || 'Loading...'}
                </span>
                <button
                  onClick={copyAddress}
                  className="text-gray-500 hover:text-white flex-shrink-0 p-0.5"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
              <p className="text-[10px] text-gray-600 mt-1.5">
                Send USDC to this address to deposit
              </p>
            </div>
          )}

          {/* Quick Add Buttons */}
          <div>
            <p className="text-xs font-medium text-gray-400 mb-2">
              {DEMO_MODE ? 'Add Demo Funds' : 'Quick Deposit'}
            </p>
            <div className="grid grid-cols-4 gap-1.5">
              {DEMO_AMOUNTS.map((amt) => (
                <button
                  key={amt}
                  onClick={() => handleQuickDeposit(amt)}
                  disabled={isLoading}
                  className="py-2 bg-[#252620] hover:bg-green-500/10 hover:border-green-500/30 border border-[#3a3b35] rounded-md text-white text-xs font-medium transition-all disabled:opacity-50"
                >
                  +${amt}
                </button>
              ))}
            </div>
          </div>

          {/* Custom Amount */}
          <div>
            <label className="text-xs font-medium text-gray-400 mb-1.5 block">
              Custom amount
            </label>
            <div className="flex gap-1.5">
              <div className="relative flex-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">$</span>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full bg-[#252620] border border-[#3a3b35] rounded-md pl-7 pr-3 py-2 text-white text-sm font-medium focus:outline-none focus:border-green-500"
                />
              </div>
              <button
                onClick={handleCustomDeposit}
                disabled={isLoading || !amount || parseFloat(amount) <= 0}
                className="px-4 py-2 bg-green-500 hover:bg-green-400 rounded-md text-white text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Plus className="w-4 h-4" />
                )}
                Add
              </button>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-center gap-1.5 text-red-400 text-xs bg-red-500/10 border border-red-500/20 rounded-md p-2.5">
              <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
              {error}
            </div>
          )}

          {/* Info */}
          {DEMO_MODE && (
            <div className="bg-yellow-500/5 border border-yellow-500/20 rounded-md p-2.5 flex items-start gap-1.5">
              <AlertCircle className="w-3.5 h-3.5 text-yellow-500/80 flex-shrink-0 mt-0.5" />
              <span className="text-yellow-500/80 text-[10px]">
                Demo Mode: These are test funds with no real value.
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
