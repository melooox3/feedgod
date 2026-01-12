'use client'

import { useState } from 'react'
import { X, ArrowDownToLine, Loader2, AlertCircle, Gamepad2 } from 'lucide-react'
import { useAppKitAccount } from '@reown/appkit/react'
import { 
  getArenaBalance, 
  setArenaBalance, 
  subtractFromBalance, 
  getUserId, 
  DEMO_MODE 
} from '@/lib/arena-wallet'
import { playPickupSound } from '@/lib/sound-utils'

interface WithdrawModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  currentArenaBalance: number
}

export default function WithdrawModal({
  isOpen,
  onClose,
  onSuccess,
  currentArenaBalance,
}: WithdrawModalProps) {
  const { address } = useAppKitAccount()
  const publicKey = address ? { toString: () => address } : null
  
  const [amount, setAmount] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [withdrawAddress, setWithdrawAddress] = useState('')

  const formatUsd = (value: number): string => {
    if (value >= 1000) {
      return `$${(value / 1000).toFixed(1)}k`
    }
    return `$${value.toFixed(2)}`
  }

  const handleWithdraw = async () => {
    const withdrawAmount = parseFloat(amount)
    if (isNaN(withdrawAmount) || withdrawAmount <= 0) {
      setError('Enter a valid amount')
      return
    }

    if (withdrawAmount > currentArenaBalance) {
      setError('Insufficient Arena balance')
      return
    }

    if (!DEMO_MODE && !withdrawAddress) {
      setError('Enter a withdrawal address')
      return
    }

    setIsLoading(true)
    setError(null)
    playPickupSound()

    try {
      const userId = getUserId(publicKey?.toString())
      
      if (DEMO_MODE) {
        await new Promise(resolve => setTimeout(resolve, 500))
        const result = subtractFromBalance(userId, withdrawAmount)
        if (!result) {
          setError('Insufficient balance')
          return
        }
      } else {
        // Production: real contract call would go here
        await new Promise(resolve => setTimeout(resolve, 1500))
        subtractFromBalance(userId, withdrawAmount)
      }

      onSuccess()
      onClose()
    } catch (err: any) {
      setError(err.message || 'Transaction failed')
    } finally {
      setIsLoading(false)
    }
  }

  const handleMaxClick = () => {
    setAmount(currentArenaBalance.toString())
  }

  const handleWithdrawAll = async () => {
    if (currentArenaBalance <= 0) return
    
    setIsLoading(true)
    setError(null)
    playPickupSound()

    try {
      const userId = getUserId(publicKey?.toString())
      
      if (DEMO_MODE) {
        await new Promise(resolve => setTimeout(resolve, 500))
        setArenaBalance(userId, 0)
      } else {
        // Production: would interact with actual contract
        await new Promise(resolve => setTimeout(resolve, 1500))
        setArenaBalance(userId, 0)
      }

      onSuccess()
      onClose()
    } catch (err: any) {
      setError(err.message || 'Transaction failed')
    } finally {
      setIsLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative w-full max-w-md bg-[#1D1E19] border border-[#3a3b35] rounded-lg shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-3 border-b border-[#3a3b35] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className={`w-8 h-8 rounded flex items-center justify-center ${
              DEMO_MODE ? 'bg-yellow-500/20' : 'bg-red-500/20'
            }`}>
              {DEMO_MODE ? (
                <Gamepad2 className="w-4 h-4 text-yellow-400" />
              ) : (
                <ArrowDownToLine className="w-4 h-4 text-red-400" />
              )}
            </div>
            <div>
              <h3 className="font-semibold text-white text-sm">
                {DEMO_MODE ? 'Remove Demo Funds' : 'Withdraw'}
              </h3>
              <p className="text-xs text-gray-500">
                {DEMO_MODE ? 'Reset your demo balance' : 'Withdraw USDC to your wallet'}
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
            <p className="text-xs text-gray-500 mb-0.5">Available to Withdraw</p>
            <p className="text-xl font-semibold text-white">
              {formatUsd(currentArenaBalance)}
            </p>
            <p className="text-[10px] text-gray-600">USDC</p>
          </div>

          {/* Withdraw address (production only) */}
          {!DEMO_MODE && (
            <div>
              <label className="text-xs font-medium text-gray-400 mb-1.5 block">
                Withdraw to address
              </label>
              <input
                type="text"
                value={withdrawAddress}
                onChange={(e) => setWithdrawAddress(e.target.value)}
                placeholder="Enter Solana address..."
                className="w-full bg-[#252620] border border-[#3a3b35] rounded-md px-3 py-2 text-white font-mono text-xs focus:outline-none focus:border-red-500"
              />
            </div>
          )}

          {/* Amount Input */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-medium text-gray-400">Amount</label>
              <button
                onClick={handleMaxClick}
                className="text-[10px] text-feedgod-primary hover:underline"
              >
                MAX
              </button>
            </div>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">$</span>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                max={currentArenaBalance}
                className="w-full bg-[#252620] border border-[#3a3b35] rounded-md pl-7 pr-14 py-2 text-white text-sm font-medium focus:outline-none focus:border-red-500"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-xs">
                USDC
              </span>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-4 gap-1.5">
            {[25, 50, 75, 100].map((percent) => (
              <button
                key={percent}
                onClick={() => setAmount((currentArenaBalance * percent / 100).toFixed(2))}
                className="py-1.5 bg-[#252620] hover:bg-[#2a2b25] rounded-md text-xs font-medium text-gray-400 transition-colors"
              >
                {percent}%
              </button>
            ))}
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-center gap-1.5 text-red-400 text-xs bg-red-500/10 border border-red-500/20 rounded-md p-2.5">
              <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
              {error}
            </div>
          )}

          {/* Buttons */}
          <div className="space-y-2">
            <button
              onClick={handleWithdraw}
              disabled={isLoading || !amount || parseFloat(amount) <= 0}
              className="w-full py-2.5 rounded-md font-semibold text-sm bg-red-500 hover:bg-red-400 text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {DEMO_MODE ? 'Removing...' : 'Withdrawing...'}
                </>
              ) : (
                <>
                  <ArrowDownToLine className="w-4 h-4" />
                  {DEMO_MODE ? 'Remove Funds' : 'Withdraw USDC'}
                </>
              )}
            </button>

            <button
              onClick={handleWithdrawAll}
              disabled={isLoading || currentArenaBalance <= 0}
              className="w-full py-2 rounded-md text-xs font-medium bg-[#252620] hover:bg-[#2a2b25] text-gray-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {DEMO_MODE ? 'Reset to Zero' : `Withdraw All (${formatUsd(currentArenaBalance)})`}
            </button>
          </div>

          {/* Info */}
          <p className="text-[10px] text-gray-600 text-center">
            {DEMO_MODE 
              ? 'Demo funds have no real value.'
              : 'Withdrawals are instant. Network fees apply (~0.00001 SOL).'
            }
          </p>
        </div>
      </div>
    </div>
  )
}
