'use client'

import { useState, useEffect } from 'react'
import { Play, Save, Settings, Clock, Code2, Zap, Database, Key, Code } from 'lucide-react'
import { FunctionConfig } from '@/types/switchboard'
import { playPickupSound } from '@/lib/sound-utils'
import ChainSelector from './ChainSelector'

interface FunctionBuilderProps {
  config: FunctionConfig | null
  onConfigChange: (config: FunctionConfig) => void
}

export default function FunctionBuilder({ config, onConfigChange }: FunctionBuilderProps) {
  const [localConfig, setLocalConfig] = useState<FunctionConfig | null>(config)

  useEffect(() => {
    if (config) {
      setLocalConfig(config)
    } else {
      const defaultConfig: FunctionConfig = {
        name: 'My Function',
        description: '',
        code: `// Your function code here
async function main() {
  // Fetch data, perform calculations, etc.
  const result = await fetch('https://api.example.com/data')
  const data = await result.json()
  
  return {
    success: true,
    data: data,
  }
}

export default main`,
        language: 'javascript',
        runtime: 'node',
        trigger: 'on-demand',
        timeout: 30,
        memory: 512,
        environment: {},
        secrets: [],
        blockchain: 'solana',
        network: 'mainnet',
        enabled: true,
      }
      setLocalConfig(defaultConfig)
      onConfigChange(defaultConfig)
    }
  }, [config, onConfigChange])

  const handleConfigUpdate = (updates: Partial<FunctionConfig>) => {
    setLocalConfig(prev => {
      if (!prev) return prev
      const updated = { ...prev, ...updates }
      onConfigChange(updated)
      return updated
    })
  }

  const handleSave = async () => {
    if (!localConfig) return
    playPickupSound()
    const funcToSave: FunctionConfig = {
      ...localConfig,
      id: localConfig.id || `func-${Date.now()}`,
      updatedAt: new Date(),
      createdAt: localConfig.createdAt || new Date(),
    }
    
    const savedFuncs = localStorage.getItem('savedFunctions')
    const funcs = savedFuncs ? JSON.parse(savedFuncs) : []
    const existingIndex = funcs.findIndex((f: FunctionConfig) => f.id === funcToSave.id)
    
    if (existingIndex >= 0) {
      funcs[existingIndex] = funcToSave
    } else {
      funcs.push(funcToSave)
    }
    
    localStorage.setItem('savedFunctions', JSON.stringify(funcs))
    alert('Function saved! Check your profile to manage saved functions.')
  }

  const handleDeploy = async () => {
    playPickupSound()
    if (!localConfig) return
    console.log('Deploying function:', localConfig)
    alert('Function deployed! (This is a demo - in production, this would deploy to Switchboard)')
  }

  if (!localConfig) {
    return (
      <div className="bg-[#252620] rounded-lg border border-[#3a3b35] p-12 text-center">
        <div className="text-xl font-semibold text-feedgod-primary dark:text-feedgod-primary mb-2">Loading Function Builder...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Module Header */}
      <div className="bg-[#252620]/80 rounded-lg border border-[#3a3b35] p-6 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-emerald-500 flex items-center justify-center">
            <Code className="w-4 h-4 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">
              Functions
            </h2>
            <p className="text-sm text-gray-400">
              Run custom off-chain computation and push results on-chain with verifiable execution
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Configuration */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-[#252620]/80 rounded-lg border border-[#3a3b35] p-6 backdrop-blur-sm">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Settings className="w-5 h-5 text-feedgod-primary dark:text-feedgod-primary" />
              Function Configuration
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Function Name</label>
                <input
                  type="text"
                  value={localConfig.name}
                  onChange={(e) => handleConfigUpdate({ name: e.target.value })}
                  className="w-full bg-[#252620] border border-[#3a3b35] rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-feedgod-primary dark:text-feedgod-primary dark:focus:ring-feedgod-primary dark:text-feedgod-primary"
                  placeholder="My Function"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Language</label>
                <select
                  value={localConfig.language}
                  onChange={(e) => handleConfigUpdate({ language: e.target.value as FunctionConfig['language'] })}
                  className="w-full bg-[#252620] border border-[#3a3b35] rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-feedgod-primary dark:text-feedgod-primary dark:focus:ring-feedgod-primary dark:text-feedgod-primary"
                >
                  <option value="javascript">JavaScript</option>
                  <option value="typescript">TypeScript</option>
                  <option value="python">Python</option>
                  <option value="rust">Rust</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Runtime</label>
                <select
                  value={localConfig.runtime}
                  onChange={(e) => handleConfigUpdate({ runtime: e.target.value as FunctionConfig['runtime'] })}
                  className="w-full bg-[#252620] border border-[#3a3b35] rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-feedgod-primary dark:text-feedgod-primary dark:focus:ring-feedgod-primary dark:text-feedgod-primary"
                >
                  <option value="node">Node.js</option>
                  <option value="python">Python</option>
                  <option value="wasm">WebAssembly</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Trigger</label>
                <select
                  value={localConfig.trigger}
                  onChange={(e) => {
                    const trigger = e.target.value as FunctionConfig['trigger']
                    handleConfigUpdate({ trigger, schedule: trigger === 'cron' ? '0 */5 * * * *' : undefined })
                  }}
                  className="w-full bg-[#252620] border border-[#3a3b35] rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-feedgod-primary dark:text-feedgod-primary dark:focus:ring-feedgod-primary dark:text-feedgod-primary"
                >
                  <option value="on-demand">On-Demand</option>
                  <option value="cron">Cron Schedule</option>
                  <option value="event">Event-Driven</option>
                </select>
              </div>

              {localConfig.trigger === 'cron' && (
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-400 mb-2">Cron Schedule</label>
                  <input
                    type="text"
                    value={localConfig.schedule || ''}
                    onChange={(e) => handleConfigUpdate({ schedule: e.target.value })}
                    className="w-full bg-[#252620] border border-[#3a3b35] rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-feedgod-primary dark:text-feedgod-primary dark:focus:ring-feedgod-primary dark:text-feedgod-primary"
                    placeholder="0 */5 * * * * (every 5 minutes)"
                  />
                  <p className="text-xs text-gray-400 mt-1">Format: second minute hour day month weekday</p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2 flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Timeout (seconds)
                </label>
                <input
                  type="number"
                  value={localConfig.timeout}
                  onChange={(e) => handleConfigUpdate({ timeout: parseInt(e.target.value) || 30 })}
                  className="w-full bg-[#252620] border border-[#3a3b35] rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-feedgod-primary dark:text-feedgod-primary dark:focus:ring-feedgod-primary dark:text-feedgod-primary"
                  min="1"
                  max="300"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Memory (MB)</label>
                <input
                  type="number"
                  value={localConfig.memory}
                  onChange={(e) => handleConfigUpdate({ memory: parseInt(e.target.value) || 512 })}
                  className="w-full bg-[#252620] border border-[#3a3b35] rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-feedgod-primary dark:text-feedgod-primary dark:focus:ring-feedgod-primary dark:text-feedgod-primary"
                  min="128"
                  max="2048"
                  step="128"
                />
              </div>
            </div>

            {/* Chain Selector */}
            <div className="mt-4">
              <ChainSelector
                blockchain={localConfig.blockchain}
                network={localConfig.network}
                onBlockchainChange={(blockchain) => handleConfigUpdate({ blockchain })}
                onNetworkChange={(network) => handleConfigUpdate({ network })}
              />
            </div>
          </div>

          {/* Code Editor */}
          <div className="bg-[#252620]/80 rounded-lg border border-[#3a3b35] p-6 backdrop-blur-sm">
            <h3 className="text-base font-semibold text-white mb-3 flex items-center gap-2">
              <Code2 className="w-5 h-5 text-feedgod-primary dark:text-feedgod-primary" />
              Function Code
            </h3>
            <textarea
              value={localConfig.code}
              onChange={(e) => handleConfigUpdate({ code: e.target.value })}
              className="w-full h-96 bg-[#252620] border border-[#3a3b35] rounded-lg px-4 py-3 text-white font-mono text-sm focus:outline-none focus:ring-2 focus:ring-feedgod-primary dark:text-feedgod-primary dark:focus:ring-feedgod-primary dark:text-feedgod-primary"
              placeholder="// Your function code here..."
            />
          </div>
        </div>

        {/* Right Column - Info & Actions */}
        <div className="space-y-6">
          <div className="bg-[#252620]/80 rounded-lg border border-[#3a3b35] p-6 backdrop-blur-sm">
            <h3 className="text-lg font-semibold text-white mb-4">Function Info</h3>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-400 mb-1">Description</p>
                <textarea
                  value={localConfig.description || ''}
                  onChange={(e) => handleConfigUpdate({ description: e.target.value })}
                  className="w-full bg-[#252620] border border-[#3a3b35] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-feedgod-primary dark:text-feedgod-primary dark:focus:ring-feedgod-primary dark:text-feedgod-primary"
                  placeholder="What does this function do?"
                  rows={3}
                />
              </div>
              <div className="pt-4 border-t border-[#3a3b35]">
                <p className="text-sm text-gray-400 mb-2">Configuration</p>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Language:</span>
                    <span className="text-white font-medium capitalize">{localConfig.language}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Runtime:</span>
                    <span className="text-white font-medium capitalize">{localConfig.runtime}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Trigger:</span>
                    <span className="text-white font-medium capitalize">{localConfig.trigger}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Timeout:</span>
                    <span className="text-white font-medium">{localConfig.timeout}s</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Memory:</span>
                    <span className="text-white font-medium">{localConfig.memory} MB</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleSave}
              className="flex-1 px-4 py-3 bg-feedgod-purple-200 dark:border-feedgod-dark-accent hover:bg-feedgod-purple-300 dark:border-feedgod-dark-accent rounded-lg text-white text-sm font-medium transition-colors flex items-center justify-center gap-2 star-glow-on-hover"
            >
              <Save className="w-4 h-4" />
              Save
            </button>
            <button
              onClick={handleDeploy}
              className="flex-1 px-4 py-3 gradient-bg hover:opacity-90 rounded-lg text-white text-sm font-medium transition-all flex items-center justify-center gap-2 star-glow-on-hover"
            >
              <Play className="w-4 h-4" />
              Deploy
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

