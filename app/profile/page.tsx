'use client'

import { useState, useEffect } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import { useEVMWallet } from '@/lib/evm-wallet-provider'
import { useRouter } from 'next/navigation'
import { Heart, Trash2, Edit, ArrowLeft, Database, Code, Dice6, Key } from 'lucide-react'
import Header from '@/components/Header'
import { FeedConfig } from '@/types/feed'
import { FunctionConfig, VRFConfig, SecretConfig, BuilderType } from '@/types/switchboard'
import { playPickupSound } from '@/lib/sound-utils'

type ProfileTab = 'feed' | 'function' | 'vrf' | 'secret'

export default function ProfilePage() {
  const solanaWallet = useWallet()
  const evmWallet = useEVMWallet()
  const router = useRouter()
  
  const connected = solanaWallet.connected || evmWallet.isConnected
  const [activeTab, setActiveTab] = useState<ProfileTab>('feed')
  const [feeds, setFeeds] = useState<FeedConfig[]>([])
  const [functions, setFunctions] = useState<FunctionConfig[]>([])
  const [vrfs, setVRFs] = useState<VRFConfig[]>([])
  const [secrets, setSecrets] = useState<SecretConfig[]>([])
  const [filter, setFilter] = useState<'all' | 'favorites'>('all')

  useEffect(() => {
    if (!connected) {
      router.push('/')
      return
    }

    // Load all saved items from localStorage
    const savedFeeds = localStorage.getItem('savedFeeds')
    if (savedFeeds) {
      try {
        const parsed = JSON.parse(savedFeeds)
        setFeeds(parsed.map((f: any) => ({
          ...f,
          createdAt: f.createdAt ? new Date(f.createdAt) : new Date(),
          updatedAt: f.updatedAt ? new Date(f.updatedAt) : new Date(),
        })))
      } catch (e) {
        console.error('Error loading feeds:', e)
      }
    }

    const savedFunctions = localStorage.getItem('savedFunctions')
    if (savedFunctions) {
      try {
        const parsed = JSON.parse(savedFunctions)
        setFunctions(parsed.map((f: any) => ({
          ...f,
          createdAt: f.createdAt ? new Date(f.createdAt) : new Date(),
          updatedAt: f.updatedAt ? new Date(f.updatedAt) : new Date(),
        })))
      } catch (e) {
        console.error('Error loading functions:', e)
      }
    }

    const savedVRFs = localStorage.getItem('savedVRFs')
    if (savedVRFs) {
      try {
        const parsed = JSON.parse(savedVRFs)
        setVRFs(parsed.map((v: any) => ({
          ...v,
          createdAt: v.createdAt ? new Date(v.createdAt) : new Date(),
          updatedAt: v.updatedAt ? new Date(v.updatedAt) : new Date(),
        })))
      } catch (e) {
        console.error('Error loading VRFs:', e)
      }
    }

    const savedSecrets = localStorage.getItem('savedSecrets')
    if (savedSecrets) {
      try {
        const parsed = JSON.parse(savedSecrets)
        setSecrets(parsed.map((s: any) => ({
          ...s,
          createdAt: s.createdAt ? new Date(s.createdAt) : new Date(),
          updatedAt: s.updatedAt ? new Date(s.updatedAt) : new Date(),
        })))
      } catch (e) {
        console.error('Error loading secrets:', e)
      }
    }
  }, [connected, router])

  const loadItem = (item: any, type: BuilderType) => {
    sessionStorage.setItem('loadConfig', JSON.stringify({ ...item, type }))
    router.push('/')
  }

  const deleteItem = (id: string, type: ProfileTab) => {
    if (confirm('Are you sure you want to delete this item?')) {
      switch (type) {
        case 'feed':
          const updatedFeeds = feeds.filter(f => f.id !== id)
          setFeeds(updatedFeeds)
          localStorage.setItem('savedFeeds', JSON.stringify(updatedFeeds))
          break
        case 'function':
          const updatedFunctions = functions.filter(f => f.id !== id)
          setFunctions(updatedFunctions)
          localStorage.setItem('savedFunctions', JSON.stringify(updatedFunctions))
          break
        case 'vrf':
          const updatedVRFs = vrfs.filter(v => v.id !== id)
          setVRFs(updatedVRFs)
          localStorage.setItem('savedVRFs', JSON.stringify(updatedVRFs))
          break
        case 'secret':
          const updatedSecrets = secrets.filter(s => s.id !== id)
          setSecrets(updatedSecrets)
          localStorage.setItem('savedSecrets', JSON.stringify(updatedSecrets))
          break
      }
    }
  }

  const toggleFavorite = (id: string, type: ProfileTab) => {
    switch (type) {
      case 'feed':
        const updatedFeeds = feeds.map(f => f.id === id ? { ...f, isFavorite: !f.isFavorite } : f)
        setFeeds(updatedFeeds)
        localStorage.setItem('savedFeeds', JSON.stringify(updatedFeeds))
        break
      case 'function':
        const updatedFunctions = functions.map(f => f.id === id ? { ...f, isFavorite: !f.isFavorite } : f)
        setFunctions(updatedFunctions)
        localStorage.setItem('savedFunctions', JSON.stringify(updatedFunctions))
        break
      case 'vrf':
        const updatedVRFs = vrfs.map(v => v.id === id ? { ...v, isFavorite: !v.isFavorite } : v)
        setVRFs(updatedVRFs)
        localStorage.setItem('savedVRFs', JSON.stringify(updatedVRFs))
        break
      case 'secret':
        const updatedSecrets = secrets.map(s => s.id === id ? { ...s, isFavorite: !s.isFavorite } : s)
        setSecrets(updatedSecrets)
        localStorage.setItem('savedSecrets', JSON.stringify(updatedSecrets))
        break
    }
  }

  const getCurrentItems = () => {
    switch (activeTab) {
      case 'feed':
        return filter === 'favorites' ? feeds.filter(f => f.isFavorite) : feeds
      case 'function':
        return filter === 'favorites' ? functions.filter(f => f.isFavorite) : functions
      case 'vrf':
        return filter === 'favorites' ? vrfs.filter(v => v.isFavorite) : vrfs
      case 'secret':
        return filter === 'favorites' ? secrets.filter(s => s.isFavorite) : secrets
    }
  }

  const getTotalCount = () => {
    switch (activeTab) {
      case 'feed': return feeds.length
      case 'function': return functions.length
      case 'vrf': return vrfs.length
      case 'secret': return secrets.length
    }
  }

  const getFavoriteCount = () => {
    switch (activeTab) {
      case 'feed': return feeds.filter(f => f.isFavorite).length
      case 'function': return functions.filter(f => f.isFavorite).length
      case 'vrf': return vrfs.filter(v => v.isFavorite).length
      case 'secret': return secrets.filter(s => s.isFavorite).length
    }
  }

  const currentItems = getCurrentItems()

  if (!connected) {
    return null
  }

  const TABS = [
    { id: 'feed' as ProfileTab, label: 'Feeds', icon: Database, count: feeds.length },
    { id: 'function' as ProfileTab, label: 'Functions', icon: Code, count: functions.length },
    { id: 'vrf' as ProfileTab, label: 'VRF', icon: Dice6, count: vrfs.length },
    { id: 'secret' as ProfileTab, label: 'Secrets', icon: Key, count: secrets.length },
  ]

  return (
    <main className="min-h-screen">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <button
            onClick={() => router.push('/')}
            className="flex items-center gap-2 text-feedgod-pink-500 dark:text-feedgod-neon-cyan hover:text-feedgod-primary dark:hover:text-feedgod-neon-pink transition-colors mb-4 star-glow-on-hover"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Builder</span>
          </button>
          <h1 className="text-3xl font-bold text-feedgod-primary dark:text-feedgod-neon-pink mb-2">My Profile</h1>
          <p className="text-feedgod-pink-500 dark:text-feedgod-neon-cyan">
            Manage your saved items
          </p>
        </div>

        {/* Category Tabs */}
        <div className="flex gap-2 mb-4 border-b border-feedgod-pink-200 dark:border-feedgod-dark-accent">
          {TABS.map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => {
                  playPickupSound()
                  setActiveTab(tab.id)
                }}
                className={`flex items-center gap-2 px-4 py-3 rounded-t-lg text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'bg-feedgod-pink-50 dark:bg-feedgod-dark-secondary text-feedgod-primary dark:text-feedgod-neon-pink border-b-2 border-feedgod-primary dark:border-feedgod-neon-pink'
                    : 'text-feedgod-pink-500 dark:text-feedgod-neon-cyan hover:text-feedgod-primary dark:hover:text-feedgod-neon-pink hover:bg-feedgod-pink-50/50 dark:hover:bg-feedgod-dark-secondary/50'
                } star-glow-on-hover`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
                <span className="text-xs opacity-75">({tab.count})</span>
              </button>
            )
          })}
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => {
              playPickupSound()
              setFilter('all')
            }}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors star-glow-on-hover ${
              filter === 'all'
                ? 'bg-feedgod-primary dark:bg-feedgod-neon-pink text-white'
                : 'bg-feedgod-pink-100 dark:bg-feedgod-dark-secondary text-feedgod-dark dark:text-feedgod-neon-cyan hover:bg-feedgod-pink-200 dark:hover:bg-feedgod-dark-accent'
            }`}
          >
            All ({getTotalCount()})
          </button>
          <button
            onClick={() => {
              playPickupSound()
              setFilter('favorites')
            }}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 star-glow-on-hover ${
              filter === 'favorites'
                ? 'bg-feedgod-primary dark:bg-feedgod-neon-pink text-white'
                : 'bg-feedgod-pink-100 dark:bg-feedgod-dark-secondary text-feedgod-dark dark:text-feedgod-neon-cyan hover:bg-feedgod-pink-200 dark:hover:bg-feedgod-dark-accent'
            }`}
          >
            <Heart className={`w-4 h-4 ${filter === 'favorites' ? 'fill-current' : ''}`} />
            Favorites ({getFavoriteCount()})
          </button>
        </div>

        {/* Items Grid */}
        {currentItems.length === 0 ? (
          <div className="bg-white/60 dark:bg-feedgod-dark-secondary/60 rounded-lg border border-feedgod-pink-200 dark:border-feedgod-dark-accent p-12 text-center backdrop-blur-sm">
            <p className="text-feedgod-pink-500 dark:text-feedgod-neon-cyan mb-4">No {TABS.find(t => t.id === activeTab)?.label.toLowerCase()} saved yet</p>
            <button
              onClick={() => router.push('/')}
              className="px-6 py-3 bg-feedgod-primary dark:bg-feedgod-neon-pink hover:bg-feedgod-secondary dark:hover:bg-feedgod-neon-cyan rounded-lg text-white font-medium transition-colors star-glow-on-hover"
            >
              Create Your First {TABS.find(t => t.id === activeTab)?.label.slice(0, -1)}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {currentItems.map((item: any) => (
              <div
                key={item.id}
                className="bg-white/60 dark:bg-feedgod-dark-secondary/60 rounded-lg border border-feedgod-pink-200 dark:border-feedgod-dark-accent p-6 backdrop-blur-sm hover:border-feedgod-primary dark:hover:border-feedgod-neon-pink transition-colors"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-feedgod-primary dark:text-feedgod-neon-pink mb-1">
                      {item.symbol || item.name}
                    </h3>
                    <p className="text-sm text-feedgod-dark dark:text-feedgod-neon-cyan">{item.name || item.description}</p>
                  </div>
                  <button
                    onClick={() => toggleFavorite(item.id, activeTab)}
                    className={`p-2 rounded-lg transition-colors star-glow-on-hover ${
                      item.isFavorite
                        ? 'text-feedgod-primary dark:text-feedgod-neon-pink'
                        : 'text-feedgod-pink-400 dark:text-feedgod-neon-cyan/50 hover:text-feedgod-primary dark:hover:text-feedgod-neon-pink'
                    }`}
                  >
                    <Heart className={`w-5 h-5 ${item.isFavorite ? 'fill-current' : ''}`} />
                  </button>
                </div>

                <div className="space-y-2 mb-4">
                  {item.blockchain && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-feedgod-pink-500 dark:text-feedgod-neon-cyan">Blockchain</span>
                      <span className="text-feedgod-dark dark:text-feedgod-neon-cyan font-medium capitalize">{item.blockchain}</span>
                    </div>
                  )}
                  {item.network && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-feedgod-pink-500 dark:text-feedgod-neon-cyan">Network</span>
                      <span className="text-feedgod-dark dark:text-feedgod-neon-cyan font-medium capitalize">{item.network}</span>
                    </div>
                  )}
                  {item.dataSources && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-feedgod-pink-500 dark:text-feedgod-neon-cyan">Sources</span>
                      <span className="text-feedgod-dark dark:text-feedgod-neon-cyan font-medium">{item.dataSources.length}</span>
                    </div>
                  )}
                  {item.updateInterval && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-feedgod-pink-500 dark:text-feedgod-neon-cyan">Update Interval</span>
                      <span className="text-feedgod-dark dark:text-feedgod-neon-cyan font-medium">{item.updateInterval}s</span>
                    </div>
                  )}
                  {item.language && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-feedgod-pink-500 dark:text-feedgod-neon-cyan">Language</span>
                      <span className="text-feedgod-dark dark:text-feedgod-neon-cyan font-medium capitalize">{item.language}</span>
                    </div>
                  )}
                  {item.type && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-feedgod-pink-500 dark:text-feedgod-neon-cyan">Type</span>
                      <span className="text-feedgod-dark dark:text-feedgod-neon-cyan font-medium capitalize">{item.type.replace('_', ' ')}</span>
                    </div>
                  )}
                </div>

                <div className="flex gap-2 pt-4 border-t border-feedgod-pink-200 dark:border-feedgod-dark-accent">
                  <button
                    onClick={() => loadItem(item, activeTab)}
                    className="flex-1 px-3 py-2 bg-feedgod-primary dark:bg-feedgod-neon-pink hover:bg-feedgod-secondary dark:hover:bg-feedgod-neon-cyan rounded-lg text-white text-sm font-medium transition-colors flex items-center justify-center gap-2 star-glow-on-hover"
                  >
                    <Edit className="w-4 h-4" />
                    Edit
                  </button>
                  <button
                    onClick={() => deleteItem(item.id, activeTab)}
                    className="px-3 py-2 bg-feedgod-pink-100 dark:bg-feedgod-dark-accent hover:bg-feedgod-pink-200 dark:hover:bg-feedgod-dark-secondary rounded-lg text-red-600 dark:text-red-400 text-sm font-medium transition-colors star-glow-on-hover"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
