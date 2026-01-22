'use client'

import { useState, useEffect } from 'react'
import { Play, Save, Settings, Key, Eye, EyeOff } from 'lucide-react'
import { SecretConfig } from '@/types/switchboard'
import { playPickupSound } from '@/lib/sound-utils'
import { useToast } from './Toast'
import ChainSelector from './ChainSelector'

interface SecretBuilderProps {
  config: SecretConfig | null
  onConfigChange: (config: SecretConfig) => void
}

export default function SecretBuilder({ config, onConfigChange }: SecretBuilderProps) {
  const [localConfig, setLocalConfig] = useState<SecretConfig | null>(config)
  const [showValue, setShowValue] = useState(false)
  const toast = useToast()

  useEffect(() => {
    if (config) {
      setLocalConfig(config)
    } else {
      const defaultConfig: SecretConfig = {
        name: 'My Secret',
        description: '',
        key: 'API_KEY',
        value: '',
        type: 'api_key',
        scope: 'global',
        associatedResources: [],
        blockchain: 'solana',
        network: 'mainnet',
        enabled: true,
      }
      setLocalConfig(defaultConfig)
      onConfigChange(defaultConfig)
    }
  }, [config, onConfigChange])

  const handleConfigUpdate = (updates: Partial<SecretConfig>) => {
    if (!localConfig) return
    const updated = { ...localConfig, ...updates }
    setLocalConfig(updated)
    onConfigChange(updated)
  }

  const handleSave = async () => {
    if (!localConfig) return
    playPickupSound()
    const secretToSave: SecretConfig = {
      ...localConfig,
      id: localConfig.id || `secret-${Date.now()}`,
      updatedAt: new Date(),
      createdAt: localConfig.createdAt || new Date(),
    }
    
    const savedSecrets = localStorage.getItem('savedSecrets')
    const secrets = savedSecrets ? JSON.parse(savedSecrets) : []
    const existingIndex = secrets.findIndex((s: SecretConfig) => s.id === secretToSave.id)
    
    if (existingIndex >= 0) {
      secrets[existingIndex] = secretToSave
    } else {
      secrets.push(secretToSave)
    }
    
    localStorage.setItem('savedSecrets', JSON.stringify(secrets))
    toast.success('Secret saved! Check your profile to manage saved secrets.')
  }

  const handleDeploy = async () => {
    playPickupSound()
    if (!localConfig) return
    console.log('Deploying secret:', localConfig)
    toast.success('Secret deployed! (Demo - in production, this would deploy to Switchboard)')
  }

  if (!localConfig) {
    return (
      <div className="bg-feedgod-pink-50 dark:bg-feedgod-dark-secondary rounded-lg border border-feedgod-pink-200 dark:border-feedgod-dark-accent p-12 text-center">
        <div className="text-xl font-semibold text-feedgod-primary mb-2">Loading Secret Builder...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Module Header */}
      <div className="bg-white/60 dark:bg-feedgod-dark-secondary/80 rounded-lg border border-feedgod-pink-200 dark:border-feedgod-dark-accent p-6 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center">
            <Key className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-feedgod-primary dark:text-feedgod-neon-pink">
              Secret Builder
            </h2>
            <p className="text-sm text-feedgod-pink-500 dark:text-feedgod-neon-cyan/70">
              Securely store and manage API keys and sensitive data for your oracle functions
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Configuration */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white/60 dark:bg-feedgod-dark-secondary/80 rounded-lg border border-feedgod-pink-200 dark:border-feedgod-dark-accent p-6 backdrop-blur-sm">
            <h3 className="text-lg font-semibold text-feedgod-dark mb-4 flex items-center gap-2">
              <Settings className="w-5 h-5 text-feedgod-primary" />
              Secret Configuration
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-feedgod-pink-500 mb-2">Secret Name</label>
                <input
                  type="text"
                  value={localConfig.name}
                  onChange={(e) => handleConfigUpdate({ name: e.target.value })}
                  className="w-full bg-feedgod-pink-50 dark:bg-feedgod-dark-secondary border border-feedgod-pink-200 dark:border-feedgod-dark-accent rounded-lg px-4 py-2 text-feedgod-dark dark:text-feedgod-neon-cyan focus:outline-none focus:ring-2 focus:ring-feedgod-primary dark:focus:ring-feedgod-neon-pink"
                  placeholder="My Secret"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-feedgod-pink-500 mb-2">Key Name</label>
                <input
                  type="text"
                  value={localConfig.key}
                  onChange={(e) => handleConfigUpdate({ key: e.target.value })}
                  className="w-full bg-feedgod-pink-50 dark:bg-feedgod-dark-secondary border border-feedgod-pink-200 dark:border-feedgod-dark-accent rounded-lg px-4 py-2 text-feedgod-dark dark:text-feedgod-neon-cyan focus:outline-none focus:ring-2 focus:ring-feedgod-primary dark:focus:ring-feedgod-neon-pink font-mono text-sm"
                  placeholder="API_KEY"
                />
                <p className="text-xs text-feedgod-pink-500 mt-1">Environment variable name</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-feedgod-pink-500 mb-2">Secret Type</label>
                <select
                  value={localConfig.type}
                  onChange={(e) => handleConfigUpdate({ type: e.target.value as SecretConfig['type'] })}
                  className="w-full bg-feedgod-pink-50 dark:bg-feedgod-dark-secondary border border-feedgod-pink-200 dark:border-feedgod-dark-accent rounded-lg px-4 py-2 text-feedgod-dark dark:text-feedgod-neon-cyan focus:outline-none focus:ring-2 focus:ring-feedgod-primary dark:focus:ring-feedgod-neon-pink"
                >
                  <option value="api_key">API Key</option>
                  <option value="private_key">Private Key</option>
                  <option value="webhook_url">Webhook URL</option>
                  <option value="database_url">Database URL</option>
                  <option value="custom">Custom</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-feedgod-pink-500 mb-2">Scope</label>
                <select
                  value={localConfig.scope}
                  onChange={(e) => handleConfigUpdate({ scope: e.target.value as SecretConfig['scope'] })}
                  className="w-full bg-feedgod-pink-50 dark:bg-feedgod-dark-secondary border border-feedgod-pink-200 dark:border-feedgod-dark-accent rounded-lg px-4 py-2 text-feedgod-dark dark:text-feedgod-neon-cyan focus:outline-none focus:ring-2 focus:ring-feedgod-primary dark:focus:ring-feedgod-neon-pink"
                >
                  <option value="global">Global</option>
                  <option value="function">Function Only</option>
                  <option value="feed">Feed Only</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-feedgod-pink-500 mb-2">Secret Value</label>
                <div className="relative">
                  <input
                    type={showValue ? 'text' : 'password'}
                    value={localConfig.value}
                    onChange={(e) => handleConfigUpdate({ value: e.target.value })}
                    className="w-full bg-feedgod-pink-50 dark:bg-feedgod-dark-secondary border border-feedgod-pink-200 dark:border-feedgod-dark-accent rounded-lg px-4 py-2 pr-10 text-feedgod-dark dark:text-feedgod-neon-cyan focus:outline-none focus:ring-2 focus:ring-feedgod-primary dark:focus:ring-feedgod-neon-pink font-mono text-sm"
                    placeholder="Enter your secret value..."
                  />
                  <button
                    type="button"
                    onClick={() => setShowValue(!showValue)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-feedgod-pink-500 hover:text-feedgod-primary transition-colors star-glow-on-hover"
                  >
                    {showValue ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-xs text-feedgod-pink-500 dark:text-feedgod-neon-cyan/70 mt-1">⚠️ This value will be encrypted when saved</p>
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
        </div>

        {/* Right Column - Info & Actions */}
        <div className="space-y-6">
          <div className="bg-white/60 dark:bg-feedgod-dark-secondary/80 rounded-lg border border-feedgod-pink-200 dark:border-feedgod-dark-accent p-6 backdrop-blur-sm">
            <h3 className="text-base font-semibold text-feedgod-dark mb-3 flex items-center gap-2">
              <Key className="w-5 h-5 text-feedgod-primary" />
              Secret Info
            </h3>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-feedgod-pink-500 mb-1">Description</p>
                <textarea
                  value={localConfig.description || ''}
                  onChange={(e) => handleConfigUpdate({ description: e.target.value })}
                  className="w-full bg-feedgod-pink-50 dark:bg-feedgod-dark-secondary border border-feedgod-pink-200 dark:border-feedgod-dark-accent rounded-lg px-3 py-2 text-sm text-feedgod-dark dark:text-feedgod-neon-cyan focus:outline-none focus:ring-2 focus:ring-feedgod-primary dark:focus:ring-feedgod-neon-pink"
                  placeholder="What is this secret used for?"
                  rows={3}
                />
              </div>
              <div className="pt-4 border-t border-feedgod-pink-200 dark:border-feedgod-dark-accent">
                <p className="text-sm text-feedgod-pink-500 dark:text-feedgod-neon-cyan/70 mb-2">Configuration</p>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-feedgod-pink-500 dark:text-feedgod-neon-cyan/70">Type:</span>
                    <span className="text-feedgod-dark dark:text-feedgod-neon-cyan font-medium capitalize">{localConfig.type.replace('_', ' ')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-feedgod-pink-500 dark:text-feedgod-neon-cyan/70">Scope:</span>
                    <span className="text-feedgod-dark dark:text-feedgod-neon-cyan font-medium capitalize">{localConfig.scope}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-feedgod-pink-500 dark:text-feedgod-neon-cyan/70">Key:</span>
                    <span className="text-feedgod-dark dark:text-feedgod-neon-cyan font-medium font-mono text-xs">{localConfig.key}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleSave}
              className="flex-1 px-4 py-3 bg-feedgod-pink-200 hover:bg-feedgod-pink-300 rounded-lg text-feedgod-dark text-sm font-medium transition-colors flex items-center justify-center gap-2 star-glow-on-hover"
            >
              <Save className="w-4 h-4" />
              Save
            </button>
            <button
              onClick={handleDeploy}
              className="flex-1 px-4 py-3 bg-feedgod-primary hover:bg-feedgod-secondary rounded-lg text-white text-sm font-medium transition-colors flex items-center justify-center gap-2 star-glow-on-hover"
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

