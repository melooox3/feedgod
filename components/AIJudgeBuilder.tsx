'use client'

import { useState } from 'react'
import { 
  Brain,
  AlertTriangle,
  ChevronRight,
  Play,
  Save,
  Clock,
  Calendar,
  Sparkles,
  CheckCircle,
  XCircle,
  Loader2,
  DollarSign,
  Lightbulb,
  Shield,
  Info,
  Plus,
  X,
  Zap,
  Target,
  Scale,
  Hash,
  ListChecks,
  FileText,
  Newspaper,
  BookOpen,
  Cloud,
  Trophy,
  TrendingUp,
  Landmark,
  Link,
  LucideIcon
} from 'lucide-react'
import XLogo from './XLogo'
import { 
  AIJudgeConfig,
  AIResolutionRequest,
  AIResolutionResponse,
  ResolutionType,
  TrustedSource,
  ResolutionIconName,
  SourceIconName,
  RESOLUTION_TYPES,
  TRUSTED_SOURCES,
  EXAMPLE_QUESTIONS
} from '@/types/ai-judge'

// Resolution type icon mapping
const RESOLUTION_ICON_MAP: Record<ResolutionIconName, LucideIcon> = {
  Scale,
  Hash,
  ListChecks,
  FileText,
}

// Source icon mapping (XLogo is custom for X/Twitter, others from Lucide)
const SOURCE_ICON_MAP: Record<SourceIconName, LucideIcon | typeof XLogo> = {
  Newspaper,
  XLogo,
  BookOpen,
  Cloud,
  Trophy,
  TrendingUp,
  Landmark,
  Link,
}
import { Blockchain, Network } from '@/types/feed'
import { playPickupSound } from '@/lib/sound-utils'
import { useCostEstimate } from '@/lib/use-cost-estimate'
import ChainSelector from './ChainSelector'

type BuilderStep = 'create' | 'configure' | 'preview'

// Chain logo mapping
const CHAIN_LOGOS: Record<string, string> = {
  solana: '/solana.png',
  ethereum: '/ethereum.png',
  monad: '/monad.png',
}

// Cost Estimate Display
function CostEstimateDisplay({ blockchain, network }: { blockchain: string; network: string }) {
  const { estimate, isLoading } = useCostEstimate(blockchain as Blockchain, network as Network, 'function')

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
          <div className="text-base font-semibold text-white">
            {estimate.estimatedCost} {estimate.currency}
          </div>
        </div>
      </div>
    </div>
  )
}

// Warning banner for AI risks
function AIWarningBanner() {
  return (
    <div className="mb-6 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-300 dark:border-amber-700/50 rounded-xl">
      <div className="flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
        <div>
          <h4 className="font-semibold text-amber-800 dark:text-amber-300 text-sm">
            AI Judgment Disclaimer
          </h4>
          <p className="text-xs text-amber-700 dark:text-amber-400/80 mt-1">
            AI oracles use language models to evaluate questions, which can hallucinate or make errors. 
            <strong> Best for low-stakes, fun predictions.</strong> Not recommended for high-value financial decisions.
            Always verify AI judgments against authoritative sources.
          </p>
        </div>
      </div>
    </div>
  )
}

// Resolution type selector
function ResolutionTypeSelector({ 
  selected, 
  onSelect 
}: { 
  selected: ResolutionType
  onSelect: (type: ResolutionType) => void 
}) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {RESOLUTION_TYPES.map((type) => {
        const TypeIcon = RESOLUTION_ICON_MAP[type.iconName]
        const isSelected = selected === type.value
        return (
          <button
            key={type.value}
            onClick={() => { playPickupSound(); onSelect(type.value); }}
            className={`p-4 rounded-xl border-2 transition-all text-left ${
              isSelected
                ? 'border-[#ff0d6e] bg-[#2d2530]'
                : 'border-[#3a3b35] bg-[#252620]/80 hover:border-[#ff0d6e]/50'
            }`}
          >
            <div className="mb-2">
              <TypeIcon className={`w-7 h-7 ${isSelected ? 'text-white' : 'text-[#ff0d6e]'}`} />
            </div>
            <h4 className="font-semibold text-white text-sm">{type.label}</h4>
            <p className="text-xs text-gray-400 mt-1">
              {type.description}
            </p>
          </button>
        )
      })}
    </div>
  )
}

// Source selector
function SourceSelector({ 
  selected, 
  onToggle 
}: { 
  selected: TrustedSource[]
  onToggle: (source: TrustedSource) => void 
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {TRUSTED_SOURCES.map((source) => {
        const SourceIcon = SOURCE_ICON_MAP[source.iconName]
        return (
          <button
            key={source.value}
            onClick={() => { playPickupSound(); onToggle(source.value); }}
            className={`px-3 py-2 rounded-lg border transition-all flex items-center gap-2 ${
              selected.includes(source.value)
                ? 'border-[#ff0d6e] bg-[#2d2530] text-white'
                : 'border-[#3a3b35] bg-[#252620]/80 text-white hover:border-[#ff0d6e]/50'
            }`}
          >
            <SourceIcon className="w-4 h-4" />
            <span className="text-sm font-medium">{source.label}</span>
          </button>
        )
      })}
    </div>
  )
}

// Example question cards
function ExampleQuestions({ onSelect }: { onSelect: (q: typeof EXAMPLE_QUESTIONS[0]) => void }) {
  return (
    <div className="space-y-2">
      <p className="text-xs text-gray-400 flex items-center gap-1">
        <Lightbulb className="w-3 h-3" />
        Example questions for inspiration:
      </p>
      <div className="flex flex-wrap gap-2">
        {EXAMPLE_QUESTIONS.slice(0, 5).map((example, i) => (
          <button
            key={i}
            onClick={() => { playPickupSound(); onSelect(example); }}
            className="px-3 py-1.5 bg-feedgod-purple-50 dark:bg-feedgod-dark-secondary dark:bg-feedgod-purple-200 dark:border-feedgod-dark-accent hover:bg-feedgod-purple-100 dark:bg-feedgod-dark-accent rounded-full text-xs text-white transition-colors truncate max-w-[250px]"
          >
            {example.question}
          </button>
        ))}
      </div>
    </div>
  )
}

// AI Resolution preview
function ResolutionPreview({ 
  response, 
  isLoading 
}: { 
  response: AIResolutionResponse | null
  isLoading: boolean 
}) {
  if (isLoading) {
    return (
      <div className="p-6 bg-[#252620] rounded-xl border border-feedgod-secondary/30 text-center">
        <Loader2 className="w-8 h-8 animate-spin mx-auto gradient-text mb-3" />
        <p className="text-sm text-white">AI is analyzing your question...</p>
        <p className="text-xs text-gray-400 mt-1">
          Consulting trusted sources...
        </p>
      </div>
    )
  }
  
  if (!response) return null
  
  return (
    <div className="p-6 bg-[#252620] rounded-xl border border-feedgod-secondary/30">
      <div className="flex items-center justify-between mb-4">
        <h4 className="font-semibold gradient-text flex items-center gap-2">
          <Brain className="w-5 h-5" />
          AI Resolution Preview
        </h4>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400">Confidence:</span>
          <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
            response.confidence >= 85 ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' :
            response.confidence >= 70 ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
            'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
          }`}>
            {response.confidence}%
          </span>
        </div>
      </div>
      
      {/* Answer */}
      <div className="mb-4 p-4 bg-feedgod-dark-secondary/60 dark:bg-feedgod-purple-50 dark:bg-feedgod-dark-secondary rounded-lg">
        <p className="text-xs text-gray-400 mb-1">Answer:</p>
        <div className="flex items-center gap-2">
          {typeof response.answer === 'boolean' ? (
            <>
              {response.answer ? (
                <CheckCircle className="w-6 h-6 text-emerald-500" />
              ) : (
                <XCircle className="w-6 h-6 text-red-500" />
              )}
              <span className="text-2xl font-bold text-white">
                {response.answer ? 'YES' : 'NO'}
              </span>
            </>
          ) : (
            <span className="text-2xl font-bold text-white">
              {String(response.answer)}
            </span>
          )}
        </div>
      </div>
      
      {/* Reasoning */}
      <div className="mb-4">
        <p className="text-xs text-gray-400 mb-1">Reasoning:</p>
        <p className="text-sm text-white/90">{response.reasoning}</p>
      </div>
      
      {/* Sources */}
      <div className="mb-4">
        <p className="text-xs text-gray-400 mb-1">Sources consulted:</p>
        <div className="flex flex-wrap gap-1">
          {response.sources.map((source, i) => (
            <span key={i} className="px-2 py-0.5 bg-feedgod-purple-100 dark:bg-feedgod-dark-accent dark:bg-feedgod-purple-200 dark:border-feedgod-dark-accent rounded text-xs text-white">
              {source}
            </span>
          ))}
        </div>
      </div>
      
      {/* Warning */}
      {response.warning && (
        <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-700/30">
          <p className="text-xs text-amber-700 dark:text-amber-400 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            {response.warning}
          </p>
        </div>
      )}
    </div>
  )
}

export default function AIJudgeBuilder() {
  const [step, setStep] = useState<BuilderStep>('create')
  
  // Config state
  const [config, setConfig] = useState<Partial<AIJudgeConfig>>({
    question: '',
    resolutionType: 'binary',
    trustedSources: ['news'],
    categories: [],
    customSources: [],
    blockchain: 'solana',
    network: 'mainnet',
    enabled: true,
  })
  
  // UI state
  const [resolutionPreview, setResolutionPreview] = useState<AIResolutionResponse | null>(null)
  const [isTestingResolution, setIsTestingResolution] = useState(false)
  const [newCategory, setNewCategory] = useState('')
  const [newCustomSource, setNewCustomSource] = useState('')
  
  const toggleSource = (source: TrustedSource) => {
    setConfig(prev => ({
      ...prev,
      trustedSources: prev.trustedSources?.includes(source)
        ? prev.trustedSources.filter(s => s !== source)
        : [...(prev.trustedSources || []), source]
    }))
  }
  
  const addCategory = () => {
    if (newCategory.trim() && !config.categories?.includes(newCategory.trim())) {
      setConfig(prev => ({
        ...prev,
        categories: [...(prev.categories || []), newCategory.trim()]
      }))
      setNewCategory('')
    }
  }
  
  const removeCategory = (cat: string) => {
    setConfig(prev => ({
      ...prev,
      categories: prev.categories?.filter(c => c !== cat) || []
    }))
  }
  
  const addCustomSource = () => {
    if (newCustomSource.trim() && !config.customSources?.includes(newCustomSource.trim())) {
      setConfig(prev => ({
        ...prev,
        customSources: [...(prev.customSources || []), newCustomSource.trim()]
      }))
      setNewCustomSource('')
    }
  }
  
  const removeCustomSource = (source: string) => {
    setConfig(prev => ({
      ...prev,
      customSources: prev.customSources?.filter(s => s !== source) || []
    }))
  }
  
  const handleExampleSelect = (example: typeof EXAMPLE_QUESTIONS[0]) => {
    setConfig(prev => ({
      ...prev,
      question: example.question,
      resolutionType: example.type,
      trustedSources: example.sources,
    }))
  }
  
  const handleTestResolution = async () => {
    if (!config.question || config.question.trim().length < 10) {
      alert('Please enter a question (at least 10 characters)')
      return
    }
    
    playPickupSound()
    setIsTestingResolution(true)
    setResolutionPreview(null)
    
    try {
      const request: AIResolutionRequest = {
        question: config.question,
        resolutionType: config.resolutionType || 'binary',
        trustedSources: config.trustedSources || [],
        customSources: config.customSources,
        categories: config.categories,
        currentDate: new Date().toISOString(),
      }
      
      const response = await fetch('/api/ai-resolve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
      })
      
      const data: AIResolutionResponse = await response.json()
      setResolutionPreview(data)
    } catch (error) {
      console.error('Resolution test failed:', error)
      alert('Failed to test resolution')
    } finally {
      setIsTestingResolution(false)
    }
  }
  
  const handleContinue = () => {
    if (!config.question || config.question.trim().length < 10) {
      alert('Please enter a question')
      return
    }
    playPickupSound()
    setStep('configure')
  }
  
  const handlePreview = () => {
    if (!config.resolutionDate) {
      alert('Please select a resolution date')
      return
    }
    playPickupSound()
    setStep('preview')
  }
  
  const handleBack = () => {
    playPickupSound()
    if (step === 'preview') setStep('configure')
    else if (step === 'configure') setStep('create')
  }
  
  const handleDeploy = () => {
    playPickupSound()
    console.log('Deploying AI Judge oracle:', config)
    alert('AI Judge Oracle deployed! (Demo - in production this would deploy to Switchboard)')
  }
  
  const handleSave = () => {
    playPickupSound()
    const fullConfig = {
      ...config,
      id: `ai-judge-${Date.now()}`,
      name: config.name || `AI Oracle: ${config.question?.slice(0, 30)}...`,
      createdAt: new Date(),
    }
    
    const saved = localStorage.getItem('savedAIJudgeOracles')
    const oracles = saved ? JSON.parse(saved) : []
    oracles.push(fullConfig)
    localStorage.setItem('savedAIJudgeOracles', JSON.stringify(oracles))
    alert('AI Judge Oracle saved! View it in your Profile tab.')
  }
  
  // Generate config preview
  const generateConfigPreview = () => {
    return {
      type: 'ai-judge',
      question: config.question,
      resolutionType: config.resolutionType,
      resolutionDate: config.resolutionDate?.toISOString(),
      trustedSources: config.trustedSources,
      customSources: config.customSources,
      categories: config.categories,
      chain: config.blockchain,
      network: config.network,
      aiModel: 'gpt-4-turbo', // Example
      outputFormat: config.resolutionType === 'binary' ? 'uint8 (0=NO, 1=YES)' :
                    config.resolutionType === 'numeric' ? 'int128' :
                    'bytes32 (hash)',
    }
  }

  return (
    <div className="space-y-6">
      {/* Module Header */}
      <div className="bg-[#252620]/80 rounded-lg border border-[#3a3b35] p-6 backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#ff0d6e] flex items-center justify-center">
              <Brain className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">
                AI Judge
              </h2>
              <p className="text-sm text-gray-400">
                Any question → On-chain answer via AI reasoning
              </p>
            </div>
          </div>
          
          {/* Step indicator */}
          <div className="flex items-center gap-2">
            <div className={`px-2.5 py-1 rounded text-xs font-medium ${
              step === 'create' ? 'bg-[#ff0d6e]/20 text-[#ff0d6e]' : 'bg-[#2a2b25] text-gray-500'
            }`}>
              1. Question
            </div>
            <ChevronRight className="w-3 h-3 text-gray-600" />
            <div className={`px-2.5 py-1 rounded text-xs font-medium ${
              step === 'configure' ? 'bg-[#ff0d6e]/20 text-[#ff0d6e]' : 'bg-[#2a2b25] text-gray-500'
            }`}>
              2. Configure
            </div>
            <ChevronRight className="w-3 h-3 text-gray-600" />
            <div className={`px-2.5 py-1 rounded text-xs font-medium ${
              step === 'preview' ? 'bg-[#ff0d6e]/20 text-[#ff0d6e]' : 'bg-[#2a2b25] text-gray-500'
            }`}>
              3. Deploy
            </div>
          </div>
        </div>
      </div>

      {/* Warning Banner */}
      <AIWarningBanner />

      {step === 'create' && (
        <div className="space-y-6">
          {/* Question Input */}
          <div className="bg-[#252620]/80 rounded-lg border border-[#3a3b35] p-6 backdrop-blur-sm">
            <h3 className="text-sm font-medium text-gray-300 mb-3">
              What question should the AI resolve?
            </h3>
            
            <textarea
              value={config.question || ''}
              onChange={(e) => setConfig(prev => ({ ...prev, question: e.target.value }))}
              placeholder="Enter your question... (e.g., 'Did Taylor Swift release a new album this week?')"
              className="w-full h-32 bg-[#1D1E19] border border-[#3a3b35] rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#ff0d6e] resize-none"
            />
            
            <div className="mt-4">
              <ExampleQuestions onSelect={handleExampleSelect} />
            </div>
          </div>

          {/* Resolution Type */}
          <div className="bg-[#252620]/80 rounded-lg border border-[#3a3b35] p-6 backdrop-blur-sm">
            <h3 className="text-sm font-medium text-gray-300 mb-3">
              Resolution Type
            </h3>
            <ResolutionTypeSelector
              selected={config.resolutionType || 'binary'}
              onSelect={(type) => setConfig(prev => ({ ...prev, resolutionType: type }))}
            />
            
            {/* Categories input for categorical type */}
            {config.resolutionType === 'categorical' && (
              <div className="mt-4 p-4 bg-feedgod-purple-50 dark:bg-feedgod-dark-secondary dark:bg-feedgod-purple-200 dark:border-feedgod-dark-accent rounded-lg">
                <label className="block text-sm font-medium text-white mb-2">
                  Define possible answers:
                </label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addCategory()}
                    placeholder="Add an option..."
                    className="flex-1 bg-feedgod-dark-secondary dark:bg-feedgod-purple-50 dark:bg-feedgod-dark-secondary border border-[#3a3b35] rounded-lg px-3 py-2 text-sm text-white"
                  />
                  <button
                    onClick={addCategory}
                    className="px-3 py-2 bg-feedgod-primary dark:text-feedgod-primary text-white rounded-lg"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {config.categories?.map((cat) => (
                    <span key={cat} className="px-3 py-1 bg-feedgod-primary dark:text-feedgod-primary/10 border border-feedgod-primary dark:text-feedgod-primary rounded-full text-sm text-feedgod-primary dark:text-feedgod-primary flex items-center gap-1">
                      {cat}
                      <button onClick={() => removeCategory(cat)} className="hover:text-red-500">
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Trusted Sources */}
          <div className="bg-[#252620]/80 rounded-lg border border-[#3a3b35] p-6 backdrop-blur-sm">
            <h3 className="text-sm font-medium text-gray-300 mb-4">
              Trusted Sources
            </h3>
            <p className="text-sm text-gray-400 mb-4">
              Select sources the AI should consult when resolving
            </p>
            <SourceSelector
              selected={config.trustedSources || []}
              onToggle={toggleSource}
            />
            
            {/* Custom sources */}
            {config.trustedSources?.includes('custom') && (
              <div className="mt-4 p-4 bg-feedgod-purple-50 dark:bg-feedgod-dark-secondary dark:bg-feedgod-purple-200 dark:border-feedgod-dark-accent rounded-lg">
                <label className="block text-sm font-medium text-white mb-2">
                  Custom source URLs:
                </label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={newCustomSource}
                    onChange={(e) => setNewCustomSource(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addCustomSource()}
                    placeholder="https://example.com/data"
                    className="flex-1 bg-feedgod-dark-secondary dark:bg-feedgod-purple-50 dark:bg-feedgod-dark-secondary border border-[#3a3b35] rounded-lg px-3 py-2 text-sm text-white"
                  />
                  <button
                    onClick={addCustomSource}
                    className="px-3 py-2 bg-feedgod-primary dark:text-feedgod-primary text-white rounded-lg"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {config.customSources?.map((source) => (
                    <span key={source} className="px-3 py-1 bg-feedgod-primary dark:text-feedgod-primary/10 border border-feedgod-primary dark:text-feedgod-primary rounded-full text-xs text-feedgod-primary dark:text-feedgod-primary flex items-center gap-1 max-w-[200px] truncate">
                      {source}
                      <button onClick={() => removeCustomSource(source)} className="hover:text-red-500">
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Test Resolution */}
          <div className="bg-[#252620]/80 rounded-lg border border-[#3a3b35] p-6 backdrop-blur-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-gray-300">
                Test AI Resolution
              </h3>
              <button
                onClick={handleTestResolution}
                disabled={isTestingResolution || !config.question || config.question.length < 10}
                className="px-4 py-2 bg-gradient-to-r from-feedgod-primary to-pink-500 hover:from-feedgod-primary hover:to-pink-600 disabled:opacity-50 rounded-lg text-white font-medium transition-all flex items-center gap-2"
              >
                {isTestingResolution ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Sparkles className="w-4 h-4" />
                )}
                Test Now
              </button>
            </div>
            
            <ResolutionPreview response={resolutionPreview} isLoading={isTestingResolution} />
            
            {!resolutionPreview && !isTestingResolution && (
              <div className="p-6 border-2 border-dashed border-[#3a3b35] rounded-xl text-center">
                <Brain className="w-12 h-12 mx-auto text-feedgod-purple-300 dark:border-feedgod-dark-accent dark:text-feedgod-purple-200 dark:border-feedgod-dark-accent mb-3" />
                <p className="text-sm text-gray-400">
                  Click "Test Now" to see how AI would resolve your question
                </p>
              </div>
            )}
          </div>

          {/* Continue Button */}
          <button
            onClick={handleContinue}
            disabled={!config.question || config.question.length < 10}
            className="w-full px-4 py-2.5 gradient-bg hover:opacity-90 disabled:opacity-50 rounded-lg text-white font-medium transition-all flex items-center justify-center gap-2"
          >
            Continue to Configure
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {step === 'configure' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Oracle Settings */}
            <div className="bg-[#252620]/80 rounded-lg border border-[#3a3b35] p-6 backdrop-blur-sm">
              <h3 className="text-sm font-medium text-gray-300 mb-4">
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
                    value={config.name || ''}
                    onChange={(e) => setConfig(prev => ({ ...prev, name: e.target.value }))}
                    placeholder={`AI Oracle: ${config.question?.slice(0, 30)}...`}
                    className="w-full bg-feedgod-purple-50 dark:bg-feedgod-dark-secondary dark:bg-feedgod-purple-200 dark:border-feedgod-dark-accent border border-[#3a3b35] rounded-lg px-4 py-2 text-white"
                  />
                </div>
                
                {/* Resolution Date */}
                <div>
                  <label className="block text-sm font-medium text-white mb-2 flex items-center gap-2">
                    <Calendar className="w-4 h-4" color="white" style={{ color: 'white', stroke: 'white' }} />
                    Resolution Date
                  </label>
                  <input
                    type="datetime-local"
                    value={config.resolutionDate ? new Date(config.resolutionDate.getTime() - config.resolutionDate.getTimezoneOffset() * 60000).toISOString().slice(0, 16) : ''}
                    onChange={(e) => setConfig(prev => ({ ...prev, resolutionDate: new Date(e.target.value) }))}
                    min={new Date().toISOString().slice(0, 16)}
                    className="w-full bg-[#1D1E19] border border-[#3a3b35] rounded-lg px-4 py-2 text-white [color-scheme:dark] date-input-white"
                    style={{ colorScheme: 'dark' }}
                  />
                  <p className="text-xs text-gray-400 /60 mt-1">
                    When should the AI evaluate and resolve this question?
                  </p>
                </div>
                
                {/* Resolution Criteria */}
                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Resolution Criteria (optional)
                  </label>
                  <textarea
                    value={config.resolutionCriteria || ''}
                    onChange={(e) => setConfig(prev => ({ ...prev, resolutionCriteria: e.target.value }))}
                    placeholder="Additional context or rules for resolution... (e.g., 'Must be confirmed by at least 2 major news sources')"
                    className="w-full h-24 bg-feedgod-purple-50 dark:bg-feedgod-dark-secondary dark:bg-feedgod-purple-200 dark:border-feedgod-dark-accent border border-[#3a3b35] rounded-lg px-4 py-3 text-white placeholder-feedgod-feedgod-secondary dark:text-feedgod-secondary/70 resize-none"
                  />
                </div>
                
                {/* Chain Selection */}
                <ChainSelector
                  blockchain={config.blockchain || 'solana'}
                  network={config.network || 'mainnet'}
                  onBlockchainChange={(blockchain) => setConfig(prev => ({ ...prev, blockchain }))}
                  onNetworkChange={(network) => setConfig(prev => ({ ...prev, network }))}
                />
              </div>
            </div>

            {/* Question Preview */}
            <div className="bg-[#252620] rounded-lg border border-feedgod-secondary/20 p-6">
              <h4 className="text-sm font-medium text-gray-400 mb-3">
                Question to Resolve
              </h4>
              <p className="text-lg text-white font-medium">
                "{config.question}"
              </p>
              <div className="mt-4 flex flex-wrap gap-2 text-xs">
                {(() => {
                  const resType = RESOLUTION_TYPES.find(t => t.value === config.resolutionType)
                  if (!resType) return null
                  const ResIcon = RESOLUTION_ICON_MAP[resType.iconName]
                  return (
                    <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded flex items-center gap-1">
                      <ResIcon className="w-3 h-3" /> {config.resolutionType}
                    </span>
                  )
                })()}
                {config.trustedSources?.map(source => {
                  const sourceInfo = TRUSTED_SOURCES.find(s => s.value === source)
                  if (!sourceInfo) return null
                  const SrcIcon = SOURCE_ICON_MAP[sourceInfo.iconName]
                  return (
                    <span key={source} className="px-2 py-1 bg-feedgod-purple-100 dark:bg-feedgod-dark-accent dark:bg-feedgod-purple-200 dark:border-feedgod-dark-accent text-white rounded flex items-center gap-1">
                      <SrcIcon className="w-3 h-3" /> {source}
                    </span>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Right sidebar */}
          <div className="space-y-4">
            <div className="bg-[#252620] rounded-lg border border-feedgod-secondary/20 p-6">
              <h4 className="text-sm font-medium text-gray-400 mb-4">
                Oracle Summary
              </h4>
              
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Type</span>
                  <span className="text-white font-medium">
                    AI Judge
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Resolution</span>
                  <span className="text-white font-medium capitalize">
                    {config.resolutionType}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Sources</span>
                  <span className="text-white font-medium">
                    {config.trustedSources?.length || 0} selected
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Chain</span>
                  <div className="flex items-center gap-1.5">
                    <img 
                      src={CHAIN_LOGOS[config.blockchain || 'solana']}
                      alt={config.blockchain}
                      className="w-4 h-4 object-contain"
                    />
                    <span className="text-white font-medium capitalize">
                      {config.blockchain}
                    </span>
                  </div>
                </div>
                {config.resolutionDate && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">Resolves</span>
                    <span className="text-white font-medium">
                      {config.resolutionDate.toLocaleDateString()}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <CostEstimateDisplay
              blockchain={config.blockchain || 'solana'}
              network={config.network || 'mainnet'}
            />

            <div className="flex flex-col gap-3">
              <button
                onClick={handlePreview}
                disabled={!config.resolutionDate}
                className="w-full px-4 py-2.5 gradient-bg hover:opacity-90 disabled:opacity-50 rounded-lg text-white font-medium transition-all flex items-center justify-center gap-2"
              >
                Preview & Deploy
                <ChevronRight className="w-4 h-4" />
              </button>
              <button
                onClick={handleBack}
                className="w-full px-4 py-2 text-sm text-gray-400 hover:text-feedgod-primary dark:text-feedgod-primary transition-colors"
              >
                Back to Question
              </button>
            </div>
          </div>
        </div>
      )}

      {step === 'preview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Config Preview */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-[#252620]/80 rounded-lg border border-[#3a3b35] p-6 backdrop-blur-sm">
              <h3 className="text-sm font-medium text-gray-300 mb-4">
                Switchboard Oracle Configuration
              </h3>
              
              <div className="bg-feedgod-dark-secondary dark:bg-black rounded-lg p-4 overflow-x-auto">
                <pre className="text-sm text-green-400 font-mono">
                  {JSON.stringify(generateConfigPreview(), null, 2)}
                </pre>
              </div>
            </div>

            {/* How it works */}
            <div className="bg-[#252620]/80 rounded-lg border border-[#3a3b35] p-6 backdrop-blur-sm">
              <h4 className="text-sm font-medium text-gray-400 mb-4 flex items-center gap-2">
                <Info className="w-4 h-4" />
                How AI Resolution Works
              </h4>
              
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-[#ff0d6e] flex items-center justify-center text-xs font-bold text-white">1</div>
                  <div>
                    <h5 className="font-medium text-white text-sm">Scheduled Trigger</h5>
                    <p className="text-xs text-gray-400">
                      At resolution time, Switchboard function wakes up
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-[#ff0d6e] flex items-center justify-center text-xs font-bold text-white">2</div>
                  <div>
                    <h5 className="font-medium text-white text-sm">AI Consultation</h5>
                    <p className="text-xs text-gray-400">
                      LLM evaluates question using trusted sources
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-[#ff0d6e] flex items-center justify-center text-xs font-bold text-white">3</div>
                  <div>
                    <h5 className="font-medium text-white text-sm">On-Chain Resolution</h5>
                    <p className="text-xs text-gray-400">
                      Answer posted to oracle with confidence score
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Use cases */}
            <div className="bg-[#252620]/80 rounded-lg border border-[#3a3b35] p-6 backdrop-blur-sm">
              <h4 className="text-sm font-medium text-gray-400 mb-4">
                Use Cases
              </h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-feedgod-purple-50 dark:bg-feedgod-dark-secondary dark:bg-feedgod-purple-200 dark:border-feedgod-dark-accent rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Target className="w-5 h-5 text-feedgod-primary" />
                    <span className="font-medium text-white">Prediction Markets</span>
                  </div>
                  <p className="text-xs text-gray-400">
                    Resolve any real-world event without custom code
                  </p>
                </div>
                <div className="p-4 bg-feedgod-purple-50 dark:bg-feedgod-dark-secondary dark:bg-feedgod-purple-200 dark:border-feedgod-dark-accent rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Zap className="w-5 h-5 text-amber-500" />
                    <span className="font-medium text-white">Smart Contracts</span>
                  </div>
                  <p className="text-xs text-gray-400">
                    Trigger contract logic based on AI verification
                  </p>
                </div>
                <div className="p-4 bg-feedgod-purple-50 dark:bg-feedgod-dark-secondary dark:bg-feedgod-purple-200 dark:border-feedgod-dark-accent rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Shield className="w-5 h-5 text-emerald-500" />
                    <span className="font-medium text-white">Insurance</span>
                  </div>
                  <p className="text-xs text-gray-400">
                    Auto-resolve parametric insurance claims
                  </p>
                </div>
                <div className="p-4 bg-feedgod-purple-50 dark:bg-feedgod-dark-secondary dark:bg-feedgod-purple-200 dark:border-feedgod-dark-accent rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="w-5 h-5 text-pink-500" />
                    <span className="font-medium text-white">Fun Bets</span>
                  </div>
                  <p className="text-xs text-gray-400">
                    Social bets on anything imaginable
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right - Actions */}
          <div className="space-y-4">
            <div className="bg-[#252620] rounded-lg border border-feedgod-secondary/20 p-6">
              <h4 className="text-sm font-medium text-gray-400 mb-4">
                Final Summary
              </h4>
              
              <div className="space-y-3 text-sm">
                <div>
                  <span className="text-gray-400 block text-xs">Question:</span>
                  <span className="text-white font-medium text-sm">
                    "{config.question?.slice(0, 60)}..."
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Resolves</span>
                  <span className="text-white font-medium">
                    {config.resolutionDate?.toLocaleDateString()}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Chain</span>
                  <div className="flex items-center gap-1.5">
                    <img 
                      src={CHAIN_LOGOS[config.blockchain || 'solana']}
                      alt={config.blockchain}
                      className="w-4 h-4 object-contain"
                    />
                    <span className="text-white font-medium capitalize">
                      {config.blockchain}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Final Warning */}
            <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700/30 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-amber-700 dark:text-amber-400">
                  AI judgments may contain errors. Use for low-stakes applications only.
                </p>
              </div>
            </div>

            <CostEstimateDisplay
              blockchain={config.blockchain || 'solana'}
              network={config.network || 'mainnet'}
            />

            <div className="flex flex-col gap-3">
              <button
                onClick={handleDeploy}
                className="w-full px-4 py-2.5 gradient-bg hover:opacity-90 rounded-lg text-white font-medium transition-all flex items-center justify-center gap-2"
              >
                <Play className="w-4 h-4" />
                Deploy Oracle
              </button>
              <button
                onClick={handleSave}
                className="w-full px-4 py-2.5 bg-[#2a2b25] hover:bg-[#3a3b35] rounded-lg text-gray-300 text-sm font-medium transition-colors flex items-center justify-center gap-2"
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


