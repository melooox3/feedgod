'use client'

import { useState } from 'react'
import { Plus, Trash2, CheckCircle2, XCircle } from 'lucide-react'
import { FeedConfig, DataSource } from '@/types/feed'

interface DataSourcesPanelProps {
  config: FeedConfig
  onUpdate: (updates: Partial<FeedConfig>) => void
}

const AVAILABLE_SOURCES = [
  { id: 'coingecko', name: 'CoinGecko', type: 'api' as const },
  { id: 'binance', name: 'Binance', type: 'api' as const },
  { id: 'coinbase', name: 'Coinbase', type: 'api' as const },
  { id: 'kraken', name: 'Kraken', type: 'api' as const },
  { id: 'pyth', name: 'Pyth Network', type: 'on-chain' as const },
  { id: 'chainlink', name: 'Chainlink', type: 'on-chain' as const },
  { id: 'custom', name: 'Custom API', type: 'api' as const },
]

export default function DataSourcesPanel({ config, onUpdate }: DataSourcesPanelProps) {
  const [showAddModal, setShowAddModal] = useState(false)

  const addDataSource = (source: typeof AVAILABLE_SOURCES[0]) => {
    const newSource: DataSource = {
      id: source.id,
      name: source.name,
      type: source.type,
      enabled: true,
      weight: 1,
    }
    onUpdate({
      dataSources: [...config.dataSources, newSource],
    })
    setShowAddModal(false)
  }

  const removeDataSource = (id: string) => {
    onUpdate({
      dataSources: config.dataSources.filter(s => s.id !== id),
    })
  }

  const updateDataSource = (id: string, updates: Partial<DataSource>) => {
    onUpdate({
      dataSources: config.dataSources.map(s =>
        s.id === id ? { ...s, ...updates } : s
      ),
    })
  }

  const availableToAdd = AVAILABLE_SOURCES.filter(
    s => !config.dataSources.find(ds => ds.id === s.id)
  )

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-white">Data Sources</h3>
          <p className="text-sm text-gray-400 mt-1">
            Add multiple data sources for better reliability
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          disabled={availableToAdd.length === 0}
          className="px-4 py-2 bg-switchboard-primary hover:bg-switchboard-primary/80 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-white text-sm font-medium transition-colors flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Source
        </button>
      </div>

      {config.dataSources.length === 0 ? (
        <div className="text-center py-12 bg-switchboard-dark-lighter/50 rounded-lg border border-dashed border-switchboard-dark-lighter">
          <p className="text-gray-400">No data sources added yet</p>
          <p className="text-sm text-gray-500 mt-1">Add at least one source to get started</p>
        </div>
      ) : (
        <div className="space-y-3">
          {config.dataSources.map((source) => (
            <div
              key={source.id}
              className="bg-switchboard-dark-lighter rounded-lg p-4 border border-switchboard-dark-lighter"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${
                    source.enabled ? 'bg-green-500' : 'bg-gray-500'
                  }`} />
                  <div>
                    <h4 className="text-white font-medium">{source.name}</h4>
                    <p className="text-xs text-gray-400 capitalize">{source.type}</p>
                  </div>
                </div>
                <button
                  onClick={() => removeDataSource(source.id)}
                  className="p-2 hover:bg-switchboard-dark-lighter rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4 text-red-400" />
                </button>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Weight</label>
                  <input
                    type="number"
                    value={source.weight || 1}
                    onChange={(e) => updateDataSource(source.id, { weight: parseFloat(e.target.value) || 1 })}
                    className="w-full bg-switchboard-dark border border-switchboard-dark-lighter rounded px-3 py-1.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-switchboard-primary"
                    min="0"
                    step="0.1"
                  />
                </div>
                <div className="flex items-end">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={source.enabled}
                      onChange={(e) => updateDataSource(source.id, { enabled: e.target.checked })}
                      className="w-4 h-4 rounded border-switchboard-dark-lighter bg-switchboard-dark text-switchboard-primary focus:ring-switchboard-primary"
                    />
                    <span className="text-xs text-gray-400">Enabled</span>
                  </label>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-switchboard-dark-light rounded-lg border border-switchboard-dark-lighter p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-white mb-4">Add Data Source</h3>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {availableToAdd.map((source) => (
                <button
                  key={source.id}
                  onClick={() => addDataSource(source)}
                  className="w-full text-left p-3 bg-switchboard-dark-lighter hover:bg-switchboard-dark-lighter/80 rounded-lg transition-colors"
                >
                  <div className="font-medium text-white">{source.name}</div>
                  <div className="text-xs text-gray-400 capitalize mt-1">{source.type}</div>
                </button>
              ))}
            </div>
            <button
              onClick={() => setShowAddModal(false)}
              className="mt-4 w-full px-4 py-2 bg-switchboard-dark-lighter hover:bg-switchboard-dark-lighter/80 rounded-lg text-white text-sm font-medium transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}




