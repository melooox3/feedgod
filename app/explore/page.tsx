'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { 
  Search, 
  Database, 
  Code, 
  Dice6, 
  Target, 
  Cloud,
  ArrowUpDown,
  Loader2,
  Sparkles,
  Activity,
  RefreshCw,
  Grid3X3,
  List,
  CheckCircle,
  AlertTriangle,
  Clock,
  Zap,
  BarChart3,
  ArrowUp,
  ArrowDown,
  BellOff,
  Trophy,
  Users,
  Brain,
  Globe,
  TrendingUp,
  LucideIcon
} from 'lucide-react'
import Header from '@/components/Header'
import OracleCard from '@/components/OracleCard'
import OracleDetailModal from '@/components/OracleDetailModal'
import LiveOracleCard from '@/components/LiveOracleCard'
import OracleSparkline from '@/components/OracleSparkline'
import { Oracle, OracleType, OracleStats } from '@/types/oracle'
import { fetchAllOracles, fetchOracleStats } from '@/lib/explore-api'
import { 
  MonitoredOracle,
  getMockDeployedOracles, 
  simulateValueUpdate,
  calculateDashboardStats,
  formatOracleValue,
  getStatusBg,
  getTypeIconName,
  OracleIconName,
  getTimeSinceUpdate,
  getMonitoredPriceSymbols,
  updateOraclesWithRealPrices
} from '@/lib/oracle-monitor'
import { playPickupSound } from '@/lib/sound-utils'
import { usePrices } from '@/lib/use-prices'
import { getPriceFeedSymbols, updatePriceCache } from '@/lib/explore-api'

type TabType = 'my-oracles' | 'all-oracles'
type FilterType = OracleType | 'all'
type SortOption = 'newest' | 'oldest' | 'popular' | 'alphabetical'
type ViewMode = 'grid' | 'list'
type DashboardFilter = 'all' | 'feed' | 'prediction' | 'weather' | 'social' | 'custom-api'

const TYPE_FILTERS: { value: FilterType; label: string; icon: React.ElementType }[] = [
  { value: 'all', label: 'All', icon: Sparkles },
  { value: 'feed', label: 'Feeds', icon: Database },
  { value: 'prediction', label: 'Predictions', icon: Target },
  { value: 'weather', label: 'Weather', icon: Cloud },
  { value: 'vrf', label: 'VRF', icon: Dice6 },
  { value: 'function', label: 'Functions', icon: Code },
]

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'newest', label: 'Newest First' },
  { value: 'popular', label: 'Most Popular' },
  { value: 'alphabetical', label: 'A-Z' },
  { value: 'oldest', label: 'Oldest First' },
]

// Stats card component for dashboard
function StatCard({ 
  icon: Icon, 
  label, 
  value, 
  subValue, 
  color 
}: { 
  icon: typeof Activity
  label: string
  value: number | string
  subValue?: string
  color: string 
}) {
  return (
    <div className="bg-[#252620] rounded-lg border border-[#3a3b35] p-3">
      <div className="flex items-center gap-2.5">
        <div className={`w-8 h-8 rounded ${color} flex items-center justify-center`}>
          <Icon className="w-4 h-4 text-white" />
        </div>
        <div>
          <p className="text-lg font-semibold text-white">{value}</p>
          <p className="text-xs text-gray-500">{label}</p>
        </div>
      </div>
      {subValue && (
        <p className="text-xs text-gray-600 mt-2">{subValue}</p>
      )}
    </div>
  )
}

// Map oracle icon names to Lucide components
const ORACLE_ICON_MAP: Record<OracleIconName, LucideIcon> = {
  BarChart3,
  Target,
  Cloud,
  Trophy,
  Users,
  Brain,
  Globe,
  TrendingUp,
}

// Compact list row for dashboard
function OracleListRow({ oracle, onRefresh }: { oracle: MonitoredOracle; onRefresh: () => void }) {
  const changeColor = oracle.changeDirection === 'up' ? 'text-emerald-500' : 
                      oracle.changeDirection === 'down' ? 'text-red-500' : 'text-gray-400'
  const ChangeIcon = oracle.changeDirection === 'up' ? ArrowUp : 
                     oracle.changeDirection === 'down' ? ArrowDown : null
  
  const iconName = getTypeIconName(oracle.type)
  const TypeIcon = ORACLE_ICON_MAP[iconName]

  return (
    <div className="flex items-center gap-3 px-3 py-2.5 hover:bg-[#2a2b25] transition-colors border-b border-[#2a2b25] last:border-0">
      {/* Status */}
      <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${getStatusBg(oracle.status)}`} />
      
      {/* Icon & Name */}
      <div className="flex items-center gap-2 min-w-[180px]">
        <div className="w-7 h-7 rounded bg-[#3a3b35] flex items-center justify-center">
          <TypeIcon className="w-3.5 h-3.5 text-gray-400" />
        </div>
        <div>
          <p className="font-medium text-white text-sm">{oracle.symbol}</p>
          <p className="text-xs text-gray-600 truncate max-w-[140px]">{oracle.name}</p>
        </div>
      </div>
      
      {/* Value */}
      <div className="min-w-[100px]">
        <p className="font-medium text-white text-sm">
          {formatOracleValue(oracle.currentValue, oracle.type, oracle.symbol)}
        </p>
      </div>
      
      {/* Change */}
      <div className={`flex items-center gap-1 min-w-[70px] ${changeColor}`}>
        {ChangeIcon && <ChangeIcon className="w-3 h-3" />}
        <span className="text-xs">
          {oracle.change24h >= 0 ? '+' : ''}{oracle.change24h.toFixed(2)}%
        </span>
      </div>
      
      {/* Sparkline */}
      <div className="flex-1 min-w-[100px]">
        <OracleSparkline 
          data={oracle.history.slice(-24)} 
          width={90} 
          height={20}
          showArea={false}
        />
      </div>
      
      {/* Last Update */}
      <div className="flex items-center gap-1 text-xs text-gray-600 min-w-[70px]">
        <Clock className="w-3 h-3" />
        {getTimeSinceUpdate(oracle.lastUpdate)}
      </div>
      
      {/* Actions */}
      <button
        onClick={onRefresh}
        className="p-1.5 hover:bg-[#3a3b35] rounded transition-colors"
      >
        <RefreshCw className="w-3.5 h-3.5 text-gray-500" />
      </button>
    </div>
  )
}

// Cache keys
const ORACLES_CACHE_KEY = 'explore_oracles_cache'
const MY_ORACLES_CACHE_KEY = 'explore_my_oracles_cache'
const CACHE_DURATION = 60000 // 1 minute

export default function ExplorePage() {
  const [activeTab, setActiveTab] = useState<TabType>('my-oracles')
  
  // Explore state - initialize from cache for instant display
  const [oracles, setOracles] = useState<Oracle[]>(() => {
    if (typeof window !== 'undefined') {
      const cached = localStorage.getItem(ORACLES_CACHE_KEY)
      if (cached) {
        try {
          const { data, timestamp } = JSON.parse(cached)
          if (Date.now() - timestamp < CACHE_DURATION) {
            return data
          }
        } catch {}
      }
    }
    return []
  })
  const [exploreStats, setExploreStats] = useState<OracleStats | null>(null)
  const [isExploreLoading, setIsExploreLoading] = useState(false) // Start false, only true when fetching
  const [selectedOracle, setSelectedOracle] = useState<Oracle | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState<FilterType>('all')
  const [sortBy, setSortBy] = useState<SortOption>('newest')
  const [showSortDropdown, setShowSortDropdown] = useState(false)
  const [showOnlyInUse, setShowOnlyInUse] = useState(false)
  
  // Dashboard state - initialize immediately
  const [myOracles, setMyOracles] = useState<MonitoredOracle[]>(() => {
    // Initialize immediately for instant render
    return getMockDeployedOracles()
  })
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [dashboardFilter, setDashboardFilter] = useState<DashboardFilter>('all')
  const [dashboardSearch, setDashboardSearch] = useState('')
  const [isLive, setIsLive] = useState(true)
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date())
  
  // Get all price symbols we need to fetch
  const allPriceSymbols = useMemo(() => {
    const monitoredSymbols = getMonitoredPriceSymbols()
    const exploreSymbols = getPriceFeedSymbols()
    return Array.from(new Set([...monitoredSymbols, ...exploreSymbols]))
  }, [])
  
  // Fetch real prices from CoinGecko
  const { prices, loading: pricesLoading, refresh: refreshPrices } = usePrices(allPriceSymbols, 30000)
  
  // Cache oracles when they change
  useEffect(() => {
    if (oracles.length > 0 && typeof window !== 'undefined') {
      localStorage.setItem(ORACLES_CACHE_KEY, JSON.stringify({
        data: oracles,
        timestamp: Date.now()
      }))
    }
  }, [oracles])
  
  // Update oracles when real prices come in
  useEffect(() => {
    if (Object.keys(prices).length > 0) {
      // Update "My Oracles" with real prices
      setMyOracles(prev => updateOraclesWithRealPrices(prev, prices))
      
      // Update explore price cache for "All Oracles"
      Object.entries(prices).forEach(([symbol, data]) => {
        updatePriceCache(symbol, data.price, data.change24h)
      })
      
      // Refresh explore oracles to get updated prices
      if (activeTab === 'all-oracles' && oracles.length > 0) {
        // Re-fetch oracles to get updated cached prices
        fetchAllOracles({
          type: typeFilter,
          search: searchQuery,
          sortBy,
        }).then(setOracles)
      }
    }
  }, [prices])
  
  // Load explore oracles - only show loading if we have no data
  useEffect(() => {
    if (activeTab === 'all-oracles') {
      const loadData = async () => {
        // Only show loading spinner if we don't have cached data
        if (oracles.length === 0) {
          setIsExploreLoading(true)
        }
        
        const [oraclesData, statsData] = await Promise.all([
          fetchAllOracles({
            type: typeFilter,
            search: searchQuery,
            sortBy,
          }),
          fetchOracleStats(),
        ])
        setOracles(oraclesData)
        setExploreStats(statsData)
        setIsExploreLoading(false)
      }
      loadData()
    }
  }, [activeTab, typeFilter, searchQuery, sortBy])
  
  // Simulate real-time updates for dashboard
  useEffect(() => {
    if (!isLive || activeTab !== 'my-oracles') return
    
    const interval = setInterval(() => {
      setMyOracles(prevOracles => {
        const numToUpdate = Math.floor(Math.random() * 3) + 1
        const indicesToUpdate = new Set<number>()
        
        while (indicesToUpdate.size < numToUpdate && indicesToUpdate.size < prevOracles.length) {
          indicesToUpdate.add(Math.floor(Math.random() * prevOracles.length))
        }
        
        return prevOracles.map((oracle, index) => 
          indicesToUpdate.has(index) && oracle.status === 'healthy'
            ? simulateValueUpdate(oracle)
            : oracle
        )
      })
      setLastRefresh(new Date())
    }, 3000)
    
    return () => clearInterval(interval)
  }, [isLive, activeTab])
  
  // Calculate dashboard stats
  const dashboardStats = calculateDashboardStats(myOracles)
  
  // Filter dashboard oracles
  const filteredMyOracles = myOracles.filter(oracle => {
    if (dashboardFilter !== 'all' && oracle.type !== dashboardFilter) return false
    if (dashboardSearch) {
      const query = dashboardSearch.toLowerCase()
      return (
        oracle.name.toLowerCase().includes(query) ||
        oracle.symbol.toLowerCase().includes(query)
      )
    }
    return true
  }).sort((a, b) => {
    const aHasAlerts = a.alerts.filter(al => !al.acknowledged).length > 0
    const bHasAlerts = b.alerts.filter(al => !al.acknowledged).length > 0
    if (aHasAlerts && !bHasAlerts) return -1
    if (!aHasAlerts && bHasAlerts) return 1
    if (a.status === 'error' && b.status !== 'error') return -1
    if (a.status !== 'error' && b.status === 'error') return 1
    return a.name.localeCompare(b.name)
  })
  
  const handleOracleClick = (oracle: Oracle) => {
    playPickupSound()
    setSelectedOracle(oracle)
    setIsModalOpen(true)
  }
  
  const handleTypeFilter = (type: FilterType) => {
    playPickupSound()
    setTypeFilter(type)
  }
  
  const handleSortChange = (sort: SortOption) => {
    playPickupSound()
    setSortBy(sort)
    setShowSortDropdown(false)
  }
  
  const handleRefreshOracle = useCallback((id: string) => {
    playPickupSound()
    setMyOracles(prev => prev.map(o => 
      o.id === id ? simulateValueUpdate(o) : o
    ))
  }, [])
  
  const handleRefreshAll = () => {
    playPickupSound()
    // Refresh real prices from API
    refreshPrices()
    setMyOracles(prev => prev.map(o => 
      o.status === 'healthy' ? simulateValueUpdate(o) : o
    ))
    setLastRefresh(new Date())
  }

  return (
    <main className="min-h-screen">
      <Header />
      
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="text-center mb-6">
          <h1 className="text-2xl font-semibold text-white mb-2">
            Explore
          </h1>
          <p className="text-sm text-gray-500 max-w-lg mx-auto">
            Monitor your deployed oracles and discover data feeds from the community.
          </p>
        </div>
        
        {/* Tab Navigation */}
        <div className="flex justify-center mb-6">
          <div className="inline-flex bg-[#252620] rounded-lg p-1 border border-[#3a3b35]">
            <button
              onClick={() => { playPickupSound(); setActiveTab('my-oracles'); }}
              className={`px-4 py-2 rounded text-sm font-medium transition-all flex items-center gap-2 ${
                activeTab === 'my-oracles'
                  ? 'bg-[#ff0d6e] text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              My Oracles
              {dashboardStats.totalAlerts > 0 && (
                <span className="bg-amber-500 text-white text-xs px-1.5 py-0.5 rounded">
                  {dashboardStats.totalAlerts}
                </span>
              )}
            </button>
            <button
              onClick={() => { playPickupSound(); setActiveTab('all-oracles'); }}
              className={`px-4 py-2 rounded text-sm font-medium transition-all flex items-center gap-2 ${
                activeTab === 'all-oracles'
                  ? 'bg-[#ff0d6e] text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              All Oracles
            </button>
          </div>
        </div>

        {/* My Oracles Tab */}
        {activeTab === 'my-oracles' && (
          <>
            {/* Stats Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <StatCard
                icon={BarChart3}
                label="Total Oracles"
                value={dashboardStats.total}
                subValue={`${dashboardStats.byChain.solana} Solana, ${dashboardStats.byChain.ethereum} ETH`}
                color="bg-[#ff0d6e]"
              />
              <StatCard
                icon={CheckCircle}
                label="Healthy"
                value={dashboardStats.healthy}
                subValue={`${Math.round((dashboardStats.healthy / dashboardStats.total) * 100)}% uptime`}
                color="bg-emerald-600"
              />
              <StatCard
                icon={AlertTriangle}
                label="Alerts"
                value={dashboardStats.totalAlerts}
                subValue={dashboardStats.totalAlerts > 0 ? 'Action required' : 'All clear'}
                color={dashboardStats.totalAlerts > 0 ? 'bg-amber-600' : 'bg-gray-600'}
              />
              <StatCard
                icon={Zap}
                label="Last Update"
                value={lastRefresh.toLocaleTimeString()}
                subValue={isLive ? 'Auto-refreshing' : 'Paused'}
                color="bg-[#ff0d6e]"
              />
            </div>

            {/* Filters & Controls */}
            <div className="bg-[#252620] rounded-lg border border-[#3a3b35] p-4 mb-6">
              <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
                {/* Search */}
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <input
                    type="text"
                    value={dashboardSearch}
                    onChange={(e) => setDashboardSearch(e.target.value)}
                    placeholder="Search your oracles..."
                    className="w-full pl-9 pr-4 py-2 bg-[#1D1E19] border border-[#3a3b35] rounded-lg text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-[#ff0d6e]"
                  />
                </div>
                
                {/* Type filters */}
                <div className="flex items-center gap-2 flex-wrap">
                  {[
                    { value: 'all', label: 'All' },
                    { value: 'feed', label: 'Feeds' },
                    { value: 'prediction', label: 'Prediction' },
                    { value: 'weather', label: 'Weather' },
                  ].map((option) => (
                    <button
                      key={option.value}
                      onClick={() => { playPickupSound(); setDashboardFilter(option.value as DashboardFilter); }}
                      className={`px-2.5 py-1.5 rounded text-xs font-medium transition-all ${
                        dashboardFilter === option.value
                          ? 'bg-[#ff0d6e] text-white'
                          : 'bg-[#2a2b25] text-gray-400 hover:text-gray-300'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
                
                {/* Live toggle & View toggle */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => { playPickupSound(); setIsLive(!isLive); }}
                    className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-medium transition-all ${
                      isLive 
                        ? 'bg-emerald-600 text-white' 
                        : 'bg-[#2a2b25] text-gray-400'
                    }`}
                  >
                    {isLive ? (
                      <>
                        <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                        <span>Live</span>
                      </>
                    ) : (
                      <>
                        <BellOff className="w-3.5 h-3.5" />
                        <span>Paused</span>
                      </>
                    )}
                  </button>
                  
                  <button
                    onClick={handleRefreshAll}
                    className="p-1.5 bg-[#2a2b25] hover:bg-[#3a3b35] rounded transition-colors"
                    title="Refresh all"
                  >
                    <RefreshCw className="w-3.5 h-3.5 text-gray-400" />
                  </button>
                  
                  <div className="flex items-center gap-0.5 bg-[#1D1E19] rounded p-0.5">
                    <button
                      onClick={() => { playPickupSound(); setViewMode('grid'); }}
                      className={`p-1.5 rounded transition-all ${
                        viewMode === 'grid' ? 'bg-[#3a3b35]' : ''
                      }`}
                    >
                      <Grid3X3 className="w-3.5 h-3.5 text-gray-400" />
                    </button>
                    <button
                      onClick={() => { playPickupSound(); setViewMode('list'); }}
                      className={`p-1.5 rounded transition-all ${
                        viewMode === 'list' ? 'bg-[#3a3b35]' : ''
                      }`}
                    >
                      <List className="w-3.5 h-3.5 text-gray-400" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Oracle Cards/List */}
            {filteredMyOracles.length === 0 ? (
              <div className="text-center py-16">
                <Activity className="w-10 h-10 mx-auto text-gray-600 mb-3" />
                <h3 className="text-base font-medium text-white mb-1">No oracles found</h3>
                <p className="text-sm text-gray-500">
                  {dashboardSearch ? 'Try a different search term' : 'Deploy your first oracle to see it here'}
                </p>
              </div>
            ) : viewMode === 'grid' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredMyOracles.map((oracle) => (
                  <LiveOracleCard
                    key={oracle.id}
                    oracle={oracle}
                    onRefresh={() => handleRefreshOracle(oracle.id)}
                  />
                ))}
              </div>
            ) : (
              <div className="bg-[#252620] rounded-lg border border-[#3a3b35] overflow-hidden">
                <div className="flex items-center gap-3 px-3 py-2 bg-[#1D1E19] border-b border-[#3a3b35] text-xs font-medium text-gray-500">
                  <div className="w-2" />
                  <div className="min-w-[200px]">Oracle</div>
                  <div className="min-w-[120px]">Value</div>
                  <div className="min-w-[80px]">24h Change</div>
                  <div className="flex-1 min-w-[120px]">Trend</div>
                  <div className="min-w-[80px]">Updated</div>
                  <div className="w-10" />
                </div>
                {filteredMyOracles.map((oracle) => (
                  <OracleListRow
                    key={oracle.id}
                    oracle={oracle}
                    onRefresh={() => handleRefreshOracle(oracle.id)}
                  />
                ))}
              </div>
            )}
          </>
        )}

        {/* All Oracles Tab */}
        {activeTab === 'all-oracles' && (
          <>
            {/* Stats Bar */}
            {exploreStats && (
              <div className="grid grid-cols-2 md:grid-cols-6 gap-2 mb-6">
                {[
                  { label: 'Total Oracles', value: exploreStats.totalOracles, color: 'text-white' },
                  { label: 'Price Feeds', value: exploreStats.totalFeeds, color: 'text-emerald-500' },
                  { label: 'Predictions', value: exploreStats.totalPredictions, color: 'text-[#ff0d6e]' },
                  { label: 'Weather', value: exploreStats.totalWeather, color: 'text-sky-500' },
                  { label: 'VRF', value: exploreStats.totalVRF, color: 'text-amber-500' },
                  { label: 'Functions', value: exploreStats.totalFunctions, color: 'text-pink-500' },
                ].map((stat) => (
                  <div key={stat.label} className="bg-[#252620] rounded-lg border border-[#3a3b35] p-3 text-center">
                    <p className={`text-lg font-semibold ${stat.color}`}>{stat.value}</p>
                    <p className="text-xs text-gray-500">{stat.label}</p>
                  </div>
                ))}
              </div>
            )}
            
            {/* Search and Filters */}
            <div className="bg-[#252620] rounded-lg border border-[#3a3b35] p-4 mb-6">
              <div className="flex flex-col md:flex-row gap-3">
                {/* Search */}
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by name, symbol, or description..."
                    className="w-full pl-9 pr-4 py-2 bg-[#1D1E19] border border-[#3a3b35] rounded-lg text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-[#ff0d6e]"
                  />
                </div>
                
                {/* Sort Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => { playPickupSound(); setShowSortDropdown(!showSortDropdown); }}
                    className="w-full md:w-auto px-3 py-2 bg-[#1D1E19] border border-[#3a3b35] rounded-lg text-white text-sm flex items-center justify-between gap-2 hover:border-[#ff0d6e]/50 transition-colors"
                  >
                    <ArrowUpDown className="w-3.5 h-3.5 text-gray-400" />
                    <span>{SORT_OPTIONS.find(o => o.value === sortBy)?.label}</span>
                  </button>
                  
                  {showSortDropdown && (
                    <div className="absolute right-0 mt-1 w-44 bg-[#252620] border border-[#3a3b35] rounded-lg shadow-lg z-20">
                      {SORT_OPTIONS.map((option) => (
                        <button
                          key={option.value}
                          onClick={() => handleSortChange(option.value)}
                          className={`w-full px-3 py-2 text-left text-sm hover:bg-[#3a3b35] transition-colors ${
                            sortBy === option.value ? 'text-[#ff0d6e]' : 'text-gray-300'
                          }`}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              
              {/* Type Filter Pills */}
              <div className="flex flex-wrap items-center gap-2 mt-3">
                {TYPE_FILTERS.map(({ value, label, icon: Icon }) => (
                  <button
                    key={value}
                    onClick={() => handleTypeFilter(value)}
                    className={`px-3 py-1.5 rounded text-xs font-medium transition-all flex items-center gap-1.5 ${
                      typeFilter === value
                        ? 'bg-[#ff0d6e] text-white'
                        : 'bg-[#2a2b25] text-gray-400 hover:text-gray-300'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {label}
                  </button>
                ))}
                
                {/* Divider */}
                <div className="w-px h-5 bg-[#3a3b35] mx-1" />
                
                {/* In Use Filter Toggle */}
                <button
                  onClick={() => { playPickupSound(); setShowOnlyInUse(!showOnlyInUse); }}
                  className={`px-3 py-1.5 rounded text-xs font-medium transition-all flex items-center gap-1.5 ${
                    showOnlyInUse
                      ? 'bg-emerald-600 text-white'
                      : 'bg-[#2a2b25] text-gray-400 hover:text-gray-300'
                  }`}
                >
                  <CheckCircle className="w-3.5 h-3.5" />
                  In Use
                  {myOracles.length > 0 && (
                    <span className={`text-xs px-1.5 py-0.5 rounded ${
                      showOnlyInUse ? 'bg-emerald-700' : 'bg-[#1D1E19]'
                    }`}>
                      {myOracles.length}
                    </span>
                  )}
                </button>
              </div>
            </div>
            
            {/* Results */}
            {isExploreLoading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
              </div>
            ) : oracles.length === 0 ? (
              <div className="text-center py-16">
                <Database className="w-10 h-10 text-gray-600 mx-auto mb-3" />
                <h3 className="text-base font-medium text-white mb-1">No oracles found</h3>
                <p className="text-sm text-gray-500">Try adjusting your search or filters</p>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-4">
                  <p className="text-sm text-gray-400">
                    Showing {showOnlyInUse 
                      ? `${oracles.filter(o => myOracles.some(m => m.symbol === o.symbol || m.name === o.name)).length} in use`
                      : `${oracles.length} oracle${oracles.length !== 1 ? 's' : ''}`
                    }
                  </p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {oracles
                    .map((oracle) => {
                      // Check if this oracle is being used (matches any of our deployed oracles)
                      const isInUse = myOracles.some(
                        (myOracle) => 
                          myOracle.symbol === oracle.symbol || 
                          myOracle.name === oracle.name
                      )
                      return { oracle, isInUse }
                    })
                    .filter(({ isInUse }) => !showOnlyInUse || isInUse)
                    .map(({ oracle, isInUse }) => (
                      <OracleCard
                        key={oracle.id}
                        oracle={oracle}
                        onClick={() => handleOracleClick(oracle)}
                        isInUse={isInUse}
                      />
                    ))}
                </div>
              </>
            )}
          </>
        )}
      </div>
      
      {/* Detail Modal */}
      <OracleDetailModal
        oracle={selectedOracle}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </main>
  )
}
