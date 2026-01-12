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
    <div className="space-y-4">
      {/* Chain Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-200 mb-2 flex items-center gap-2">
          <NetworkIcon className="w-4 h-4 text-gray-400" />
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
                playPickupSound()
                onBlockchainChange(chain.value)
                onNetworkChange(chain.networks[0])
              }}
              className={`p-3 rounded-lg border transition-all duration-150 text-left cursor-pointer relative overflow-hidden group ${
                blockchain === chain.value
                  ? 'border-feedgod-primary/60 bg-feedgod-primary/10'
                  : 'border-[#3a3b35] bg-[#252620] hover:border-[#4a4b45] hover:bg-[#2a2b25]'
              }`}
            >
              {/* Background logo watermark */}
              <div className="absolute -right-2 -bottom-2 opacity-[0.07] group-hover:opacity-[0.12] transition-opacity pointer-events-none">
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
                <span className={`font-medium text-sm ${
                  blockchain === chain.value ? 'text-white' : 'text-gray-200'
                }`}>
                  {chain.label}
                </span>
              </div>
              <div className={`text-xs mt-1 relative z-10 ${
                blockchain === chain.value ? 'text-feedgod-primary/70' : 'text-gray-500'
              }`}>
                {chain.networks.length} network{chain.networks.length !== 1 ? 's' : ''}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Network Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-200 mb-2">
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
                playPickupSound()
                onNetworkChange(net)
              }}
              className={`px-4 py-2 rounded-lg border transition-all duration-150 text-sm font-medium cursor-pointer ${
                network === net
                  ? 'border-feedgod-primary bg-feedgod-primary text-white'
                  : 'border-[#3a3b35] bg-[#252620] text-gray-300 hover:border-[#4a4b45] hover:text-white'
              }`}
            >
              {NETWORK_LABELS[net]}
            </button>
          ))}
        </div>
        {(network === 'testnet' || network === 'devnet') && (
          <p className="text-xs text-gray-500 mt-2">
            {network === 'testnet' ? 'Testnet' : 'Devnet'} is for testing only. Use mainnet for production.
          </p>
        )}
      </div>
    </div>
  )
}
