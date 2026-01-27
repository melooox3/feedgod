'use client'

import { useEffect, useState } from 'react'
import { useAppKit, useAppKitAccount } from '@reown/appkit/react'
import { useDisconnect } from 'wagmi'
import { Wallet, LogOut, User, Check } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { playPickupSound } from '@/lib/utils/sound-utils'

export default function WalletButton() {
  const { open } = useAppKit()
  const { address, isConnected } = useAppKitAccount()
  const { disconnect } = useDisconnect()
  const router = useRouter()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleConnect = () => {
    playPickupSound()
    open()
  }

  const handleDisconnect = () => {
    playPickupSound()
    disconnect()
    sessionStorage.removeItem('walletVerified')
    sessionStorage.removeItem('walletAddress')
  }

  const handleProfile = () => {
    playPickupSound()
    router.push('/profile')
  }

  const handleAccountView = () => {
    playPickupSound()
    open({ view: 'Account' })
  }

  const getAddress = () => {
    if (address) {
      return `${address.slice(0, 6)}...${address.slice(-4)}`
    }
    return ''
  }

  // Don't render until mounted (avoid hydration mismatch)
  if (!mounted) {
    return (
      <button className="px-4 py-2 gradient-bg hover:opacity-90 rounded-lg text-white font-semibold text-sm transition-all flex items-center gap-2 opacity-50">
        <Wallet className="w-4 h-4" />
        <span>Connect Wallet</span>
      </button>
    )
  }

  // Connected state
  if (isConnected && address) {
    return (
      <div className="flex items-center gap-2">
        <button
          onClick={handleProfile}
          className="px-3 py-2 bg-[#252620] hover:bg-[#2a2b25] border border-[#3a3b35] rounded-lg text-white text-sm font-medium transition-colors flex items-center gap-2"
        >
          <User className="w-4 h-4" />
          <span className="hidden sm:inline">Profile</span>
        </button>
        <button
          onClick={handleAccountView}
          className="px-3 py-2 bg-[#252620] hover:bg-[#2a2b25] border border-[#3a3b35] rounded-lg text-sm font-medium flex items-center gap-2 transition-colors"
        >
          <Wallet className="w-4 h-4 text-gray-400" />
          <span className="text-white">{getAddress()}</span>
          <Check className="w-3 h-3 text-green-500" />
        </button>
        <button
          onClick={handleDisconnect}
          className="px-3 py-2 bg-[#252620] hover:bg-red-900/30 border border-[#3a3b35] hover:border-red-500/50 rounded-lg text-gray-400 hover:text-red-400 text-sm font-medium transition-colors flex items-center gap-2"
          title="Disconnect"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    )
  }

  // Not connected - show connect button
  return (
    <button
      onClick={handleConnect}
      className="px-4 py-2 gradient-bg hover:opacity-90 rounded-lg text-white font-semibold text-sm transition-all flex items-center gap-2"
    >
      <Wallet className="w-4 h-4" />
      <span>Connect Wallet</span>
    </button>
  )
}
