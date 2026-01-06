'use client'

import { useState, useEffect, useCallback } from 'react'
import { 
  Activity, 
  RefreshCw,
  Bell,
  BellOff,
  Grid3X3,
  List,
  Filter,
  Search,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock,
  Zap,
  BarChart3,
  ArrowUp,
  ArrowDown
} from 'lucide-react'
import Header from '@/components/Header'
import LiveOracleCard from '@/components/LiveOracleCard'
import OracleSparkline from '@/components/OracleSparkline'
import { 
  MonitoredOracle,
  getMockDeployedOracles, 
  simulateValueUpdate,
  calculateDashboardStats,
  formatOracleValue,
  getStatusBg,
  getTypeIcon,
  getTimeSinceUpdate
} from '@/lib/oracle-monitor'
import { playPickupSound } from '@/lib/sound-utils'

type ViewMode = 'grid' | 'list'
type FilterType = 'all' | 'feed' | 'prediction' | 'weather' | 'social' | 'custom-api'

// Stats card component
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
    <div className="bg-white/60 dark:bg-feedgod-dark-secondary/80 rounded-xl border border-feedgod-pink-200 dark:border-feedgod-dark-accent p-4 backdrop-blur-sm">
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-lg ${color} flex items-center justify-center`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
        <div>
          <p className="text-2xl font-bold text-feedgod-dark dark:text-white">{value}</p>
          <p className="text-xs text-feedgod-pink-500 dark:text-feedgod-neon-cyan/70">{label}</p>
        </div>
      </div>
      {subValue && (
        <p className="text-xs text-feedgod-pink-400 mt-2">{subValue}</p>
      )}
    </div>
  )
}

// Compact list row
function OracleListRow({ oracle, onRefresh }: { oracle: MonitoredOracle; onRefresh: () => void }) {
  const changeColor = oracle.changeDirection === 'up' ? 'text-emerald-500' : 
                      oracle.changeDirection === 'down' ? 'text-red-500' : 'text-gray-400'
  const ChangeIcon = oracle.changeDirection === 'up' ? ArrowUp : 
                     oracle.changeDirection === 'down' ? ArrowDown : null

  return (
    <div className="flex items-center gap-4 px-4 py-3 hover:bg-feedgod-pink-50 dark:hover:bg-feedgod-dark-accent/50 transition-colors border-b border-feedgod-pink-100 dark:border-feedgod-dark-accent last:border-0">
      {/* Status */}
      <div className={`w-2 h-2 rounded-full flex-shrink-0 ${getStatusBg(oracle.status)}`} />
      
      {/* Icon & Name */}
      <div className="flex items-center gap-2 min-w-[200px]">
        <span className="text-lg">{getTypeIcon(oracle.type)}</span>
        <div>
          <p className="font-medium text-feedgod-dark dark:text-white text-sm">{oracle.symbol}</p>
          <p className="text-xs text-feedgod-pink-400 truncate max-w-[150px]">{oracle.name}</p>
        </div>
      </div>
      
      {/* Value */}
      <div className="min-w-[120px]">
        <p className="font-bold text-feedgod-dark dark:text-white">
          {formatOracleValue(oracle.currentValue, oracle.type, oracle.symbol)}
        </p>
      </div>
      
      {/* Change */}
      <div className={`flex items-center gap-1 min-w-[80px] ${changeColor}`}>
        {ChangeIcon && <ChangeIcon className="w-3 h-3" />}
        <span className="text-sm">
          {oracle.change24h >= 0 ? '+' : ''}{oracle.change24h.toFixed(2)}%
        </span>
      </div>
      
      {/* Sparkline */}
      <div className="flex-1 min-w-[120px]">
        <OracleSparkline 
          data={oracle.history.slice(-24)} 
          width={100} 
          height={24}
          showArea={false}
        />
      </div>
      
      {/* Last Update */}
      <div className="flex items-center gap-1 text-xs text-feedgod-pink-400 min-w-[80px]">
        <Clock className="w-3 h-3" />
        {getTimeSinceUpdate(oracle.lastUpdate)}
      </div>
      
      {/* Actions */}
      <button
        onClick={onRefresh}
        className="p-2 hover:bg-feedgod-pink-100 dark:hover:bg-feedgod-dark-accent rounded-lg transition-colors"
      >
        <RefreshCw className="w-4 h-4 text-feedgod-pink-400" />
      </button>
    </div>
  )
}

export default function DashboardPage() {
  const [oracles, setOracles] = useState<MonitoredOracle[]>([])
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [filter, setFilter] = useState<FilterType>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [isLive, setIsLive] = useState(true)
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date())
  
  // Initialize oracles
  useEffect(() => {
    setOracles(getMockDeployedOracles())
  }, [])
  
  // Simulate real-time updates
  useEffect(() => {
    if (!isLive) return
    
    const interval = setInterval(() => {
      setOracles(prevOracles => {
        // Randomly update 1-3 oracles
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
    }, 3000) // Update every 3 seconds
    
    return () => clearInterval(interval)
  }, [isLive])
  
  // Calculate stats
  const stats = calculateDashboardStats(oracles)
  
  // Filter and search oracles
  const filteredOracles = oracles.filter(oracle => {
    // Type filter
    if (filter !== 'all' && oracle.type !== filter) return false
    
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      return (
        oracle.name.toLowerCase().includes(query) ||
        oracle.symbol.toLowerCase().includes(query) ||
        oracle.publicKey.toLowerCase().includes(query)
      )
    }
    
    return true
  })
  
  // Sort by type, then by name
  const sortedOracles = [...filteredOracles].sort((a, b) => {
    // Prioritize oracles with alerts
    const aHasAlerts = a.alerts.filter(al => !al.acknowledged).length > 0
    const bHasAlerts = b.alerts.filter(al => !al.acknowledged).length > 0
    if (aHasAlerts && !bHasAlerts) return -1
    if (!aHasAlerts && bHasAlerts) return 1
    
    // Then by status (errors first)
    if (a.status === 'error' && b.status !== 'error') return -1
    if (a.status !== 'error' && b.status === 'error') return 1
    if (a.status === 'stale' && b.status !== 'stale') return -1
    if (a.status !== 'stale' && b.status === 'stale') return 1
    
    // Then alphabetically
    return a.name.localeCompare(b.name)
  })
  
  const handleRefreshOracle = useCallback((id: string) => {
    playPickupSound()
    setOracles(prev => prev.map(o => 
      o.id === id ? simulateValueUpdate(o) : o
    ))
  }, [])
  
  const handleRefreshAll = () => {
    playPickupSound()
    setOracles(prev => prev.map(o => 
      o.status === 'healthy' ? simulateValueUpdate(o) : o
    ))
    setLastRefresh(new Date())
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-feedgod-pink-50 via-white to-feedgod-pink-100 dark:from-feedgod-dark-bg dark:via-feedgod-dark-bg dark:to-feedgod-dark-secondary">
      <Header />
      
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        {/* Page Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-feedgod-dark dark:text-white flex items-center gap-3">
              <Activity className="w-8 h-8 text-feedgod-primary" />
              Live Dashboard
            </h1>
            <p className="text-feedgod-pink-500 dark:text-feedgod-neon-cyan/70 mt-1">
              Real-time monitoring of all your deployed oracles
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Live toggle */}
            <button
              onClick={() => { playPickupSound(); setIsLive(!isLive); }}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                isLive 
                  ? 'bg-emerald-500 text-white' 
                  : 'bg-feedgod-pink-100 dark:bg-feedgod-dark-accent text-feedgod-dark dark:text-white'
              }`}
            >
              {isLive ? (
                <>
                  <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
                  <span>Live</span>
                </>
              ) : (
                <>
                  <BellOff className="w-4 h-4" />
                  <span>Paused</span>
                </>
              )}
            </button>
            
            {/* Refresh button */}
            <button
              onClick={handleRefreshAll}
              className="p-2 bg-feedgod-pink-100 dark:bg-feedgod-dark-accent hover:bg-feedgod-pink-200 rounded-lg transition-colors"
              title="Refresh all"
            >
              <RefreshCw className="w-5 h-5 text-feedgod-dark dark:text-white" />
            </button>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <StatCard
            icon={BarChart3}
            label="Total Oracles"
            value={stats.total}
            subValue={`${stats.byChain.solana} Solana, ${stats.byChain.ethereum} ETH`}
            color="bg-gradient-to-br from-blue-500 to-purple-500"
          />
          <StatCard
            icon={CheckCircle}
            label="Healthy"
            value={stats.healthy}
            subValue={`${Math.round((stats.healthy / stats.total) * 100)}% uptime`}
            color="bg-gradient-to-br from-emerald-500 to-green-500"
          />
          <StatCard
            icon={AlertTriangle}
            label="Alerts"
            value={stats.totalAlerts}
            subValue={stats.totalAlerts > 0 ? 'Action required' : 'All clear'}
            color={stats.totalAlerts > 0 ? 'bg-gradient-to-br from-amber-500 to-orange-500' : 'bg-gradient-to-br from-gray-400 to-gray-500'}
          />
          <StatCard
            icon={Zap}
            label="Last Update"
            value={lastRefresh.toLocaleTimeString()}
            subValue={isLive ? 'Auto-refreshing' : 'Paused'}
            color="bg-gradient-to-br from-feedgod-primary to-pink-500"
          />
        </div>

        {/* Filters & Search */}
        <div className="bg-white/60 dark:bg-feedgod-dark-secondary/80 rounded-xl border border-feedgod-pink-200 dark:border-feedgod-dark-accent p-4 mb-6 backdrop-blur-sm">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-feedgod-pink-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search oracles..."
                className="w-full pl-10 pr-4 py-2 bg-feedgod-pink-50 dark:bg-feedgod-dark-accent border border-feedgod-pink-200 dark:border-feedgod-dark-accent rounded-lg text-feedgod-dark dark:text-white placeholder-feedgod-pink-400 focus:outline-none focus:ring-2 focus:ring-feedgod-primary"
              />
            </div>
            
            {/* Type filters */}
            <div className="flex items-center gap-2 flex-wrap">
              {[
                { value: 'all', label: 'All' },
                { value: 'feed', label: '📊 Feeds' },
                { value: 'prediction', label: '🎯 Prediction' },
                { value: 'weather', label: '🌤️ Weather' },
                { value: 'social', label: '👥 Social' },
                { value: 'custom-api', label: '🌐 Custom' },
              ].map((option) => (
                <button
                  key={option.value}
                  onClick={() => { playPickupSound(); setFilter(option.value as FilterType); }}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                    filter === option.value
                      ? 'bg-feedgod-primary text-white'
                      : 'bg-feedgod-pink-100 dark:bg-feedgod-dark-accent text-feedgod-dark dark:text-white hover:bg-feedgod-pink-200'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
            
            {/* View toggle */}
            <div className="flex items-center gap-1 bg-feedgod-pink-100 dark:bg-feedgod-dark-accent rounded-lg p-1">
              <button
                onClick={() => { playPickupSound(); setViewMode('grid'); }}
                className={`p-2 rounded-md transition-all ${
                  viewMode === 'grid' 
                    ? 'bg-white dark:bg-feedgod-dark-secondary shadow-sm' 
                    : 'hover:bg-feedgod-pink-200 dark:hover:bg-feedgod-dark-secondary'
                }`}
              >
                <Grid3X3 className="w-4 h-4 text-feedgod-dark dark:text-white" />
              </button>
              <button
                onClick={() => { playPickupSound(); setViewMode('list'); }}
                className={`p-2 rounded-md transition-all ${
                  viewMode === 'list' 
                    ? 'bg-white dark:bg-feedgod-dark-secondary shadow-sm' 
                    : 'hover:bg-feedgod-pink-200 dark:hover:bg-feedgod-dark-secondary'
                }`}
              >
                <List className="w-4 h-4 text-feedgod-dark dark:text-white" />
              </button>
            </div>
          </div>
        </div>

        {/* Oracle Cards/List */}
        {sortedOracles.length === 0 ? (
          <div className="text-center py-20">
            <Activity className="w-16 h-16 mx-auto text-feedgod-pink-300 dark:text-feedgod-dark-accent mb-4" />
            <h3 className="text-xl font-semibold text-feedgod-dark dark:text-white mb-2">
              No oracles found
            </h3>
            <p className="text-feedgod-pink-500 dark:text-feedgod-neon-cyan/70">
              {searchQuery 
                ? 'Try a different search term' 
                : 'Deploy your first oracle to see it here'}
            </p>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sortedOracles.map((oracle) => (
              <LiveOracleCard
                key={oracle.id}
                oracle={oracle}
                onRefresh={() => handleRefreshOracle(oracle.id)}
              />
            ))}
          </div>
        ) : (
          <div className="bg-white/60 dark:bg-feedgod-dark-secondary/80 rounded-xl border border-feedgod-pink-200 dark:border-feedgod-dark-accent backdrop-blur-sm overflow-hidden">
            {/* List header */}
            <div className="flex items-center gap-4 px-4 py-3 bg-feedgod-pink-50 dark:bg-feedgod-dark-accent/50 border-b border-feedgod-pink-200 dark:border-feedgod-dark-accent text-xs font-medium text-feedgod-pink-500 dark:text-feedgod-neon-cyan/70 uppercase tracking-wider">
              <div className="w-2" />
              <div className="min-w-[200px]">Oracle</div>
              <div className="min-w-[120px]">Value</div>
              <div className="min-w-[80px]">24h Change</div>
              <div className="flex-1 min-w-[120px]">Trend</div>
              <div className="min-w-[80px]">Updated</div>
              <div className="w-10" />
            </div>
            
            {/* List rows */}
            {sortedOracles.map((oracle) => (
              <OracleListRow
                key={oracle.id}
                oracle={oracle}
                onRefresh={() => handleRefreshOracle(oracle.id)}
              />
            ))}
          </div>
        )}

        {/* Footer stats */}
        <div className="mt-8 text-center text-xs text-feedgod-pink-400 dark:text-feedgod-neon-cyan/50">
          Monitoring {stats.total} oracles • {stats.byType.feed} feeds • {stats.byType.prediction} predictions • {stats.byType.weather} weather • {stats.byType.social} social • {stats.byType['custom-api']} custom
        </div>
      </div>
    </main>
  )
}

