'use client'

import { useState, useEffect, useMemo } from 'react'
import { 
  Search, 
  Database, 
  Code, 
  Dice6, 
  Target, 
  Cloud,
  SlidersHorizontal,
  ArrowUpDown,
  Loader2,
  Compass,
  Sparkles,
  TrendingUp
} from 'lucide-react'
import Header from '@/components/Header'
import OracleCard from '@/components/OracleCard'
import OracleDetailModal from '@/components/OracleDetailModal'
import { Oracle, OracleType, OracleFilters, OracleStats } from '@/types/oracle'
import { fetchAllOracles, fetchOracleStats } from '@/lib/explore-api'
import { playPickupSound } from '@/lib/sound-utils'

type FilterType = OracleType | 'all'
type SortOption = 'newest' | 'oldest' | 'popular' | 'alphabetical'

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

export default function ExplorePage() {
  const [oracles, setOracles] = useState<Oracle[]>([])
  const [stats, setStats] = useState<OracleStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [selectedOracle, setSelectedOracle] = useState<Oracle | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState<FilterType>('all')
  const [sortBy, setSortBy] = useState<SortOption>('newest')
  const [showSortDropdown, setShowSortDropdown] = useState(false)
  
  // Load oracles
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true)
      
      const [oraclesData, statsData] = await Promise.all([
        fetchAllOracles({
          type: typeFilter,
          search: searchQuery,
          sortBy,
        }),
        fetchOracleStats(),
      ])
      
      setOracles(oraclesData)
      setStats(statsData)
      setIsLoading(false)
    }
    
    loadData()
  }, [typeFilter, searchQuery, sortBy])
  
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

  return (
    <main className="min-h-screen">
      <Header />
      
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Hero Section */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-feedgod-primary to-purple-600 mb-4">
            <Compass className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-feedgod-dark dark:text-white mb-3">
            Explore Oracles
          </h1>
          <p className="text-feedgod-pink-500 dark:text-feedgod-neon-cyan/70 max-w-xl mx-auto">
            Discover deployed oracles and data feeds. Find the right data source for your smart contracts.
          </p>
        </div>
        
        {/* Stats Bar */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-6 gap-3 mb-8">
            <div className="bg-white/60 dark:bg-feedgod-dark-secondary/80 rounded-xl border border-feedgod-pink-200 dark:border-feedgod-dark-accent p-4 text-center backdrop-blur-sm">
              <p className="text-2xl font-bold text-feedgod-dark dark:text-white">{stats.totalOracles}</p>
              <p className="text-xs text-feedgod-pink-500 dark:text-feedgod-neon-cyan/60">Total Oracles</p>
            </div>
            <div className="bg-white/60 dark:bg-feedgod-dark-secondary/80 rounded-xl border border-feedgod-pink-200 dark:border-feedgod-dark-accent p-4 text-center backdrop-blur-sm">
              <p className="text-2xl font-bold text-emerald-500">{stats.totalFeeds}</p>
              <p className="text-xs text-feedgod-pink-500 dark:text-feedgod-neon-cyan/60">Price Feeds</p>
            </div>
            <div className="bg-white/60 dark:bg-feedgod-dark-secondary/80 rounded-xl border border-feedgod-pink-200 dark:border-feedgod-dark-accent p-4 text-center backdrop-blur-sm">
              <p className="text-2xl font-bold text-purple-500">{stats.totalPredictions}</p>
              <p className="text-xs text-feedgod-pink-500 dark:text-feedgod-neon-cyan/60">Predictions</p>
            </div>
            <div className="bg-white/60 dark:bg-feedgod-dark-secondary/80 rounded-xl border border-feedgod-pink-200 dark:border-feedgod-dark-accent p-4 text-center backdrop-blur-sm">
              <p className="text-2xl font-bold text-sky-500">{stats.totalWeather}</p>
              <p className="text-xs text-feedgod-pink-500 dark:text-feedgod-neon-cyan/60">Weather</p>
            </div>
            <div className="bg-white/60 dark:bg-feedgod-dark-secondary/80 rounded-xl border border-feedgod-pink-200 dark:border-feedgod-dark-accent p-4 text-center backdrop-blur-sm">
              <p className="text-2xl font-bold text-amber-500">{stats.totalVRF}</p>
              <p className="text-xs text-feedgod-pink-500 dark:text-feedgod-neon-cyan/60">VRF</p>
            </div>
            <div className="bg-white/60 dark:bg-feedgod-dark-secondary/80 rounded-xl border border-feedgod-pink-200 dark:border-feedgod-dark-accent p-4 text-center backdrop-blur-sm">
              <p className="text-2xl font-bold text-pink-500">{stats.totalFunctions}</p>
              <p className="text-xs text-feedgod-pink-500 dark:text-feedgod-neon-cyan/60">Functions</p>
            </div>
          </div>
        )}
        
        {/* Search and Filters */}
        <div className="bg-white/60 dark:bg-feedgod-dark-secondary/80 rounded-xl border border-feedgod-pink-200 dark:border-feedgod-dark-accent p-4 mb-6 backdrop-blur-sm">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-feedgod-pink-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name, symbol, or description..."
                className="w-full pl-10 pr-4 py-3 bg-feedgod-pink-50 dark:bg-feedgod-dark-accent border border-feedgod-pink-200 dark:border-feedgod-dark-accent rounded-lg text-feedgod-dark dark:text-white placeholder-feedgod-pink-400 focus:outline-none focus:ring-2 focus:ring-feedgod-primary"
              />
            </div>
            
            {/* Sort Dropdown */}
            <div className="relative">
              <button
                onClick={() => { playPickupSound(); setShowSortDropdown(!showSortDropdown); }}
                className="w-full md:w-auto px-4 py-3 bg-feedgod-pink-50 dark:bg-feedgod-dark-accent border border-feedgod-pink-200 dark:border-feedgod-dark-accent rounded-lg text-feedgod-dark dark:text-white flex items-center justify-between gap-2 hover:border-feedgod-primary transition-colors"
              >
                <ArrowUpDown className="w-4 h-4 text-feedgod-pink-500" />
                <span className="text-sm">{SORT_OPTIONS.find(o => o.value === sortBy)?.label}</span>
              </button>
              
              {showSortDropdown && (
                <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-feedgod-dark-secondary border border-feedgod-pink-200 dark:border-feedgod-dark-accent rounded-lg shadow-lg z-20">
                  {SORT_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => handleSortChange(option.value)}
                      className={`w-full px-4 py-2 text-left text-sm hover:bg-feedgod-pink-50 dark:hover:bg-feedgod-dark-accent transition-colors ${
                        sortBy === option.value ? 'text-feedgod-primary font-medium' : 'text-feedgod-dark dark:text-white'
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
          <div className="flex flex-wrap gap-2 mt-4">
            {TYPE_FILTERS.map(({ value, label, icon: Icon }) => (
              <button
                key={value}
                onClick={() => handleTypeFilter(value)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-2 ${
                  typeFilter === value
                    ? 'bg-feedgod-primary text-white shadow-lg shadow-feedgod-primary/20'
                    : 'bg-feedgod-pink-100 dark:bg-feedgod-dark-accent text-feedgod-pink-600 dark:text-feedgod-neon-cyan/70 hover:bg-feedgod-pink-200'
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </button>
            ))}
          </div>
        </div>
        
        {/* Results */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-feedgod-primary" />
          </div>
        ) : oracles.length === 0 ? (
          <div className="text-center py-20">
            <Database className="w-16 h-16 text-feedgod-pink-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-feedgod-dark dark:text-white mb-2">
              No oracles found
            </h3>
            <p className="text-feedgod-pink-500 dark:text-feedgod-neon-cyan/70">
              Try adjusting your search or filters
            </p>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-feedgod-pink-500 dark:text-feedgod-neon-cyan/70">
                Showing {oracles.length} oracle{oracles.length !== 1 ? 's' : ''}
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {oracles.map((oracle) => (
                <OracleCard
                  key={oracle.id}
                  oracle={oracle}
                  onClick={() => handleOracleClick(oracle)}
                />
              ))}
            </div>
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

