'use client'

import { useState, useEffect } from 'react'
import { useAppKitAccount } from '@reown/appkit/react'
import { useRouter } from 'next/navigation'
import { Heart, Trash2, Edit, ArrowLeft, Database, Code, Dice6, Key, Target, Cloud, Trophy, Users, Brain, Globe } from 'lucide-react'
import Header from '@/components/Header'
import { FeedConfig } from '@/types/feed'
import { FunctionConfig, VRFConfig, SecretConfig, BuilderType } from '@/types/switchboard'
import { playPickupSound } from '@/lib/sound-utils'

type ProfileTab = 'feed' | 'function' | 'vrf' | 'secret' | 'prediction' | 'weather' | 'sports' | 'social' | 'ai-judge' | 'custom-api'

export default function ProfilePage() {
  const { isConnected } = useAppKitAccount()
  const router = useRouter()
  
  const connected = isConnected
  const [activeTab, setActiveTab] = useState<ProfileTab>('feed')
  const [feeds, setFeeds] = useState<FeedConfig[]>([])
  const [functions, setFunctions] = useState<FunctionConfig[]>([])
  const [vrfs, setVRFs] = useState<VRFConfig[]>([])
  const [secrets, setSecrets] = useState<SecretConfig[]>([])
  const [predictions, setPredictions] = useState<any[]>([])
  const [weather, setWeather] = useState<any[]>([])
  const [sports, setSports] = useState<any[]>([])
  const [social, setSocial] = useState<any[]>([])
  const [aiJudge, setAiJudge] = useState<any[]>([])
  const [customApi, setCustomApi] = useState<any[]>([])
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

    const savedPredictions = localStorage.getItem('savedPredictions')
    if (savedPredictions) {
      try {
        const parsed = JSON.parse(savedPredictions)
        setPredictions(parsed.map((p: any) => ({
          ...p,
          createdAt: p.createdAt ? new Date(p.createdAt) : new Date(),
          updatedAt: p.updatedAt ? new Date(p.updatedAt) : new Date(),
        })))
      } catch (e) {
        console.error('Error loading predictions:', e)
      }
    }

    const savedWeather = localStorage.getItem('savedWeather')
    if (savedWeather) {
      try {
        const parsed = JSON.parse(savedWeather)
        setWeather(parsed.map((w: any) => ({
          ...w,
          createdAt: w.createdAt ? new Date(w.createdAt) : new Date(),
          updatedAt: w.updatedAt ? new Date(w.updatedAt) : new Date(),
        })))
      } catch (e) {
        console.error('Error loading weather:', e)
      }
    }

    const savedSports = localStorage.getItem('savedSports')
    if (savedSports) {
      try {
        const parsed = JSON.parse(savedSports)
        setSports(parsed.map((s: any) => ({
          ...s,
          createdAt: s.createdAt ? new Date(s.createdAt) : new Date(),
          updatedAt: s.updatedAt ? new Date(s.updatedAt) : new Date(),
        })))
      } catch (e) {
        console.error('Error loading sports:', e)
      }
    }

    const savedSocial = localStorage.getItem('savedSocial')
    if (savedSocial) {
      try {
        const parsed = JSON.parse(savedSocial)
        setSocial(parsed.map((s: any) => ({
          ...s,
          createdAt: s.createdAt ? new Date(s.createdAt) : new Date(),
          updatedAt: s.updatedAt ? new Date(s.updatedAt) : new Date(),
        })))
      } catch (e) {
        console.error('Error loading social:', e)
      }
    }

    const savedAiJudge = localStorage.getItem('savedAiJudge')
    if (savedAiJudge) {
      try {
        const parsed = JSON.parse(savedAiJudge)
        setAiJudge(parsed.map((a: any) => ({
          ...a,
          createdAt: a.createdAt ? new Date(a.createdAt) : new Date(),
          updatedAt: a.updatedAt ? new Date(a.updatedAt) : new Date(),
        })))
      } catch (e) {
        console.error('Error loading AI judge:', e)
      }
    }

    const savedCustomApi = localStorage.getItem('savedCustomApi')
    if (savedCustomApi) {
      try {
        const parsed = JSON.parse(savedCustomApi)
        setCustomApi(parsed.map((c: any) => ({
          ...c,
          createdAt: c.createdAt ? new Date(c.createdAt) : new Date(),
          updatedAt: c.updatedAt ? new Date(c.updatedAt) : new Date(),
        })))
      } catch (e) {
        console.error('Error loading custom API:', e)
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
        case 'prediction':
          const updatedPredictions = predictions.filter(p => p.id !== id)
          setPredictions(updatedPredictions)
          localStorage.setItem('savedPredictions', JSON.stringify(updatedPredictions))
          break
        case 'weather':
          const updatedWeather = weather.filter(w => w.id !== id)
          setWeather(updatedWeather)
          localStorage.setItem('savedWeather', JSON.stringify(updatedWeather))
          break
        case 'sports':
          const updatedSports = sports.filter(s => s.id !== id)
          setSports(updatedSports)
          localStorage.setItem('savedSports', JSON.stringify(updatedSports))
          break
        case 'social':
          const updatedSocial = social.filter(s => s.id !== id)
          setSocial(updatedSocial)
          localStorage.setItem('savedSocial', JSON.stringify(updatedSocial))
          break
        case 'ai-judge':
          const updatedAiJudge = aiJudge.filter(a => a.id !== id)
          setAiJudge(updatedAiJudge)
          localStorage.setItem('savedAiJudge', JSON.stringify(updatedAiJudge))
          break
        case 'custom-api':
          const updatedCustomApi = customApi.filter(c => c.id !== id)
          setCustomApi(updatedCustomApi)
          localStorage.setItem('savedCustomApi', JSON.stringify(updatedCustomApi))
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
      case 'prediction':
        const updatedPredictions = predictions.map(p => p.id === id ? { ...p, isFavorite: !p.isFavorite } : p)
        setPredictions(updatedPredictions)
        localStorage.setItem('savedPredictions', JSON.stringify(updatedPredictions))
        break
      case 'weather':
        const updatedWeather = weather.map(w => w.id === id ? { ...w, isFavorite: !w.isFavorite } : w)
        setWeather(updatedWeather)
        localStorage.setItem('savedWeather', JSON.stringify(updatedWeather))
        break
      case 'sports':
        const updatedSports = sports.map(s => s.id === id ? { ...s, isFavorite: !s.isFavorite } : s)
        setSports(updatedSports)
        localStorage.setItem('savedSports', JSON.stringify(updatedSports))
        break
      case 'social':
        const updatedSocial = social.map(s => s.id === id ? { ...s, isFavorite: !s.isFavorite } : s)
        setSocial(updatedSocial)
        localStorage.setItem('savedSocial', JSON.stringify(updatedSocial))
        break
      case 'ai-judge':
        const updatedAiJudge = aiJudge.map(a => a.id === id ? { ...a, isFavorite: !a.isFavorite } : a)
        setAiJudge(updatedAiJudge)
        localStorage.setItem('savedAiJudge', JSON.stringify(updatedAiJudge))
        break
      case 'custom-api':
        const updatedCustomApi = customApi.map(c => c.id === id ? { ...c, isFavorite: !c.isFavorite } : c)
        setCustomApi(updatedCustomApi)
        localStorage.setItem('savedCustomApi', JSON.stringify(updatedCustomApi))
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
      case 'prediction':
        return filter === 'favorites' ? predictions.filter(p => p.isFavorite) : predictions
      case 'weather':
        return filter === 'favorites' ? weather.filter(w => w.isFavorite) : weather
      case 'sports':
        return filter === 'favorites' ? sports.filter(s => s.isFavorite) : sports
      case 'social':
        return filter === 'favorites' ? social.filter(s => s.isFavorite) : social
      case 'ai-judge':
        return filter === 'favorites' ? aiJudge.filter(a => a.isFavorite) : aiJudge
      case 'custom-api':
        return filter === 'favorites' ? customApi.filter(c => c.isFavorite) : customApi
      default:
        return []
    }
  }

  const getTotalCount = () => {
    switch (activeTab) {
      case 'feed': return feeds.length
      case 'function': return functions.length
      case 'vrf': return vrfs.length
      case 'secret': return secrets.length
      case 'prediction': return predictions.length
      case 'weather': return weather.length
      case 'sports': return sports.length
      case 'social': return social.length
      case 'ai-judge': return aiJudge.length
      case 'custom-api': return customApi.length
      default: return 0
    }
  }

  const getFavoriteCount = () => {
    switch (activeTab) {
      case 'feed': return feeds.filter(f => f.isFavorite).length
      case 'function': return functions.filter(f => f.isFavorite).length
      case 'vrf': return vrfs.filter(v => v.isFavorite).length
      case 'secret': return secrets.filter(s => s.isFavorite).length
      case 'prediction': return predictions.filter(p => p.isFavorite).length
      case 'weather': return weather.filter(w => w.isFavorite).length
      case 'sports': return sports.filter(s => s.isFavorite).length
      case 'social': return social.filter(s => s.isFavorite).length
      case 'ai-judge': return aiJudge.filter(a => a.isFavorite).length
      case 'custom-api': return customApi.filter(c => c.isFavorite).length
      default: return 0
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
    { id: 'prediction' as ProfileTab, label: 'Predictions', icon: Target, count: predictions.length },
    { id: 'weather' as ProfileTab, label: 'Weather', icon: Cloud, count: weather.length },
    { id: 'sports' as ProfileTab, label: 'Sports', icon: Trophy, count: sports.length },
    { id: 'social' as ProfileTab, label: 'Social', icon: Users, count: social.length },
    { id: 'ai-judge' as ProfileTab, label: 'AI Judge', icon: Brain, count: aiJudge.length },
    { id: 'custom-api' as ProfileTab, label: 'Custom API', icon: Globe, count: customApi.length },
  ]

  return (
    <main className="min-h-screen">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <button
            onClick={() => router.push('/')}
            className="flex items-center gap-2 text-gray-400 hover:text-feedgod-primary transition-colors mb-4 star-glow-on-hover"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Builder</span>
          </button>
          <h1 className="text-3xl font-bold gradient-text mb-2">My Profile</h1>
          <p className="text-gray-400">
            Manage your saved oracles and configurations
          </p>
        </div>

        {/* Category Tabs */}
        <div className="flex flex-wrap gap-2 mb-4 pb-4 border-b border-[#3a3b35]">
          {TABS.map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => {
                  playPickupSound()
                  setActiveTab(tab.id)
                }}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'gradient-bg text-white'
                    : 'bg-[#252620] text-gray-400 hover:text-white hover:bg-[#2a2b25] border border-[#3a3b35]'
                } star-glow-on-hover`}
              >
                <Icon className="w-4 h-4" />
                <span className="hidden sm:inline">{tab.label}</span>
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
                ? 'gradient-bg text-white'
                : 'bg-[#252620] border border-[#3a3b35] text-gray-400 hover:text-white hover:bg-[#2a2b25]'
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
                ? 'gradient-bg text-white'
                : 'bg-[#252620] border border-[#3a3b35] text-gray-400 hover:text-white hover:bg-[#2a2b25]'
            }`}
          >
            <Heart className={`w-4 h-4 ${filter === 'favorites' ? 'fill-current' : ''}`} />
            Favorites ({getFavoriteCount()})
          </button>
        </div>

        {/* Items Grid */}
        {currentItems.length === 0 ? (
          <div className="bg-[#252620] rounded-lg border border-[#3a3b35] p-12 text-center">
            <p className="text-gray-400 mb-4">No {TABS.find(t => t.id === activeTab)?.label.toLowerCase()} saved yet</p>
            <button
              onClick={() => router.push('/')}
              className="px-6 py-3 gradient-bg hover:opacity-90 rounded-lg text-white font-medium transition-all star-glow-on-hover"
            >
              Create Your First {TABS.find(t => t.id === activeTab)?.label.slice(0, -1)}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {currentItems.map((item: any) => (
              <div
                key={item.id}
                className="bg-[#252620] rounded-lg border border-[#3a3b35] p-6 hover:border-feedgod-primary/50 transition-colors"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="text-lg font-bold gradient-text mb-1">
                      {item.symbol || item.name || item.question || 'Untitled'}
                    </h3>
                    <p className="text-sm text-gray-400">{item.name || item.description || item.city?.name || item.platform || ''}</p>
                  </div>
                  <button
                    onClick={() => toggleFavorite(item.id, activeTab)}
                    className={`p-2 rounded-lg transition-colors star-glow-on-hover ${
                      item.isFavorite
                        ? 'text-feedgod-primary'
                        : 'text-gray-500 hover:text-feedgod-primary'
                    }`}
                  >
                    <Heart className={`w-5 h-5 ${item.isFavorite ? 'fill-current' : ''}`} />
                  </button>
                </div>

                <div className="space-y-2 mb-4">
                  {item.blockchain && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">Blockchain</span>
                      <span className="text-white font-medium capitalize">{item.blockchain}</span>
                    </div>
                  )}
                  {item.network && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">Network</span>
                      <span className="text-white font-medium capitalize">{item.network}</span>
                    </div>
                  )}
                  {item.dataSources && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">Sources</span>
                      <span className="text-white font-medium">{item.dataSources.length}</span>
                    </div>
                  )}
                  {item.updateInterval && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">Update Interval</span>
                      <span className="text-white font-medium">{item.updateInterval}s</span>
                    </div>
                  )}
                  {item.language && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">Language</span>
                      <span className="text-white font-medium capitalize">{item.language}</span>
                    </div>
                  )}
                  {item.type && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">Type</span>
                      <span className="text-white font-medium capitalize">{item.type.replace('_', ' ')}</span>
                    </div>
                  )}
                  {item.city && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">City</span>
                      <span className="text-white font-medium">{item.city.name}, {item.city.country}</span>
                    </div>
                  )}
                  {item.metric && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">Metric</span>
                      <span className="text-white font-medium capitalize">{item.metric.replace('_', ' ')}</span>
                    </div>
                  )}
                  {item.platform && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">Platform</span>
                      <span className="text-white font-medium capitalize">{item.platform}</span>
                    </div>
                  )}
                  {item.username && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">Username</span>
                      <span className="text-white font-medium">@{item.username}</span>
                    </div>
                  )}
                  {item.question && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">Question</span>
                      <span className="text-white font-medium truncate max-w-[150px]">{item.question}</span>
                    </div>
                  )}
                  {item.endpoint && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">Endpoint</span>
                      <span className="text-white font-medium truncate max-w-[150px]">{item.endpoint}</span>
                    </div>
                  )}
                </div>

                <div className="flex gap-2 pt-4 border-t border-[#3a3b35]">
                  <button
                    onClick={() => loadItem(item, activeTab)}
                    className="flex-1 px-3 py-2 gradient-bg hover:opacity-90 rounded-lg text-white text-sm font-medium transition-all flex items-center justify-center gap-2 star-glow-on-hover"
                  >
                    <Edit className="w-4 h-4" />
                    Edit
                  </button>
                  <button
                    onClick={() => deleteItem(item.id, activeTab)}
                    className="px-3 py-2 bg-[#2a2b25] border border-[#3a3b35] hover:bg-red-900/30 hover:border-red-500/50 rounded-lg text-red-400 text-sm font-medium transition-colors star-glow-on-hover"
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
