'use client'

import { useState, useEffect } from 'react'
import { 
  TrendingUp, 
  TrendingDown, 
  Clock, 
  Check, 
  X as XIcon,
  ChevronDown,
  ChevronUp,
  Loader2,
  Wallet,
  Trophy
} from 'lucide-react'
import { useAppKit, useAppKitAccount } from '@reown/appkit/react'
import { getTimeRemaining } from '@/lib/arena-api'
import { getUserPredictions, markPredictionClaimed, formatSwtch } from '@/lib/arena-storage'
import { addToBalance, getUserId, DEMO_MODE } from '@/lib/arena-wallet'
import { Prediction } from '@/types/arena'
import { playPickupSound } from '@/lib/sound-utils'

interface YourPositionsProps {
  onClaimSuccess?: () => void
}

type PositionStatus = 'active' | 'won' | 'lost' | 'claiming'

interface DisplayPosition extends Prediction {
  displayStatus: PositionStatus
  marketTitle: string
  resolveAt: Date
}

export default function YourPositions({ onClaimSuccess }: YourPositionsProps) {
  const { address, isConnected } = useAppKitAccount()
  const { open: openWalletModal } = useAppKit()
  const connected = isConnected
  const publicKey = address ? { toString: () => address } : null
  const [positions, setPositions] = useState<DisplayPosition[]>([])
  const [isExpanded, setIsExpanded] = useState(true)
  const [showHistory, setShowHistory] = useState(false)
  const [claimingId, setClaimingId] = useState<string | null>(null)

  // Load positions
  useEffect(() => {
    // In demo mode, always load positions (no wallet needed)
    // In production mode, require wallet connection
    if (!DEMO_MODE && !connected) {
      setPositions([])
      return
    }

    const loadPositions = () => {
      const userPredictions = getUserPredictions()
      
      // Transform predictions to display positions
      const displayPositions: DisplayPosition[] = userPredictions.map(pred => ({
        ...pred,
        displayStatus: pred.status === 'pending' 
          ? 'active' 
          : (pred.status === 'won' ? 'won' : 'lost'),
        marketTitle: pred.marketId.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
        resolveAt: new Date(new Date(pred.placedAt).getTime() + 24 * 60 * 60 * 1000),
      }))

      setPositions(displayPositions)
    }

    loadPositions()
    const interval = setInterval(loadPositions, 2000)
    return () => clearInterval(interval)
  }, [connected])

  const handleClaim = async (positionId: string) => {
    setClaimingId(positionId)
    playPickupSound()

    try {
      await new Promise(resolve => setTimeout(resolve, 1500))

      // Find the position to get payout amount
      const position = positions.find(p => p.id === positionId)
      if (position && position.potentialPayout) {
        // Add winnings to wallet balance
        const userId = getUserId(publicKey?.toString())
        addToBalance(userId, position.potentialPayout)
        
        // Mark prediction as claimed in storage
        markPredictionClaimed(positionId)
      }

      // Update position status locally
      setPositions(prev => 
        prev.map(p => 
          p.id === positionId ? { ...p, displayStatus: 'won' as PositionStatus, claimed: true } : p
        )
      )

      onClaimSuccess?.()
    } catch (err) {
      console.error('Claim failed:', err)
    } finally {
      setClaimingId(null)
    }
  }

  const activePositions = positions.filter(p => p.displayStatus === 'active')
  const resolvedPositions = positions.filter(p => p.displayStatus !== 'active')
  const unclaimedWins = positions.filter(p => p.displayStatus === 'won' && p.status === 'won')

  // In production mode, require wallet connection
  if (!DEMO_MODE && !connected) {
    return (
      <div className="bg-[#252620] rounded-lg border border-[#3a3b35] p-3">
        <div className="flex items-center gap-1.5 mb-2">
          <Trophy className="w-4 h-4 text-feedgod-primary" />
          <h3 className="font-semibold text-white text-sm">Your Positions</h3>
        </div>
        <div className="text-center py-4">
          <Wallet className="w-7 h-7 text-gray-600 mx-auto mb-2" />
          <button 
            onClick={() => openWalletModal()}
            className="text-xs text-feedgod-primary hover:underline cursor-pointer"
          >
            Connect wallet to see positions
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-[#252620] rounded-lg border border-[#3a3b35] overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-3 flex items-center justify-between hover:bg-[#2a2b25] transition-colors"
      >
        <div className="flex items-center gap-1.5">
          <Trophy className="w-4 h-4 text-feedgod-primary" />
          <h3 className="font-semibold text-white text-sm">Your Positions</h3>
          {activePositions.length > 0 && (
            <span className="px-1.5 py-0.5 bg-[#ff0d6e] text-white text-[10px] font-medium rounded">
              {activePositions.length}
            </span>
          )}
          {unclaimedWins.length > 0 && (
            <span className="px-1.5 py-0.5 bg-green-500/20 text-green-400 text-[10px] font-medium rounded animate-pulse">
              Claim!
            </span>
          )}
        </div>
        {isExpanded ? (
          <ChevronUp className="w-4 h-4 text-gray-500" />
        ) : (
          <ChevronDown className="w-4 h-4 text-gray-500" />
        )}
      </button>

      {/* Content */}
      {isExpanded && (
        <div className="border-t border-[#3a3b35]">
          {positions.length === 0 ? (
            <div className="p-4 text-center">
              <p className="text-gray-500 text-xs">No positions yet</p>
              <p className="text-gray-600 text-[10px] mt-0.5">Place a bet to get started</p>
            </div>
          ) : (
            <>
              {/* Active Positions */}
              {activePositions.length > 0 && (
                <div className="p-2.5 space-y-1.5">
                  <p className="text-[10px] text-gray-600 uppercase tracking-wider px-0.5">Active</p>
                  {activePositions.map((position) => (
                    <PositionCard 
                      key={position.id} 
                      position={position}
                      onClaim={handleClaim}
                      isClaiming={claimingId === position.id}
                    />
                  ))}
                </div>
              )}

              {/* Show History Toggle */}
              {resolvedPositions.length > 0 && (
                <>
                  <button
                    onClick={() => setShowHistory(!showHistory)}
                    className="w-full px-3 py-1.5 text-xs text-gray-500 hover:text-gray-300 hover:bg-[#2a2b25] transition-colors flex items-center justify-between border-t border-[#3a3b35]"
                  >
                    <span>History ({resolvedPositions.length})</span>
                    {showHistory ? (
                      <ChevronUp className="w-3.5 h-3.5" />
                    ) : (
                      <ChevronDown className="w-3.5 h-3.5" />
                    )}
                  </button>

                  {showHistory && (
                    <div className="p-2.5 space-y-1.5 border-t border-[#3a3b35]">
                      {resolvedPositions.map((position) => (
                        <PositionCard 
                          key={position.id} 
                          position={position}
                          onClaim={handleClaim}
                          isClaiming={claimingId === position.id}
                        />
                      ))}
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}

function PositionCard({ 
  position, 
  onClaim,
  isClaiming,
}: { 
  position: DisplayPosition
  onClaim: (id: string) => void
  isClaiming: boolean
}) {
  const isUp = position.direction === 'up'
  const timeRemaining = getTimeRemaining(position.resolveAt)
  const displayStatus = position.displayStatus

  const statusColors = {
    active: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    won: 'bg-green-500/10 text-green-400 border-green-500/20',
    lost: 'bg-red-500/10 text-red-400 border-red-500/20',
    claiming: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  }

  const StatusIcon = {
    active: Clock,
    won: Check,
    lost: XIcon,
    claiming: Loader2,
  }[displayStatus]

  return (
    <div className={`bg-[#1D1E19] rounded-md p-2 border ${
      displayStatus === 'won'
        ? 'border-green-500/30'
        : 'border-[#3a3b35]'
    }`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          {/* Market & Direction */}
          <div className="flex items-center gap-1.5 mb-0.5">
            <div className={`w-5 h-5 rounded flex items-center justify-center ${
              isUp ? 'bg-green-500/20' : 'bg-red-500/20'
            }`}>
              {isUp ? (
                <TrendingUp className="w-2.5 h-2.5 text-green-400" />
              ) : (
                <TrendingDown className="w-2.5 h-2.5 text-red-400" />
              )}
            </div>
            <span className="font-medium text-gray-200 text-[11px] truncate">
              {position.marketTitle}
            </span>
          </div>

          {/* Amount & Payout */}
          <div className="flex items-center gap-2 text-[10px] pl-6">
            <span className="text-gray-500">
              {formatSwtch(position.amountWagered)}
            </span>
            <span className="text-gray-600">→</span>
            <span className={displayStatus === 'won' ? 'text-green-400' : 'text-gray-400'}>
              {formatSwtch(position.potentialPayout)} USDC
            </span>
          </div>
        </div>

        {/* Status / Claim Button */}
        <div className="flex-shrink-0">
          {displayStatus === 'won' ? (
            <button
              onClick={() => onClaim(position.id)}
              disabled={isClaiming}
              className="px-2 py-1 bg-green-500 hover:bg-green-400 text-white text-[10px] font-medium rounded transition-colors flex items-center gap-0.5 disabled:opacity-50"
            >
              {isClaiming ? (
                <Loader2 className="w-2.5 h-2.5 animate-spin" />
              ) : (
                <Check className="w-2.5 h-2.5" />
              )}
              Claim
            </button>
          ) : (
            <div className={`px-1.5 py-0.5 rounded text-[10px] font-medium border ${statusColors[displayStatus]} flex items-center gap-0.5`}>
              <StatusIcon className={`w-2.5 h-2.5 ${displayStatus === 'claiming' ? 'animate-spin' : ''}`} />
              {displayStatus === 'active' ? timeRemaining : displayStatus}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
