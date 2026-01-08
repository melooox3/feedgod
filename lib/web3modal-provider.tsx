'use client'

import { ReactNode, useEffect, useState } from 'react'
import { WagmiProvider } from 'wagmi'
import { QueryClientProvider } from '@tanstack/react-query'
import { createAppKit } from '@reown/appkit/react'
import { mainnet, arbitrum, optimism, base, polygon, sepolia } from '@reown/appkit/networks'
import { wagmiAdapter, wagmiConfig, queryClient, projectId, metadata, networks } from './web3modal-config'

// Flag to prevent multiple initializations
let appKitInitialized = false

interface Web3ModalProviderProps {
  children: ReactNode
}

export function Web3ModalProvider({ children }: Web3ModalProviderProps) {
  const [ready, setReady] = useState(false)

  useEffect(() => {
    // Initialize AppKit only once on client
    if (!appKitInitialized && typeof window !== 'undefined') {
      createAppKit({
        adapters: [wagmiAdapter],
        networks: [mainnet, arbitrum, optimism, base, polygon, sepolia],
        projectId,
        metadata,
        themeMode: 'dark',
        themeVariables: {
          '--w3m-accent': '#ff0d6e',
          '--w3m-color-mix': '#ff0d6e',
          '--w3m-color-mix-strength': 20,
          '--w3m-border-radius-master': '8px',
          '--w3m-z-index': 99999,
        },
        features: {
          analytics: false,
          onramp: false,
        },
      })
      appKitInitialized = true
    }
    setReady(true)
  }, [])

  if (!ready) {
    return null // or a loading spinner
  }

  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </WagmiProvider>
  )
}
