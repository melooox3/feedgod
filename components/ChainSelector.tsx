'use client'

import { Blockchain, Network } from '@/types/feed'
import { Network as NetworkIcon } from 'lucide-react'
import { playPickupSound } from '@/lib/sound-utils'

interface ChainSelectorProps {
  blockchain: Blockchain
  network: Network
  onBlockchainChange: (blockchain: Blockchain) => void
  onNetworkChange: (network: Network) => void
}

const BLOCKCHAINS: { value: Blockchain; label: string; networks: Network[] }[] = [
  {
    value: 'solana',
    label: 'Solana',
    networks: ['mainnet', 'devnet', 'testnet'],
  },
  {
    value: 'ethereum',
    label: 'Ethereum',
    networks: ['mainnet', 'testnet'],
  },
  {
    value: 'monad',
    label: 'Monad',
    networks: ['mainnet', 'devnet', 'testnet'],
  },
]

const NETWORK_LABELS: Record<Network, string> = {
  mainnet: 'Mainnet',
  devnet: 'Devnet',
  testnet: 'Testnet',
}

export default function ChainSelector({
  blockchain,
  network,
  onBlockchainChange,
  onNetworkChange,
}: ChainSelectorProps) {
  const currentChain = BLOCKCHAINS.find(c => c.value === blockchain)
  const availableNetworks = currentChain?.networks || []

  return (
    <div className="space-y-3">
      <div>
        <label className="block text-sm font-medium text-feedgod-dark dark:text-feedgod-neon-cyan mb-2 flex items-center gap-2">
          <NetworkIcon className="w-4 h-4" />
          Chain
        </label>
        <div className="grid grid-cols-3 gap-2">
          {BLOCKCHAINS.map((chain) => (
            <button
              key={chain.value}
              type="button"
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                console.log('Blockchain button clicked:', chain.value)
                playPickupSound()
                onBlockchainChange(chain.value)
                // Set to first available network for this chain
                onNetworkChange(chain.networks[0])
              }}
              className={`p-3 rounded-lg border-2 transition-colors text-left cursor-pointer relative z-10 ${
                blockchain === chain.value
                  ? 'border-feedgod-primary dark:border-feedgod-neon-pink bg-feedgod-pink-50 dark:bg-feedgod-dark-accent'
                  : 'border-feedgod-pink-200 dark:border-feedgod-dark-accent bg-white dark:bg-feedgod-dark-secondary hover:border-feedgod-pink-300 dark:hover:border-feedgod-neon-cyan'
              }`}
            >
              <div className="font-medium text-feedgod-dark dark:text-feedgod-neon-cyan text-sm">{chain.label}</div>
              <div className="text-xs text-feedgod-pink-500 dark:text-feedgod-neon-cyan/70 mt-1">
                {chain.networks.length} network{chain.networks.length !== 1 ? 's' : ''}
              </div>
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-feedgod-dark dark:text-feedgod-neon-cyan mb-2">
          Network
        </label>
        <div className="flex gap-2 flex-wrap">
          {availableNetworks.map((net) => (
            <button
              key={net}
              type="button"
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                console.log('Network button clicked:', net, 'current blockchain:', blockchain)
                playPickupSound()
                // CRITICAL: Only update network, don't touch blockchain
                onNetworkChange(net)
              }}
              className={`px-4 py-2 rounded-lg border-2 transition-colors text-sm font-medium cursor-pointer relative z-10 ${
                network === net
                  ? 'border-feedgod-primary dark:border-feedgod-neon-pink bg-feedgod-primary dark:bg-feedgod-neon-pink text-white'
                  : 'border-feedgod-pink-200 dark:border-feedgod-dark-accent bg-white dark:bg-feedgod-dark-secondary text-feedgod-dark dark:text-feedgod-neon-cyan hover:border-feedgod-pink-300 dark:hover:border-feedgod-neon-cyan'
              } star-glow-on-hover`}
            >
              {NETWORK_LABELS[net]}
            </button>
          ))}
        </div>
        {network === 'testnet' || network === 'devnet' ? (
          <p className="text-xs text-feedgod-pink-500 dark:text-feedgod-neon-cyan/70 mt-2">
            ⚠️ {network === 'testnet' ? 'Testnet' : 'Devnet'} is for testing only. Use mainnet for production.
          </p>
        ) : null}
      </div>
    </div>
  )
}

