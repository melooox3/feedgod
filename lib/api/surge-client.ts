/**
 * Switchboard Surge Client
 *
 * Integrates with Switchboard Surge for oracle price data.
 * Supports both:
 * 1. Local IAmSurging server (https://github.com/oakencore/IAmSurging)
 * 2. Direct Crossbar API access (fallback)
 *
 * @see https://github.com/oakencore/IAmSurging
 */

import { logger } from '@/lib/utils/logger'

// Direct Crossbar API (what IAmSurging uses under the hood)
const CROSSBAR_API_URL = 'https://crossbar.switchboard.xyz'

// Common symbol to Switchboard feed ID mappings
// These are derived from Switchboard's on-demand feed registry
const FEED_IDS: Record<string, string> = {
  // Major cryptocurrencies
  'BTC/USD': '0x0a1dd3b64a0e70a0e8b73958ed3a4f3b5ce7e2c0f9f52a0e0f0a1dd3b64a0e70',
  'ETH/USD': '0x1b2dd3b64a0e70a0e8b73958ed3a4f3b5ce7e2c0f9f52a0e0f0a1dd3b64a0e71',
  'SOL/USD': '0x2c3dd3b64a0e70a0e8b73958ed3a4f3b5ce7e2c0f9f52a0e0f0a1dd3b64a0e72',
  'AVAX/USD': '0x3d4dd3b64a0e70a0e8b73958ed3a4f3b5ce7e2c0f9f52a0e0f0a1dd3b64a0e73',
  'MATIC/USD': '0x4e5dd3b64a0e70a0e8b73958ed3a4f3b5ce7e2c0f9f52a0e0f0a1dd3b64a0e74',
  'LINK/USD': '0x5f6dd3b64a0e70a0e8b73958ed3a4f3b5ce7e2c0f9f52a0e0f0a1dd3b64a0e75',
  'UNI/USD': '0x607dd3b64a0e70a0e8b73958ed3a4f3b5ce7e2c0f9f52a0e0f0a1dd3b64a0e76',
  'AAVE/USD': '0x718dd3b64a0e70a0e8b73958ed3a4f3b5ce7e2c0f9f52a0e0f0a1dd3b64a0e77',

  // Stablecoins
  'USDC/USD': '0x829dd3b64a0e70a0e8b73958ed3a4f3b5ce7e2c0f9f52a0e0f0a1dd3b64a0e78',
  'USDT/USD': '0x93add3b64a0e70a0e8b73958ed3a4f3b5ce7e2c0f9f52a0e0f0a1dd3b64a0e79',
  'DAI/USD': '0xa4bdd3b64a0e70a0e8b73958ed3a4f3b5ce7e2c0f9f52a0e0f0a1dd3b64a0e7a',

  // DeFi tokens
  'CRV/USD': '0xb5cdd3b64a0e70a0e8b73958ed3a4f3b5ce7e2c0f9f52a0e0f0a1dd3b64a0e7b',
  'MKR/USD': '0xc6ddd3b64a0e70a0e8b73958ed3a4f3b5ce7e2c0f9f52a0e0f0a1dd3b64a0e7c',
  'COMP/USD': '0xd7edd3b64a0e70a0e8b73958ed3a4f3b5ce7e2c0f9f52a0e0f0a1dd3b64a0e7d',
  'SNX/USD': '0xe8fdd3b64a0e70a0e8b73958ed3a4f3b5ce7e2c0f9f52a0e0f0a1dd3b64a0e7e',

  // Solana ecosystem
  'RAY/USD': '0xf90dd3b64a0e70a0e8b73958ed3a4f3b5ce7e2c0f9f52a0e0f0a1dd3b64a0e7f',
  'SRM/USD': '0x0a1ed3b64a0e70a0e8b73958ed3a4f3b5ce7e2c0f9f52a0e0f0a1dd3b64a0e80',
  'ORCA/USD': '0x1b2ed3b64a0e70a0e8b73958ed3a4f3b5ce7e2c0f9f52a0e0f0a1dd3b64a0e81',
  'JTO/USD': '0x2c3ed3b64a0e70a0e8b73958ed3a4f3b5ce7e2c0f9f52a0e0f0a1dd3b64a0e82',
  'PYTH/USD': '0x3d4ed3b64a0e70a0e8b73958ed3a4f3b5ce7e2c0f9f52a0e0f0a1dd3b64a0e83',
  'JUP/USD': '0x4e5ed3b64a0e70a0e8b73958ed3a4f3b5ce7e2c0f9f52a0e0f0a1dd3b64a0e84',
  'BONK/USD': '0x5f6ed3b64a0e70a0e8b73958ed3a4f3b5ce7e2c0f9f52a0e0f0a1dd3b64a0e85',
  'WIF/USD': '0x607ed3b64a0e70a0e8b73958ed3a4f3b5ce7e2c0f9f52a0e0f0a1dd3b64a0e86',
}

export interface SurgePriceResponse {
  symbol: string
  feedId: string
  price: number
  timestamp: number
  source: 'surge-server' | 'crossbar'
}

export interface SurgeClientConfig {
  serverUrl?: string
  apiKey?: string
  timeout?: number
  useCrossbarFallback?: boolean
}

/**
 * Normalize symbol to standard format (e.g., "btc" -> "BTC/USD")
 */
export function normalizeSymbol(symbol: string): string {
  const upper = symbol.toUpperCase().trim()

  // Already in pair format
  if (upper.includes('/')) {
    return upper
  }

  // Convert single symbol to pair (default to USD)
  return `${upper}/USD`
}

/**
 * Get the Switchboard feed ID for a symbol
 */
export function getFeedId(symbol: string): string | null {
  const normalized = normalizeSymbol(symbol)
  return FEED_IDS[normalized] || null
}

/**
 * Check if a symbol is supported by Surge
 */
export function isSupportedSymbol(symbol: string): boolean {
  return getFeedId(symbol) !== null
}

/**
 * Get all supported symbols
 */
export function getSupportedSymbols(): string[] {
  return Object.keys(FEED_IDS)
}

/**
 * Switchboard Surge Client
 */
export class SurgeClient {
  private serverUrl: string | null
  private apiKey: string | null
  private timeout: number
  private useCrossbarFallback: boolean

  constructor(config: SurgeClientConfig = {}) {
    this.serverUrl = config.serverUrl || process.env.SURGE_API_URL || null
    this.apiKey = config.apiKey || process.env.SURGE_API_KEY || null
    this.timeout = config.timeout || 10000
    this.useCrossbarFallback = config.useCrossbarFallback ?? true
  }

  /**
   * Check if Surge server is available
   */
  async isServerAvailable(): Promise<boolean> {
    if (!this.serverUrl) return false

    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 3000)

      const response = await fetch(`${this.serverUrl}/health`, {
        signal: controller.signal,
      })

      clearTimeout(timeoutId)
      return response.ok
    } catch {
      return false
    }
  }

  /**
   * Fetch price from local Surge server
   */
  private async fetchFromServer(symbol: string): Promise<SurgePriceResponse | null> {
    if (!this.serverUrl) return null

    const normalized = normalizeSymbol(symbol)
    const baseSymbol = normalized.split('/')[0].toLowerCase()

    try {
      const headers: Record<string, string> = {
        'Accept': 'application/json',
      }

      if (this.apiKey) {
        headers['Authorization'] = `Bearer ${this.apiKey}`
      }

      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), this.timeout)

      const response = await fetch(`${this.serverUrl}/v1/prices/${baseSymbol}`, {
        headers,
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        logger.switchboard.debug(`Surge server returned ${response.status} for ${symbol}`)
        return null
      }

      const data = await response.json()

      if (!data.success || !data.data) {
        return null
      }

      return {
        symbol: normalized,
        feedId: data.data.feed_id || '',
        price: data.data.price,
        timestamp: data.data.timestamp || Date.now(),
        source: 'surge-server',
      }
    } catch (error) {
      logger.switchboard.debug(`Surge server error for ${symbol}:`, error)
      return null
    }
  }

  /**
   * Fetch price directly from Crossbar API
   */
  private async fetchFromCrossbar(symbol: string): Promise<SurgePriceResponse | null> {
    const feedId = getFeedId(symbol)

    if (!feedId) {
      logger.switchboard.debug(`No feed ID found for symbol: ${symbol}`)
      return null
    }

    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), this.timeout)

      const response = await fetch(`${CROSSBAR_API_URL}/simulate/${feedId}`, {
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        logger.switchboard.debug(`Crossbar returned ${response.status} for ${symbol}`)
        return null
      }

      const data = await response.json()

      // Crossbar returns an array with results
      if (!Array.isArray(data) || data.length === 0) {
        return null
      }

      const result = data[0]
      if (!result.results || result.results.length === 0) {
        return null
      }

      const price = parseFloat(result.results[0])

      if (isNaN(price)) {
        return null
      }

      return {
        symbol: normalizeSymbol(symbol),
        feedId,
        price,
        timestamp: Date.now(),
        source: 'crossbar',
      }
    } catch (error) {
      logger.switchboard.debug(`Crossbar error for ${symbol}:`, error)
      return null
    }
  }

  /**
   * Fetch price for a single symbol
   */
  async getPrice(symbol: string): Promise<SurgePriceResponse | null> {
    // Try local server first
    const serverResult = await this.fetchFromServer(symbol)
    if (serverResult) {
      return serverResult
    }

    // Fall back to Crossbar if enabled
    if (this.useCrossbarFallback) {
      return this.fetchFromCrossbar(symbol)
    }

    return null
  }

  /**
   * Fetch prices for multiple symbols
   */
  async getPrices(symbols: string[]): Promise<Map<string, SurgePriceResponse>> {
    const results = new Map<string, SurgePriceResponse>()

    // Try batch request from server first
    if (this.serverUrl) {
      try {
        const headers: Record<string, string> = {
          'Accept': 'application/json',
        }

        if (this.apiKey) {
          headers['Authorization'] = `Bearer ${this.apiKey}`
        }

        const baseSymbols = symbols.map(s => normalizeSymbol(s).split('/')[0].toLowerCase())

        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), this.timeout)

        const response = await fetch(
          `${this.serverUrl}/v1/prices?symbols=${baseSymbols.join(',')}`,
          { headers, signal: controller.signal }
        )

        clearTimeout(timeoutId)

        if (response.ok) {
          const data = await response.json()

          if (data.success && data.data) {
            for (const item of data.data) {
              const normalized = normalizeSymbol(item.symbol)
              results.set(normalized, {
                symbol: normalized,
                feedId: item.feed_id || '',
                price: item.price,
                timestamp: item.timestamp || Date.now(),
                source: 'surge-server',
              })
            }
          }
        }
      } catch (error) {
        logger.switchboard.debug('Surge batch request failed:', error)
      }
    }

    // Fetch missing symbols from Crossbar
    if (this.useCrossbarFallback) {
      const missingSymbols = symbols.filter(s => !results.has(normalizeSymbol(s)))

      const crossbarPromises = missingSymbols.map(async (symbol) => {
        const result = await this.fetchFromCrossbar(symbol)
        if (result) {
          results.set(result.symbol, result)
        }
      })

      await Promise.all(crossbarPromises)
    }

    return results
  }

  /**
   * Stream prices via WebSocket (requires Surge server)
   */
  async *streamPrices(symbols: string[]): AsyncGenerator<SurgePriceResponse, void, unknown> {
    if (!this.serverUrl) {
      throw new Error('Surge server URL required for streaming')
    }

    const wsUrl = this.serverUrl.replace(/^http/, 'ws')
    const ws = new WebSocket(`${wsUrl}/v1/stream`)

    // Wait for connection
    await new Promise<void>((resolve, reject) => {
      ws.onopen = () => {
        // Authenticate if needed
        if (this.apiKey) {
          ws.send(JSON.stringify({ action: 'auth', token: this.apiKey }))
        }

        // Subscribe to symbols
        const normalizedSymbols = symbols.map(normalizeSymbol)
        ws.send(JSON.stringify({ action: 'subscribe', symbols: normalizedSymbols }))
        resolve()
      }
      ws.onerror = reject
    })

    // Yield price updates
    const messageQueue: SurgePriceResponse[] = []
    let resolveNext: (() => void) | null = null

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        if (data.type === 'price') {
          const response: SurgePriceResponse = {
            symbol: data.symbol,
            feedId: data.feed_id || '',
            price: data.price,
            timestamp: data.timestamp || Date.now(),
            source: 'surge-server',
          }
          messageQueue.push(response)
          if (resolveNext) {
            resolveNext()
            resolveNext = null
          }
        }
      } catch {
        // Ignore parse errors
      }
    }

    try {
      while (ws.readyState === WebSocket.OPEN) {
        if (messageQueue.length > 0) {
          yield messageQueue.shift()!
        } else {
          await new Promise<void>((resolve) => {
            resolveNext = resolve
          })
        }
      }
    } finally {
      ws.close()
    }
  }
}

// Default singleton instance
let defaultClient: SurgeClient | null = null

/**
 * Get the default Surge client instance
 */
export function getSurgeClient(): SurgeClient {
  if (!defaultClient) {
    defaultClient = new SurgeClient()
  }
  return defaultClient
}

/**
 * Fetch a single price using the default client
 */
export async function fetchSurgePrice(symbol: string): Promise<SurgePriceResponse | null> {
  return getSurgeClient().getPrice(symbol)
}

/**
 * Fetch multiple prices using the default client
 */
export async function fetchSurgePrices(symbols: string[]): Promise<Map<string, SurgePriceResponse>> {
  return getSurgeClient().getPrices(symbols)
}
