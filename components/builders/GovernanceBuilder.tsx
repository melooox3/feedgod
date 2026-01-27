'use client'

import { useState, useCallback } from 'react'
import { 
  Landmark,
  Sparkles,
  Settings,
  ChevronRight,
  Rocket,
  FileCode,
  Link2,
  ExternalLink,
  Copy,
  Check,
  AlertCircle,
  Zap,
  Vote,
  Target,
  Users,
  Shield,
  Wrench,
  Star,
  TrendingUp,
  Gamepad2,
  LucideIcon,
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
  Play
} from 'lucide-react'
import XLogo from '@/components/shared/XLogo'
import { 
  GovernanceOracleConfig,
  GovernanceTemplate,
  MetricSource,
  ConditionGroup,
  LogicalOperator,
  OutputType,
  MetricIconName,
  GOVERNANCE_TEMPLATES,
  METRIC_SOURCES
} from '@/types/governance'
import MetricSelector from '@/components/selectors/MetricSelector'
import ConditionBuilder from '@/components/forms/ConditionBuilder'
import GovernancePreview from '@/components/forms/GovernancePreview'
import { playPickupSound } from '@/lib/utils/sound-utils'

type BuilderStep = 'template' | 'metrics' | 'conditions' | 'output' | 'integration' | 'preview'

const STEPS: { id: BuilderStep; label: string; icon: LucideIcon }[] = [
  { id: 'template', label: 'Template', icon: Sparkles },
  { id: 'metrics', label: 'Data Sources', icon: Settings },
  { id: 'conditions', label: 'Conditions', icon: Zap },
  { id: 'output', label: 'Output', icon: FileCode },
  { id: 'integration', label: 'Integration', icon: Link2 },
  { id: 'preview', label: 'Preview', icon: Rocket },
]

const DAO_INTEGRATIONS: { id: string; name: string; description: string; icon: LucideIcon }[] = [
  { id: 'realms', name: 'Realms', description: 'Solana DAO framework', icon: Landmark },
  { id: 'metadao', name: 'MetaDAO', description: 'Futarchy governance', icon: Target },
  { id: 'squads', name: 'Squads', description: 'Multi-signature', icon: Users },
  { id: 'spl_governance', name: 'SPL Governance', description: 'Native Solana', icon: Shield },
  { id: 'custom', name: 'Custom', description: 'Any program', icon: Wrench },
]

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

const generateId = () => `gov-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

export default function GovernanceBuilder() {
  const [currentStep, setCurrentStep] = useState<BuilderStep>('template')
  const [copied, setCopied] = useState(false)
  
  const [config, setConfig] = useState<GovernanceOracleConfig>({
    id: generateId(),
    name: '',
    description: '',
    metrics: [],
    customInputs: {},
    conditionGroups: [{
      id: generateId(),
      conditions: [],
      logicalOperator: 'AND',
    }],
    rootLogicalOperator: 'AND',
    output: {
      type: 'boolean',
      trueLabel: 'Condition Met',
      falseLabel: 'Not Met',
    },
    network: 'solana-mainnet',
    updateInterval: 3600,
  })

  const updateConfig = useCallback((updates: Partial<GovernanceOracleConfig>) => {
    setConfig(prev => ({ ...prev, ...updates }))
  }, [])

  const getTemplateIcon = (iconName: MetricIconName): LucideIcon => {
    return ICON_MAP[iconName] || Star
  }

  const selectTemplate = (template: GovernanceTemplate) => {
    playPickupSound()
    updateConfig({
      templateId: template.id,
      name: template.name,
      description: template.description,
      metrics: [...template.metrics],
      conditionGroups: template.conditions.map(g => ({
        ...g,
        id: generateId(),
        conditions: g.conditions.map(c => ({ ...c, id: generateId() }))
      })),
      output: { ...template.output },
    })
    setCurrentStep('metrics')
  }

  const handleMetricSelect = (metric: MetricSource) => {
    if (!config.metrics.find(m => m.id === metric.id)) {
      updateConfig({ metrics: [...config.metrics, metric] })
    }
  }

  const handleMetricRemove = (metricId: string) => {
    updateConfig({ 
      metrics: config.metrics.filter(m => m.id !== metricId),
      // Also remove conditions referencing this metric
      conditionGroups: config.conditionGroups.map(group => ({
        ...group,
        conditions: group.conditions.filter(c => c.metricId !== metricId)
      }))
    })
  }

  const handleConditionsChange = (groups: ConditionGroup[], rootOperator: LogicalOperator) => {
    updateConfig({ 
      conditionGroups: groups,
      rootLogicalOperator: rootOperator
    })
  }

  const goToStep = (step: BuilderStep) => {
    playPickupSound()
    setCurrentStep(step)
  }

  const nextStep = () => {
    const currentIndex = STEPS.findIndex(s => s.id === currentStep)
    if (currentIndex < STEPS.length - 1) {
      goToStep(STEPS[currentIndex + 1].id)
    }
  }

  const prevStep = () => {
    const currentIndex = STEPS.findIndex(s => s.id === currentStep)
    if (currentIndex > 0) {
      goToStep(STEPS[currentIndex - 1].id)
    }
  }

  const copyConfig = () => {
    navigator.clipboard.writeText(JSON.stringify(config, null, 2))
    setCopied(true)
    playPickupSound()
    setTimeout(() => setCopied(false), 2000)
  }

  const isStepComplete = (step: BuilderStep): boolean => {
    switch (step) {
      case 'template': return !!config.name
      case 'metrics': return config.metrics.length > 0
      case 'conditions': return config.conditionGroups.some(g => g.conditions.length > 0)
      case 'output': return !!config.output.type
      case 'integration': return true // Optional
      case 'preview': return true
      default: return false
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center">
          <Landmark className="w-6 h-6 text-white" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-white">Governance Oracle</h2>
          <p className="text-sm text-gray-400">
            Create oracles that trigger DAO actions based on real-world data
          </p>
        </div>
      </div>

      {/* Step Navigation */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        {STEPS.map((step, index) => {
          const Icon = step.icon
          const isActive = currentStep === step.id
          const isComplete = isStepComplete(step.id)
          const isPast = STEPS.findIndex(s => s.id === currentStep) > index
          
          return (
            <button
              key={step.id}
              onClick={() => goToStep(step.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-feedgod-primary text-white'
                  : isPast || isComplete
                    ? 'bg-feedgod-dark-accent text-white hover:bg-feedgod-dark-accent/80'
                    : 'bg-feedgod-dark-secondary text-gray-400 hover:text-white'
              }`}
            >
              {isComplete && !isActive ? (
                <Check className="w-4 h-4 text-emerald-400" />
              ) : (
                <Icon className="w-4 h-4" />
              )}
              <span className="text-sm font-medium">{step.label}</span>
            </button>
          )
        })}
      </div>

      {/* Step Content */}
      <div className="bg-feedgod-dark-secondary border border-feedgod-dark-accent rounded-xl p-6">
        {/* Template Selection */}
        {currentStep === 'template' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-white mb-2">Choose a Template</h3>
              <p className="text-sm text-gray-400">
                Start with a pre-configured template or build from scratch
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Custom Option */}
              <button
                onClick={() => { 
                  playPickupSound()
                  updateConfig({ 
                    name: 'Custom Governance Oracle',
                    description: 'Custom conditions for your DAO'
                  })
                  setCurrentStep('metrics')
                }}
                className="group p-5 bg-feedgod-dark-accent border-2 border-dashed border-feedgod-dark-accent hover:border-feedgod-primary rounded-xl text-left transition-all"
              >
                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-feedgod-primary to-feedgod-secondary flex items-center justify-center mb-4">
                  <Settings className="w-6 h-6 text-white" />
                </div>
                <h4 className="text-white font-semibold mb-1">Build from Scratch</h4>
                <p className="text-sm text-gray-400 mb-3">
                  Create a fully custom governance oracle
                </p>
                <div className="flex items-center gap-1 text-feedgod-primary text-sm font-medium">
                  <span>Start Building</span>
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </button>

              {/* Templates */}
              {GOVERNANCE_TEMPLATES.map(template => {
                const TemplateIcon = getTemplateIcon(template.iconName)
                return (
                  <button
                    key={template.id}
                    onClick={() => selectTemplate(template)}
                    className={`group p-5 bg-feedgod-dark-accent border border-feedgod-dark-accent hover:border-feedgod-primary rounded-xl text-left transition-all ${
                      config.templateId === template.id ? 'ring-2 ring-feedgod-primary' : ''
                    }`}
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-8 h-8 rounded-lg bg-purple-600 flex items-center justify-center">
                        <TemplateIcon className="w-5 h-5 text-white" />
                      </div>
                      <span className="text-xs text-gray-500 bg-feedgod-dark-secondary px-2 py-1 rounded">
                        {template.category}
                      </span>
                    </div>
                    <h4 className="text-white font-semibold mb-1">{template.name}</h4>
                    <p className="text-sm text-gray-400 mb-3 line-clamp-2">
                      {template.description}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {template.metrics.slice(0, 3).map(metric => {
                        const MetricIcon = ICON_MAP[metric.iconName] || Settings
                        return (
                          <span 
                            key={metric.id}
                            className="flex items-center gap-1 text-xs text-gray-400 bg-feedgod-dark-secondary px-2 py-1 rounded"
                          >
                            <MetricIcon className="w-3 h-3" />
                            {metric.name}
                          </span>
                        )
                      })}
                      {template.metrics.length > 3 && (
                        <span className="text-xs text-gray-500">
                          +{template.metrics.length - 3} more
                        </span>
                      )}
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* Metrics Selection */}
        {currentStep === 'metrics' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-white mb-2">Select Data Sources</h3>
              <p className="text-sm text-gray-400">
                Choose the metrics your oracle will monitor
              </p>
            </div>

            {/* Oracle Name */}
            <div className="space-y-2">
              <label className="text-sm text-gray-300">Oracle Name</label>
              <input
                type="text"
                value={config.name}
                onChange={(e) => updateConfig({ name: e.target.value })}
                placeholder="My Governance Oracle"
                className="w-full px-4 py-3 bg-feedgod-dark-accent border border-feedgod-dark-accent rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-feedgod-primary"
              />
            </div>

            {/* Custom Inputs */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm text-gray-300">Protocol Address (optional)</label>
                <input
                  type="text"
                  value={config.customInputs.protocolAddress || ''}
                  onChange={(e) => updateConfig({ 
                    customInputs: { ...config.customInputs, protocolAddress: e.target.value }
                  })}
                  placeholder="Protocol contract address"
                  className="w-full px-4 py-2 bg-feedgod-dark-accent border border-feedgod-dark-accent rounded-lg text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-feedgod-primary"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm text-gray-300">Twitter Handle (optional)</label>
                <input
                  type="text"
                  value={config.customInputs.twitterHandle || ''}
                  onChange={(e) => updateConfig({ 
                    customInputs: { ...config.customInputs, twitterHandle: e.target.value }
                  })}
                  placeholder="@handle"
                  className="w-full px-4 py-2 bg-feedgod-dark-accent border border-feedgod-dark-accent rounded-lg text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-feedgod-primary"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm text-gray-300">GitHub Repo (optional)</label>
                <input
                  type="text"
                  value={config.customInputs.githubRepo || ''}
                  onChange={(e) => updateConfig({ 
                    customInputs: { ...config.customInputs, githubRepo: e.target.value }
                  })}
                  placeholder="owner/repo"
                  className="w-full px-4 py-2 bg-feedgod-dark-accent border border-feedgod-dark-accent rounded-lg text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-feedgod-primary"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm text-gray-300">Custom API (optional)</label>
                <input
                  type="text"
                  value={config.customInputs.customApiEndpoint || ''}
                  onChange={(e) => updateConfig({ 
                    customInputs: { ...config.customInputs, customApiEndpoint: e.target.value }
                  })}
                  placeholder="https://api.example.com/data"
                  className="w-full px-4 py-2 bg-feedgod-dark-accent border border-feedgod-dark-accent rounded-lg text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-feedgod-primary"
                />
              </div>
            </div>

            <MetricSelector
              selectedMetrics={config.metrics}
              onSelect={handleMetricSelect}
              onRemove={handleMetricRemove}
              maxSelections={10}
            />
          </div>
        )}

        {/* Conditions Builder */}
        {currentStep === 'conditions' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-white mb-2">Define Conditions</h3>
              <p className="text-sm text-gray-400">
                Create the logic that determines your oracle's output
              </p>
            </div>

            {config.metrics.length === 0 ? (
              <div className="text-center py-12">
                <AlertCircle className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400">Add metrics first to build conditions</p>
                <button
                  onClick={() => goToStep('metrics')}
                  className="mt-4 px-4 py-2 bg-feedgod-primary rounded-lg text-white text-sm font-medium"
                >
                  Go to Metrics
                </button>
              </div>
            ) : (
              <ConditionBuilder
                metrics={config.metrics}
                conditionGroups={config.conditionGroups}
                rootOperator={config.rootLogicalOperator}
                onChange={handleConditionsChange}
              />
            )}
          </div>
        )}

        {/* Output Configuration */}
        {currentStep === 'output' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-white mb-2">Configure Output</h3>
              <p className="text-sm text-gray-400">
                How should the oracle report its findings?
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { 
                  type: 'boolean' as OutputType, 
                  label: 'Boolean', 
                  icon: Check,
                  description: 'True/False output for pass/fail conditions'
                },
                { 
                  type: 'score' as OutputType, 
                  label: 'Score', 
                  icon: BarChart3,
                  description: 'Numeric score (0-100) based on conditions met'
                },
                { 
                  type: 'raw_value' as OutputType, 
                  label: 'Raw Value', 
                  icon: TrendingUp,
                  description: 'Direct metric value for on-chain consumption'
                },
              ].map(option => {
                const Icon = option.icon
                return (
                  <button
                    key={option.type}
                    onClick={() => {
                      playPickupSound()
                      updateConfig({ 
                        output: { 
                          ...config.output, 
                          type: option.type,
                          ...(option.type === 'boolean' ? { trueLabel: 'Condition Met', falseLabel: 'Not Met' } : {}),
                          ...(option.type === 'score' ? { minScore: 0, maxScore: 100 } : {}),
                          ...(option.type === 'raw_value' ? { decimals: 2 } : {}),
                        }
                      })
                    }}
                    className={`p-5 rounded-xl border text-left transition-all ${
                      config.output.type === option.type
                        ? 'bg-feedgod-primary/10 border-feedgod-primary'
                        : 'bg-feedgod-dark-accent border-feedgod-dark-accent hover:border-feedgod-primary/50'
                    }`}
                  >
                    <div className="w-8 h-8 rounded-lg bg-[#ff0d6e] flex items-center justify-center mb-3">
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <h4 className="text-white font-semibold mb-1">{option.label}</h4>
                    <p className="text-sm text-gray-400">{option.description}</p>
                  </button>
                )
              })}
            </div>

            {/* Type-specific settings */}
            {config.output.type === 'boolean' && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm text-gray-300">True Label</label>
                  <input
                    type="text"
                    value={config.output.trueLabel || ''}
                    onChange={(e) => updateConfig({ 
                      output: { ...config.output, trueLabel: e.target.value }
                    })}
                    placeholder="e.g., Milestone Reached"
                    className="w-full px-4 py-2 bg-feedgod-dark-accent border border-feedgod-dark-accent rounded-lg text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-feedgod-primary"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm text-gray-300">False Label</label>
                  <input
                    type="text"
                    value={config.output.falseLabel || ''}
                    onChange={(e) => updateConfig({ 
                      output: { ...config.output, falseLabel: e.target.value }
                    })}
                    placeholder="e.g., In Progress"
                    className="w-full px-4 py-2 bg-feedgod-dark-accent border border-feedgod-dark-accent rounded-lg text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-feedgod-primary"
                  />
                </div>
              </div>
            )}

            {config.output.type === 'score' && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm text-gray-300">Minimum Score</label>
                  <input
                    type="number"
                    value={config.output.minScore || 0}
                    onChange={(e) => updateConfig({ 
                      output: { ...config.output, minScore: parseInt(e.target.value) || 0 }
                    })}
                    className="w-full px-4 py-2 bg-feedgod-dark-accent border border-feedgod-dark-accent rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-feedgod-primary"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm text-gray-300">Maximum Score</label>
                  <input
                    type="number"
                    value={config.output.maxScore || 100}
                    onChange={(e) => updateConfig({ 
                      output: { ...config.output, maxScore: parseInt(e.target.value) || 100 }
                    })}
                    className="w-full px-4 py-2 bg-feedgod-dark-accent border border-feedgod-dark-accent rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-feedgod-primary"
                  />
                </div>
              </div>
            )}

            {/* Update Interval */}
            <div className="space-y-2">
              <label className="text-sm text-gray-300">Update Interval</label>
              <select
                value={config.updateInterval}
                onChange={(e) => updateConfig({ updateInterval: parseInt(e.target.value) })}
                className="w-full px-4 py-3 bg-feedgod-dark-accent border border-feedgod-dark-accent rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-feedgod-primary"
              >
                <option value={300}>Every 5 minutes</option>
                <option value={900}>Every 15 minutes</option>
                <option value={3600}>Every hour</option>
                <option value={21600}>Every 6 hours</option>
                <option value={86400}>Daily</option>
              </select>
            </div>
          </div>
        )}

        {/* DAO Integration */}
        {currentStep === 'integration' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-white mb-2">DAO Integration</h3>
              <p className="text-sm text-gray-400">
                Connect your oracle to a DAO framework (optional)
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {DAO_INTEGRATIONS.map(dao => {
                const DaoIcon = dao.icon
                return (
                  <button
                    key={dao.id}
                    onClick={() => {
                      playPickupSound()
                      updateConfig({ 
                        daoIntegration: config.daoIntegration?.type === dao.id 
                          ? undefined 
                          : { type: dao.id as any }
                      })
                    }}
                    className={`p-5 rounded-xl border text-left transition-all ${
                      config.daoIntegration?.type === dao.id
                        ? 'bg-feedgod-primary/10 border-feedgod-primary'
                        : 'bg-feedgod-dark-accent border-feedgod-dark-accent hover:border-feedgod-primary/50'
                    }`}
                  >
                    <div className="w-8 h-8 rounded-lg bg-purple-600 flex items-center justify-center mb-3">
                      <DaoIcon className="w-5 h-5 text-white" />
                    </div>
                    <h4 className="text-white font-semibold mb-1">{dao.name}</h4>
                    <p className="text-sm text-gray-400">{dao.description}</p>
                  </button>
                )
              })}
            </div>

            {config.daoIntegration && (
              <div className="bg-feedgod-dark-accent rounded-lg p-4 space-y-4">
                <h4 className="text-white font-medium">Integration Settings</h4>
                <div className="space-y-2">
                  <label className="text-sm text-gray-300">Treasury Address (optional)</label>
                  <input
                    type="text"
                    value={config.daoIntegration.treasuryAddress || ''}
                    onChange={(e) => updateConfig({ 
                      daoIntegration: { ...config.daoIntegration!, treasuryAddress: e.target.value }
                    })}
                    placeholder="DAO treasury address"
                    className="w-full px-4 py-2 bg-feedgod-dark-secondary border border-feedgod-dark-accent rounded-lg text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-feedgod-primary"
                  />
                </div>
              </div>
            )}

            <div className="bg-gradient-to-br from-purple-500/10 to-indigo-500/10 border border-purple-500/30 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <Landmark className="w-5 h-5 text-purple-400 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-white font-medium mb-1">How it works</h4>
                  <p className="text-sm text-gray-400">
                    Your oracle will publish data on-chain that your DAO smart contract can read.
                    When conditions are met, your DAO can automatically execute actions like 
                    releasing funds, passing proposals, or triggering governance events.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Preview */}
        {currentStep === 'preview' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">Preview & Deploy</h3>
                <p className="text-sm text-gray-400">
                  Review your governance oracle configuration
                </p>
              </div>
              <button
                onClick={copyConfig}
                className="flex items-center gap-2 px-4 py-2 bg-feedgod-dark-accent hover:bg-feedgod-dark-accent/80 rounded-lg text-white text-sm transition-colors"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                {copied ? 'Copied!' : 'Copy Config'}
              </button>
            </div>

            <GovernancePreview config={config} />

            {/* Deploy Button */}
            <div className="flex justify-center pt-4">
              <button
                onClick={() => {
                  playPickupSound()
                  alert('Deployment functionality coming soon! Your config has been copied to clipboard.')
                  copyConfig()
                }}
                className="w-full px-4 py-3 gradient-bg hover:opacity-90 rounded-lg text-white font-medium transition-all flex items-center justify-center gap-2"
              >
                <Play className="w-4 h-4" />
                Deploy Oracle
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Navigation Buttons */}
      <div className="flex justify-between">
        <button
          onClick={prevStep}
          disabled={currentStep === 'template'}
          className="px-6 py-3 bg-feedgod-dark-accent hover:bg-feedgod-dark-accent/80 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-white font-medium transition-colors"
        >
          Previous
        </button>
        <button
          onClick={nextStep}
          disabled={currentStep === 'preview'}
          className="px-6 py-3 bg-feedgod-primary hover:bg-feedgod-primary/80 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-white font-medium transition-colors flex items-center gap-2"
        >
          Next
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
