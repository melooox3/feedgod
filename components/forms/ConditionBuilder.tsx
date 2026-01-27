'use client'

import { useState } from 'react'
import { 
  Plus, 
  Trash2, 
  ChevronDown,
  ArrowRight,
  Zap,
  Clock,
  TrendingUp,
  TrendingDown,
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
  Condition,
  ConditionGroup,
  ConditionOperator,
  LogicalOperator,
  MetricSource,
  MetricIconName,
  getOperatorLabel,
  getOperatorDescription,
  formatMetricValue
} from '@/types/governance'
import { playPickupSound } from '@/lib/utils/sound-utils'

interface ConditionBuilderProps {
  metrics: MetricSource[]
  conditionGroups: ConditionGroup[]
  rootOperator: LogicalOperator
  onChange: (groups: ConditionGroup[], rootOperator: LogicalOperator) => void
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

const OPERATORS: { value: ConditionOperator; label: string; description: string; icon?: LucideIcon; needsDuration?: boolean }[] = [
  { value: 'greater_than', label: '>', description: 'Greater than' },
  { value: 'less_than', label: '<', description: 'Less than' },
  { value: 'equals', label: '=', description: 'Equals' },
  { value: 'greater_or_equal', label: '≥', description: 'Greater or equal' },
  { value: 'less_or_equal', label: '≤', description: 'Less or equal' },
  { value: 'not_equals', label: '≠', description: 'Not equals' },
  { value: 'increased_by_percent', label: '↑%', description: 'Increased by %', icon: TrendingUp },
  { value: 'decreased_by_percent', label: '↓%', description: 'Decreased by %', icon: TrendingDown },
  { value: 'sustained_above', label: 'T>', description: 'Stays above for', icon: Clock, needsDuration: true },
  { value: 'sustained_below', label: 'T<', description: 'Stays below for', icon: Clock, needsDuration: true },
]

export default function ConditionBuilder({ 
  metrics, 
  conditionGroups, 
  rootOperator,
  onChange 
}: ConditionBuilderProps) {
  const [expandedGroup, setExpandedGroup] = useState<string | null>(
    conditionGroups[0]?.id || null
  )

  const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

  const getMetricIcon = (iconName: MetricIconName): LucideIcon => {
    return ICON_MAP[iconName] || Settings
  }

  const addConditionGroup = () => {
    playPickupSound()
    const newGroup: ConditionGroup = {
      id: generateId(),
      conditions: [],
      logicalOperator: 'AND',
    }
    onChange([...conditionGroups, newGroup], rootOperator)
    setExpandedGroup(newGroup.id)
  }

  const removeConditionGroup = (groupId: string) => {
    playPickupSound()
    onChange(conditionGroups.filter(g => g.id !== groupId), rootOperator)
  }

  const updateConditionGroup = (groupId: string, updates: Partial<ConditionGroup>) => {
    onChange(
      conditionGroups.map(g => g.id === groupId ? { ...g, ...updates } : g),
      rootOperator
    )
  }

  const addCondition = (groupId: string) => {
    playPickupSound()
    const newCondition: Condition = {
      id: generateId(),
      metricId: metrics[0]?.id || '',
      operator: 'greater_than',
      value: 0,
    }
    
    updateConditionGroup(groupId, {
      conditions: [
        ...conditionGroups.find(g => g.id === groupId)!.conditions,
        newCondition
      ]
    })
  }

  const updateCondition = (groupId: string, conditionId: string, updates: Partial<Condition>) => {
    const group = conditionGroups.find(g => g.id === groupId)
    if (!group) return
    
    updateConditionGroup(groupId, {
      conditions: group.conditions.map(c => 
        c.id === conditionId ? { ...c, ...updates } : c
      )
    })
  }

  const removeCondition = (groupId: string, conditionId: string) => {
    playPickupSound()
    const group = conditionGroups.find(g => g.id === groupId)
    if (!group) return
    
    updateConditionGroup(groupId, {
      conditions: group.conditions.filter(c => c.id !== conditionId)
    })
  }

  // Generate human-readable condition string
  const getConditionString = (condition: Condition): string => {
    const metric = metrics.find(m => m.id === condition.metricId)
    if (!metric) return 'Unknown condition'
    
    const opInfo = OPERATORS.find(o => o.value === condition.operator)
    let str = `${metric.name} ${opInfo?.description || condition.operator} ${condition.value}`
    
    if (condition.duration) {
      str += ` for ${condition.duration} ${condition.durationUnit || 'days'}`
    }
    
    return str
  }

  // Generate full logic string
  const getFullLogicString = (): string => {
    if (conditionGroups.length === 0) return 'No conditions defined'
    
    const groupStrings = conditionGroups.map(group => {
      if (group.conditions.length === 0) return null
      
      const conditionStrings = group.conditions.map(c => getConditionString(c))
      const joined = conditionStrings.join(` ${group.logicalOperator} `)
      
      return group.conditions.length > 1 ? `(${joined})` : joined
    }).filter(Boolean)
    
    return groupStrings.join(` ${rootOperator} `) || 'No conditions defined'
  }

  return (
    <div className="space-y-6">
      {/* Logic Preview */}
      <div className="bg-gradient-to-br from-feedgod-primary/10 to-feedgod-secondary/10 border border-feedgod-primary/30 rounded-xl p-4">
        <div className="flex items-center gap-2 mb-2">
          <Zap className="w-4 h-4 text-feedgod-primary" />
          <span className="text-sm font-medium text-feedgod-primary">Logic Preview</span>
        </div>
        <p className="text-white font-mono text-sm bg-feedgod-dark-secondary/50 rounded-lg p-3">
          IF {getFullLogicString()} → THEN <span className="text-emerald-400">TRUE</span>
        </p>
      </div>

      {/* Root Operator Toggle (when multiple groups) */}
      {conditionGroups.length > 1 && (
        <div className="flex items-center justify-center gap-2">
          <span className="text-sm text-gray-400">Combine groups with:</span>
          <div className="flex bg-feedgod-dark-accent rounded-lg p-1">
            {(['AND', 'OR'] as LogicalOperator[]).map(op => (
              <button
                key={op}
                onClick={() => { playPickupSound(); onChange(conditionGroups, op); }}
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                  rootOperator === op
                    ? 'bg-feedgod-primary text-white'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                {op}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Condition Groups */}
      <div className="space-y-4">
        {conditionGroups.map((group, groupIndex) => (
          <div
            key={group.id}
            className="bg-feedgod-dark-secondary border border-feedgod-dark-accent rounded-xl overflow-hidden"
          >
            {/* Group Header */}
            <div 
              className="flex items-center justify-between p-4 cursor-pointer hover:bg-feedgod-dark-accent/30 transition-colors"
              onClick={() => { 
                playPickupSound()
                setExpandedGroup(expandedGroup === group.id ? null : group.id)
              }}
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-feedgod-primary/20 flex items-center justify-center">
                  <span className="text-feedgod-primary font-bold text-sm">{groupIndex + 1}</span>
                </div>
                <div>
                  <h4 className="text-white font-medium">
                    Condition Group {groupIndex + 1}
                  </h4>
                  <p className="text-xs text-gray-400">
                    {group.conditions.length} condition{group.conditions.length !== 1 ? 's' : ''} • {group.logicalOperator}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                {conditionGroups.length > 1 && (
                  <button
                    onClick={(e) => { e.stopPropagation(); removeConditionGroup(group.id); }}
                    className="p-2 hover:bg-red-500/20 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4 text-red-400" />
                  </button>
                )}
                <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${
                  expandedGroup === group.id ? 'rotate-180' : ''
                }`} />
              </div>
            </div>

            {/* Expanded Content */}
            {expandedGroup === group.id && (
              <div className="border-t border-feedgod-dark-accent p-4 space-y-4">
                {/* Group Operator */}
                {group.conditions.length > 1 && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-400">Match:</span>
                    <div className="flex bg-feedgod-dark-accent rounded-lg p-1">
                      {(['AND', 'OR'] as LogicalOperator[]).map(op => (
                        <button
                          key={op}
                          onClick={() => { 
                            playPickupSound()
                            updateConditionGroup(group.id, { logicalOperator: op })
                          }}
                          className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
                            group.logicalOperator === op
                              ? 'bg-feedgod-primary text-white'
                              : 'text-gray-400 hover:text-white'
                          }`}
                        >
                          {op === 'AND' ? 'All conditions' : 'Any condition'}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Conditions */}
                <div className="space-y-3">
                  {group.conditions.map((condition, condIndex) => {
                    const metric = metrics.find(m => m.id === condition.metricId)
                    const opInfo = OPERATORS.find(o => o.value === condition.operator)
                    const MetricIcon = metric ? getMetricIcon(metric.iconName) : Settings
                    
                    return (
                      <div
                        key={condition.id}
                        className="flex flex-wrap items-center gap-2 p-3 bg-feedgod-dark-accent/50 rounded-lg"
                      >
                        {/* Metric Select */}
                        <div className="flex-1 min-w-[150px]">
                          <div className="relative">
                            <select
                              value={condition.metricId}
                              onChange={(e) => updateCondition(group.id, condition.id, { metricId: e.target.value })}
                              className="w-full pl-9 pr-3 py-2 bg-feedgod-dark-secondary border border-feedgod-dark-accent rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-feedgod-primary appearance-none"
                            >
                              {metrics.map(m => (
                                <option key={m.id} value={m.id}>
                                  {m.name}
                                </option>
                              ))}
                            </select>
                            <MetricIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                          </div>
                        </div>

                        {/* Operator Select */}
                        <div className="min-w-[140px]">
                          <select
                            value={condition.operator}
                            onChange={(e) => updateCondition(group.id, condition.id, { 
                              operator: e.target.value as ConditionOperator,
                              duration: OPERATORS.find(o => o.value === e.target.value)?.needsDuration ? 7 : undefined,
                              durationUnit: 'days'
                            })}
                            className="w-full px-3 py-2 bg-feedgod-dark-secondary border border-feedgod-dark-accent rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-feedgod-primary"
                          >
                            {OPERATORS.map(op => (
                              <option key={op.value} value={op.value}>
                                {op.label} {op.description}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Value Input */}
                        <div className="min-w-[100px]">
                          <input
                            type="number"
                            value={condition.value}
                            onChange={(e) => updateCondition(group.id, condition.id, { value: parseFloat(e.target.value) || 0 })}
                            className="w-full px-3 py-2 bg-feedgod-dark-secondary border border-feedgod-dark-accent rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-feedgod-primary"
                            placeholder="Value"
                          />
                        </div>

                        {/* Duration (for sustained conditions) */}
                        {opInfo?.needsDuration && (
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-gray-400" />
                            <input
                              type="number"
                              value={condition.duration || 7}
                              onChange={(e) => updateCondition(group.id, condition.id, { duration: parseInt(e.target.value) || 1 })}
                              className="w-16 px-2 py-2 bg-feedgod-dark-secondary border border-feedgod-dark-accent rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-feedgod-primary"
                              min="1"
                            />
                            <select
                              value={condition.durationUnit || 'days'}
                              onChange={(e) => updateCondition(group.id, condition.id, { durationUnit: e.target.value as 'hours' | 'days' | 'weeks' })}
                              className="px-2 py-2 bg-feedgod-dark-secondary border border-feedgod-dark-accent rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-feedgod-primary"
                            >
                              <option value="hours">hours</option>
                              <option value="days">days</option>
                              <option value="weeks">weeks</option>
                            </select>
                          </div>
                        )}

                        {/* Sample Value */}
                        {metric && (
                          <span className="text-xs text-gray-500">
                            Current: {formatMetricValue(metric.sampleValue, metric)}
                          </span>
                        )}

                        {/* Remove Button */}
                        <button
                          onClick={() => removeCondition(group.id, condition.id)}
                          className="p-2 hover:bg-red-500/20 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4 text-red-400" />
                        </button>
                      </div>
                    )
                  })}

                  {/* Add Condition Button */}
                  <button
                    onClick={() => addCondition(group.id)}
                    disabled={metrics.length === 0}
                    className="w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-feedgod-dark-accent hover:border-feedgod-primary/50 rounded-lg text-gray-400 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Plus className="w-4 h-4" />
                    <span className="text-sm">Add Condition</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}

        {/* Add Group Button */}
        <button
          onClick={addConditionGroup}
          className="w-full flex items-center justify-center gap-2 py-4 bg-feedgod-dark-secondary border-2 border-dashed border-feedgod-dark-accent hover:border-feedgod-primary/50 rounded-xl text-gray-400 hover:text-white transition-colors"
        >
          <Plus className="w-5 h-5" />
          <span className="font-medium">Add Condition Group</span>
        </button>
      </div>
    </div>
  )
}
