'use client'

import { useState, useMemo } from 'react'
import { 
  Search, 
  Plus, 
  Check,
  TrendingUp,
  Users,
  Github,
  Gamepad2,
  Settings,
  X,
  Wallet,
  BarChart3,
  Coins,
  DollarSign,
  MessageCircle,
  MessagesSquare,
  Send,
  Smile,
  GitCommit,
  UserCheck,
  Star,
  Rocket,
  LucideIcon
} from 'lucide-react'
import XLogo from '@/components/shared/XLogo'
import { 
  MetricSource, 
  MetricCategory, 
  MetricIconName,
  METRIC_SOURCES,
  formatMetricValue 
} from '@/types/governance'
import { playPickupSound } from '@/lib/utils/sound-utils'

interface MetricSelectorProps {
  selectedMetrics: MetricSource[]
  onSelect: (metric: MetricSource) => void
  onRemove: (metricId: string) => void
  maxSelections?: number
}

// Map icon names to components (XLogo is custom, others from Lucide)
const ICON_MAP: Record<MetricIconName, LucideIcon | typeof XLogo> = {
  Wallet,
  Users,
  BarChart3,
  Coins,
  TrendingUp,
  DollarSign,
  XLogo,
  MessageCircle,
  Gamepad2,
  MessagesSquare,
  Send,
  Smile,
  GitCommit,
  UserCheck,
  Star,
  Rocket,
  Settings,
}

const CATEGORY_INFO: Record<MetricCategory, { label: string; icon: LucideIcon; color: string }> = {
  onchain: { label: 'On-Chain', icon: TrendingUp, color: 'from-emerald-500 to-green-600' },
  social: { label: 'Social', icon: Users, color: 'from-blue-500 to-indigo-600' },
  github: { label: 'GitHub', icon: Github, color: 'from-gray-600 to-gray-800' },
  game: { label: 'Gaming', icon: Gamepad2, color: 'from-purple-500 to-pink-600' },
  custom: { label: 'Custom', icon: Settings, color: 'from-amber-500 to-orange-600' },
}

export default function MetricSelector({ 
  selectedMetrics, 
  onSelect, 
  onRemove,
  maxSelections = 10 
}: MetricSelectorProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState<MetricCategory | 'all'>('all')
  const [isExpanded, setIsExpanded] = useState(false)

  const filteredMetrics = useMemo(() => {
    return METRIC_SOURCES.filter(metric => {
      // Category filter
      if (activeCategory !== 'all' && metric.category !== activeCategory) {
        return false
      }
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        return (
          metric.name.toLowerCase().includes(query) ||
          metric.description.toLowerCase().includes(query)
        )
      }
      return true
    })
  }, [searchQuery, activeCategory])

  const isSelected = (metricId: string) => 
    selectedMetrics.some(m => m.id === metricId)

  const handleSelect = (metric: MetricSource) => {
    playPickupSound()
    if (isSelected(metric.id)) {
      onRemove(metric.id)
    } else if (selectedMetrics.length < maxSelections) {
      onSelect(metric)
    }
  }

  const categories: (MetricCategory | 'all')[] = ['all', 'onchain', 'social', 'github', 'game', 'custom']

  const getMetricIcon = (iconName: MetricIconName) => {
    return ICON_MAP[iconName] || Settings
  }

  return (
    <div className="space-y-4">
      {/* Selected Metrics Pills */}
      {selectedMetrics.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {selectedMetrics.map(metric => {
            const IconComponent = getMetricIcon(metric.iconName)
            return (
              <div
                key={metric.id}
                className="flex items-center gap-2 px-3 py-1.5 bg-feedgod-primary/20 border border-feedgod-primary/30 rounded-full"
              >
                <IconComponent className="w-3.5 h-3.5 text-feedgod-primary" />
                <span className="text-sm text-white font-medium">{metric.name}</span>
                <button
                  onClick={() => { playPickupSound(); onRemove(metric.id); }}
                  className="p-0.5 hover:bg-feedgod-primary/30 rounded-full transition-colors"
                >
                  <X className="w-3 h-3 text-gray-400" />
                </button>
              </div>
            )
          })}
        </div>
      )}

      {/* Toggle Button */}
      <button
        onClick={() => { playPickupSound(); setIsExpanded(!isExpanded); }}
        className="w-full flex items-center justify-between px-4 py-3 bg-feedgod-dark-accent border border-feedgod-dark-accent hover:border-feedgod-primary/50 rounded-xl transition-colors"
      >
        <div className="flex items-center gap-3">
          <Plus className="w-5 h-5 text-feedgod-primary" />
          <span className="text-white font-medium">
            {isExpanded ? 'Hide Metrics' : 'Add Data Metrics'}
          </span>
        </div>
        <span className="text-sm text-gray-400">
          {selectedMetrics.length}/{maxSelections} selected
        </span>
      </button>

      {/* Expanded Selector */}
      {isExpanded && (
        <div className="bg-feedgod-dark-secondary border border-feedgod-dark-accent rounded-xl overflow-hidden">
          {/* Search */}
          <div className="p-4 border-b border-feedgod-dark-accent">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search metrics..."
                className="w-full pl-10 pr-4 py-2 bg-feedgod-dark-accent border border-feedgod-dark-accent rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-feedgod-primary text-sm"
              />
            </div>
          </div>

          {/* Category Tabs */}
          <div className="flex overflow-x-auto border-b border-feedgod-dark-accent">
            {categories.map(category => {
              const info = category === 'all' 
                ? { label: 'All', icon: TrendingUp, color: 'from-feedgod-primary to-feedgod-secondary' }
                : CATEGORY_INFO[category]
              const Icon = info.icon
              
              return (
                <button
                  key={category}
                  onClick={() => { playPickupSound(); setActiveCategory(category); }}
                  className={`flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors ${
                    activeCategory === category
                      ? 'text-white border-b-2 border-feedgod-primary bg-feedgod-dark-accent/50'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {info.label}
                </button>
              )
            })}
          </div>

          {/* Metrics Grid */}
          <div className="p-4 max-h-80 overflow-y-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {filteredMetrics.map(metric => {
                const selected = isSelected(metric.id)
                const categoryInfo = CATEGORY_INFO[metric.category]
                const IconComponent = getMetricIcon(metric.iconName)
                
                return (
                  <button
                    key={metric.id}
                    onClick={() => handleSelect(metric)}
                    disabled={!selected && selectedMetrics.length >= maxSelections}
                    className={`relative flex items-start gap-3 p-4 rounded-xl border transition-all text-left ${
                      selected
                        ? 'bg-feedgod-primary/10 border-feedgod-primary'
                        : 'bg-feedgod-dark-accent/50 border-feedgod-dark-accent hover:border-feedgod-primary/50 disabled:opacity-50 disabled:cursor-not-allowed'
                    }`}
                  >
                    {/* Selection indicator */}
                    {selected && (
                      <div className="absolute top-2 right-2">
                        <div className="w-5 h-5 rounded-full bg-feedgod-primary flex items-center justify-center">
                          <Check className="w-3 h-3 text-white" />
                        </div>
                      </div>
                    )}
                    
                    {/* Icon */}
                    <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${categoryInfo.color} flex items-center justify-center flex-shrink-0`}>
                      <IconComponent className="w-5 h-5 text-white" />
                    </div>
                    
                    {/* Content */}
                    <div className="flex-1 min-w-0 pr-6">
                      <h4 className="text-white font-medium text-sm">{metric.name}</h4>
                      <p className="text-gray-400 text-xs mt-0.5 line-clamp-2">
                        {metric.description}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-xs text-gray-500 bg-feedgod-dark-secondary px-2 py-0.5 rounded">
                          {categoryInfo.label}
                        </span>
                        <span className="text-xs text-feedgod-primary font-medium">
                          Sample: {formatMetricValue(metric.sampleValue, metric)}
                        </span>
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
            
            {filteredMetrics.length === 0 && (
              <div className="text-center py-8">
                <p className="text-gray-400">No metrics found</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
