'use client'

import { useEffect, useRef, useState } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import { useWalletModal } from '@solana/wallet-adapter-react-ui'
import { useEVMWallet } from '@/lib/evm-wallet-provider'
import { Wallet, LogOut, User, ChevronDown } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { playPickupSound } from '@/lib/sound-utils'

type WalletType = 'solana' | 'evm' | null

export default function WalletButton() {
  const solanaWallet = useWallet()
  const { setVisible: setSolanaModalVisible } = useWalletModal()
  const evmWallet = useEVMWallet()
  const router = useRouter()
  const wasConnectedRef = useRef(false)
  const [showWalletMenu, setShowWalletMenu] = useState(false)
  const [walletType, setWalletType] = useState<WalletType>(null)

  // Determine which wallet is connected
  const isSolanaConnected = solanaWallet.connected && solanaWallet.publicKey
  const isEVMConnected = evmWallet.isConnected && evmWallet.address
  const isAnyConnected = isSolanaConnected || isEVMConnected

  // Play sound when wallet connects
  useEffect(() => {
    if (isAnyConnected && !wasConnectedRef.current) {
      playPickupSound()
      wasConnectedRef.current = true
      if (isSolanaConnected) setWalletType('solana')
      if (isEVMConnected) setWalletType('evm')
    } else if (!isAnyConnected) {
      wasConnectedRef.current = false
      setWalletType(null)
    }
  }, [isAnyConnected, isSolanaConnected, isEVMConnected])

  const handleConnect = (type: 'solana' | 'evm') => {
    setWalletType(type)
    if (type === 'solana') {
      setSolanaModalVisible(true)
    } else {
      evmWallet.connect()
    }
  }

  const handleDisconnect = () => {
    if (walletType === 'solana') {
      solanaWallet.disconnect()
    } else if (walletType === 'evm') {
      evmWallet.disconnect()
    }
    setWalletType(null)
  }

  const handleProfile = () => {
    playPickupSound()
    router.push('/profile')
  }

  const getAddress = () => {
    if (isSolanaConnected && solanaWallet.publicKey) {
      return `${solanaWallet.publicKey.toString().slice(0, 4)}...${solanaWallet.publicKey.toString().slice(-4)}`
    }
    if (isEVMConnected && evmWallet.address) {
      return `${evmWallet.address.slice(0, 6)}...${evmWallet.address.slice(-4)}`
    }
    return ''
  }

  const getWalletName = () => {
    if (isSolanaConnected) {
      return solanaWallet.wallet?.adapter.name || 'Solana'
    }
    if (isEVMConnected) {
      if (typeof window !== 'undefined' && window.ethereum) {
        if (window.ethereum.isRabby) return 'Rabby'
        if (window.ethereum.isMetaMask) return 'MetaMask'
      }
      return 'EVM'
    }
    return ''
  }

  if (isAnyConnected) {
    const address = getAddress()
    const walletName = getWalletName()
    
    return (
      <div className="flex items-center gap-2">
        <button
          onClick={handleProfile}
          className="px-3 py-2 bg-feedgod-pink-100 dark:bg-feedgod-dark-secondary hover:bg-feedgod-pink-200 dark:hover:bg-feedgod-dark-accent rounded-lg text-feedgod-dark dark:text-feedgod-neon-cyan text-sm font-medium transition-colors flex items-center gap-2 star-glow-on-hover"
        >
          <User className="w-4 h-4" />
          <span>Profile</span>
        </button>
        <div className="px-3 py-2 bg-feedgod-pink-50 dark:bg-feedgod-dark-secondary rounded-lg text-feedgod-dark dark:text-feedgod-neon-cyan text-sm font-medium flex items-center gap-2">
          <Wallet className="w-4 h-4" />
          <span className="hidden sm:inline">{walletName}</span>
          <span>{address}</span>
        </div>
        <button
          onClick={handleDisconnect}
          className="px-3 py-2 bg-feedgod-pink-100 dark:bg-feedgod-dark-secondary hover:bg-feedgod-pink-200 dark:hover:bg-feedgod-dark-accent rounded-lg text-feedgod-dark dark:text-feedgod-neon-cyan text-sm font-medium transition-colors flex items-center gap-2 star-glow-on-hover"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    )
  }

  return (
    <div className="relative">
      <button
        onClick={() => setShowWalletMenu(!showWalletMenu)}
        className="px-4 py-2 bg-feedgod-primary hover:bg-feedgod-secondary rounded-lg text-white text-sm font-medium transition-colors flex items-center gap-2 star-glow-on-hover"
      >
        <Wallet className="w-4 h-4" />
        <span>Connect Wallet</span>
        <ChevronDown className="w-4 h-4" />
      </button>
      
      {showWalletMenu && (
        <>
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setShowWalletMenu(false)}
          />
          <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-feedgod-dark-secondary rounded-lg shadow-lg border border-feedgod-pink-200 dark:border-feedgod-dark-accent z-20 overflow-hidden">
            <button
              onClick={() => {
                handleConnect('solana')
                setShowWalletMenu(false)
              }}
              className="w-full px-4 py-3 text-left hover:bg-feedgod-pink-50 dark:hover:bg-feedgod-dark-accent transition-colors flex items-center gap-2 text-feedgod-dark dark:text-feedgod-neon-cyan star-glow-on-hover"
            >
              <Wallet className="w-4 h-4" />
              <span>Solana Wallet</span>
            </button>
            <button
              onClick={() => {
                handleConnect('evm')
                setShowWalletMenu(false)
              }}
              className="w-full px-4 py-3 text-left hover:bg-feedgod-pink-50 dark:hover:bg-feedgod-dark-accent transition-colors flex items-center gap-2 text-feedgod-dark dark:text-feedgod-neon-cyan star-glow-on-hover"
            >
              <Wallet className="w-4 h-4" />
              <span>EVM Wallet</span>
            </button>
          </div>
        </>
      )}
    </div>
  )
}
