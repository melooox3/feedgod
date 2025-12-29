'use client'

import { ReactNode } from 'react'
import { WalletContextProvider } from './wallet-provider'
import { EVMWalletProvider } from './evm-wallet-provider'

export function UnifiedWalletProvider({ children }: { children: ReactNode }) {
  return (
    <WalletContextProvider>
      <EVMWalletProvider>
        {children}
      </EVMWalletProvider>
    </WalletContextProvider>
  )
}

