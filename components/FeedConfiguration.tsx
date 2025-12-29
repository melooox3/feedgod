'use client'

import { FeedConfig } from '@/types/feed'

interface FeedConfigurationProps {
  config: FeedConfig
  onUpdate: (updates: Partial<FeedConfig>) => void
}

export default function FeedConfiguration({ config, onUpdate }: FeedConfigurationProps) {
  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Feed Name
        </label>
        <input
          type="text"
          value={config.name}
          onChange={(e) => onUpdate({ name: e.target.value })}
          className="w-full bg-switchboard-dark-lighter border border-switchboard-dark-lighter rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-switchboard-primary"
          placeholder="My Custom Feed"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Symbol (e.g., BTC/USD)
        </label>
        <input
          type="text"
          value={config.symbol}
          onChange={(e) => onUpdate({ symbol: e.target.value })}
          className="w-full bg-switchboard-dark-lighter border border-switchboard-dark-lighter rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-switchboard-primary"
          placeholder="BTC/USD"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Description
        </label>
        <textarea
          value={config.description || ''}
          onChange={(e) => onUpdate({ description: e.target.value })}
          className="w-full bg-switchboard-dark-lighter border border-switchboard-dark-lighter rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-switchboard-primary h-24 resize-none"
          placeholder="Describe your feed..."
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Update Interval (seconds)
          </label>
          <input
            type="number"
            value={config.updateInterval}
            onChange={(e) => onUpdate({ updateInterval: parseInt(e.target.value) || 60 })}
            className="w-full bg-switchboard-dark-lighter border border-switchboard-dark-lighter rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-switchboard-primary"
            min="1"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Decimals
          </label>
          <input
            type="number"
            value={config.decimals}
            onChange={(e) => onUpdate({ decimals: parseInt(e.target.value) || 8 })}
            className="w-full bg-switchboard-dark-lighter border border-switchboard-dark-lighter rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-switchboard-primary"
            min="0"
            max="18"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Network
        </label>
        <select
          value={config.network}
          onChange={(e) => onUpdate({ network: e.target.value as any })}
          className="w-full bg-switchboard-dark-lighter border border-switchboard-dark-lighter rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-switchboard-primary"
        >
          <option value="mainnet">Mainnet</option>
          <option value="devnet">Devnet</option>
          <option value="testnet">Testnet</option>
        </select>
      </div>

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="enabled"
          checked={config.enabled}
          onChange={(e) => onUpdate({ enabled: e.target.checked })}
          className="w-4 h-4 rounded border-switchboard-dark-lighter bg-switchboard-dark-lighter text-switchboard-primary focus:ring-switchboard-primary"
        />
        <label htmlFor="enabled" className="text-sm font-medium text-gray-300">
          Enable Feed
        </label>
      </div>
    </div>
  )
}




