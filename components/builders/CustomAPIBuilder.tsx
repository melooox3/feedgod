'use client'

import { useState, useEffect } from 'react'
import { 
  Globe,
  ChevronRight,
  Play,
  Save,
  Clock,
  Loader2,
  DollarSign,
  Plus,
  X,
  Zap,
  Link2,
  Settings,
  CheckCircle,
  AlertCircle,
  ArrowRight,
  Code,
  RefreshCw,
  Bitcoin,
  Coins,
  Thermometer,
  Star,
  Smartphone,
  ArrowLeftRight,
  Dices,
  TrendingUp,
  LucideIcon
} from 'lucide-react'
import { 
  CustomAPIConfig,
  APIHeader,
  APITestResult,
  TransformStep,
  APIIconName,
  API_TEMPLATES,
  TRANSFORM_TYPES
} from '@/types/custom-api'

// API template icon mapping
const API_ICON_MAP: Record<APIIconName, LucideIcon> = {
  Bitcoin,
  Coins,
  Thermometer,
  Star,
  Smartphone,
  ArrowLeftRight,
  Globe,
  Dices,
}
import { Blockchain, Network } from '@/types/feed'
import { 
  testEndpoint, 
  extractValue, 
  applyTransforms, 
  isValidUrl,
  generateJobDefinition,
  formatValue
} from '@/lib/api/custom-api'
import { playPickupSound } from '@/lib/utils/sound-utils'
import { useCostEstimate } from '@/lib/hooks/use-cost-estimate'
import ChainSelector from '@/components/selectors/ChainSelector'
import JSONPathSelector from '@/components/selectors/JSONPathSelector'

type BuilderStep = 'fetch' | 'select' | 'configure' | 'preview'

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
          <div className="text-base font-semibold text-white">
            {estimate.estimatedCost} {estimate.currency}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function CustomAPIBuilder() {
  const [step, setStep] = useState<BuilderStep>('fetch')
  
  // API config state
  const [config, setConfig] = useState<Partial<CustomAPIConfig>>({
    url: '',
    method: 'GET',
    headers: [],
    jsonPath: '',
    transforms: [],
    updateInterval: 60,
    blockchain: 'solana',
    network: 'mainnet',
    enabled: true,
  })
  
  // UI state
  const [isTesting, setIsTesting] = useState(false)
  const [testResult, setTestResult] = useState<APITestResult | null>(null)
  const [selectedValue, setSelectedValue] = useState<any>(null)
  const [showHeaders, setShowHeaders] = useState(false)

  // Read smartPromptData from sessionStorage and pre-fill the form
  useEffect(() => {
    const smartData = sessionStorage.getItem('smartPromptData')
    if (smartData) {
      try {
        const { module, parsed } = JSON.parse(smartData)
        if (module === 'custom-api' && parsed?.url) {
          setConfig(prev => ({
            ...prev,
            url: parsed.url,
            name: parsed.name || 'Custom API Feed'
          }))
        }
      } catch (e) {
        console.error('Error parsing smartPromptData:', e)
      } finally {
        sessionStorage.removeItem('smartPromptData')
      }
    }
  }, [])

  const handleUrlChange = (url: string) => {
    setConfig(prev => ({ ...prev, url }))
    setTestResult(null)
  }
  
  const handleTemplateSelect = (template: typeof API_TEMPLATES[0]) => {
    playPickupSound()
    setConfig(prev => ({
      ...prev,
      url: template.url,
      method: template.method,
      headers: template.headers,
      name: template.name,
    }))
    setTestResult(null)
  }
  
  const handleAddHeader = () => {
    setConfig(prev => ({
      ...prev,
      headers: [...(prev.headers || []), { key: '', value: '', enabled: true }]
    }))
  }
  
  const handleUpdateHeader = (index: number, field: keyof APIHeader, value: string | boolean) => {
    setConfig(prev => ({
      ...prev,
      headers: prev.headers?.map((h, i) => i === index ? { ...h, [field]: value } : h) || []
    }))
  }
  
  const handleRemoveHeader = (index: number) => {
    setConfig(prev => ({
      ...prev,
      headers: prev.headers?.filter((_, i) => i !== index) || []
    }))
  }
  
  const handleAddTransform = (type: typeof TRANSFORM_TYPES[0]['value']) => {
    playPickupSound()
    setConfig(prev => ({
      ...prev,
      transforms: [...(prev.transforms || []), { type, value: type === 'round' ? 2 : type === 'multiply' || type === 'divide' ? 1 : undefined }]
    }))
  }
  
  const handleUpdateTransform = (index: number, field: keyof TransformStep, value: any) => {
    setConfig(prev => ({
      ...prev,
      transforms: prev.transforms?.map((t, i) => i === index ? { ...t, [field]: value } : t) || []
    }))
  }
  
  const handleRemoveTransform = (index: number) => {
    setConfig(prev => ({
      ...prev,
      transforms: prev.transforms?.filter((_, i) => i !== index) || []
    }))
  }
  
  const handleTest = async () => {
    if (!config.url || !isValidUrl(config.url)) {
      alert('Please enter a valid URL')
      return
    }
    
    playPickupSound()
    setIsTesting(true)
    setTestResult(null)
    
    try {
      const result = await testEndpoint(
        config.url,
        config.method || 'GET',
        config.headers || []
      )
      setTestResult(result)
      
      if (result.success) {
        setStep('select')
      }
    } catch (error) {
      setTestResult({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      })
    } finally {
      setIsTesting(false)
    }
  }
  
  const handlePathSelect = (path: string, value: any) => {
    setConfig(prev => ({ ...prev, jsonPath: path }))
    setSelectedValue(value)
  }
  
  const handleContinueToConfig = () => {
    if (!config.jsonPath) {
      alert('Please select a value from the JSON response')
      return
    }
    playPickupSound()
    setStep('configure')
  }
  
  const handlePreview = () => {
    if (!config.name) {
      setConfig(prev => ({ ...prev, name: `Custom API: ${new URL(config.url!).hostname}` }))
    }
    playPickupSound()
    setStep('preview')
  }
  
  const handleBack = () => {
    playPickupSound()
    if (step === 'preview') setStep('configure')
    else if (step === 'configure') setStep('select')
    else if (step === 'select') setStep('fetch')
  }
  
  const handleDeploy = () => {
    playPickupSound()
    console.log('Deploying Custom API oracle:', config)
    alert('Custom API Oracle deployed! (Demo - in production this would deploy to Switchboard)')
  }
  
  const handleSave = () => {
    playPickupSound()
    const fullConfig = {
      ...config,
      id: `custom-api-${Date.now()}`,
      createdAt: new Date(),
    }
    
    const saved = localStorage.getItem('savedCustomAPIOracles')
    const oracles = saved ? JSON.parse(saved) : []
    oracles.push(fullConfig)
    localStorage.setItem('savedCustomAPIOracles', JSON.stringify(oracles))
    alert('Custom API Oracle saved! View it in your Profile tab.')
  }
  
  // Calculate transformed value
  const transformedValue = selectedValue !== undefined && config.transforms
    ? applyTransforms(selectedValue, config.transforms)
    : selectedValue

  return (
    <div className="space-y-6">
      {/* Module Header */}
      <div className="bg-[#252620]/80 rounded-lg border border-[#3a3b35] p-6 backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-cyan-600 flex items-center justify-center">
              <Globe className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">
                Custom API Oracle Builder
              </h2>
              <p className="text-sm text-gray-400">
                Turn any JSON API into an on-chain oracle
              </p>
            </div>
          </div>
          
          {/* Step indicator */}
          <div className="flex items-center gap-2">
            <div className={`px-3 py-1 rounded-full text-xs font-medium ${
              step === 'fetch' ? 'bg-feedgod-primary dark:text-feedgod-primary text-white' : 'bg-feedgod-purple-100 dark:bg-feedgod-dark-accent dark:bg-feedgod-purple-200 dark:border-feedgod-dark-accent text-gray-400'
            }`}>
              1. Fetch
            </div>
            <ChevronRight className="w-4 h-4 text-feedgod-purple-300 dark:border-feedgod-dark-accent" />
            <div className={`px-3 py-1 rounded-full text-xs font-medium ${
              step === 'select' ? 'bg-feedgod-primary dark:text-feedgod-primary text-white' : 'bg-feedgod-purple-100 dark:bg-feedgod-dark-accent dark:bg-feedgod-purple-200 dark:border-feedgod-dark-accent text-gray-400'
            }`}>
              2. Select
            </div>
            <ChevronRight className="w-4 h-4 text-feedgod-purple-300 dark:border-feedgod-dark-accent" />
            <div className={`px-3 py-1 rounded-full text-xs font-medium ${
              step === 'configure' ? 'bg-feedgod-primary dark:text-feedgod-primary text-white' : 'bg-feedgod-purple-100 dark:bg-feedgod-dark-accent dark:bg-feedgod-purple-200 dark:border-feedgod-dark-accent text-gray-400'
            }`}>
              3. Transform
            </div>
            <ChevronRight className="w-4 h-4 text-feedgod-purple-300 dark:border-feedgod-dark-accent" />
            <div className={`px-3 py-1 rounded-full text-xs font-medium ${
              step === 'preview' ? 'bg-feedgod-primary dark:text-feedgod-primary text-white' : 'bg-feedgod-purple-100 dark:bg-feedgod-dark-accent dark:bg-feedgod-purple-200 dark:border-feedgod-dark-accent text-gray-400'
            }`}>
              4. Deploy
            </div>
          </div>
        </div>
      </div>

      {step === 'fetch' && (
        <div className="space-y-6">
          {/* URL Input */}
          <div className="bg-[#252620]/80 rounded-lg border border-[#3a3b35] p-6 backdrop-blur-sm">
            <h3 className="text-sm font-medium text-gray-300 mb-4">
              Enter API URL
            </h3>
            
            <div className="flex gap-3">
              <div className="flex-1 relative">
                <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-feedgod-secondary/70" />
                <input
                  type="url"
                  value={config.url || ''}
                  onChange={(e) => handleUrlChange(e.target.value)}
                  placeholder="https://api.example.com/data"
                  className="w-full pl-10 pr-4 py-3 bg-feedgod-purple-50 dark:bg-feedgod-dark-secondary dark:bg-feedgod-purple-200 dark:border-feedgod-dark-accent border border-[#3a3b35] rounded-lg text-white placeholder-feedgod-feedgod-secondary dark:text-feedgod-secondary/70 focus:outline-none focus:ring-2 focus:ring-feedgod-primary dark:text-feedgod-primary font-mono text-sm"
                />
              </div>
              <select
                value={config.method || 'GET'}
                onChange={(e) => setConfig(prev => ({ ...prev, method: e.target.value as 'GET' | 'POST' }))}
                className="px-4 py-3 bg-feedgod-purple-50 dark:bg-feedgod-dark-secondary dark:bg-feedgod-purple-200 dark:border-feedgod-dark-accent border border-[#3a3b35] rounded-lg text-white font-medium"
              >
                <option value="GET">GET</option>
                <option value="POST">POST</option>
              </select>
              <button
                onClick={handleTest}
                disabled={isTesting || !config.url}
                className="px-6 py-3 gradient-bg hover:opacity-90 disabled:opacity-50 rounded-lg text-white font-medium transition-all flex items-center gap-2"
              >
                {isTesting ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Zap className="w-5 h-5" />
                )}
                Test
              </button>
            </div>
            
            {/* Headers toggle */}
            <button
              onClick={() => setShowHeaders(!showHeaders)}
              className="mt-4 flex items-center gap-2 text-sm text-gray-400 hover:text-feedgod-primary dark:text-feedgod-primary transition-colors"
            >
              <Settings className="w-4 h-4" />
              {showHeaders ? 'Hide' : 'Show'} Headers
              {(config.headers?.length || 0) > 0 && (
                <span className="px-2 py-0.5 bg-feedgod-primary dark:text-feedgod-primary/20 rounded-full text-xs">
                  {config.headers?.length}
                </span>
              )}
            </button>
            
            {/* Headers editor */}
            {showHeaders && (
              <div className="mt-4 space-y-2 p-4 bg-feedgod-purple-50 dark:bg-feedgod-dark-secondary dark:bg-feedgod-purple-200 dark:border-feedgod-dark-accent rounded-lg">
                {config.headers?.map((header, index) => (
                  <div key={index} className="flex gap-2 items-center">
                    <input
                      type="text"
                      value={header.key}
                      onChange={(e) => handleUpdateHeader(index, 'key', e.target.value)}
                      placeholder="Header name"
                      className="flex-1 px-3 py-2 bg-feedgod-dark-secondary dark:bg-feedgod-purple-50 dark:bg-feedgod-dark-secondary border border-[#3a3b35] rounded text-sm font-mono"
                    />
                    <input
                      type="text"
                      value={header.value}
                      onChange={(e) => handleUpdateHeader(index, 'value', e.target.value)}
                      placeholder="Value"
                      className="flex-1 px-3 py-2 bg-feedgod-dark-secondary dark:bg-feedgod-purple-50 dark:bg-feedgod-dark-secondary border border-[#3a3b35] rounded text-sm font-mono"
                    />
                    <button
                      onClick={() => handleRemoveHeader(index)}
                      className="p-2 text-red-500 hover:bg-red-50 rounded"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                <button
                  onClick={handleAddHeader}
                  className="flex items-center gap-2 text-sm text-feedgod-primary dark:text-feedgod-primary hover:underline"
                >
                  <Plus className="w-4 h-4" />
                  Add Header
                </button>
              </div>
            )}
          </div>

          {/* Test Result */}
          {testResult && (
            <div className={`p-4 rounded-lg border ${
              testResult.success 
                ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-700/50'
                : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-700/50'
            }`}>
              <div className="flex items-center gap-2 mb-2">
                {testResult.success ? (
                  <CheckCircle className="w-5 h-5 text-emerald-500" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-red-500" />
                )}
                <span className={`font-medium ${testResult.success ? 'text-emerald-700 dark:text-emerald-400' : 'text-red-700 dark:text-red-400'}`}>
                  {testResult.success ? `Success! (${testResult.responseTime}ms)` : 'Request Failed'}
                </span>
                {testResult.statusCode && (
                  <span className="text-sm text-gray-500">HTTP {testResult.statusCode}</span>
                )}
              </div>
              {testResult.error && (
                <p className="text-sm text-red-600 dark:text-red-400">{testResult.error}</p>
              )}
            </div>
          )}

          {/* API Templates */}
          <div className="bg-[#252620]/80 rounded-lg border border-[#3a3b35] p-6 backdrop-blur-sm">
            <h3 className="text-sm font-medium text-gray-300 mb-4">
              Quick Templates
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {API_TEMPLATES.map((template) => {
                const TemplateIcon = API_ICON_MAP[template.iconName]
                return (
                  <button
                    key={template.name}
                    onClick={() => handleTemplateSelect(template)}
                    className={`p-4 rounded-lg border transition-all text-left hover:border-feedgod-primary dark:text-feedgod-primary/50 ${
                      config.url === template.url 
                        ? 'border-feedgod-primary dark:text-feedgod-primary bg-feedgod-primary dark:text-feedgod-primary/5' 
                        : 'border-[#3a3b35] bg-feedgod-dark-secondary/60 dark:bg-feedgod-purple-50 dark:bg-feedgod-dark-secondary/60'
                    }`}
                  >
                    <div className="mb-2 flex items-center gap-2">
                      <TemplateIcon className="w-6 h-6 text-feedgod-primary" />
                      {template.symbol && (
                        <span className="text-lg font-bold text-white">{template.symbol}</span>
                      )}
                    </div>
                    <h4 className="font-medium text-white text-sm">{template.name}</h4>
                    <p className="text-xs text-gray-400 mt-1 truncate">
                      {template.description}
                    </p>
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {step === 'select' && testResult?.success && (
        <div className="space-y-6">
          <div className="bg-[#252620]/80 rounded-lg border border-[#3a3b35] p-6 backdrop-blur-sm">
            <h3 className="text-sm font-medium text-gray-300 mb-4">
              Select Value to Track
            </h3>
            
            <JSONPathSelector
              data={testResult.data}
              selectedPath={config.jsonPath || ''}
              onSelectPath={handlePathSelect}
            />
          </div>

          {/* Selected value preview */}
          {config.jsonPath && selectedValue !== undefined && (
            <div className="bg-[#252620] rounded-lg border border-[#3a3b35] p-6">
              <h4 className="text-sm font-medium text-gray-400 mb-3">
                Selected Value Preview
              </h4>
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <p className="text-xs text-gray-400 mb-1">Path:</p>
                  <code className="font-mono text-sm text-white bg-feedgod-dark-secondary/50 dark:bg-black/20 px-2 py-1 rounded">
                    {config.jsonPath}
                  </code>
                </div>
                <ArrowRight className="w-5 h-5 text-gray-400 dark:text-feedgod-secondary/70" />
                <div className="flex-1">
                  <p className="text-xs text-gray-400 mb-1">Current Value:</p>
                  <span className="text-2xl font-bold gradient-text">
                    {formatValue(selectedValue)}
                  </span>
                </div>
              </div>
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={handleBack}
              className="px-4 py-3 text-gray-400 hover:text-feedgod-primary dark:text-feedgod-primary transition-colors"
            >
              ← Back
            </button>
            <button
              onClick={handleContinueToConfig}
              disabled={!config.jsonPath}
              className="flex-1 px-4 py-3 gradient-bg hover:opacity-90 disabled:opacity-50 rounded-lg text-white font-medium transition-all flex items-center justify-center gap-2"
            >
              Continue to Transform
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
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
                    placeholder={`Custom API: ${config.url ? new URL(config.url).hostname : 'example.com'}`}
                    className="w-full bg-feedgod-purple-50 dark:bg-feedgod-dark-secondary dark:bg-feedgod-purple-200 dark:border-feedgod-dark-accent border border-[#3a3b35] rounded-lg px-4 py-2 text-white"
                  />
                </div>
                
                {/* Update Interval */}
                <div>
                  <label className="block text-sm font-medium text-white mb-2 flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    Update Interval
                  </label>
                  <select
                    value={config.updateInterval}
                    onChange={(e) => setConfig(prev => ({ ...prev, updateInterval: parseInt(e.target.value) }))}
                    className="w-full bg-feedgod-purple-50 dark:bg-feedgod-dark-secondary dark:bg-feedgod-purple-200 dark:border-feedgod-dark-accent border border-[#3a3b35] rounded-lg px-4 py-2 text-white"
                  >
                    <option value="10">Every 10 seconds</option>
                    <option value="30">Every 30 seconds</option>
                    <option value="60">Every minute</option>
                    <option value="300">Every 5 minutes</option>
                    <option value="900">Every 15 minutes</option>
                    <option value="3600">Every hour</option>
                  </select>
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

            {/* Value Transforms */}
            <div className="bg-[#252620]/80 rounded-lg border border-[#3a3b35] p-6 backdrop-blur-sm">
              <h3 className="text-sm font-medium text-gray-300 mb-4">
                Value Transforms (Optional)
              </h3>
              
              {/* Current transforms */}
              {config.transforms && config.transforms.length > 0 && (
                <div className="space-y-2 mb-4">
                  {config.transforms.map((transform, index) => {
                    const transformInfo = TRANSFORM_TYPES.find(t => t.value === transform.type)
                    return (
                      <div key={index} className="flex items-center gap-2 p-3 bg-feedgod-purple-50 dark:bg-feedgod-dark-secondary dark:bg-feedgod-purple-200 dark:border-feedgod-dark-accent rounded-lg">
                        <span className="text-sm font-medium text-white">
                          {transformInfo?.label}
                        </span>
                        {transformInfo?.requiresValue && (
                          <input
                            type="number"
                            value={transform.type === 'round' ? transform.decimals || 0 : transform.value || 0}
                            onChange={(e) => handleUpdateTransform(
                              index, 
                              transform.type === 'round' ? 'decimals' : 'value', 
                              parseFloat(e.target.value)
                            )}
                            className="w-20 px-2 py-1 bg-feedgod-dark-secondary dark:bg-feedgod-purple-50 dark:bg-feedgod-dark-secondary border border-[#3a3b35] rounded text-sm"
                          />
                        )}
                        <button
                          onClick={() => handleRemoveTransform(index)}
                          className="ml-auto p-1 text-red-500 hover:bg-red-50 rounded"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    )
                  })}
                </div>
              )}
              
              {/* Add transform buttons */}
              <div className="flex flex-wrap gap-2">
                {TRANSFORM_TYPES.filter(t => t.value !== 'none').map((transform) => (
                  <button
                    key={transform.value}
                    onClick={() => handleAddTransform(transform.value)}
                    className="px-3 py-1.5 bg-feedgod-purple-100 dark:bg-feedgod-dark-accent dark:bg-feedgod-purple-200 dark:border-feedgod-dark-accent hover:bg-feedgod-purple-200 dark:border-feedgod-dark-accent rounded-lg text-sm text-white transition-colors"
                  >
                    + {transform.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right sidebar */}
          <div className="space-y-4">
            {/* Live Preview */}
            <div className="bg-[#252620] rounded-lg border border-[#3a3b35] p-6">
              <h4 className="text-sm font-medium text-gray-400 mb-4">
                Live Value Preview
              </h4>
              
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-gray-400 mb-1">Raw Value:</p>
                  <span className="text-lg font-mono text-white">
                    {formatValue(selectedValue)}
                  </span>
                </div>
                
                {config.transforms && config.transforms.length > 0 && (
                  <>
                    <ArrowRight className="w-4 h-4 text-gray-400 dark:text-feedgod-secondary/70 mx-auto" />
                    <div>
                      <p className="text-xs text-gray-400 mb-1">After Transforms:</p>
                      <span className="text-2xl font-bold gradient-text">
                        {formatValue(transformedValue)}
                      </span>
                    </div>
                  </>
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

      {step === 'preview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Config Preview */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-[#252620]/80 rounded-lg border border-[#3a3b35] p-6 backdrop-blur-sm">
              <h3 className="text-sm font-medium text-gray-300 mb-4">
                Switchboard Job Definition
              </h3>
              
              <div className="bg-feedgod-dark-secondary dark:bg-black rounded-lg p-4 overflow-x-auto">
                <pre className="text-sm text-green-400 font-mono">
                  {JSON.stringify(generateJobDefinition({
                    url: config.url || '',
                    method: config.method || 'GET',
                    headers: config.headers || [],
                    jsonPath: config.jsonPath || '',
                    transforms: config.transforms || [],
                  }), null, 2)}
                </pre>
              </div>
            </div>

            {/* What you're creating */}
            <div className="bg-[#252620] rounded-lg border border-[#3a3b35] p-6">
              <h4 className="text-sm font-medium text-gray-400 mb-4">
                Oracle Summary
              </h4>
              
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <Globe className="w-5 h-5 text-cyan-500 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-white">API Endpoint</p>
                    <code className="text-xs text-gray-400 font-mono break-all">
                      {config.url}
                    </code>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Code className="w-5 h-5 text-feedgod-primary mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-white">JSONPath</p>
                    <code className="text-xs text-gray-400 font-mono">
                      {config.jsonPath}
                    </code>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <RefreshCw className="w-5 h-5 text-feedgod-primary mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-white">Update Frequency</p>
                    <p className="text-xs text-gray-400">
                      Every {config.updateInterval} seconds
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Power examples */}
            <div className="bg-[#252620]/80 rounded-lg border border-[#3a3b35] p-6 backdrop-blur-sm">
              <h4 className="text-sm font-medium text-gray-400 mb-4">
                The Power of Custom API Oracles
              </h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="p-3 bg-feedgod-purple-50 dark:bg-feedgod-dark-secondary dark:bg-feedgod-purple-200 dark:border-feedgod-dark-accent rounded-lg flex items-start gap-2">
                  <TrendingUp className="w-4 h-4 text-feedgod-primary flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-white">Any data source</p>
                    <p className="text-xs text-gray-400">
                      Stock prices, game stats, IoT sensors
                    </p>
                  </div>
                </div>
                <div className="p-3 bg-feedgod-purple-50 dark:bg-feedgod-dark-secondary dark:bg-feedgod-purple-200 dark:border-feedgod-dark-accent rounded-lg flex items-start gap-2">
                  <Zap className="w-4 h-4 text-feedgod-primary flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-white">Real-time updates</p>
                    <p className="text-xs text-gray-400">
                      As frequent as every 10 seconds
                    </p>
                  </div>
                </div>
                <div className="p-3 bg-feedgod-purple-50 dark:bg-feedgod-dark-secondary dark:bg-feedgod-purple-200 dark:border-feedgod-dark-accent rounded-lg flex items-start gap-2">
                  <Link2 className="w-4 h-4 text-feedgod-primary flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-white">Chain-agnostic</p>
                    <p className="text-xs text-gray-400">
                      Deploy to Solana, Ethereum, Monad
                    </p>
                  </div>
                </div>
                <div className="p-3 bg-feedgod-purple-50 dark:bg-feedgod-dark-secondary dark:bg-feedgod-purple-200 dark:border-feedgod-dark-accent rounded-lg flex items-start gap-2">
                  <Settings className="w-4 h-4 text-feedgod-primary flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-white">Transforms built-in</p>
                    <p className="text-xs text-gray-400">
                      Math operations, formatting, precision
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right - Actions */}
          <div className="space-y-4">
            <div className="bg-[#252620] rounded-lg border border-[#3a3b35] p-6">
              <h4 className="text-sm font-medium text-gray-400 mb-4">
                Final Preview
              </h4>
              
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Name</span>
                  <span className="text-white font-medium truncate max-w-[150px]">
                    {config.name || 'Custom API Oracle'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Current Value</span>
                  <span className="gradient-text font-bold">
                    {formatValue(transformedValue)}
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

            <CostEstimateDisplay
              blockchain={config.blockchain || 'solana'}
              network={config.network || 'mainnet'}
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


