'use client'

import { useState, useMemo } from 'react'
import { ChevronRight, ChevronDown, Copy, Check, Hash, Type, ToggleLeft, List, Braces, Circle } from 'lucide-react'
import { generatePath, getValueType, formatValue } from '@/lib/api/custom-api'
import { playPickupSound } from '@/lib/utils/sound-utils'

interface JSONPathSelectorProps {
  data: any
  selectedPath: string
  onSelectPath: (path: string, value: any) => void
}

// Type icons
const TypeIcon = ({ type }: { type: string }) => {
  switch (type) {
    case 'string':
      return <Type className="w-3 h-3 text-emerald-500" />
    case 'number':
      return <Hash className="w-3 h-3 text-feedgod-primary" />
    case 'boolean':
      return <ToggleLeft className="w-3 h-3 text-feedgod-primary" />
    case 'array':
      return <List className="w-3 h-3 text-amber-500" />
    case 'object':
      return <Braces className="w-3 h-3 text-pink-500" />
    case 'null':
      return <Circle className="w-3 h-3 text-gray-400" />
    default:
      return null
  }
}

// Individual tree node
function TreeNode({ 
  keyName,
  value, 
  path,
  depth,
  selectedPath,
  onSelect,
  defaultExpanded = false
}: { 
  keyName: string | number
  value: any
  path: (string | number)[]
  depth: number
  selectedPath: string
  onSelect: (path: string, value: any) => void
  defaultExpanded?: boolean
}) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded || depth < 2)
  
  const valueType = getValueType(value)
  const isExpandable = valueType === 'object' || valueType === 'array'
  const currentPath = generatePath(path)
  const isSelected = selectedPath === currentPath
  const isSelectable = !isExpandable || (valueType === 'array' && value.length > 0)
  
  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (isExpandable) {
      setIsExpanded(!isExpanded)
    }
  }
  
  const handleSelect = () => {
    if (isSelectable) {
      playPickupSound()
      onSelect(currentPath, value)
    }
  }
  
  // Get child entries
  const children = useMemo(() => {
    if (!isExpandable || !isExpanded) return []
    
    if (Array.isArray(value)) {
      return value.slice(0, 50).map((item, index) => ({
        key: index,
        value: item,
      }))
    }
    
    return Object.entries(value).slice(0, 100).map(([k, v]) => ({
      key: k,
      value: v,
    }))
  }, [value, isExpandable, isExpanded])
  
  // Format display value
  const displayValue = useMemo(() => {
    if (isExpandable) {
      if (Array.isArray(value)) {
        return `Array(${value.length})`
      }
      return `{${Object.keys(value).length}}`
    }
    return formatValue(value)
  }, [value, isExpandable])
  
  return (
    <div className="select-none">
      <div 
        className={`flex items-center gap-1 py-1 px-2 rounded cursor-pointer transition-colors ${
          isSelected 
            ? 'bg-feedgod-primary dark:text-feedgod-primary/20 border border-feedgod-primary dark:text-feedgod-primary' 
            : 'hover:bg-feedgod-purple-100 dark:bg-feedgod-dark-accent dark:hover:bg-feedgod-purple-200 dark:border-feedgod-dark-accent'
        }`}
        style={{ paddingLeft: `${depth * 16 + 8}px` }}
        onClick={handleSelect}
      >
        {/* Expand/collapse toggle */}
        {isExpandable ? (
          <button 
            onClick={handleToggle}
            className="w-4 h-4 flex items-center justify-center text-gray-400 dark:text-feedgod-secondary/70 hover:text-feedgod-primary dark:text-feedgod-primary"
          >
            {isExpanded ? (
              <ChevronDown className="w-3 h-3" />
            ) : (
              <ChevronRight className="w-3 h-3" />
            )}
          </button>
        ) : (
          <span className="w-4" />
        )}
        
        {/* Type icon */}
        <TypeIcon type={valueType} />
        
        {/* Key name */}
        <span className="font-mono text-sm text-white">
          {typeof keyName === 'number' ? `[${keyName}]` : keyName}
        </span>
        
        <span className="text-gray-400 dark:text-feedgod-secondary/70 /50">:</span>
        
        {/* Value */}
        <span className={`font-mono text-sm truncate max-w-[300px] ${
          valueType === 'string' ? 'text-emerald-600 dark:text-emerald-400' :
          valueType === 'number' ? 'text-feedgod-primary dark:text-blue-400' :
          valueType === 'boolean' ? 'text-feedgod-primary dark:text-feedgod-secondary' :
          valueType === 'null' ? 'text-gray-500' :
          'text-gray-400 /70'
        }`}>
          {displayValue}
        </span>
        
        {/* Selection indicator */}
        {isSelected && (
          <Check className="w-4 h-4 text-feedgod-primary dark:text-feedgod-primary ml-auto" />
        )}
      </div>
      
      {/* Children */}
      {isExpanded && children.length > 0 && (
        <div>
          {children.map(({ key, value: childValue }) => (
            <TreeNode
              key={key}
              keyName={key}
              value={childValue}
              path={[...path, key]}
              depth={depth + 1}
              selectedPath={selectedPath}
              onSelect={onSelect}
            />
          ))}
          {Array.isArray(value) && value.length > 50 && (
            <div 
              className="text-xs text-gray-400 dark:text-feedgod-secondary/70 italic py-1"
              style={{ paddingLeft: `${(depth + 1) * 16 + 8}px` }}
            >
              ...and {value.length - 50} more items
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function JSONPathSelector({ data, selectedPath, onSelectPath }: JSONPathSelectorProps) {
  const [copied, setCopied] = useState(false)
  
  const handleCopyPath = () => {
    if (selectedPath) {
      navigator.clipboard.writeText(selectedPath)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }
  
  // Handle raw text responses
  const isRawText = data && data._raw !== undefined && data._type === 'text'
  
  if (!data) {
    return (
      <div className="p-8 text-center text-gray-400 dark:text-feedgod-secondary/70 /50">
        <Braces className="w-12 h-12 mx-auto mb-3 opacity-50" />
        <p>No data to display</p>
        <p className="text-xs mt-1">Fetch an API to see the response</p>
      </div>
    )
  }
  
  return (
    <div className="space-y-4">
      {/* Selected path display */}
      {selectedPath && (
        <div className="flex items-center gap-2 p-3 bg-feedgod-primary dark:text-feedgod-primary/10 border border-feedgod-primary dark:text-feedgod-primary/30 rounded-lg">
          <span className="text-xs text-gray-400 /70">Selected:</span>
          <code className="flex-1 font-mono text-sm gradient-text font-bold">
            {selectedPath}
          </code>
          <button
            onClick={handleCopyPath}
            className="p-1 hover:bg-feedgod-primary dark:text-feedgod-primary/20 rounded transition-colors"
            title="Copy path"
          >
            {copied ? (
              <Check className="w-4 h-4 text-emerald-500" />
            ) : (
              <Copy className="w-4 h-4 text-feedgod-primary dark:text-feedgod-primary" />
            )}
          </button>
        </div>
      )}
      
      {/* Instruction */}
      <p className="text-xs text-gray-400 /70">
        Click on any value to select it for your oracle
      </p>
      
      {/* Tree view */}
      <div className="max-h-[400px] overflow-auto bg-feedgod-dark-secondary/60 dark:bg-feedgod-purple-50 dark:bg-feedgod-dark-secondary/60 rounded-lg border border-feedgod-purple-200 dark:border-feedgod-dark-accent dark:border-feedgod-purple-200 dark:border-feedgod-dark-accent">
        {isRawText ? (
          <div 
            className={`p-4 cursor-pointer rounded transition-colors ${
              selectedPath === '$._raw' 
                ? 'bg-feedgod-primary dark:text-feedgod-primary/20 border border-feedgod-primary dark:text-feedgod-primary' 
                : 'hover:bg-feedgod-purple-100 dark:bg-feedgod-dark-accent dark:hover:bg-feedgod-purple-200 dark:border-feedgod-dark-accent'
            }`}
            onClick={() => { playPickupSound(); onSelectPath('$._raw', data._raw); }}
          >
            <div className="flex items-center gap-2 mb-2">
              <Type className="w-4 h-4 text-emerald-500" />
              <span className="font-mono text-sm text-white">Plain Text Response</span>
              {selectedPath === '$._raw' && <Check className="w-4 h-4 text-feedgod-primary dark:text-feedgod-primary ml-auto" />}
            </div>
            <pre className="font-mono text-sm text-emerald-600 dark:text-emerald-400 whitespace-pre-wrap break-all">
              {data._raw}
            </pre>
          </div>
        ) : (
          <TreeNode
            keyName="response"
            value={data}
            path={[]}
            depth={0}
            selectedPath={selectedPath}
            onSelect={onSelectPath}
            defaultExpanded
          />
        )}
      </div>
    </div>
  )
}


