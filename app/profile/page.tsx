'use client'

import { useState, useEffect } from 'react'
import { useAppKitAccount } from '@reown/appkit/react'
import { useRouter } from 'next/navigation'
import { Heart, Trash2, Edit, ArrowLeft, Database, Code, Dice6, Key, Target, Cloud, Trophy, Users, Brain, Globe, LayoutGrid, LucideIcon } from 'lucide-react'
import Header from '@/components/Header'
import { FeedConfig } from '@/types/feed'
import { FunctionConfig, VRFConfig, SecretConfig, BuilderType } from '@/types/switchboard'
import { playPickupSound } from '@/lib/sound-utils'

type ProfileTab = 'all' | 'feed' | 'function' | 'vrf' | 'secret' | 'prediction' | 'weather' | 'sports' | 'social' | 'ai-judge' | 'custom-api'

// Category colors for visual differentiation
const CATEGORY_COLORS: Record<string, { bg: string; border: string; text: string; badge: string }> = {
  feed: { bg: 'bg-blue-500/10', border: 'border-blue-500/30', text: 'text-blue-400', badge: 'bg-blue-500' },
  function: { bg: 'bg-purple-500/10', border: 'border-purple-500/30', text: 'text-purple-400', badge: 'bg-purple-500' },
  vrf: { bg: 'bg-yellow-500/10', border: 'border-yellow-500/30', text: 'text-yellow-400', badge: 'bg-yellow-500' },
  secret: { bg: 'bg-red-500/10', border: 'border-red-500/30', text: 'text-red-400', badge: 'bg-red-500' },
  prediction: { bg: 'bg-pink-500/10', border: 'border-pink-500/30', text: 'text-pink-400', badge: 'bg-pink-500' },
  weather: { bg: 'bg-cyan-500/10', border: 'border-cyan-500/30', text: 'text-cyan-400', badge: 'bg-cyan-500' },
  sports: { bg: 'bg-green-500/10', border: 'border-green-500/30', text: 'text-green-400', badge: 'bg-green-500' },
  social: { bg: 'bg-indigo-500/10', border: 'border-indigo-500/30', text: 'text-indigo-400', badge: 'bg-indigo-500' },
  'ai-judge': { bg: 'bg-orange-500/10', border: 'border-orange-500/30', text: 'text-orange-400', badge: 'bg-orange-500' },
  'custom-api': { bg: 'bg-teal-500/10', border: 'border-teal-500/30', text: 'text-teal-400', badge: 'bg-teal-500' },
}

const CATEGORY_LABELS: Record<string, string> = {
  feed: 'Feed',
  function: 'Function',
  vrf: 'VRF',
  secret: 'Secret',
  prediction: 'Prediction',
  weather: 'Weather',
  sports: 'Sports',
  social: 'Social',
  'ai-judge': 'AI Judge',
  'custom-api': 'Custom API',
}

export default function ProfilePage() {
  const { isConnected } = useAppKitAccount()
  const router = useRouter()
  
  const [mounted, setMounted] = useState(false)
  const [activeTab, setActiveTab] = useState<ProfileTab>('all')
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

  // Wait for client-side mount before checking connection
  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    // Don't redirect until mounted (AppKit initialized)
    if (!mounted) return
    
    if (!isConnected) {
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

    const savedPredictions = localStorage.getItem('savedPredictionOracles')
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

    const savedWeather = localStorage.getItem('savedWeatherOracles')
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

    const savedSports = localStorage.getItem('savedSportsOracles')
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

    const savedSocial = localStorage.getItem('savedSocialOracles')
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

    const savedAiJudge = localStorage.getItem('savedAIJudgeOracles')
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

    const savedCustomApi = localStorage.getItem('savedCustomAPIOracles')
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
  }, [mounted, isConnected, router])

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
          localStorage.setItem('savedPredictionOracles', JSON.stringify(updatedPredictions))
          break
        case 'weather':
          const updatedWeather = weather.filter(w => w.id !== id)
          setWeather(updatedWeather)
          localStorage.setItem('savedWeatherOracles', JSON.stringify(updatedWeather))
          break
        case 'sports':
          const updatedSports = sports.filter(s => s.id !== id)
          setSports(updatedSports)
          localStorage.setItem('savedSportsOracles', JSON.stringify(updatedSports))
          break
        case 'social':
          const updatedSocial = social.filter(s => s.id !== id)
          setSocial(updatedSocial)
          localStorage.setItem('savedSocialOracles', JSON.stringify(updatedSocial))
          break
        case 'ai-judge':
          const updatedAiJudge = aiJudge.filter(a => a.id !== id)
          setAiJudge(updatedAiJudge)
          localStorage.setItem('savedAIJudgeOracles', JSON.stringify(updatedAiJudge))
          break
        case 'custom-api':
          const updatedCustomApi = customApi.filter(c => c.id !== id)
          setCustomApi(updatedCustomApi)
          localStorage.setItem('savedCustomAPIOracles', JSON.stringify(updatedCustomApi))
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
        localStorage.setItem('savedPredictionOracles', JSON.stringify(updatedPredictions))
        break
      case 'weather':
        const updatedWeather = weather.map(w => w.id === id ? { ...w, isFavorite: !w.isFavorite } : w)
        setWeather(updatedWeather)
        localStorage.setItem('savedWeatherOracles', JSON.stringify(updatedWeather))
        break
      case 'sports':
        const updatedSports = sports.map(s => s.id === id ? { ...s, isFavorite: !s.isFavorite } : s)
        setSports(updatedSports)
        localStorage.setItem('savedSportsOracles', JSON.stringify(updatedSports))
        break
      case 'social':
        const updatedSocial = social.map(s => s.id === id ? { ...s, isFavorite: !s.isFavorite } : s)
        setSocial(updatedSocial)
        localStorage.setItem('savedSocialOracles', JSON.stringify(updatedSocial))
        break
      case 'ai-judge':
        const updatedAiJudge = aiJudge.map(a => a.id === id ? { ...a, isFavorite: !a.isFavorite } : a)
        setAiJudge(updatedAiJudge)
        localStorage.setItem('savedAIJudgeOracles', JSON.stringify(updatedAiJudge))
        break
      case 'custom-api':
        const updatedCustomApi = customApi.map(c => c.id === id ? { ...c, isFavorite: !c.isFavorite } : c)
        setCustomApi(updatedCustomApi)
        localStorage.setItem('savedCustomAPIOracles', JSON.stringify(updatedCustomApi))
        break
    }
  }

  const getAllItems = () => {
    const allItems = [
      ...feeds.map(f => ({ ...f, _category: 'feed' as ProfileTab })),
      ...functions.map(f => ({ ...f, _category: 'function' as ProfileTab })),
      ...vrfs.map(v => ({ ...v, _category: 'vrf' as ProfileTab })),
      ...secrets.map(s => ({ ...s, _category: 'secret' as ProfileTab })),
      ...predictions.map(p => ({ ...p, _category: 'prediction' as ProfileTab })),
      ...weather.map(w => ({ ...w, _category: 'weather' as ProfileTab })),
      ...sports.map(s => ({ ...s, _category: 'sports' as ProfileTab })),
      ...social.map(s => ({ ...s, _category: 'social' as ProfileTab })),
      ...aiJudge.map(a => ({ ...a, _category: 'ai-judge' as ProfileTab })),
      ...customApi.map(c => ({ ...c, _category: 'custom-api' as ProfileTab })),
    ]
    // Sort by createdAt descending (newest first)
    return allItems.sort((a, b) => {
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0
      return dateB - dateA
    })
  }

  const getCurrentItems = () => {
    if (activeTab === 'all') {
      const all = getAllItems()
      return filter === 'favorites' ? all.filter(item => item.isFavorite) : all
    }
    switch (activeTab) {
      case 'feed':
        return (filter === 'favorites' ? feeds.filter(f => f.isFavorite) : feeds).map(f => ({ ...f, _category: 'feed' as ProfileTab }))
      case 'function':
        return (filter === 'favorites' ? functions.filter(f => f.isFavorite) : functions).map(f => ({ ...f, _category: 'function' as ProfileTab }))
      case 'vrf':
        return (filter === 'favorites' ? vrfs.filter(v => v.isFavorite) : vrfs).map(v => ({ ...v, _category: 'vrf' as ProfileTab }))
      case 'secret':
        return (filter === 'favorites' ? secrets.filter(s => s.isFavorite) : secrets).map(s => ({ ...s, _category: 'secret' as ProfileTab }))
      case 'prediction':
        return (filter === 'favorites' ? predictions.filter(p => p.isFavorite) : predictions).map(p => ({ ...p, _category: 'prediction' as ProfileTab }))
      case 'weather':
        return (filter === 'favorites' ? weather.filter(w => w.isFavorite) : weather).map(w => ({ ...w, _category: 'weather' as ProfileTab }))
      case 'sports':
        return (filter === 'favorites' ? sports.filter(s => s.isFavorite) : sports).map(s => ({ ...s, _category: 'sports' as ProfileTab }))
      case 'social':
        return (filter === 'favorites' ? social.filter(s => s.isFavorite) : social).map(s => ({ ...s, _category: 'social' as ProfileTab }))
      case 'ai-judge':
        return (filter === 'favorites' ? aiJudge.filter(a => a.isFavorite) : aiJudge).map(a => ({ ...a, _category: 'ai-judge' as ProfileTab }))
      case 'custom-api':
        return (filter === 'favorites' ? customApi.filter(c => c.isFavorite) : customApi).map(c => ({ ...c, _category: 'custom-api' as ProfileTab }))
      default:
        return []
    }
  }

  const getTotalCount = () => {
    if (activeTab === 'all') {
      return feeds.length + functions.length + vrfs.length + secrets.length + 
        predictions.length + weather.length + sports.length + social.length + aiJudge.length + customApi.length
    }
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
    if (activeTab === 'all') {
      return getAllItems().filter(item => item.isFavorite).length
    }
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

  // Show nothing while mounting or if not connected
  if (!mounted || !isConnected) {
    return (
      <main className="min-h-screen">
        <Header />
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex items-center justify-center h-48">
            <div className="w-5 h-5 border-2 border-feedgod-primary border-t-transparent rounded-full animate-spin" />
          </div>
        </div>
      </main>
    )
  }

  const allItemsCount = feeds.length + functions.length + vrfs.length + secrets.length + 
    predictions.length + weather.length + sports.length + social.length + aiJudge.length + customApi.length

  const TABS: { id: ProfileTab; label: string; icon: LucideIcon; count: number }[] = [
    { id: 'all', label: 'All', icon: LayoutGrid, count: allItemsCount },
    { id: 'feed', label: 'Feeds', icon: Database, count: feeds.length },
    { id: 'function', label: 'Functions', icon: Code, count: functions.length },
    { id: 'vrf', label: 'VRF', icon: Dice6, count: vrfs.length },
    { id: 'secret', label: 'Secrets', icon: Key, count: secrets.length },
    { id: 'prediction', label: 'Predictions', icon: Target, count: predictions.length },
    { id: 'weather', label: 'Weather', icon: Cloud, count: weather.length },
    { id: 'sports', label: 'Sports', icon: Trophy, count: sports.length },
    { id: 'social', label: 'Social', icon: Users, count: social.length },
    { id: 'ai-judge', label: 'AI Judge', icon: Brain, count: aiJudge.length },
    { id: 'custom-api', label: 'Custom API', icon: Globe, count: customApi.length },
  ]

  return (
    <main className="min-h-screen">
      <Header />
      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="mb-5">
          <button
            onClick={() => router.push('/')}
            className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-feedgod-primary transition-colors mb-3"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Builder</span>
          </button>
          <h1 className="text-xl font-semibold text-white mb-1">My Oracles</h1>
          <p className="text-xs text-gray-500">
            Manage your saved configurations
          </p>
        </div>

        {/* Category Tabs */}
        <div className="flex flex-wrap gap-1.5 mb-3 pb-3 border-b border-[#3a3b35]">
          {TABS.map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => {
                  playPickupSound()
                  setActiveTab(tab.id)
                }}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'bg-feedgod-primary text-white'
                    : 'bg-[#252620] text-gray-500 hover:text-gray-300 hover:bg-[#2a2b25] border border-[#3a3b35]'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{tab.label}</span>
                <span className="text-[10px] opacity-75">({tab.count})</span>
              </button>
            )
          })}
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-1.5 mb-4">
          <button
            onClick={() => {
              playPickupSound()
              setFilter('all')
            }}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              filter === 'all'
                ? 'bg-[#252620] text-white border border-[#3a3b35]'
                : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            All ({getTotalCount()})
          </button>
          <button
            onClick={() => {
              playPickupSound()
              setFilter('favorites')
            }}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors flex items-center gap-1.5 ${
              filter === 'favorites'
                ? 'bg-[#252620] text-white border border-[#3a3b35]'
                : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            <Heart className={`w-3 h-3 ${filter === 'favorites' ? 'fill-current text-feedgod-primary' : ''}`} />
            Favorites ({getFavoriteCount()})
          </button>
        </div>

        {/* Items Grid */}
        {currentItems.length === 0 ? (
          <div className="bg-[#252620] rounded-md border border-[#3a3b35] p-8 text-center">
            <p className="text-gray-500 text-sm mb-3">
              {activeTab === 'all' 
                ? 'No saved configurations yet' 
                : `No ${TABS.find(t => t.id === activeTab)?.label.toLowerCase()} saved yet`
              }
            </p>
            <button
              onClick={() => router.push('/')}
              className="px-4 py-2 bg-feedgod-primary hover:opacity-90 rounded-md text-white text-xs font-medium transition-all"
            >
              {activeTab === 'all' 
                ? 'Create Your First Oracle' 
                : `Create ${TABS.find(t => t.id === activeTab)?.label.slice(0, -1)}`
              }
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {currentItems.map((item: any) => {
              const category = item._category || activeTab
              const colors = CATEGORY_COLORS[category] || CATEGORY_COLORS.feed
              const categoryLabel = CATEGORY_LABELS[category] || category
              
              return (
              <div
                key={item.id}
                className={`bg-[#252620] rounded-md border p-4 transition-colors ${
                  activeTab === 'all' 
                    ? `${colors.border} hover:border-opacity-60` 
                    : 'border-[#3a3b35] hover:border-feedgod-primary/30'
                }`}
              >
                {/* Category Badge - shown in "All" view */}
                {activeTab === 'all' && (
                  <div className="mb-2">
                    <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium ${colors.badge} text-white`}>
                      {categoryLabel}
                    </span>
                  </div>
                )}
                
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1 min-w-0">
                    <h3 className={`text-sm font-semibold mb-0.5 truncate ${activeTab === 'all' ? colors.text : 'text-white'}`}>
                      {item.symbol || item.name || item.question || 'Untitled'}
                    </h3>
                    <p className="text-xs text-gray-500 truncate">{item.name || item.description || item.city?.name || item.platform || ''}</p>
                  </div>
                  <button
                    onClick={() => toggleFavorite(item.id, category as ProfileTab)}
                    className={`p-1 rounded transition-colors ml-2 ${
                      item.isFavorite
                        ? 'text-feedgod-primary'
                        : 'text-gray-600 hover:text-feedgod-primary'
                    }`}
                  >
                    <Heart className={`w-3.5 h-3.5 ${item.isFavorite ? 'fill-current' : ''}`} />
                  </button>
                </div>

                <div className="space-y-1 mb-3">
                  {item.blockchain && (
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-gray-600">Blockchain</span>
                      <span className="text-gray-400 capitalize">{item.blockchain}</span>
                    </div>
                  )}
                  {item.network && (
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-gray-600">Network</span>
                      <span className="text-gray-400 capitalize">{item.network}</span>
                    </div>
                  )}
                  {item.dataSources && (
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-gray-600">Sources</span>
                      <span className="text-gray-400">{item.dataSources.length}</span>
                    </div>
                  )}
                  {item.updateInterval && (
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-gray-600">Interval</span>
                      <span className="text-gray-400">{item.updateInterval}s</span>
                    </div>
                  )}
                  {item.city && (
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-gray-600">City</span>
                      <span className="text-gray-400">{item.city.name}</span>
                    </div>
                  )}
                  {item.metric && (
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-gray-600">Metric</span>
                      <span className="text-gray-400 capitalize">{item.metric.replace('_', ' ')}</span>
                    </div>
                  )}
                  {item.platform && (
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-gray-600">Platform</span>
                      <span className="text-gray-400 capitalize">{item.platform}</span>
                    </div>
                  )}
                  {item.username && (
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-gray-600">User</span>
                      <span className="text-gray-400">@{item.username}</span>
                    </div>
                  )}
                  {item.match && (
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-gray-600">Match</span>
                      <span className="text-gray-400 truncate max-w-[120px]">
                        {item.match.homeTeam?.name} vs {item.match.awayTeam?.name}
                      </span>
                    </div>
                  )}
                  {item.marketTitle && (
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-gray-600">Market</span>
                      <span className="text-gray-400 truncate max-w-[120px]">{item.marketTitle}</span>
                    </div>
                  )}
                  {item.model && (
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-gray-600">Model</span>
                      <span className="text-gray-400">{item.model}</span>
                    </div>
                  )}
                </div>

                <div className="flex gap-1.5 pt-3 border-t border-[#3a3b35]">
                  <button
                    onClick={() => loadItem(item, category as BuilderType)}
                    className={`flex-1 px-2.5 py-1.5 rounded text-white text-[11px] font-medium transition-all flex items-center justify-center gap-1.5 ${
                      activeTab === 'all' ? `${colors.badge} hover:opacity-90` : 'bg-feedgod-primary hover:opacity-90'
                    }`}
                  >
                    <Edit className="w-3 h-3" />
                    Edit
                  </button>
                  <button
                    onClick={() => deleteItem(item.id, category as ProfileTab)}
                    className="px-2 py-1.5 bg-[#2a2b25] hover:bg-red-900/30 rounded text-gray-500 hover:text-red-400 text-[11px] font-medium transition-colors"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            )})}
          </div>
        )}
      </div>
    </main>
  )
}
