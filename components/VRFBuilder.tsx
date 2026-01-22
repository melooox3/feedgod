'use client'

import { useState, useEffect } from 'react'
import { Play, Save, Settings, Dice6, Hash } from 'lucide-react'
import { VRFConfig } from '@/types/switchboard'
import { playPickupSound } from '@/lib/sound-utils'
import ChainSelector from './ChainSelector'

interface VRFBuilderProps {
  config: VRFConfig | null
  onConfigChange: (config: VRFConfig) => void
}

export default function VRFBuilder({ config, onConfigChange }: VRFBuilderProps) {
  const [localConfig, setLocalConfig] = useState<VRFConfig | null>(config)

  useEffect(() => {
    if (config) {
      setLocalConfig(config)
    } else {
      const defaultConfig: VRFConfig = {
        name: 'My VRF',
        description: '',
        min: 0,
        max: 100,
        numWords: 1,
        batchSize: 1,
        blockchain: 'solana',
        network: 'mainnet',
        enabled: true,
      }
      setLocalConfig(defaultConfig)
      onConfigChange(defaultConfig)
    }
  }, [config, onConfigChange])

  const handleConfigUpdate = (updates: Partial<VRFConfig>) => {
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
    const vrfToSave: VRFConfig = {
      ...localConfig,
      id: localConfig.id || `vrf-${Date.now()}`,
      updatedAt: new Date(),
      createdAt: localConfig.createdAt || new Date(),
    }
    
    const savedVRFs = localStorage.getItem('savedVRFs')
    const vrfs = savedVRFs ? JSON.parse(savedVRFs) : []
    const existingIndex = vrfs.findIndex((v: VRFConfig) => v.id === vrfToSave.id)
    
    if (existingIndex >= 0) {
      vrfs[existingIndex] = vrfToSave
    } else {
      vrfs.push(vrfToSave)
    }
    
    localStorage.setItem('savedVRFs', JSON.stringify(vrfs))
    alert('VRF saved! Check your profile to manage saved VRFs.')
  }

  const handleDeploy = async () => {
    playPickupSound()
    if (!localConfig) return
    console.log('Deploying VRF:', localConfig)
    alert('VRF deployed! (This is a demo - in production, this would deploy to Switchboard)')
  }

  if (!localConfig) {
    return (
      <div className="bg-[#252620] rounded-lg border border-[#3a3b35] p-12 text-center">
        <div className="text-xl font-semibold text-feedgod-primary dark:text-feedgod-primary mb-2">Loading VRF Builder...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Module Header */}
      <div className="bg-[#252620]/80 rounded-lg border border-[#3a3b35] p-6 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-orange-500 flex items-center justify-center">
            <Dice6 className="w-4 h-4 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">
              VRF Builder
            </h2>
            <p className="text-sm text-gray-400">
              Generate verifiable random numbers for games, NFTs, and fair selection mechanisms
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
              VRF Configuration
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">VRF Name</label>
                <input
                  type="text"
                  value={localConfig.name}
                  onChange={(e) => handleConfigUpdate({ name: e.target.value })}
                  className="w-full bg-[#252620] border border-[#3a3b35] rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-feedgod-primary dark:text-feedgod-primary dark:focus:ring-feedgod-primary dark:text-feedgod-primary"
                  placeholder="My VRF"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2 flex items-center gap-2">
                  <Hash className="w-4 h-4" />
                  Number of Words
                </label>
                <input
                  type="number"
                  value={localConfig.numWords || 1}
                  onChange={(e) => handleConfigUpdate({ numWords: parseInt(e.target.value) || 1 })}
                  className="w-full bg-[#252620] border border-[#3a3b35] rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-feedgod-primary dark:text-feedgod-primary dark:focus:ring-feedgod-primary dark:text-feedgod-primary"
                  min="1"
                  max="10"
                />
                <p className="text-xs text-gray-400 mt-1">Number of random values to generate</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Minimum Value</label>
                <input
                  type="number"
                  value={localConfig.min || 0}
                  onChange={(e) => handleConfigUpdate({ min: parseInt(e.target.value) || 0 })}
                  className="w-full bg-[#252620] border border-[#3a3b35] rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-feedgod-primary dark:text-feedgod-primary dark:focus:ring-feedgod-primary dark:text-feedgod-primary"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Maximum Value</label>
                <input
                  type="number"
                  value={localConfig.max || 100}
                  onChange={(e) => handleConfigUpdate({ max: parseInt(e.target.value) || 100 })}
                  className="w-full bg-[#252620] border border-[#3a3b35] rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-feedgod-primary dark:text-feedgod-primary dark:focus:ring-feedgod-primary dark:text-feedgod-primary"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Batch Size</label>
                <input
                  type="number"
                  value={localConfig.batchSize || 1}
                  onChange={(e) => handleConfigUpdate({ batchSize: parseInt(e.target.value) || 1 })}
                  className="w-full bg-[#252620] border border-[#3a3b35] rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-feedgod-primary dark:text-feedgod-primary dark:focus:ring-feedgod-primary dark:text-feedgod-primary"
                  min="1"
                  max="100"
                />
                <p className="text-xs text-gray-400 mt-1">Number of requests to batch together</p>
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

            {/* Advanced Settings */}
            <div className="mt-6 pt-6 border-t border-[#3a3b35]">
              <h4 className="text-sm font-medium text-white mb-4">Advanced Settings</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Callback Program ID</label>
                  <input
                    type="text"
                    value={localConfig.callbackProgramId || ''}
                    onChange={(e) => handleConfigUpdate({ callbackProgramId: e.target.value })}
                    className="w-full bg-[#252620] border border-[#3a3b35] rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-feedgod-primary dark:text-feedgod-primary dark:focus:ring-feedgod-primary dark:text-feedgod-primary font-mono text-sm"
                    placeholder="Program ID to callback"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Authority</label>
                  <input
                    type="text"
                    value={localConfig.authority || ''}
                    onChange={(e) => handleConfigUpdate({ authority: e.target.value })}
                    className="w-full bg-[#252620] border border-[#3a3b35] rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-feedgod-primary dark:text-feedgod-primary dark:focus:ring-feedgod-primary dark:text-feedgod-primary font-mono text-sm"
                    placeholder="Authority address"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Info & Actions */}
        <div className="space-y-6">
          <div className="bg-[#252620]/80 rounded-lg border border-[#3a3b35] p-6 backdrop-blur-sm">
            <h3 className="text-base font-semibold text-white mb-3 flex items-center gap-2">
              <Dice6 className="w-5 h-5 text-feedgod-primary dark:text-feedgod-primary" />
              VRF Info
            </h3>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-400 mb-1">Description</p>
                <textarea
                  value={localConfig.description || ''}
                  onChange={(e) => handleConfigUpdate({ description: e.target.value })}
                  className="w-full bg-[#252620] border border-[#3a3b35] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-feedgod-primary dark:text-feedgod-primary dark:focus:ring-feedgod-primary dark:text-feedgod-primary"
                  placeholder="What is this VRF used for?"
                  rows={3}
                />
              </div>
              <div className="pt-4 border-t border-[#3a3b35]">
                <p className="text-sm text-gray-400 mb-2">Configuration</p>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Range:</span>
                    <span className="text-white font-medium">{localConfig.min || 0} - {localConfig.max || 100}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Words:</span>
                    <span className="text-white font-medium">{localConfig.numWords || 1}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Batch Size:</span>
                    <span className="text-white font-medium">{localConfig.batchSize || 1}</span>
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

