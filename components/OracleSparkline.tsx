'use client'

import { useMemo } from 'react'
import { OracleDataPoint } from '@/lib/oracle-monitor'

interface OracleSparklineProps {
  data: OracleDataPoint[]
  width?: number
  height?: number
  color?: string
  showArea?: boolean
  className?: string
}

export default function OracleSparkline({
  data,
  width = 120,
  height = 40,
  color = '#ec4899', // feedgod pink
  showArea = true,
  className = '',
}: OracleSparklineProps) {
  const { path, areaPath, minMax } = useMemo(() => {
    if (data.length < 2) {
      return { path: '', areaPath: '', minMax: { min: 0, max: 0 } }
    }
    
    const values = data.map(d => d.value)
    const min = Math.min(...values)
    const max = Math.max(...values)
    const range = max - min || 1
    
    // Add padding
    const paddedMin = min - range * 0.1
    const paddedMax = max + range * 0.1
    const paddedRange = paddedMax - paddedMin
    
    // Calculate points
    const points = data.map((point, index) => {
      const x = (index / (data.length - 1)) * width
      const y = height - ((point.value - paddedMin) / paddedRange) * height
      return { x, y }
    })
    
    // Build SVG path
    let path = `M ${points[0].x} ${points[0].y}`
    for (let i = 1; i < points.length; i++) {
      path += ` L ${points[i].x} ${points[i].y}`
    }
    
    // Build area path (for gradient fill)
    let areaPath = path + ` L ${width} ${height} L 0 ${height} Z`
    
    return { path, areaPath, minMax: { min, max } }
  }, [data, width, height])
  
  // Determine if trend is up or down
  const isPositive = data.length >= 2 && data[data.length - 1].value >= data[0].value
  const lineColor = isPositive ? '#10b981' : '#ef4444' // green/red
  
  if (data.length < 2) {
    return (
      <div 
        className={`flex items-center justify-center text-feedgod-pink-400 text-xs ${className}`}
        style={{ width, height }}
      >
        No data
      </div>
    )
  }
  
  return (
    <svg 
      width={width} 
      height={height} 
      className={className}
      viewBox={`0 0 ${width} ${height}`}
    >
      <defs>
        <linearGradient id={`sparkline-gradient-${isPositive ? 'up' : 'down'}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={lineColor} stopOpacity="0.3" />
          <stop offset="100%" stopColor={lineColor} stopOpacity="0" />
        </linearGradient>
      </defs>
      
      {/* Area fill */}
      {showArea && (
        <path
          d={areaPath}
          fill={`url(#sparkline-gradient-${isPositive ? 'up' : 'down'})`}
        />
      )}
      
      {/* Line */}
      <path
        d={path}
        fill="none"
        stroke={lineColor}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      
      {/* Current value dot */}
      {data.length > 0 && (
        <circle
          cx={width}
          cy={height - ((data[data.length - 1].value - (minMax.min - (minMax.max - minMax.min) * 0.1)) / ((minMax.max - minMax.min) * 1.2 || 1)) * height}
          r="2.5"
          fill={lineColor}
        />
      )}
    </svg>
  )
}

