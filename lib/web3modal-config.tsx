'use client'

import { cookieStorage, createStorage } from 'wagmi'
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi'
import { mainnet, arbitrum, optimism, base, polygon, sepolia } from '@reown/appkit/networks'
import { QueryClient } from '@tanstack/react-query'

// Get project ID from https://cloud.walletconnect.com (it's free)
// Create a .env.local file with: NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_id
export const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || '3a8170812b534d0ff9d794f19a901d64'

// Create query client for React Query
export const queryClient = new QueryClient()

export const metadata = {
  name: 'FeedGod',
  description: 'Any data. Any chain. No code.',
  url: typeof window !== 'undefined' ? window.location.origin : 'https://feedgod.xyz',
  icons: ['/symbol-colored.svg']
}

// Configure networks
export const networks = [mainnet, arbitrum, optimism, base, polygon, sepolia] as const

// Create Wagmi adapter
export const wagmiAdapter = new WagmiAdapter({
  storage: createStorage({
    storage: cookieStorage
  }),
  networks,
  projectId,
  ssr: true,
})

// Export wagmi config for provider
export const wagmiConfig = wagmiAdapter.wagmiConfig
