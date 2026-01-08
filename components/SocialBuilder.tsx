'use client'

import { useState, useEffect } from 'react'
import { 
  Search, 
  Clock, 
  Play, 
  Save, 
  ChevronRight,
  User,
  Users,
  Eye,
  Heart,
  MessageCircle,
  RefreshCw,
  Loader2,
  DollarSign,
  CheckCircle,
  AtSign,
  Link as LinkIcon,
  TrendingUp,
  Zap
} from 'lucide-react'
import { 
  SocialPlatform, 
  SocialProfile,
  SocialOracleConfig,
  SocialMetric,
  SOCIAL_PLATFORMS,
  POPULAR_ACCOUNTS,
  getMetricsForPlatform
} from '@/types/social'
import { Blockchain, Network } from '@/types/feed'
import { 
  fetchSocialProfile, 
  parseUsername,
  formatMetricValue,
  getMetricLabel,
  getPlatformIcon
} from '@/lib/social-api'
import { playPickupSound } from '@/lib/sound-utils'
import { useCostEstimate } from '@/lib/use-cost-estimate'
import ChainSelector from './ChainSelector'

type BuilderStep = 'select' | 'configure' | 'preview'

// Chain logo mapping
const CHAIN_LOGOS: Record<string, string> = {
  solana: '/solana.png',
  ethereum: '/ethereum.png',
  monad: '/monad.png',
}

// Cost Estimate Display
function CostEstimateDisplay({ blockchain, network }: { blockchain: string; network: string }) {
  const { estimate, isLoading } = useCostEstimate(blockchain as Blockchain, network as Network, 'feed')

  if (isLoading || !estimate) {
    return (
      <div className="px-4 py-3 bg-[#252620] rounded-lg border border-[#3a3b35]">
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <DollarSign className="w-4 h-4 animate-pulse" />
          <span>Calculating cost...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="px-4 py-3 bg-[#252620] rounded-lg border border-[#3a3b35]">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <DollarSign className="w-4 h-4" />
          <span>Estimated Cost:</span>
        </div>
        <div className="text-right">
          <div className="text-lg font-bold gradient-text">
            {estimate.estimatedCost} {estimate.currency}
          </div>
        </div>
      </div>
    </div>
  )
}

// Platform card
function PlatformCard({ 
  platform, 
  isSelected, 
  onClick 
}: { 
  platform: typeof SOCIAL_PLATFORMS[0]
  isSelected: boolean
  onClick: () => void 
}) {
  return (
    <button
      onClick={onClick}
      className={`p-6 rounded-xl border-2 transition-all text-center ${
        isSelected
          ? 'border-feedgod-primary dark:text-feedgod-primary dark:border-feedgod-primary dark:text-feedgod-primary bg-feedgod-primary dark:text-feedgod-primary/5'
          : 'border-[#3a3b35] bg-feedgod-dark-secondary/60 dark:bg-feedgod-purple-50 dark:bg-feedgod-dark-secondary/80 hover:border-feedgod-primary dark:text-feedgod-primary/50'
      }`}
    >
      <div className={`w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br ${platform.color} flex items-center justify-center mb-3 shadow-lg`}>
        {platform.value === 'twitter' ? (
          <span className="text-3xl font-black text-white drop-shadow-md">𝕏</span>
        ) : (
          <span className="text-3xl">{platform.icon}</span>
        )}
      </div>
      <h3 className="font-bold text-white">{platform.label}</h3>
      <p className="text-xs text-gray-400 mt-1">
        {platform.metrics.length} metrics available
      </p>
    </button>
  )
}

// Demo data banner
function DemoDataBanner() {
  return (
    <div className="mb-4 px-4 py-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700/50 rounded-lg">
      <div className="flex items-center gap-2">
        <span className="px-2 py-0.5 bg-amber-400 text-amber-900 text-xs font-bold rounded">DEMO DATA</span>
        <p className="text-sm text-amber-700 dark:text-amber-300">
          Social API integration coming soon. Showing simulated data for demonstration.
        </p>
      </div>
    </div>
  )
}

// Profile preview card
function ProfilePreview({ profile, selectedMetric }: { profile: SocialProfile; selectedMetric?: SocialMetric }) {
  const platformInfo = SOCIAL_PLATFORMS.find(p => p.value === profile.platform)
  
  return (
    <div className="relative bg-feedgod-dark-secondary/60 dark:bg-feedgod-purple-50 dark:bg-feedgod-dark-secondary/80 rounded-xl border border-[#3a3b35] p-6 backdrop-blur-sm">
      {/* Demo badge on card */}
      <div className="absolute top-3 right-3 z-10">
        <span className="px-2 py-0.5 bg-amber-400 text-amber-900 text-[10px] font-bold rounded shadow-sm">DEMO</span>
      </div>
      <div className="flex items-start gap-4">
        <div className={`w-16 h-16 rounded-xl bg-gradient-to-br ${platformInfo?.color || 'from-gray-400 to-gray-600'} flex items-center justify-center flex-shrink-0 shadow-lg`}>
          {profile.profileImage ? (
            <img src={profile.profileImage} alt="" className="w-full h-full object-cover rounded-xl" />
          ) : profile.platform === 'twitter' ? (
            <span className="text-2xl font-black text-white drop-shadow-md">𝕏</span>
          ) : (
            <span className="text-2xl">{platformInfo?.icon}</span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-white text-lg truncate">
              {profile.displayName}
            </h3>
            {profile.verified && (
              <CheckCircle className="w-5 h-5 text-feedgod-primary flex-shrink-0" />
            )}
          </div>
          <p className="text-sm text-gray-400">
            @{profile.username}
          </p>
        </div>
      </div>
      
      {/* Metrics Grid */}
      <div className="grid grid-cols-3 gap-3 mt-4">
        {Object.entries(profile.metrics).map(([metric, value]) => (
          <div 
            key={metric}
            className={`p-3 rounded-lg text-center ${
              selectedMetric === metric 
                ? 'bg-feedgod-primary dark:text-feedgod-primary/10 border border-feedgod-primary dark:text-feedgod-primary' 
                : 'bg-feedgod-purple-50 dark:bg-feedgod-dark-secondary dark:bg-feedgod-purple-200 dark:border-feedgod-dark-accent'
            }`}
          >
            <p className="text-xl font-bold text-white">
              {formatMetricValue(value)}
            </p>
            <p className="text-xs text-gray-400 capitalize">
              {getMetricLabel(metric as SocialMetric)}
            </p>
          </div>
        ))}
      </div>
      
      <p className="text-xs text-gray-400 dark:text-feedgod-secondary/70 /50 mt-3">
        Last updated: {profile.lastUpdated.toLocaleTimeString()}
      </p>
    </div>
  )
}

export default function SocialBuilder() {
  const [step, setStep] = useState<BuilderStep>('select')
  
  // Selection state
  const [selectedPlatform, setSelectedPlatform] = useState<SocialPlatform | null>(null)
  const [targetType, setTargetType] = useState<'profile' | 'post'>('profile')
  const [targetInput, setTargetInput] = useState('')
  const [selectedMetric, setSelectedMetric] = useState<SocialMetric | null>(null)
  
  // Data state
  const [profile, setProfile] = useState<SocialProfile | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Oracle config
  const [oracleConfig, setOracleConfig] = useState<Partial<SocialOracleConfig>>({
    updateInterval: 3600,
    blockchain: 'solana',
    network: 'mainnet',
    enabled: true,
  })
  
  // Get available metrics for selected platform
  const availableMetrics = selectedPlatform ? getMetricsForPlatform(selectedPlatform) : []
  
  // Suggestions for selected platform
  const suggestions = selectedPlatform 
    ? POPULAR_ACCOUNTS.filter(a => a.platform === selectedPlatform).slice(0, 4)
    : []

  // Fetch profile when target changes
  const handleFetchProfile = async () => {
    if (!selectedPlatform || !targetInput.trim()) return
    
    setIsLoading(true)
    setError(null)
    
    try {
      const username = parseUsername(targetInput, selectedPlatform)
      const fetchedProfile = await fetchSocialProfile(selectedPlatform, username)
      
      if (fetchedProfile) {
        setProfile(fetchedProfile)
        
        // Auto-select first available metric if none selected
        if (!selectedMetric && Object.keys(fetchedProfile.metrics).length > 0) {
          setSelectedMetric(Object.keys(fetchedProfile.metrics)[0] as SocialMetric)
        }
        
        // Auto-generate oracle name
        setOracleConfig(prev => ({
          ...prev,
          name: `${fetchedProfile.displayName} ${getMetricLabel(selectedMetric || 'followers')}`,
          target: username,
          platform: selectedPlatform,
          targetType,
        }))
      } else {
        setError('Profile not found')
      }
    } catch (err) {
      setError('Failed to fetch profile')
    } finally {
      setIsLoading(false)
    }
  }
  
  // Handle suggestion click
  const handleSuggestionClick = (account: typeof POPULAR_ACCOUNTS[0]) => {
    playPickupSound()
    setTargetInput(account.username)
    // Fetch immediately
    setTimeout(() => {
      setIsLoading(true)
      fetchSocialProfile(account.platform, account.username).then(p => {
        if (p) {
          setProfile(p)
          if (!selectedMetric && Object.keys(p.metrics).length > 0) {
            setSelectedMetric(Object.keys(p.metrics)[0] as SocialMetric)
          }
          setOracleConfig(prev => ({
            ...prev,
            name: `${p.displayName} ${getMetricLabel(selectedMetric || 'followers')}`,
            target: account.username,
            platform: account.platform,
            targetType: 'profile',
          }))
        }
        setIsLoading(false)
      })
    }, 100)
  }
  
  const handlePlatformSelect = (platform: SocialPlatform) => {
    playPickupSound()
    setSelectedPlatform(platform)
    setProfile(null)
    setTargetInput('')
    setSelectedMetric(null)
  }
  
  const handleConfigure = () => {
    if (!profile || !selectedMetric) return
    playPickupSound()
    setOracleConfig(prev => ({
      ...prev,
      metric: selectedMetric,
      name: `${profile.displayName} ${getMetricLabel(selectedMetric)}`,
    }))
    setStep('configure')
  }
  
  const handlePreview = () => {
    playPickupSound()
    setStep('preview')
  }
  
  const handleBack = () => {
    playPickupSound()
    if (step === 'preview') setStep('configure')
    else if (step === 'configure') setStep('select')
  }
  
  const handleDeploy = () => {
    playPickupSound()
    console.log('Deploying social oracle:', { ...oracleConfig, profile })
    alert('Social Oracle deployed! (Demo - in production this would deploy to Switchboard)')
  }
  
  const handleSave = () => {
    playPickupSound()
    const config = {
      ...oracleConfig,
      id: `social-${Date.now()}`,
      createdAt: new Date(),
    }
    
    const saved = localStorage.getItem('savedSocialOracles')
    const oracles = saved ? JSON.parse(saved) : []
    oracles.push(config)
    localStorage.setItem('savedSocialOracles', JSON.stringify(oracles))
    alert('Social Oracle configuration saved!')
  }
  
  const handleRefresh = async () => {
    if (!selectedPlatform || !targetInput) return
    playPickupSound()
    await handleFetchProfile()
  }
  
  // Generate oracle config for preview
  const generateConfig = () => {
    if (!profile || !selectedMetric) return null
    
    return {
      name: oracleConfig.name,
      description: `Track ${getMetricLabel(selectedMetric)} for @${profile.username} on ${selectedPlatform}`,
      chain: oracleConfig.blockchain,
      network: oracleConfig.network,
      updateInterval: oracleConfig.updateInterval,
      source: {
        type: 'social',
        platform: selectedPlatform,
        targetType,
        target: profile.username,
        metric: selectedMetric,
      },
      output: {
        type: 'uint64',
        description: `Current ${getMetricLabel(selectedMetric)} count`,
      },
      currentValue: profile.metrics[selectedMetric],
    }
  }

  return (
    <div className="space-y-6">
      {/* Module Header */}
      <div className="bg-feedgod-dark-secondary/60 dark:bg-feedgod-purple-50 dark:bg-feedgod-dark-secondary/80 rounded-lg border border-[#3a3b35] p-6 backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-feedgod-primary via-feedgod-primary to-pink-500 flex items-center justify-center">
              <Users className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold gradient-text">
                Social Media Oracle Builder
              </h2>
              <p className="text-sm text-gray-400">
                Track Twitter, YouTube, and TikTok metrics on-chain
              </p>
            </div>
          </div>
          
          {/* Step indicator */}
          <div className="flex items-center gap-2">
            <div className={`px-3 py-1 rounded-full text-xs font-medium ${
              step === 'select' ? 'bg-feedgod-primary dark:text-feedgod-primary text-white' : 'bg-feedgod-purple-100 dark:bg-feedgod-dark-accent dark:bg-feedgod-purple-200 dark:border-feedgod-dark-accent text-gray-400'
            }`}>
              1. Select
            </div>
            <ChevronRight className="w-4 h-4 text-feedgod-purple-300 dark:border-feedgod-dark-accent" />
            <div className={`px-3 py-1 rounded-full text-xs font-medium ${
              step === 'configure' ? 'bg-feedgod-primary dark:text-feedgod-primary text-white' : 'bg-feedgod-purple-100 dark:bg-feedgod-dark-accent dark:bg-feedgod-purple-200 dark:border-feedgod-dark-accent text-gray-400'
            }`}>
              2. Configure
            </div>
            <ChevronRight className="w-4 h-4 text-feedgod-purple-300 dark:border-feedgod-dark-accent" />
            <div className={`px-3 py-1 rounded-full text-xs font-medium ${
              step === 'preview' ? 'bg-feedgod-primary dark:text-feedgod-primary text-white' : 'bg-feedgod-purple-100 dark:bg-feedgod-dark-accent dark:bg-feedgod-purple-200 dark:border-feedgod-dark-accent text-gray-400'
            }`}>
              3. Deploy
            </div>
          </div>
        </div>
      </div>

      {step === 'select' && (
        <div className="space-y-6">
          {/* Platform Selection */}
          <div className="bg-feedgod-dark-secondary/60 dark:bg-feedgod-purple-50 dark:bg-feedgod-dark-secondary/80 rounded-lg border border-[#3a3b35] p-6 backdrop-blur-sm">
            <h3 className="text-lg font-semibold gradient-text mb-4">
              Select Platform
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {SOCIAL_PLATFORMS.map((platform) => (
                <PlatformCard
                  key={platform.value}
                  platform={platform}
                  isSelected={selectedPlatform === platform.value}
                  onClick={() => handlePlatformSelect(platform.value)}
                />
              ))}
            </div>
          </div>

          {/* Username/URL Input */}
          {selectedPlatform && (
            <div className="bg-feedgod-dark-secondary/60 dark:bg-feedgod-purple-50 dark:bg-feedgod-dark-secondary/80 rounded-lg border border-[#3a3b35] p-6 backdrop-blur-sm">
              <h3 className="text-lg font-semibold gradient-text mb-4">
                Enter Username or URL
              </h3>
              
              {/* Input */}
              <div className="flex gap-3">
                <div className="flex-1 relative">
                  <AtSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-feedgod-secondary/70" />
                  <input
                    type="text"
                    value={targetInput}
                    onChange={(e) => setTargetInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleFetchProfile()}
                    placeholder={`Enter ${selectedPlatform} username or profile URL...`}
                    className="w-full pl-10 pr-4 py-3 bg-feedgod-purple-50 dark:bg-feedgod-dark-secondary dark:bg-feedgod-purple-200 dark:border-feedgod-dark-accent border border-[#3a3b35] rounded-lg text-white placeholder-feedgod-feedgod-secondary dark:text-feedgod-secondary/70 focus:outline-none focus:ring-2 focus:ring-feedgod-primary dark:text-feedgod-primary"
                  />
                </div>
                <button
                  onClick={handleFetchProfile}
                  disabled={isLoading || !targetInput.trim()}
                  className="px-6 py-3 gradient-bg hover:opacity-90 disabled:opacity-50 rounded-lg text-white font-medium transition-all flex items-center gap-2"
                >
                  {isLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Search className="w-5 h-5" />
                  )}
                  Fetch
                </button>
              </div>
              
              {/* Error */}
              {error && (
                <p className="text-sm text-red-500 mt-2">{error}</p>
              )}
              
              {/* Suggestions */}
              {suggestions.length > 0 && !profile && (
                <div className="mt-4">
                  <p className="text-xs text-gray-400 mb-2">
                    Popular accounts:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {suggestions.map((account) => (
                      <button
                        key={account.username}
                        onClick={() => handleSuggestionClick(account)}
                        className="px-3 py-1.5 bg-feedgod-purple-100 dark:bg-feedgod-dark-accent dark:bg-feedgod-purple-200 dark:border-feedgod-dark-accent hover:bg-feedgod-purple-200 dark:border-feedgod-dark-accent rounded-full text-sm text-white transition-colors"
                      >
                        @{account.username}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Profile Preview */}
          {profile && (
            <>
            <DemoDataBanner />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <ProfilePreview profile={profile} selectedMetric={selectedMetric || undefined} />
              </div>
              
              <div className="space-y-4">
                {/* Metric Selection */}
                <div className="bg-feedgod-dark-secondary/60 dark:bg-feedgod-purple-50 dark:bg-feedgod-dark-secondary/80 rounded-lg border border-[#3a3b35] p-4 backdrop-blur-sm">
                  <h4 className="text-sm font-semibold gradient-text mb-3">
                    Select Metric to Track
                  </h4>
                  <div className="space-y-2">
                    {availableMetrics
                      .filter(m => profile.metrics[m.value] !== undefined)
                      .map((metric) => (
                        <button
                          key={metric.value}
                          onClick={() => { playPickupSound(); setSelectedMetric(metric.value as SocialMetric); }}
                          className={`w-full p-3 rounded-lg text-left transition-all ${
                            selectedMetric === metric.value
                              ? 'bg-feedgod-primary dark:text-feedgod-primary/10 border border-feedgod-primary dark:text-feedgod-primary'
                              : 'bg-feedgod-purple-50 dark:bg-feedgod-dark-secondary dark:bg-feedgod-purple-200 dark:border-feedgod-dark-accent hover:bg-feedgod-purple-100 dark:bg-feedgod-dark-accent'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-medium text-white text-sm">
                              {metric.label}
                            </span>
                            <span className="gradient-text font-bold">
                              {formatMetricValue(profile.metrics[metric.value] || 0)}
                            </span>
                          </div>
                          <p className="text-xs text-gray-400 /60 mt-1">
                            {metric.description}
                          </p>
                        </button>
                      ))}
                  </div>
                </div>

                {/* Continue Button */}
                <button
                  onClick={handleConfigure}
                  disabled={!selectedMetric}
                  className="w-full px-4 py-3 gradient-bg hover:opacity-90 disabled:opacity-50 rounded-lg text-white font-medium transition-all flex items-center justify-center gap-2"
                >
                  Configure Oracle
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
            </>
          )}
        </div>
      )}

      {step === 'configure' && profile && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left - Config */}
          <div className="lg:col-span-2 space-y-6">
            {/* Selected Profile Summary */}
            <ProfilePreview profile={profile} selectedMetric={selectedMetric || undefined} />

            {/* Oracle Settings */}
            <div className="bg-feedgod-dark-secondary/60 dark:bg-feedgod-purple-50 dark:bg-feedgod-dark-secondary/80 rounded-lg border border-[#3a3b35] p-6 backdrop-blur-sm">
              <h3 className="text-lg font-semibold gradient-text mb-4">
                Oracle Settings
              </h3>
              
              <div className="space-y-4">
                {/* Oracle Name */}
                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Oracle Name
                  </label>
                  <input
                    type="text"
                    value={oracleConfig.name || ''}
                    onChange={(e) => setOracleConfig(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full bg-feedgod-purple-50 dark:bg-feedgod-dark-secondary dark:bg-feedgod-purple-200 dark:border-feedgod-dark-accent border border-[#3a3b35] rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-feedgod-primary dark:text-feedgod-primary"
                  />
                </div>
                
                {/* Update Interval */}
                <div>
                  <label className="block text-sm font-medium text-white mb-2 flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    Update Interval
                  </label>
                  <select
                    value={oracleConfig.updateInterval}
                    onChange={(e) => setOracleConfig(prev => ({ ...prev, updateInterval: parseInt(e.target.value) }))}
                    className="w-full bg-feedgod-purple-50 dark:bg-feedgod-dark-secondary dark:bg-feedgod-purple-200 dark:border-feedgod-dark-accent border border-[#3a3b35] rounded-lg px-4 py-2 text-white"
                  >
                    <option value="300">Every 5 minutes</option>
                    <option value="900">Every 15 minutes</option>
                    <option value="1800">Every 30 minutes</option>
                    <option value="3600">Every hour</option>
                    <option value="21600">Every 6 hours</option>
                    <option value="86400">Daily</option>
                  </select>
                </div>
                
                {/* Chain Selection */}
                <ChainSelector
                  blockchain={oracleConfig.blockchain || 'solana'}
                  network={oracleConfig.network || 'mainnet'}
                  onBlockchainChange={(blockchain) => setOracleConfig(prev => ({ ...prev, blockchain }))}
                  onNetworkChange={(network) => setOracleConfig(prev => ({ ...prev, network }))}
                />
              </div>
            </div>
          </div>

          {/* Right - Summary & Actions */}
          <div className="space-y-4">
            <div className="bg-gradient-to-br from-blue-400/10 via-feedgod-primary/10 to-pink-500/10 rounded-lg border border-feedgod-secondary/20 p-6">
              <h4 className="text-sm font-semibold gradient-text mb-4">
                Oracle Summary
              </h4>
              
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Platform</span>
                  <span className="text-white font-medium flex items-center gap-1">
                    {getPlatformIcon(selectedPlatform!)} {selectedPlatform}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Account</span>
                  <span className="text-white font-medium">
                    @{profile.username}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Metric</span>
                  <span className="text-white font-medium">
                    {getMetricLabel(selectedMetric!)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Current Value</span>
                  <span className="gradient-text font-bold">
                    {formatMetricValue(profile.metrics[selectedMetric!] || 0)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Chain</span>
                  <div className="flex items-center gap-1.5">
                    <img 
                      src={CHAIN_LOGOS[oracleConfig.blockchain || 'solana']}
                      alt={oracleConfig.blockchain}
                      className="w-4 h-4 object-contain"
                    />
                    <span className="text-white font-medium capitalize">
                      {oracleConfig.blockchain}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <CostEstimateDisplay
              blockchain={oracleConfig.blockchain || 'solana'}
              network={oracleConfig.network || 'mainnet'}
            />

            <div className="flex flex-col gap-3">
              <button
                onClick={handlePreview}
                className="w-full px-4 py-3 gradient-bg hover:opacity-90 rounded-lg text-white font-medium transition-all flex items-center justify-center gap-2"
              >
                Preview & Deploy
                <ChevronRight className="w-4 h-4" />
              </button>
              <button
                onClick={handleBack}
                className="w-full px-4 py-2 text-sm text-gray-400 hover:text-feedgod-primary dark:text-feedgod-primary transition-colors"
              >
                Back to Select
              </button>
            </div>
          </div>
        </div>
      )}

      {step === 'preview' && profile && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Config Preview */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-feedgod-dark-secondary/60 dark:bg-feedgod-purple-50 dark:bg-feedgod-dark-secondary/80 rounded-lg border border-[#3a3b35] p-6 backdrop-blur-sm">
              <h3 className="text-lg font-semibold gradient-text mb-4">
                Switchboard Oracle Configuration
              </h3>
              
              <div className="bg-feedgod-dark-secondary dark:bg-black rounded-lg p-4 overflow-x-auto">
                <pre className="text-sm text-green-400 font-mono">
                  {JSON.stringify(generateConfig(), null, 2)}
                </pre>
              </div>
            </div>

            {/* Use Cases */}
            <div className="bg-feedgod-dark-secondary/60 dark:bg-feedgod-purple-50 dark:bg-feedgod-dark-secondary/80 rounded-lg border border-[#3a3b35] p-6 backdrop-blur-sm">
              <h4 className="text-sm font-semibold gradient-text mb-4">
                Use Cases for This Oracle
              </h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-feedgod-purple-50 dark:bg-feedgod-dark-secondary dark:bg-feedgod-purple-200 dark:border-feedgod-dark-accent rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="w-5 h-5 text-emerald-500" />
                    <span className="font-medium text-white">Social Tokens</span>
                  </div>
                  <p className="text-xs text-gray-400">
                    Tie token value to follower milestones
                  </p>
                </div>
                <div className="p-4 bg-feedgod-purple-50 dark:bg-feedgod-dark-secondary dark:bg-feedgod-purple-200 dark:border-feedgod-dark-accent rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Zap className="w-5 h-5 text-amber-500" />
                    <span className="font-medium text-white">Creator DAOs</span>
                  </div>
                  <p className="text-xs text-gray-400">
                    Governance weighted by social reach
                  </p>
                </div>
                <div className="p-4 bg-feedgod-purple-50 dark:bg-feedgod-dark-secondary dark:bg-feedgod-purple-200 dark:border-feedgod-dark-accent rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Heart className="w-5 h-5 text-red-500" />
                    <span className="font-medium text-white">Engagement Betting</span>
                  </div>
                  <p className="text-xs text-gray-400">
                    Predict viral content performance
                  </p>
                </div>
                <div className="p-4 bg-feedgod-purple-50 dark:bg-feedgod-dark-secondary dark:bg-feedgod-purple-200 dark:border-feedgod-dark-accent rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="w-5 h-5 text-feedgod-primary" />
                    <span className="font-medium text-white">Milestone Rewards</span>
                  </div>
                  <p className="text-xs text-gray-400">
                    Auto-release funds at follower goals
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right - Actions */}
          <div className="space-y-4">
            <div className="bg-gradient-to-br from-blue-400/10 via-feedgod-primary/10 to-pink-500/10 rounded-lg border border-feedgod-secondary/20 p-6">
              <h4 className="text-sm font-semibold gradient-text mb-4">
                Final Summary
              </h4>
              
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Target</span>
                  <span className="text-white font-medium">
                    @{profile.username}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Tracking</span>
                  <span className="text-white font-medium">
                    {getMetricLabel(selectedMetric!)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Updates</span>
                  <span className="text-white font-medium">
                    {oracleConfig.updateInterval === 300 ? 'Every 5m' :
                     oracleConfig.updateInterval === 900 ? 'Every 15m' :
                     oracleConfig.updateInterval === 1800 ? 'Every 30m' :
                     oracleConfig.updateInterval === 3600 ? 'Hourly' :
                     oracleConfig.updateInterval === 21600 ? 'Every 6h' : 'Daily'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Chain</span>
                  <div className="flex items-center gap-1.5">
                    <img 
                      src={CHAIN_LOGOS[oracleConfig.blockchain || 'solana']}
                      alt={oracleConfig.blockchain}
                      className="w-4 h-4 object-contain"
                    />
                    <span className="text-white font-medium capitalize">
                      {oracleConfig.blockchain}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <CostEstimateDisplay
              blockchain={oracleConfig.blockchain || 'solana'}
              network={oracleConfig.network || 'mainnet'}
            />

            <div className="flex flex-col gap-3">
              <button
                onClick={handleDeploy}
                className="w-full px-4 py-3 gradient-bg hover:opacity-90 rounded-lg text-white font-medium transition-all flex items-center justify-center gap-2"
              >
                <Play className="w-4 h-4" />
                Deploy Oracle
              </button>
              <button
                onClick={handleSave}
                className="w-full px-4 py-3 bg-feedgod-purple-100 dark:bg-feedgod-dark-accent dark:bg-feedgod-purple-200 dark:border-feedgod-dark-accent hover:bg-feedgod-purple-200 dark:border-feedgod-dark-accent rounded-lg text-white font-medium transition-colors flex items-center justify-center gap-2"
              >
                <Save className="w-4 h-4" />
                Save Configuration
              </button>
              <button
                onClick={handleBack}
                className="w-full px-4 py-2 text-sm text-gray-400 hover:text-feedgod-primary dark:text-feedgod-primary transition-colors"
              >
                Back to Configure
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

