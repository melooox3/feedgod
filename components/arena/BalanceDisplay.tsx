'use client'

import { useState, useEffect } from 'react'
import { Wallet, PieChart } from 'lucide-react'
import { useAppKitAccount } from '@reown/appkit/react'
import { getArenaBalance, getUserId, formatUsdc } from '@/lib/arena/arena-wallet'
import { getArenaUser } from '@/lib/arena/arena-storage'

export default function BalanceDisplay() {
  const { address } = useAppKitAccount()
  const publicKey = address ? { toString: () => address } : null
  const [balance, setBalance] = useState(0)
  const [portfolio, setPortfolio] = useState(0)

  useEffect(() => {
    const loadData = () => {
      const userId = getUserId(publicKey?.toString())
      
      // Get current balance from wallet system
      const currentBalance = getArenaBalance(userId)
      setBalance(currentBalance)
      
      // Get pending positions value from arena-storage (predictions system)
      const user = getArenaUser()
      const pendingValue = user.predictions
        .filter(p => p.status === 'pending')
        .reduce((sum, p) => sum + (p.potentialPayout || 0), 0)
      
      // Portfolio = balance + pending position values
      setPortfolio(currentBalance + pendingValue)
    }
    
    loadData()
    const interval = setInterval(loadData, 1000)
    return () => clearInterval(interval)
  }, [publicKey])

  return (
    <div className="bg-[#1D1E19]/60 rounded-lg border border-[#2a2b25] px-4 py-3 space-y-2">
      {/* Portfolio (Total) */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <PieChart className="w-3.5 h-3.5 text-gray-500" />
          <span className="text-[10px] text-gray-500 uppercase tracking-wide">Portfolio</span>
        </div>
        <span className="text-sm font-medium text-gray-200">
          {formatUsdc(portfolio)} <span className="text-gray-500">USDC</span>
        </span>
      </div>
      
      {/* Divider */}
      <div className="border-t border-[#2a2b25]" />
      
      {/* Balance (Available) */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Wallet className="w-3.5 h-3.5 text-gray-600" />
          <span className="text-[10px] text-gray-600 uppercase tracking-wide">Available</span>
        </div>
        <span className="text-xs text-gray-400">
          {formatUsdc(balance)}
        </span>
      </div>
    </div>
  )
}
