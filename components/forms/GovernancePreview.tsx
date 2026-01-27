'use client'

import { useState, useEffect, useMemo } from 'react'
import { 
  RefreshCw, 
  CheckCircle2, 
  XCircle, 
  AlertCircle,
  Zap,
  ArrowRight,
  TrendingUp,
  Activity,
  Target,
  LucideIcon,
  Wallet,
  Users,
  BarChart3,
  Coins,
  DollarSign,
  MessageCircle,
  Gamepad2,
  MessagesSquare,
  Send,
  Smile,
  GitCommit,
  UserCheck,
  Star,
  Rocket,
  Settings
} from 'lucide-react'
import XLogo from '@/components/shared/XLogo'
import { 
  GovernanceOracleConfig,
  MetricSource,
  MetricIconName,
  ConditionGroup,
  evaluateConditionGroup,
  formatMetricValue,
  getOperatorDescription
} from '@/types/governance'
import { playPickupSound } from '@/lib/utils/sound-utils'

interface GovernancePreviewProps {
  config: GovernanceOracleConfig
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

export default function GovernancePreview({ config }: GovernancePreviewProps) {
  const [isSimulating, setIsSimulating] = useState(false)
  const [simulatedValues, setSimulatedValues] = useState<Record<string, number>>({})
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)

  // Initialize with sample values
  useEffect(() => {
    const values: Record<string, number> = {}
    config.metrics.forEach(metric => {
      values[metric.id] = metric.currentValue ?? metric.sampleValue
    })
    setSimulatedValues(values)
    setLastUpdate(new Date())
  }, [config.metrics])

  // Evaluate all condition groups
  const evaluationResults = useMemo(() => {
    return config.conditionGroups.map(group => ({
      groupId: group.id,
      result: evaluateConditionGroup(group, simulatedValues),
      conditionResults: group.conditions.map(condition => ({
        conditionId: condition.id,
        metricId: condition.metricId,
        result: evaluateConditionGroup({
          ...group,
          conditions: [condition]
        }, simulatedValues)
      }))
    }))
  }, [config.conditionGroups, simulatedValues])

  // Calculate final result
  const finalResult = useMemo(() => {
    if (evaluationResults.length === 0) return false
    
    const groupResults = evaluationResults.map(r => r.result)
    
    if (config.rootLogicalOperator === 'AND') {
      return groupResults.every(r => r)
    } else {
      return groupResults.some(r => r)
    }
  }, [evaluationResults, config.rootLogicalOperator])

  // Calculate score (0-100) based on conditions met
  const calculatedScore = useMemo(() => {
    if (config.output.type !== 'score') return null
    
    const allConditions = config.conditionGroups.flatMap(g => g.conditions)
    if (allConditions.length === 0) return 0
    
    const passedConditions = evaluationResults.flatMap(r => 
      r.conditionResults.filter(c => c.result)
    ).length
    
    const rawScore = (passedConditions / allConditions.length) * 100
    const min = config.output.minScore ?? 0
    const max = config.output.maxScore ?? 100
    
    return Math.round(min + (rawScore / 100) * (max - min))
  }, [evaluationResults, config.output, config.conditionGroups])

  // Simulate real-time updates
  const runSimulation = async () => {
    playPickupSound()
    setIsSimulating(true)
    
    // Simulate fetching new values with slight variations
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    const newValues: Record<string, number> = {}
    config.metrics.forEach(metric => {
      const base = metric.sampleValue
      // Add random variation (-5% to +5%)
      const variation = base * (Math.random() * 0.1 - 0.05)
      newValues[metric.id] = Math.max(0, base + variation)
    })
    
    setSimulatedValues(newValues)
    setLastUpdate(new Date())
    setIsSimulating(false)
  }

  // Get output display
  const getOutputDisplay = () => {
    switch (config.output.type) {
      case 'boolean':
        return {
          value: finalResult 
            ? (config.output.trueLabel || 'TRUE') 
            : (config.output.falseLabel || 'FALSE'),
          color: finalResult ? 'text-emerald-400' : 'text-red-400',
          bgColor: finalResult ? 'bg-emerald-500/20' : 'bg-red-500/20',
          icon: finalResult ? CheckCircle2 : XCircle,
        }
      case 'score':
        const score = calculatedScore ?? 0
        const scoreColor = score >= 70 ? 'text-emerald-400' : score >= 40 ? 'text-amber-400' : 'text-red-400'
        const scoreBg = score >= 70 ? 'bg-emerald-500/20' : score >= 40 ? 'bg-amber-500/20' : 'bg-red-500/20'
        return {
          value: `${score}`,
          suffix: `/ ${config.output.maxScore || 100}`,
          color: scoreColor,
          bgColor: scoreBg,
          icon: Target,
        }
      case 'raw_value':
        const rawValue = Object.values(simulatedValues)[0] || 0
        return {
          value: rawValue.toFixed(config.output.decimals ?? 2),
          suffix: config.output.unit || '',
          color: 'text-feedgod-primary',
          bgColor: 'bg-feedgod-primary/20',
          icon: Activity,
        }
      default:
        return {
          value: 'N/A',
          color: 'text-gray-400',
          bgColor: 'bg-gray-500/20',
          icon: AlertCircle,
        }
    }
  }

  const outputDisplay = getOutputDisplay()
  const OutputIcon = outputDisplay.icon

  const getMetricIcon = (iconName: MetricIconName): LucideIcon => {
    return ICON_MAP[iconName] || Settings
  }

  if (config.metrics.length === 0) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="w-12 h-12 text-gray-600 mx-auto mb-4" />
        <p className="text-gray-400">Add metrics to see the preview</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-white">Live Simulation</h3>
          <p className="text-sm text-gray-400 mt-1">
            Preview oracle output with sample data
          </p>
        </div>
        <button
          onClick={runSimulation}
          disabled={isSimulating}
          className="px-4 py-2 bg-feedgod-primary hover:bg-feedgod-primary/80 disabled:opacity-50 rounded-lg text-white text-sm font-medium transition-colors flex items-center gap-2"
        >
          <RefreshCw className={`w-4 h-4 ${isSimulating ? 'animate-spin' : ''}`} />
          Simulate
        </button>
      </div>

      {/* Output Display */}
      <div className={`${outputDisplay.bgColor} rounded-xl p-6 border border-feedgod-dark-accent`}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-400 mb-2">Oracle Output</p>
            <div className="flex items-baseline gap-2">
              <span className={`text-4xl font-bold ${outputDisplay.color}`}>
                {outputDisplay.value}
              </span>
              {outputDisplay.suffix && (
                <span className="text-xl text-gray-400">{outputDisplay.suffix}</span>
              )}
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Output Type: {config.output.type.replace('_', ' ').toUpperCase()}
            </p>
          </div>
          <div className={`w-16 h-16 rounded-xl ${outputDisplay.bgColor} flex items-center justify-center`}>
            <OutputIcon className={`w-8 h-8 ${outputDisplay.color}`} />
          </div>
        </div>
      </div>

      {/* Metric Values */}
      <div>
        <h4 className="text-sm font-medium text-gray-300 mb-3 flex items-center gap-2">
          <TrendingUp className="w-4 h-4" />
          Current Metric Values
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {config.metrics.map(metric => {
            const MetricIcon = getMetricIcon(metric.iconName)
            return (
              <div
                key={metric.id}
                className="flex items-center justify-between p-4 bg-feedgod-dark-accent rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-feedgod-dark-secondary flex items-center justify-center">
                    <MetricIcon className="w-4 h-4 text-feedgod-primary" />
                  </div>
                  <div>
                    <p className="text-white font-medium text-sm">{metric.name}</p>
                    <p className="text-xs text-gray-500">{metric.description}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-white font-bold">
                    {formatMetricValue(simulatedValues[metric.id] || 0, metric)}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Condition Evaluation */}
      <div>
        <h4 className="text-sm font-medium text-gray-300 mb-3 flex items-center gap-2">
          <Zap className="w-4 h-4" />
          Condition Evaluation
        </h4>
        <div className="space-y-3">
          {config.conditionGroups.map((group, groupIdx) => {
            const groupResult = evaluationResults.find(r => r.groupId === group.id)
            
            return (
              <div
                key={group.id}
                className={`p-4 rounded-lg border ${
                  groupResult?.result 
                    ? 'bg-emerald-500/10 border-emerald-500/30' 
                    : 'bg-red-500/10 border-red-500/30'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    {groupResult?.result ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-400" />
                    )}
                    <span className="text-white font-medium">
                      Group {groupIdx + 1}
                    </span>
                    <span className="text-xs text-gray-400 px-2 py-0.5 bg-feedgod-dark-secondary rounded">
                      {group.logicalOperator}
                    </span>
                  </div>
                  <span className={`text-sm font-medium ${
                    groupResult?.result ? 'text-emerald-400' : 'text-red-400'
                  }`}>
                    {groupResult?.result ? 'PASS' : 'FAIL'}
                  </span>
                </div>
                
                <div className="space-y-2">
                  {group.conditions.map(condition => {
                    const metric = config.metrics.find(m => m.id === condition.metricId)
                    const condResult = groupResult?.conditionResults.find(c => c.conditionId === condition.id)
                    const currentValue = simulatedValues[condition.metricId] || 0
                    
                    return (
                      <div
                        key={condition.id}
                        className="flex items-center gap-3 text-sm pl-7"
                      >
                        {condResult?.result ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                        ) : (
                          <XCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                        )}
                        <span className="text-gray-300">
                          {metric?.name || 'Unknown'} ({formatMetricValue(currentValue, metric!)})
                        </span>
                        <ArrowRight className="w-3 h-3 text-gray-500" />
                        <span className="text-gray-400">
                          {getOperatorDescription(condition.operator)} {condition.value}
                          {condition.duration && ` for ${condition.duration} ${condition.durationUnit}`}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* DAO Integration Preview */}
      {config.daoIntegration && (
        <div className="bg-feedgod-dark-accent rounded-lg p-4">
          <h4 className="text-sm font-medium text-gray-300 mb-2">DAO Integration</h4>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-gray-400">Platform:</span>
            <span className="text-white capitalize">{config.daoIntegration.type.replace('_', ' ')}</span>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            This oracle will feed data to your DAO for automatic execution
          </p>
        </div>
      )}

      {/* Last Update */}
      {lastUpdate && (
        <div className="text-center text-xs text-gray-500">
          Last simulated: {lastUpdate.toLocaleTimeString()}
        </div>
      )}
    </div>
  )
}
