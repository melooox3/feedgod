'use client'

import { useState, useEffect } from 'react'
import { Plus } from 'lucide-react'
import FeedBuilder from '@/components/FeedBuilder'
import FunctionBuilder from '@/components/FunctionBuilder'
import VRFBuilder from '@/components/VRFBuilder'
import SecretBuilder from '@/components/SecretBuilder'
import CommandBar from '@/components/CommandBar'
import TabNavigation from '@/components/TabNavigation'
import Header from '@/components/Header'
import BulkFeedCreator from '@/components/BulkFeedCreator'
import { FeedConfig } from '@/types/feed'
import { FunctionConfig, VRFConfig, SecretConfig, BuilderType } from '@/types/switchboard'

export default function Home() {
  const [activeTab, setActiveTab] = useState<BuilderType>('feed')
  const [feedConfig, setFeedConfig] = useState<FeedConfig | null>(null)
  const [functionConfig, setFunctionConfig] = useState<FunctionConfig | null>(null)
  const [vrfConfig, setVRFConfig] = useState<VRFConfig | null>(null)
  const [secretConfig, setSecretConfig] = useState<SecretConfig | null>(null)
  const [showBulkCreator, setShowBulkCreator] = useState(false)

  // Load config from sessionStorage if available (from profile page)
  useEffect(() => {
    const loadConfig = sessionStorage.getItem('loadConfig')
    if (loadConfig) {
      try {
        const parsed = JSON.parse(loadConfig)
        const type = parsed.type || 'feed'
        
        if (type === 'feed') {
          setFeedConfig({
            ...parsed,
            createdAt: parsed.createdAt ? new Date(parsed.createdAt) : new Date(),
            updatedAt: parsed.updatedAt ? new Date(parsed.updatedAt) : new Date(),
          })
          setActiveTab('feed')
        } else if (type === 'function') {
          setFunctionConfig({
            ...parsed,
            createdAt: parsed.createdAt ? new Date(parsed.createdAt) : new Date(),
            updatedAt: parsed.updatedAt ? new Date(parsed.updatedAt) : new Date(),
          })
          setActiveTab('function')
        } else if (type === 'vrf') {
          setVRFConfig({
            ...parsed,
            createdAt: parsed.createdAt ? new Date(parsed.createdAt) : new Date(),
            updatedAt: parsed.updatedAt ? new Date(parsed.updatedAt) : new Date(),
          })
          setActiveTab('vrf')
        } else if (type === 'secret') {
          setSecretConfig({
            ...parsed,
            createdAt: parsed.createdAt ? new Date(parsed.createdAt) : new Date(),
            updatedAt: parsed.updatedAt ? new Date(parsed.updatedAt) : new Date(),
          })
          setActiveTab('secret')
        }
        
        sessionStorage.removeItem('loadConfig')
      } catch (e) {
        console.error('Error loading config:', e)
      }
    }
  }, [])

  const handleSearch = (query: string) => {
    console.log('Searching for:', query)
    alert(`Searching for: ${query}\n\n(In production, this would search existing Switchboard resources)`)
  }

  const handleBulkFeedsGenerated = (feeds: FeedConfig[]) => {
    // Save all feeds to localStorage
    const savedFeeds = localStorage.getItem('savedFeeds')
    const existingFeeds = savedFeeds ? JSON.parse(savedFeeds) : []
    
    feeds.forEach(feed => {
      const feedToSave = {
        ...feed,
        id: feed.id || `feed-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      existingFeeds.push(feedToSave)
    })
    
    localStorage.setItem('savedFeeds', JSON.stringify(existingFeeds))
    alert(`Successfully created ${feeds.length} feeds! Check your profile to manage them.`)
    setShowBulkCreator(false)
  }

  const renderBuilder = () => {
    switch (activeTab) {
      case 'feed':
        return (
          <FeedBuilder
            config={feedConfig}
            onConfigChange={setFeedConfig}
          />
        )
      case 'function':
        return (
          <FunctionBuilder
            config={functionConfig}
            onConfigChange={setFunctionConfig}
          />
        )
      case 'vrf':
        return (
          <VRFBuilder
            config={vrfConfig}
            onConfigChange={setVRFConfig}
          />
        )
      case 'secret':
        return (
          <SecretBuilder
            config={secretConfig}
            onConfigChange={setSecretConfig}
          />
        )
      default:
        return null
    }
  }

  return (
    <main className="min-h-screen">
      <Header />
      <div className="container mx-auto px-4 py-6">
        <div className="space-y-5">
          {/* Command Bar */}
          <div className="flex items-center gap-2">
            <div className="flex-1 min-w-0">
              <CommandBar
                onFeedGenerated={setFeedConfig}
                onFunctionGenerated={setFunctionConfig}
                onVRFGenerated={setVRFConfig}
                onSecretGenerated={setSecretConfig}
                onSearch={handleSearch}
                activeTab={activeTab}
              />
            </div>
            {activeTab === 'feed' && (
              <button
                onClick={() => setShowBulkCreator(true)}
                className="px-3 py-1.5 bg-feedgod-pink-200 dark:bg-feedgod-dark-secondary hover:bg-feedgod-pink-300 dark:hover:bg-feedgod-dark-accent rounded-lg text-feedgod-dark dark:text-feedgod-neon-cyan text-sm font-medium transition-colors flex items-center gap-2 star-glow-on-hover"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Bulk Create</span>
              </button>
            )}
          </div>

          {/* Tab Navigation */}
          <div className="bg-white/60 dark:bg-feedgod-dark-secondary/80 rounded-lg border border-feedgod-pink-200 dark:border-feedgod-dark-accent backdrop-blur-sm overflow-hidden">
            <TabNavigation activeTab={activeTab} onTabChange={setActiveTab} />
            
            {/* Builder Content */}
            <div className="p-5">
              {renderBuilder()}
            </div>
          </div>
        </div>
      </div>

      {/* Bulk Feed Creator Modal */}
      <BulkFeedCreator
        isOpen={showBulkCreator}
        onClose={() => setShowBulkCreator(false)}
        onFeedsGenerated={handleBulkFeedsGenerated}
      />
    </main>
  )
}
