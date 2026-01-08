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

const BLOCKCHAINS: { value: Blockchain; label: string; networks: Network[]; logo: string }[] = [
  {
    value: 'solana',
    label: 'Solana',
    networks: ['mainnet', 'devnet', 'testnet'],
    logo: '/solana.png',
  },
  {
    value: 'ethereum',
    label: 'Ethereum',
    networks: ['mainnet', 'testnet'],
    logo: '/ethereum.png',
  },
  {
    value: 'monad',
    label: 'Monad',
    networks: ['mainnet', 'devnet', 'testnet'],
    logo: '/monad.png',
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
        <label className="block text-sm font-medium text-white mb-2 flex items-center gap-2">
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
              className={`p-3 rounded-lg border-2 transition-colors text-left cursor-pointer relative z-10 overflow-hidden group ${
                blockchain === chain.value
                  ? 'border-feedgod-primary dark:text-feedgod-primary dark:border-feedgod-primary dark:text-feedgod-primary bg-feedgod-purple-50 dark:bg-feedgod-dark-secondary dark:bg-feedgod-purple-200 dark:border-feedgod-dark-accent'
                  : 'border-feedgod-purple-200 dark:border-feedgod-dark-accent dark:border-feedgod-purple-200 dark:border-feedgod-dark-accent bg-feedgod-dark-secondary dark:bg-feedgod-purple-50 dark:bg-feedgod-dark-secondary hover:border-feedgod-purple-300 dark:border-feedgod-dark-accent dark:hover:border-feedgod-feedgod-primary dark:text-feedgod-secondary'
              }`}
            >
              {/* Background logo watermark */}
              <div className="absolute -right-2 -bottom-2 opacity-10 group-hover:opacity-20 transition-opacity">
                <img 
                  src={chain.logo} 
                  alt="" 
                  className="w-12 h-12 object-contain"
                />
              </div>
              
              <div className="flex items-center gap-2 relative z-10">
                <img 
                  src={chain.logo} 
                  alt={chain.label} 
                  className="w-5 h-5 object-contain"
                />
                <div className="font-medium text-white text-sm">{chain.label}</div>
              </div>
              <div className="text-xs text-gray-400 mt-1 relative z-10">
                {chain.networks.length} network{chain.networks.length !== 1 ? 's' : ''}
              </div>
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-white mb-2">
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
                  ? 'border-feedgod-primary dark:text-feedgod-primary dark:border-feedgod-primary dark:text-feedgod-primary bg-feedgod-primary dark:text-feedgod-primary dark:bg-feedgod-primary dark:text-feedgod-primary text-white'
                  : 'border-feedgod-dark-accent bg-feedgod-dark-secondary text-white hover:border-feedgod-primary/50'
              } star-glow-on-hover`}
            >
              {NETWORK_LABELS[net]}
            </button>
          ))}
        </div>
        {network === 'testnet' || network === 'devnet' ? (
          <p className="text-xs text-gray-400 mt-2">
            ⚠️ {network === 'testnet' ? 'Testnet' : 'Devnet'} is for testing only. Use mainnet for production.
          </p>
        ) : null}
      </div>
    </div>
  )
}

