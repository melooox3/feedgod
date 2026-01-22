'use client'

import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react'
import { ethers } from 'ethers'
import { useToast } from '@/components/Toast'

interface EVMWalletContextType {
  address: string | null
  isConnected: boolean
  chainId: number | null
  provider: ethers.BrowserProvider | null
  signer: ethers.JsonRpcSigner | null
  connect: () => Promise<void>
  disconnect: () => void
  switchChain: (chainId: number) => Promise<void>
}

const EVMWalletContext = createContext<EVMWalletContextType | undefined>(undefined)

export function useEVMWallet() {
  const context = useContext(EVMWalletContext)
  if (!context) {
    throw new Error('useEVMWallet must be used within EVMWalletProvider')
  }
  return context
}

export function EVMWalletProvider({ children }: { children: ReactNode }) {
  const toast = useToast()
  const [address, setAddress] = useState<string | null>(null)
  const [chainId, setChainId] = useState<number | null>(null)
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null)
  const [signer, setSigner] = useState<ethers.JsonRpcSigner | null>(null)
  const [isConnected, setIsConnected] = useState(false)

  // Check if wallet is already connected on mount
  useEffect(() => {
    if (typeof window !== 'undefined' && window.ethereum) {
      checkConnection()
      
      const handleAccountsChangedWrapper = (accounts: string[]) => handleAccountsChanged(accounts)
      const handleChainChangedWrapper = (chainId: string) => handleChainChanged(chainId)
      
      // Listen for account changes
      window.ethereum.on('accountsChanged', handleAccountsChangedWrapper)
      // Listen for chain changes
      window.ethereum.on('chainChanged', handleChainChangedWrapper)
      
      return () => {
        if (window.ethereum) {
          window.ethereum.removeListener('accountsChanged', handleAccountsChangedWrapper)
          window.ethereum.removeListener('chainChanged', handleChainChangedWrapper)
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const checkConnection = async () => {
    if (!window.ethereum) return
    
    try {
      const provider = new ethers.BrowserProvider(window.ethereum)
      const accounts = await provider.listAccounts()
      
      if (accounts.length > 0) {
        const signer = await provider.getSigner()
        const network = await provider.getNetwork()
        const address = await signer.getAddress()
        
        setProvider(provider)
        setSigner(signer)
        setAddress(address)
        setChainId(Number(network.chainId))
        setIsConnected(true)
      }
    } catch (error) {
      console.error('Error checking EVM wallet connection:', error)
    }
  }

  const handleAccountsChanged = (accounts: string[]) => {
    if (accounts.length === 0) {
      disconnect()
    } else {
      checkConnection()
    }
  }

  const handleChainChanged = (chainId: string) => {
    setChainId(Number(chainId))
    checkConnection()
  }

  const connect = async () => {
    if (!window.ethereum) {
      toast.warning('Please install MetaMask, Rabby, or another EVM-compatible wallet')
      return
    }

    try {
      const provider = new ethers.BrowserProvider(window.ethereum)
      await provider.send('eth_requestAccounts', [])
      
      const signer = await provider.getSigner()
      const network = await provider.getNetwork()
      const address = await signer.getAddress()
      
      setProvider(provider)
      setSigner(signer)
      setAddress(address)
      setChainId(Number(network.chainId))
      setIsConnected(true)
    } catch (error: any) {
      console.error('Error connecting EVM wallet:', error)
      if (error.code === 4001) {
        toast.warning('Please connect your wallet to continue')
      }
    }
  }

  const disconnect = () => {
    setAddress(null)
    setChainId(null)
    setProvider(null)
    setSigner(null)
    setIsConnected(false)
  }

  const switchChain = async (targetChainId: number) => {
    if (!window.ethereum || !provider) return

    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: `0x${targetChainId.toString(16)}` }],
      })
    } catch (switchError: any) {
      // This error code indicates that the chain has not been added to MetaMask
      if (switchError.code === 4902) {
        // You can add the chain here if needed
        console.error('Chain not added to wallet')
      } else {
        console.error('Error switching chain:', switchError)
      }
    }
  }

  return (
    <EVMWalletContext.Provider
      value={{
        address,
        isConnected,
        chainId,
        provider,
        signer,
        connect,
        disconnect,
        switchChain,
      }}
    >
      {children}
    </EVMWalletContext.Provider>
  )
}
