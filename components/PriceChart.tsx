'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { RefreshCw, TrendingUp, TrendingDown } from 'lucide-react'

interface PriceChartProps {
  data: Array<{ time: number; price: number }>
  symbol: string
  currentPrice: number | null
  priceChange: number | null
  aggregatorType: string
  sourceCount: number
  onRefresh?: () => void
}

type TimeInterval = '1m' | '5m' | '15m' | '1h' | '4h' | '1D' | '1W'

export default function PriceChart({ 
  data, 
  symbol, 
  currentPrice,
  priceChange,
  aggregatorType,
  sourceCount,
  onRefresh 
}: PriceChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [hoveredPoint, setHoveredPoint] = useState<{ x: number; y: number; price: number; time: Date } | null>(null)
  const [timeInterval, setTimeInterval] = useState<TimeInterval>('1D')
  const [filteredData, setFilteredData] = useState<Array<{ time: number; price: number }>>(data)

  const intervals: { label: string; value: TimeInterval }[] = [
    { label: '1m', value: '1m' },
    { label: '5m', value: '5m' },
    { label: '15m', value: '15m' },
    { label: '1h', value: '1h' },
    { label: '4h', value: '4h' },
    { label: '1D', value: '1D' },
    { label: '1W', value: '1W' },
  ]

  // Filter data based on time interval
  useEffect(() => {
    if (!data || data.length === 0) return

    const now = Date.now()
    let timeRange = 24 * 60 * 60 * 1000 // Default 24 hours

    switch (timeInterval) {
      case '1m':
        timeRange = 60 * 1000
        break
      case '5m':
        timeRange = 5 * 60 * 1000
        break
      case '15m':
        timeRange = 15 * 60 * 1000
        break
      case '1h':
        timeRange = 60 * 60 * 1000
        break
      case '4h':
        timeRange = 4 * 60 * 60 * 1000
        break
      case '1D':
        timeRange = 24 * 60 * 60 * 1000
        break
      case '1W':
        timeRange = 7 * 24 * 60 * 60 * 1000
        break
    }

    const filtered = data.filter(point => point.time >= now - timeRange)
    setFilteredData(filtered.length > 0 ? filtered : data)
  }, [data, timeInterval])

  const drawChart = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas || !filteredData || filteredData.length === 0) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Set canvas size based on container
    const container = containerRef.current
    if (container) {
      const rect = container.getBoundingClientRect()
      canvas.width = rect.width * 2 // For retina displays
      canvas.height = 400 * 2
      canvas.style.width = `${rect.width}px`
      canvas.style.height = '400px'
    }

    const width = canvas.width
    const height = canvas.height
    const padding = { left: 100, right: 20, top: 40, bottom: 60 }

    // Clear canvas
    ctx.clearRect(0, 0, width, height)

    // Find min/max prices
    const prices = filteredData.map(d => d.price)
    const minPrice = Math.min(...prices)
    const maxPrice = Math.max(...prices)
    const priceRange = maxPrice - minPrice || 1
    const paddingAmount = priceRange * 0.1 // 10% padding

    // Draw grid lines
    ctx.strokeStyle = '#334155'
    ctx.lineWidth = 1
    ctx.setLineDash([5, 5])
    for (let i = 0; i <= 5; i++) {
      const y = padding.top + ((height - padding.top - padding.bottom) * i) / 5
      ctx.beginPath()
      ctx.moveTo(padding.left, y)
      ctx.lineTo(width - padding.right, y)
      ctx.stroke()
    }
    ctx.setLineDash([])

    // Draw price labels (left side) - MUCH LARGER
    ctx.fillStyle = '#E2E8F0'
    ctx.font = 'bold 18px Inter, system-ui, sans-serif'
    ctx.textAlign = 'right'
    ctx.textBaseline = 'middle'
    for (let i = 0; i <= 5; i++) {
      const price = maxPrice + paddingAmount - ((priceRange + paddingAmount * 2) * i) / 5
      const y = padding.top + ((height - padding.top - padding.bottom) * i) / 5
      ctx.fillText(`$${price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, padding.left - 20, y)
    }

    // Draw time labels (bottom) - larger
    ctx.fillStyle = '#94A3B8'
    ctx.font = 'bold 13px Inter, system-ui, sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'top'
    const timeLabels = 6
    for (let i = 0; i < timeLabels; i++) {
      const index = Math.floor((filteredData.length - 1) * (i / (timeLabels - 1)))
      const point = filteredData[index]
      if (point) {
        const x = padding.left + ((width - padding.left - padding.right) * i) / (timeLabels - 1)
        const date = new Date(point.time)
        const timeStr = date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
        ctx.fillText(timeStr, x, height - padding.bottom + 10)
      }
    }

    // Draw price line with gradient
    const gradient = ctx.createLinearGradient(0, padding.top, 0, height - padding.bottom)
    gradient.addColorStop(0, '#EC4899') // Pink
    gradient.addColorStop(0.5, '#F472B6') // Light pink
    gradient.addColorStop(1, '#F9A8D4') // Lighter pink

    ctx.strokeStyle = gradient
    ctx.fillStyle = gradient
    ctx.lineWidth = 3
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.beginPath()

    const points: Array<{ x: number; y: number; price: number; time: number }> = []
    filteredData.forEach((point, index) => {
      const x = padding.left + ((width - padding.left - padding.right) * index) / (filteredData.length - 1 || 1)
      const priceY = minPrice - paddingAmount
      const y = padding.top + ((point.price - priceY) / (priceRange + paddingAmount * 2)) * (height - padding.top - padding.bottom)
      points.push({ x, y, price: point.price, time: point.time })

      if (index === 0) {
        ctx.moveTo(x, y)
      } else {
        ctx.lineTo(x, y)
      }
    })

    ctx.stroke()

    // Draw gradient fill under line
    const fillGradient = ctx.createLinearGradient(0, padding.top, 0, height - padding.bottom)
    fillGradient.addColorStop(0, 'rgba(236, 72, 153, 0.3)')
    fillGradient.addColorStop(0.5, 'rgba(244, 114, 182, 0.2)')
    fillGradient.addColorStop(1, 'rgba(249, 168, 212, 0.1)')

    ctx.fillStyle = fillGradient
    ctx.lineTo(width - padding.right, height - padding.bottom)
    ctx.lineTo(padding.left, height - padding.bottom)
    ctx.closePath()
    ctx.fill()

    // Draw hover point
    if (hoveredPoint) {
      // Find closest point
      const closestPoint = points.reduce((closest, point) => {
        const dist = Math.abs(point.x - hoveredPoint.x)
        const closestDist = Math.abs(closest.x - hoveredPoint.x)
        return dist < closestDist ? point : closest
      }, points[0])

      // Draw vertical line
      ctx.strokeStyle = '#64748B'
      ctx.lineWidth = 1
      ctx.setLineDash([5, 5])
      ctx.beginPath()
      ctx.moveTo(closestPoint.x, padding.top)
      ctx.lineTo(closestPoint.x, height - padding.bottom)
      ctx.stroke()
      ctx.setLineDash([])

      // Draw point
      ctx.fillStyle = '#FFFFFF'
      ctx.strokeStyle = gradient
      ctx.lineWidth = 3
      ctx.beginPath()
      ctx.arc(closestPoint.x, closestPoint.y, 6, 0, Math.PI * 2)
      ctx.fill()
      ctx.stroke()
    }

    // Store points for hover detection
    ;(canvas as any).chartPoints = points
  }, [filteredData, hoveredPoint])

  useEffect(() => {
    drawChart()
  }, [drawChart])

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const x = (e.clientX - rect.left) * 2 // Account for retina scaling
    const points = (canvas as any).chartPoints as Array<{ x: number; y: number; price: number; time: number }>

    if (points && points.length > 0) {
      const closestPoint = points.reduce((closest, point) => {
        const dist = Math.abs(point.x - x)
        const closestDist = Math.abs(closest.x - x)
        return dist < closestDist ? point : closest
      }, points[0])

      if (closestPoint) {
        setHoveredPoint({
          x: e.clientX - rect.left,
          y: e.clientY - rect.top,
          price: closestPoint.price,
          time: new Date(closestPoint.time),
        })
      }
    }
  }

  const handleMouseLeave = () => {
    setHoveredPoint(null)
  }

  return (
    <div className="bg-white/60 rounded-lg border border-feedgod-pink-200 p-6 backdrop-blur-sm">
      {/* Combined Header with Price Info */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex-1">
          <div className="flex items-center gap-4 mb-3">
            <h3 className="text-xl font-bold text-feedgod-primary">{symbol} Price Chart</h3>
            {priceChange !== null && (
              priceChange >= 0 ? (
                <TrendingUp className="w-5 h-5 text-green-400" />
              ) : (
                <TrendingDown className="w-5 h-5 text-red-400" />
              )
            )}
          </div>
          {currentPrice !== null ? (
            <div className="space-y-1">
              <p className="text-4xl font-bold text-feedgod-primary">
                ${currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
              <p className={`text-sm font-medium ${priceChange !== null && priceChange >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                {priceChange !== null ? `${priceChange >= 0 ? '+' : ''}${priceChange.toFixed(2)}%` : 'N/A'} (24h)
              </p>
              <p className="text-xs text-feedgod-pink-500 mt-2">
                Aggregated from {sourceCount} source{sourceCount !== 1 ? 's' : ''} using {aggregatorType} method
              </p>
            </div>
          ) : (
            <div className="text-2xl font-bold text-feedgod-pink-400">Loading...</div>
          )}
        </div>
        <div className="flex items-center gap-3">
          {/* Time Interval Selector */}
          <div className="flex items-center gap-1 bg-feedgod-pink-100 rounded-lg p-1">
            {intervals.map((interval) => (
              <button
                key={interval.value}
                onClick={() => setTimeInterval(interval.value)}
                className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                  timeInterval === interval.value
                    ? 'bg-feedgod-primary text-white'
                    : 'text-feedgod-pink-500 hover:text-feedgod-primary'
                }`}
              >
                {interval.label}
              </button>
            ))}
          </div>
          {onRefresh && (
            <button
              onClick={onRefresh}
              className="p-2 hover:bg-feedgod-pink-100 rounded-lg transition-colors"
              title="Refresh prices"
            >
              <RefreshCw className="w-4 h-4 text-feedgod-pink-500 hover:text-feedgod-primary" />
            </button>
          )}
        </div>
      </div>

      {/* Chart */}
      <div className="relative w-full" ref={containerRef}>
        {filteredData.length === 0 ? (
          <div className="h-[400px] flex items-center justify-center text-feedgod-pink-400">
            Loading chart data...
          </div>
        ) : (
          <>
            <canvas
              ref={canvasRef}
              className="w-full h-[400px] cursor-crosshair"
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
            />
            {/* Hover Tooltip */}
            {hoveredPoint && (
              <div
                className="absolute pointer-events-none bg-white border border-feedgod-pink-200 rounded-lg px-3 py-2 shadow-xl z-10"
                style={{
                  left: `${hoveredPoint.x}px`,
                  top: `${hoveredPoint.y - 60}px`,
                  transform: 'translateX(-50%)',
                }}
              >
                <div className="text-xs text-feedgod-pink-500 mb-1">
                  {hoveredPoint.time.toLocaleString()}
                </div>
                <div className="text-sm font-bold text-feedgod-primary">
                  ${hoveredPoint.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
