'use client'

import { FeedConfig } from '@/types/feed'

interface AggregatorPanelProps {
  config: FeedConfig
  onUpdate: (updates: Partial<FeedConfig>) => void
}

export default function AggregatorPanel({ config, onUpdate }: AggregatorPanelProps) {
  const aggregator = config.aggregator

  const updateAggregator = (updates: Partial<FeedConfig['aggregator']>) => {
    onUpdate({
      aggregator: { ...aggregator, ...updates },
    })
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-white mb-1">Aggregator Settings</h3>
        <p className="text-sm text-gray-400">
          Configure how prices from multiple sources are combined
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Aggregation Type
        </label>
        <div className="grid grid-cols-2 gap-3">
          {(['median', 'mean', 'weighted'] as const).map((type) => (
            <button
              key={type}
              onClick={() => updateAggregator({ type })}
              className={`p-4 rounded-lg border-2 transition-colors text-left ${
                aggregator.type === type
                  ? 'border-switchboard-primary bg-switchboard-primary/10'
                  : 'border-switchboard-dark-lighter bg-switchboard-dark-lighter hover:border-switchboard-dark-lighter/80'
              }`}
            >
              <div className="font-medium text-white capitalize">{type}</div>
              <div className="text-xs text-gray-400 mt-1">
                {type === 'median' && 'Use middle value (most robust)'}
                {type === 'mean' && 'Average all values'}
                {type === 'weighted' && 'Weight by source reliability'}
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Minimum Sources Required
          </label>
          <input
            type="number"
            value={aggregator.minSources || 2}
            onChange={(e) => updateAggregator({ minSources: parseInt(e.target.value) || 2 })}
            className="w-full bg-switchboard-dark-lighter border border-switchboard-dark-lighter rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-switchboard-primary"
            min="1"
            max={config.dataSources.length}
          />
          <p className="text-xs text-gray-500 mt-1">
            Feed requires at least this many active sources
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Deviation Threshold (%)
          </label>
          <input
            type="number"
            value={aggregator.deviationThreshold ? aggregator.deviationThreshold * 100 : 5}
            onChange={(e) => updateAggregator({ deviationThreshold: (parseFloat(e.target.value) || 5) / 100 })}
            className="w-full bg-switchboard-dark-lighter border border-switchboard-dark-lighter rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-switchboard-primary"
            min="0"
            max="100"
            step="0.1"
          />
          <p className="text-xs text-gray-500 mt-1">
            Reject prices deviating more than this
          </p>
        </div>
      </div>

      <div className="bg-switchboard-dark-lighter rounded-lg p-4 border border-switchboard-dark-lighter">
        <h4 className="text-sm font-medium text-white mb-2">Current Configuration</h4>
        <div className="space-y-1 text-sm text-gray-400">
          <div>Type: <span className="text-white capitalize">{aggregator.type}</span></div>
          <div>Min Sources: <span className="text-white">{aggregator.minSources || 2}</span></div>
          <div>Deviation Threshold: <span className="text-white">{(aggregator.deviationThreshold || 0.05) * 100}%</span></div>
          <div>Active Sources: <span className="text-white">{config.dataSources.filter(s => s.enabled).length}</span></div>
        </div>
      </div>
    </div>
  )
}




