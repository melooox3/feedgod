'use client'

import { useState, useEffect } from 'react'
import { X, TrendingUp, TrendingDown, AlertCircle } from 'lucide-react'
import { useAppKitAccount } from '@reown/appkit/react'
import { Market, ARENA_CONFIG, PredictionDirection } from '@/types/arena'
import { placePrediction } from '@/lib/arena/arena-storage'
import { getArenaBalance, subtractFromBalance, getUserId, formatUsdc } from '@/lib/arena/arena-wallet'
import { calculatePotentialPayout, formatValue, getTimeRemaining } from '@/lib/arena/arena-api'
import { playPickupSound } from '@/lib/utils/sound-utils'

interface PredictionModalProps {
  market: Market
  direction: PredictionDirection
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export default function PredictionModal({
  market,
  direction,
  isOpen,
  onClose,
  onSuccess,
}: PredictionModalProps) {
  const { address } = useAppKitAccount()
  const [amount, setAmount] = useState(50)
  const [userBalance, setUserBalance] = useState(0)
  const [potentialPayout, setPotentialPayout] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Initialize balance when modal opens - use address directly to avoid object recreation
  useEffect(() => {
    if (isOpen) {
      const userId = getUserId(address || undefined)
      const balance = getArenaBalance(userId)
      setUserBalance(balance)
      setAmount(Math.min(50, balance))
      setError(null)
    }
  }, [isOpen, address])

  useEffect(() => {
    const payout = calculatePotentialPayout(amount, market, direction)
    setPotentialPayout(payout)
  }, [amount, market, direction])

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value)
    setAmount(Math.min(value, userBalance, ARENA_CONFIG.MAX_BET))
  }

  const handleQuickBet = (amt: number) => {
    playPickupSound()
    setAmount(Math.min(amt, userBalance, ARENA_CONFIG.MAX_BET))
  }

  const handleSubmit = async () => {
    if (amount < ARENA_CONFIG.MIN_BET) {
      setError(`Minimum bet is $${ARENA_CONFIG.MIN_BET} USDC`)
      return
    }
    
    if (amount > userBalance) {
      setError("Insufficient balance")
      return
    }

    setIsSubmitting(true)
    playPickupSound()
    
    await new Promise(resolve => setTimeout(resolve, 500))
    
    // Deduct from wallet balance
    const userId = getUserId(address || undefined)
    const success = subtractFromBalance(userId, amount)
    
    if (!success) {
      setError('Insufficient balance')
      setIsSubmitting(false)
      return
    }
    
    // Record the prediction
    const prediction = placePrediction({
      marketId: market.id,
      marketTitle: market.title,
      direction,
      amountWagered: amount,
      potentialPayout,
    })
    
    if (!prediction) {
      setError('Failed to place bet. You may have already bet on this market.')
      setIsSubmitting(false)
      return
    }
    
    setIsSubmitting(false)
    onSuccess()
  }

  if (!isOpen) return null

  const totalPoints = market.totalUpPoints + market.totalDownPoints
  const upPercent = totalPoints > 0 ? Math.round((market.totalUpPoints / totalPoints) * 100) : 50
  const downPercent = 100 - upPercent
  const currentPercent = direction === 'up' ? upPercent : downPercent
  const multiplier = potentialPayout / amount || 0

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
        <div className={`p-3 ${direction === 'up' ? 'bg-green-500/5' : 'bg-red-500/5'}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              {direction === 'up' ? (
                <div className="w-8 h-8 rounded bg-green-500/20 flex items-center justify-center">
                  <TrendingUp className="w-4 h-4 text-green-400" />
                </div>
              ) : (
                <div className="w-8 h-8 rounded bg-red-500/20 flex items-center justify-center">
                  <TrendingDown className="w-4 h-4 text-red-400" />
                </div>
              )}
              <div>
                <h3 className="font-semibold text-white text-sm">
                  Predict {direction.toUpperCase()}
                </h3>
                <p className="text-xs text-gray-500">{market.title}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-[#252620] rounded-md transition-colors"
            >
              <X className="w-4 h-4 text-gray-500" />
            </button>
          </div>
        </div>
        
        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Market Info */}
          <div className="bg-[#252620] rounded-md p-3">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs text-gray-500">Current Value</span>
              <span className="font-semibold text-sm text-white">
                {formatValue(market.currentValue, market.unit)}
              </span>
            </div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs text-gray-500">Resolves In</span>
              <span className="font-medium text-xs text-feedgod-primary">
                {getTimeRemaining(new Date(market.resolveAt))}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500">Community Says</span>
              <span className={`font-medium text-xs ${direction === 'up' ? 'text-green-400' : 'text-red-400'}`}>
                {currentPercent}% {direction.toUpperCase()}
              </span>
            </div>
          </div>
          
          {/* Amount Slider */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-medium text-gray-400">Bet Amount</label>
              <span className="text-[10px] text-gray-500">
                {formatUsdc(userBalance)} USDC available
              </span>
            </div>
            
            {/* Custom styled slider */}
            <div className="relative py-1.5">
              <input
                type="range"
                min={ARENA_CONFIG.MIN_BET}
                max={Math.min(userBalance, ARENA_CONFIG.MAX_BET)}
                value={amount}
                onChange={handleSliderChange}
                className="w-full h-1.5 rounded-lg appearance-none cursor-pointer
                  [&::-webkit-slider-runnable-track]:bg-[#3a3b35]
                  [&::-webkit-slider-runnable-track]:rounded-lg
                  [&::-webkit-slider-runnable-track]:h-1.5
                  [&::-webkit-slider-thumb]:appearance-none
                  [&::-webkit-slider-thumb]:w-4
                  [&::-webkit-slider-thumb]:h-4
                  [&::-webkit-slider-thumb]:rounded-full
                  [&::-webkit-slider-thumb]:bg-feedgod-primary
                  [&::-webkit-slider-thumb]:border-2
                  [&::-webkit-slider-thumb]:border-white
                  [&::-webkit-slider-thumb]:mt-[-5px]
                  [&::-webkit-slider-thumb]:shadow-md
                  [&::-moz-range-track]:bg-[#3a3b35]
                  [&::-moz-range-track]:rounded-lg
                  [&::-moz-range-track]:h-1.5
                  [&::-moz-range-thumb]:w-4
                  [&::-moz-range-thumb]:h-4
                  [&::-moz-range-thumb]:rounded-full
                  [&::-moz-range-thumb]:bg-feedgod-primary
                  [&::-moz-range-thumb]:border-2
                  [&::-moz-range-thumb]:border-white
                "
              />
            </div>
            
            <div className="flex items-center justify-between mt-1">
              <span className="text-[10px] text-gray-600">{ARENA_CONFIG.MIN_BET}</span>
              <span className="text-lg font-semibold text-white">{amount} USDC</span>
              <span className="text-[10px] text-gray-600">{Math.min(userBalance, ARENA_CONFIG.MAX_BET)}</span>
            </div>
            
            {/* Quick Bet Buttons */}
            <div className="flex gap-1.5 mt-2.5">
              {[25, 50, 100, 250, 500].map((amt) => (
                <button
                  key={amt}
                  onClick={() => handleQuickBet(amt)}
                  disabled={amt > userBalance}
                  className={`flex-1 py-1.5 rounded-md text-xs font-medium transition-colors ${
                    amt > userBalance
                      ? 'bg-[#1D1E19] text-gray-600 cursor-not-allowed'
                      : amount === amt
                        ? 'bg-feedgod-primary text-white'
                        : 'bg-[#2a2b25] text-gray-400 hover:bg-[#323329]'
                  }`}
                >
                  {amt}
                </button>
              ))}
            </div>
          </div>
          
          {/* Potential Payout - Single clean display */}
          <div className={`rounded-md p-3 ${direction === 'up' ? 'bg-green-500/5 border border-green-500/15' : 'bg-red-500/5 border border-red-500/15'}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] text-gray-500 mb-0.5">Potential Payout</p>
                <p className="text-lg font-semibold text-white">
                  {formatUsdc(potentialPayout)} USDC
                </p>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-gray-500 mb-0.5">Multiplier</p>
                <p className={`text-lg font-semibold ${direction === 'up' ? 'text-green-400' : 'text-red-400'}`}>
                  {multiplier.toFixed(1)}x
                </p>
              </div>
            </div>
          </div>
          
          {/* Error Message */}
          {error && (
            <div className="flex items-center gap-1.5 text-red-400 text-xs">
              <AlertCircle className="w-3 h-3" />
              {error}
            </div>
          )}
          
          {/* Submit Button */}
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || amount < ARENA_CONFIG.MIN_BET || amount > userBalance}
            className={`w-full py-2.5 rounded-md font-semibold text-sm transition-all flex items-center justify-center gap-1.5 ${
              direction === 'up'
                ? 'bg-green-500 hover:bg-green-400 text-white'
                : 'bg-red-500 hover:bg-red-400 text-white'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Placing Bet...
              </>
            ) : (
              <>
                {direction === 'up' ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                Bet {amount} USDC on {direction.toUpperCase()}
              </>
            )}
          </button>
          
          {/* Disclaimer */}
          <p className="text-[10px] text-gray-600 text-center">
            Bets are final. Funds will be deducted immediately.
          </p>
        </div>
      </div>
    </div>
  )
}
