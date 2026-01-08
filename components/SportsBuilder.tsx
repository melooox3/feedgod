'use client'

import { useState, useEffect } from 'react'
import { 
  Search, 
  Clock, 
  Play, 
  Save, 
  ChevronRight,
  Calendar,
  MapPin,
  Trophy,
  RefreshCw,
  Loader2,
  DollarSign,
  Zap,
  List,
  Grid
} from 'lucide-react'
import { 
  Match, 
  SportCategory, 
  SportsOracleConfig, 
  OracleOutputType,
  OUTPUT_TYPE_INFO 
} from '@/types/sports'
import { League } from '@/types/sports'
import { Blockchain, Network } from '@/types/feed'
import { LEAGUES, SPORT_CATEGORIES, getLeaguesBySport } from '@/data/leagues'
import { 
  fetchUpcomingMatches, 
  fetchPastMatches,
  formatMatchTime, 
  getSportIcon,
  generateMockEsportsMatches 
} from '@/lib/sports-api'
import { playPickupSound } from '@/lib/sound-utils'
import { useCostEstimate } from '@/lib/use-cost-estimate'
import ChainSelector from './ChainSelector'

type BuilderStep = 'browse' | 'configure' | 'preview'
type ViewMode = 'list' | 'grid'

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

// Match Card Component
function MatchCard({ 
  match, 
  isSelected, 
  onSelect 
}: { 
  match: Match
  isSelected: boolean
  onSelect: () => void 
}) {
  const timeDisplay = formatMatchTime(match.startTime)
  const isFinished = match.status === 'finished'
  const isLive = match.status === 'live'
  
  return (
    <div
      onClick={onSelect}
      className={`p-4 rounded-xl border-2 transition-all cursor-pointer ${
        isSelected
          ? 'border-feedgod-primary bg-feedgod-primary/10'
          : 'border-[#3a3b35] bg-[#252620] hover:border-feedgod-primary/50'
      }`}
    >
      {/* League & Status */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-lg">{getSportIcon(match.league.sport)}</span>
          <span className="text-xs text-gray-400 font-medium">
            {match.league.shortName || match.league.name}
          </span>
        </div>
        <div className={`px-2 py-0.5 rounded-full text-xs font-medium ${
          isLive ? 'bg-red-500/10 text-red-500 animate-pulse' :
          isFinished ? 'bg-[#1D1E19] text-gray-400' :
          'bg-emerald-500/10 text-emerald-500'
        }`}>
          {isLive ? '● LIVE' : isFinished ? 'Finished' : timeDisplay}
        </div>
      </div>
      
      {/* Teams */}
      <div className="space-y-2">
        {/* Home Team */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {match.homeTeam.logo ? (
              <img 
                src={match.homeTeam.logo} 
                alt={match.homeTeam.name}
                className="w-6 h-6 object-contain"
              />
            ) : (
              <div className="w-6 h-6 rounded-full bg-[#3a3b35] flex items-center justify-center text-xs font-bold text-white">
                {match.homeTeam.name.charAt(0)}
              </div>
            )}
            <span className="font-medium text-white text-sm">
              {match.homeTeam.name}
            </span>
          </div>
          {isFinished && (
            <span className={`text-lg font-bold ${
              match.homeScore! > match.awayScore! ? 'text-emerald-500' : 'text-white'
            }`}>
              {match.homeScore}
            </span>
          )}
        </div>
        
        {/* Away Team */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {match.awayTeam.logo ? (
              <img 
                src={match.awayTeam.logo} 
                alt={match.awayTeam.name}
                className="w-6 h-6 object-contain"
              />
            ) : (
              <div className="w-6 h-6 rounded-full bg-[#3a3b35] flex items-center justify-center text-xs font-bold text-white">
                {match.awayTeam.name.charAt(0)}
              </div>
            )}
            <span className="font-medium text-white text-sm">
              {match.awayTeam.name}
            </span>
          </div>
          {isFinished && (
            <span className={`text-lg font-bold ${
              match.awayScore! > match.homeScore! ? 'text-emerald-500' : 'text-white'
            }`}>
              {match.awayScore}
            </span>
          )}
        </div>
      </div>
      
      {/* Venue & Round */}
      {(match.venue || match.round) && (
        <div className="mt-3 pt-3 border-t border-[#3a3b35] flex items-center gap-3 text-xs text-gray-500">
          {match.venue && (
            <span className="flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              {match.venue}
            </span>
          )}
          {match.round && (
            <span className="flex items-center gap-1">
              <Trophy className="w-3 h-3" />
              Round {match.round}
            </span>
          )}
        </div>
      )}
    </div>
  )
}

export default function SportsBuilder() {
  const [step, setStep] = useState<BuilderStep>('browse')
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  
  // Filter state
  const [selectedSport, setSelectedSport] = useState<SportCategory>('soccer')
  const [selectedLeague, setSelectedLeague] = useState<League | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [includePastMatches, setIncludePastMatches] = useState(false)
  
  // Data state
  const [matches, setMatches] = useState<Match[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null)
  
  // Oracle config
  const [oracleConfig, setOracleConfig] = useState<Partial<SportsOracleConfig>>({
    outputType: 'winner',
    updateInterval: 60,
    blockchain: 'solana',
    network: 'mainnet',
    enabled: true,
  })
  
  // Get leagues for selected sport
  const availableLeagues = getLeaguesBySport(selectedSport)
  
  // Load matches when league changes
  useEffect(() => {
    if (!selectedLeague) {
      // Select first league by default
      if (availableLeagues.length > 0) {
        setSelectedLeague(availableLeagues[0])
      }
      return
    }
    
    const loadMatches = async () => {
      setIsLoading(true)
      setMatches([])
      
      try {
        // Handle esports specially (mock data)
        if (selectedSport === 'esports') {
          const esportsMatches = generateMockEsportsMatches()
          setMatches(esportsMatches.filter(m => m.league.id === selectedLeague.id))
          setIsLoading(false)
          return
        }
        
        // Fetch upcoming matches
        const upcoming = await fetchUpcomingMatches(selectedLeague.id)
        
        // Optionally fetch past matches
        let past: Match[] = []
        if (includePastMatches) {
          past = await fetchPastMatches(selectedLeague.id)
        }
        
        // Combine and sort
        const allMatches = [...upcoming, ...past]
        allMatches.sort((a, b) => b.startTime.getTime() - a.startTime.getTime())
        
        setMatches(allMatches)
      } catch (error) {
        console.error('[SportsBuilder] Error loading matches:', error)
      } finally {
        setIsLoading(false)
      }
    }
    
    loadMatches()
  }, [selectedLeague, selectedSport, includePastMatches])
  
  // Update league when sport changes
  useEffect(() => {
    const leagues = getLeaguesBySport(selectedSport)
    if (leagues.length > 0) {
      setSelectedLeague(leagues[0])
    } else {
      setSelectedLeague(null)
    }
    setSelectedMatch(null)
  }, [selectedSport])
  
  // Filter matches by search
  const filteredMatches = matches.filter(match => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      match.homeTeam.name.toLowerCase().includes(query) ||
      match.awayTeam.name.toLowerCase().includes(query) ||
      match.venue?.toLowerCase().includes(query)
    )
  })
  
  const handleMatchSelect = (match: Match) => {
    playPickupSound()
    setSelectedMatch(match)
    
    // Auto-generate oracle name
    setOracleConfig(prev => ({
      ...prev,
      name: `${match.homeTeam.name} vs ${match.awayTeam.name}`,
      description: `${match.league.name} - ${formatMatchTime(match.startTime)}`,
    }))
  }
  
  const handleConfigure = () => {
    if (!selectedMatch) return
    playPickupSound()
    setStep('configure')
  }
  
  const handlePreview = () => {
    playPickupSound()
    setStep('preview')
  }
  
  const handleBack = () => {
    playPickupSound()
    if (step === 'preview') setStep('configure')
    else if (step === 'configure') setStep('browse')
  }
  
  const handleDeploy = () => {
    playPickupSound()
    console.log('Deploying sports oracle:', { ...oracleConfig, match: selectedMatch })
    alert('Sports Oracle deployed! (Demo - in production this would deploy to Switchboard)')
  }
  
  const handleSave = () => {
    playPickupSound()
    const config = {
      ...oracleConfig,
      id: `sports-${Date.now()}`,
      match: selectedMatch,
      createdAt: new Date(),
    }
    
    const saved = localStorage.getItem('savedSportsOracles')
    const oracles = saved ? JSON.parse(saved) : []
    oracles.push(config)
    localStorage.setItem('savedSportsOracles', JSON.stringify(oracles))
    alert('Sports Oracle configuration saved!')
  }
  
  const handleRefresh = async () => {
    if (!selectedLeague) return
    playPickupSound()
    setIsLoading(true)
    
    try {
      if (selectedSport === 'esports') {
        const esportsMatches = generateMockEsportsMatches()
        setMatches(esportsMatches.filter(m => m.league.id === selectedLeague.id))
      } else {
        const upcoming = await fetchUpcomingMatches(selectedLeague.id)
        const past = includePastMatches ? await fetchPastMatches(selectedLeague.id) : []
        setMatches([...upcoming, ...past])
      }
    } catch (error) {
      console.error('[SportsBuilder] Error refreshing:', error)
    } finally {
      setIsLoading(false)
    }
  }
  
  // Generate oracle config for preview
  const generateConfig = () => {
    if (!selectedMatch) return null
    
    return {
      name: oracleConfig.name,
      description: oracleConfig.description,
      chain: oracleConfig.blockchain,
      network: oracleConfig.network,
      updateInterval: oracleConfig.updateInterval,
      source: {
        type: 'sports',
        provider: 'thesportsdb',
        matchId: selectedMatch.id,
        homeTeam: selectedMatch.homeTeam.name,
        awayTeam: selectedMatch.awayTeam.name,
        league: selectedMatch.league.name,
        startTime: selectedMatch.startTime.toISOString(),
      },
      output: {
        type: oracleConfig.outputType,
        format: OUTPUT_TYPE_INFO[oracleConfig.outputType || 'winner'].format,
      },
    }
  }

  return (
    <div className="space-y-6">
      {/* Module Header */}
      <div className="bg-[#252620] rounded-lg border border-[#3a3b35] p-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
              <Trophy className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold gradient-text">
                Sports Oracle Builder
              </h2>
              <p className="text-sm text-gray-400">
                Create on-chain oracles for sports match outcomes
              </p>
            </div>
          </div>
          
          {/* Step indicator */}
          <div className="flex items-center gap-2">
            <div className={`px-3 py-1 rounded-full text-xs font-medium ${
              step === 'browse' ? 'gradient-bg text-white' : 'bg-[#1D1E19] border border-[#3a3b35] text-gray-400'
            }`}>
              1. Browse
            </div>
            <ChevronRight className="w-4 h-4 text-gray-500" />
            <div className={`px-3 py-1 rounded-full text-xs font-medium ${
              step === 'configure' ? 'gradient-bg text-white' : 'bg-[#1D1E19] border border-[#3a3b35] text-gray-400'
            }`}>
              2. Configure
            </div>
            <ChevronRight className="w-4 h-4 text-gray-500" />
            <div className={`px-3 py-1 rounded-full text-xs font-medium ${
              step === 'preview' ? 'gradient-bg text-white' : 'bg-[#1D1E19] border border-[#3a3b35] text-gray-400'
            }`}>
              3. Deploy
            </div>
          </div>
        </div>
      </div>

      {step === 'browse' && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left - Filters */}
          <div className="space-y-4">
            {/* Sport Category */}
            <div className="bg-[#252620] rounded-lg border border-[#3a3b35] p-4">
              <h4 className="text-sm font-semibold gradient-text mb-3">Sport</h4>
              <div className="space-y-2">
                {SPORT_CATEGORIES.map((sport) => (
                  <button
                    key={sport.value}
                    onClick={() => { playPickupSound(); setSelectedSport(sport.value); }}
                    className={`w-full px-3 py-2 rounded-lg text-left transition-all flex items-center gap-2 ${
                      selectedSport === sport.value
                        ? 'gradient-bg text-white border border-feedgod-primary/50'
                        : 'bg-[#1D1E19] border border-[#3a3b35] text-white hover:bg-[#2a2b25] hover:border-feedgod-primary/30'
                    }`}
                  >
                    <span className="text-lg">{sport.icon}</span>
                    <span className="text-sm font-medium">{sport.label}</span>
                  </button>
                ))}
              </div>
            </div>
            
            {/* League Selector */}
            <div className="bg-[#252620] rounded-lg border border-[#3a3b35] p-4">
              <h4 className="text-sm font-semibold gradient-text mb-3">League</h4>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {availableLeagues.map((league) => (
                  <button
                    key={league.id}
                    onClick={() => { playPickupSound(); setSelectedLeague(league); }}
                    className={`w-full px-3 py-2 rounded-lg text-left transition-all ${
                      selectedLeague?.id === league.id
                        ? 'gradient-bg text-white border border-feedgod-primary/50'
                        : 'bg-[#1D1E19] border border-[#3a3b35] text-white hover:bg-[#2a2b25] hover:border-feedgod-primary/30'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-lg flex-shrink-0">{league.icon || '🏆'}</span>
                      <span className="text-sm font-medium truncate">{league.name}</span>
                    </div>
                    {league.country && (
                      <span className={`text-xs ml-7 ${selectedLeague?.id === league.id ? 'text-white/70' : 'text-gray-500'}`}>
                        {league.country}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
            
            {/* Options */}
            <div className="bg-[#252620] rounded-lg border border-[#3a3b35] p-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includePastMatches}
                  onChange={(e) => setIncludePastMatches(e.target.checked)}
                  className="rounded border-[#3a3b35] bg-[#1D1E19] text-feedgod-primary focus:ring-feedgod-primary"
                />
                <span className="text-sm text-white">Include past matches</span>
              </label>
            </div>
          </div>

          {/* Right - Match List */}
          <div className="lg:col-span-3 space-y-4">
            {/* Search & View Toggle */}
            <div className="flex items-center gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search teams or venues..."
                  className="w-full pl-10 pr-4 py-2 bg-[#252620] border border-[#3a3b35] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-feedgod-primary focus:border-transparent"
                />
              </div>
              
              <div className="flex items-center bg-[#252620] border border-[#3a3b35] rounded-lg">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-l-lg ${viewMode === 'grid' ? 'gradient-bg text-white' : 'text-gray-400 hover:text-white'}`}
                >
                  <Grid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-r-lg ${viewMode === 'list' ? 'gradient-bg text-white' : 'text-gray-400 hover:text-white'}`}
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
              
              <button
                onClick={handleRefresh}
                disabled={isLoading}
                className="p-2 hover:bg-[#2a2b25] rounded-lg transition-colors border border-[#3a3b35]"
              >
                <RefreshCw className={`w-5 h-5 text-gray-400 ${isLoading ? 'animate-spin' : ''}`} />
              </button>
            </div>

            {/* Matches */}
            {isLoading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-feedgod-primary" />
              </div>
            ) : filteredMatches.length === 0 ? (
              <div className="text-center py-20">
                <Trophy className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">
                  No matches found
                </h3>
                <p className="text-gray-400">
                  {selectedLeague ? 'No upcoming matches in this league' : 'Select a league to browse matches'}
                </p>
              </div>
            ) : (
              <>
                <p className="text-sm text-gray-400">
                  {filteredMatches.length} match{filteredMatches.length !== 1 ? 'es' : ''} found
                </p>
                
                <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 gap-4' : 'space-y-3'}>
                  {filteredMatches.map((match) => (
                    <MatchCard
                      key={match.id}
                      match={match}
                      isSelected={selectedMatch?.id === match.id}
                      onSelect={() => handleMatchSelect(match)}
                    />
                  ))}
                </div>
              </>
            )}

            {/* Next Button */}
            {selectedMatch && (
              <div className="sticky bottom-4 pt-4">
                <button
                  onClick={handleConfigure}
                  className="w-full px-4 py-3 gradient-bg hover:opacity-90 rounded-lg text-white font-medium transition-all flex items-center justify-center gap-2 shadow-lg"
                >
                  Configure Oracle for {selectedMatch.homeTeam.name} vs {selectedMatch.awayTeam.name}
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {step === 'configure' && selectedMatch && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left - Config */}
          <div className="lg:col-span-2 space-y-6">
            {/* Selected Match Summary */}
            <div className="bg-[#252620] rounded-lg border border-[#3a3b35] p-6">
              <h3 className="text-lg font-semibold gradient-text mb-4">Selected Match</h3>
              <MatchCard match={selectedMatch} isSelected={true} onSelect={() => {}} />
            </div>

            {/* Oracle Output Type */}
            <div className="bg-[#252620] rounded-lg border border-[#3a3b35] p-6">
              <h3 className="text-lg font-semibold gradient-text mb-4">
                Oracle Output Type
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {(Object.keys(OUTPUT_TYPE_INFO) as OracleOutputType[]).map((type) => {
                  const info = OUTPUT_TYPE_INFO[type]
                  return (
                    <button
                      key={type}
                      onClick={() => { playPickupSound(); setOracleConfig(prev => ({ ...prev, outputType: type })); }}
                      className={`p-4 rounded-lg border-2 text-left transition-all ${
                        oracleConfig.outputType === type
                          ? 'border-feedgod-primary bg-feedgod-primary/10'
                          : 'border-[#3a3b35] bg-[#1D1E19] hover:border-feedgod-primary/50'
                      }`}
                    >
                      <div className="font-medium text-white mb-1">{info.label}</div>
                      <div className="text-xs text-gray-400 mb-2">{info.description}</div>
                      <div className="text-xs font-mono bg-[#1D1E19] border border-[#3a3b35] text-green-400 p-2 rounded">
                        {info.format}
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Chain Selection */}
            <div className="bg-[#252620] rounded-lg border border-[#3a3b35] p-6">
              <h3 className="text-lg font-semibold gradient-text mb-4">
                Deployment Settings
              </h3>
              
              <div className="space-y-4">
                <ChainSelector
                  blockchain={oracleConfig.blockchain || 'solana'}
                  network={oracleConfig.network || 'mainnet'}
                  onBlockchainChange={(blockchain) => setOracleConfig(prev => ({ ...prev, blockchain }))}
                  onNetworkChange={(network) => setOracleConfig(prev => ({ ...prev, network }))}
                />
                
                <div>
                  <label className="block text-sm font-medium text-white mb-2 flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    Update Interval
                  </label>
                  <select
                    value={oracleConfig.updateInterval}
                    onChange={(e) => setOracleConfig(prev => ({ ...prev, updateInterval: parseInt(e.target.value) }))}
                    className="w-full bg-[#1D1E19] border border-[#3a3b35] rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-feedgod-primary"
                  >
                    <option value="60">Every minute</option>
                    <option value="300">Every 5 minutes</option>
                    <option value="900">Every 15 minutes</option>
                    <option value="3600">Every hour</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Right - Summary & Actions */}
          <div className="space-y-4">
            <div className="bg-gradient-to-br from-green-400/10 to-emerald-600/10 rounded-lg border border-green-400/20 p-6">
              <h4 className="text-sm font-semibold gradient-text mb-4">
                Oracle Summary
              </h4>
              
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Match</span>
                  <span className="text-white font-medium text-right">
                    {selectedMatch.homeTeam.name} vs {selectedMatch.awayTeam.name}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Output</span>
                  <span className="text-white font-medium">
                    {OUTPUT_TYPE_INFO[oracleConfig.outputType || 'winner'].label}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500">Chain</span>
                  <div className="flex items-center gap-1.5">
                    <img 
                      src={CHAIN_LOGOS[oracleConfig.blockchain || 'solana']}
                      alt={oracleConfig.blockchain}
                      className="w-4 h-4 object-contain"
                    />
                    <span className="text-white font-medium capitalize">{oracleConfig.blockchain}</span>
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
                className="w-full px-4 py-2 text-sm text-gray-400 hover:text-feedgod-primary transition-colors"
              >
                Back to Browse
              </button>
            </div>
          </div>
        </div>
      )}

      {step === 'preview' && selectedMatch && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Config Preview */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-[#252620] rounded-lg border border-[#3a3b35] p-6">
              <h3 className="text-lg font-semibold gradient-text mb-4">
                Switchboard Oracle Configuration
              </h3>
              
              <div className="bg-[#1D1E19] rounded-lg p-4 overflow-x-auto border border-[#3a3b35]">
                <pre className="text-sm text-green-400 font-mono">
                  {JSON.stringify(generateConfig(), null, 2)}
                </pre>
              </div>
            </div>

            {/* How it works */}
            <div className="bg-[#252620] rounded-lg border border-[#3a3b35] p-6">
              <h4 className="text-sm font-semibold gradient-text mb-4">
                How This Oracle Works
              </h4>
              
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full gradient-bg flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-bold text-white">1</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">Match Monitoring</p>
                    <p className="text-xs text-gray-400">
                      Oracle monitors {selectedMatch.homeTeam.name} vs {selectedMatch.awayTeam.name} for result
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full gradient-bg flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-bold text-white">2</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">Result Resolution</p>
                    <p className="text-xs text-gray-400">
                      When match ends, oracle outputs: {OUTPUT_TYPE_INFO[oracleConfig.outputType || 'winner'].format}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full gradient-bg flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-bold text-white">3</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">On-Chain Settlement</p>
                    <p className="text-xs text-gray-400">
                      Smart contracts can read the result for betting, prediction markets, and more
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right - Actions */}
          <div className="space-y-4">
            <div className="bg-gradient-to-br from-green-400/10 to-emerald-600/10 rounded-lg border border-green-400/20 p-6">
              <h4 className="text-sm font-semibold gradient-text mb-4">
                Final Summary
              </h4>
              
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">League</span>
                  <span className="text-white font-medium">
                    {selectedMatch.league.name}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Match Time</span>
                  <span className="text-white font-medium">
                    {formatMatchTime(selectedMatch.startTime)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500">Chain</span>
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
                className="w-full px-4 py-3 bg-[#252620] border border-[#3a3b35] hover:bg-[#2a2b25] rounded-lg text-white font-medium transition-colors flex items-center justify-center gap-2"
              >
                <Save className="w-4 h-4" />
                Save Configuration
              </button>
              <button
                onClick={handleBack}
                className="w-full px-4 py-2 text-sm text-gray-400 hover:text-feedgod-primary transition-colors"
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

