import { PredictionMarket, PredictionPlatform, MarketSearchFilters } from '@/types/prediction'

/**
 * Fetch markets from Polymarket via our proxy API route
 */
export async function fetchPolymarketMarkets(filters?: MarketSearchFilters): Promise<PredictionMarket[]> {
  try {
    // Use our proxy API route to avoid CORS
    const params = new URLSearchParams({ endpoint: 'markets' })
    if (filters?.searchQuery) {
      params.set('search', filters.searchQuery)
    }
    
    const url = `/api/polymarket?${params}`
    console.log('[Polymarket] Fetching via proxy:', url)
    
    const response = await fetch(url)
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error('[Polymarket] API error:', response.status, errorText)
      return []
    }
    
    const data = await response.json()
    console.log('[Polymarket] Raw response:', data?.length || 0, 'markets')
    
    if (!Array.isArray(data)) {
      console.error('[Polymarket] Unexpected response format:', typeof data)
      return []
    }
    
    let markets: PredictionMarket[] = []
    
    for (const item of data) {
      try {
        // Must have a question/title
        const title = item.question || item.title
        if (!title || title.length < 10) continue
        
        // Parse outcomes
        let outcomes: string[] = []
        try {
          outcomes = typeof item.outcomes === 'string' 
            ? JSON.parse(item.outcomes) 
            : (item.outcomes || [])
        } catch {
          outcomes = ['Yes', 'No']
        }
        
        // Only binary markets
        if (outcomes.length !== 2) continue
        
        // Parse prices
        let prices: number[] = [0.5, 0.5]
        try {
          const parsedPrices = typeof item.outcomePrices === 'string'
            ? JSON.parse(item.outcomePrices)
            : (item.outcomePrices || [])
          if (Array.isArray(parsedPrices)) {
            prices = parsedPrices.map((p: any) => parseFloat(p) || 0.5)
          }
        } catch {}
        
        // Map to yes/no
        let yesPrice = 0.5
        let noPrice = 0.5
        
        for (let i = 0; i < outcomes.length; i++) {
          const name = String(outcomes[i]).toLowerCase().trim()
          if (name === 'yes') yesPrice = prices[i] || 0.5
          else if (name === 'no') noPrice = prices[i] || 0.5
        }
        
        // Validate prices
        if (yesPrice <= 0 || yesPrice >= 1) yesPrice = 0.5
        if (noPrice <= 0 || noPrice >= 1) noPrice = 1 - yesPrice
        
        const volume = parseFloat(item.volume) || parseFloat(item.volumeNum) || 0
        
        markets.push({
          id: `pm-${item.conditionId || item.id}`,
          title: title,
          description: item.description || title,
          outcomes: [
            { id: 'yes', name: 'Yes', price: yesPrice },
            { id: 'no', name: 'No', price: noPrice },
          ],
          endDate: new Date(item.endDate || item.end_date_iso || Date.now() + 30 * 24 * 60 * 60 * 1000),
          platform: 'polymarket' as PredictionPlatform,
          currentPrices: { yes: yesPrice, no: noPrice },
          volume,
          liquidity: parseFloat(item.liquidity) || 0,
          status: item.closed ? 'closed' : 'active',
          category: detectCategory(title),
          marketUrl: item.slug ? `https://polymarket.com/event/${item.slug}` : 'https://polymarket.com',
        })
      } catch (e) {
        console.debug('[Polymarket] Error parsing market:', e)
      }
    }
    
    // Apply search filter client-side
    if (filters?.searchQuery) {
      const query = filters.searchQuery.toLowerCase()
      markets = markets.filter(m => 
        m.title.toLowerCase().includes(query) ||
        m.description.toLowerCase().includes(query) ||
        (m.category && m.category.toLowerCase().includes(query))
      )
    }
    
    // Apply category filter
    if (filters?.category && filters.category !== 'all') {
      markets = markets.filter(m => m.category === filters.category)
    }
    
    // Sort by volume
    markets.sort((a, b) => (b.volume || 0) - (a.volume || 0))
    
    console.log('[Polymarket] Processed:', markets.length, 'markets')
    return markets.slice(0, 50)
    
  } catch (error) {
    console.error('[Polymarket] Fetch error:', error)
    return []
  }
}

/**
 * Fetch a specific Polymarket market via proxy
 */
export async function fetchPolymarketMarket(id: string): Promise<PredictionMarket | null> {
  try {
    const conditionId = id.replace('pm-', '')
    const response = await fetch(`/api/polymarket?endpoint=markets/${conditionId}`)
    if (!response.ok) return null
    
    const item = await response.json()
    const title = item.question || item.title || 'Unknown Market'
    
    let yesPrice = 0.5, noPrice = 0.5
    try {
      const prices = typeof item.outcomePrices === 'string' ? JSON.parse(item.outcomePrices) : item.outcomePrices
      const outcomes = typeof item.outcomes === 'string' ? JSON.parse(item.outcomes) : item.outcomes || ['Yes', 'No']
      outcomes.forEach((o: string, i: number) => {
        if (o.toLowerCase() === 'yes') yesPrice = parseFloat(prices[i]) || 0.5
        else if (o.toLowerCase() === 'no') noPrice = parseFloat(prices[i]) || 0.5
      })
    } catch {}
    
    return {
      id: `pm-${item.conditionId || item.id}`,
      title,
      description: item.description || title,
      outcomes: [
        { id: 'yes', name: 'Yes', price: yesPrice },
        { id: 'no', name: 'No', price: noPrice },
      ],
      endDate: new Date(item.endDate || Date.now() + 30 * 24 * 60 * 60 * 1000),
      platform: 'polymarket',
      currentPrices: { yes: yesPrice, no: noPrice },
      volume: parseFloat(item.volume) || 0,
      liquidity: parseFloat(item.liquidity) || 0,
      status: item.closed ? 'closed' : 'active',
      category: detectCategory(title),
      marketUrl: item.slug ? `https://polymarket.com/event/${item.slug}` : 'https://polymarket.com',
    }
  } catch (error) {
    console.error('[Polymarket] Error fetching market:', error)
    return null
  }
}

/**
 * Fetch events from Kalshi via our proxy API route
 * Uses the EVENTS endpoint which returns cleaner, top-level event data
 */
export async function fetchKalshiMarkets(filters?: MarketSearchFilters): Promise<PredictionMarket[]> {
  try {
    // Use our proxy API route to fetch events
    const url = '/api/kalshi'
    console.log('[Kalshi] Fetching events via proxy:', url)
    
    const response = await fetch(url)
    
    if (!response.ok) {
      console.error('[Kalshi] API error:', response.status)
      return []
    }
    
    const data = await response.json()
    const events = data.events || []
    console.log('[Kalshi] Events returned:', events.length)
    
    // Log first event to see structure
    if (events.length > 0) {
      console.log('[Kalshi] Sample event:', JSON.stringify(events[0], null, 2))
    }
    
    let markets: PredictionMarket[] = []
    
    for (const event of events) {
      try {
        // Get the event title - this should be clean!
        const title = event.title || ''
        
        // Skip if no title or no markets
        if (!title || title.length < 5) continue
        if (!event.markets || event.markets.length === 0) continue
        
        // Get the first/primary market for pricing
        const primaryMarket = event.markets[0]
        
        // Calculate price from the primary market
        let yesPrice = 0.5
        if (primaryMarket.yes_bid !== undefined && primaryMarket.yes_ask !== undefined) {
          yesPrice = ((primaryMarket.yes_bid + primaryMarket.yes_ask) / 2) / 100
        } else if (primaryMarket.last_price !== undefined) {
          yesPrice = primaryMarket.last_price / 100
        }
        
        // Validate price
        if (yesPrice <= 0.01 || yesPrice >= 0.99) yesPrice = 0.5
        const noPrice = 1 - yesPrice
        
        // Sum volume across all nested markets
        const totalVolume = event.markets.reduce((sum: number, m: any) => 
          sum + (m.volume || m.dollar_volume || 0), 0
        )
        
        // Get end date from first market
        const endDate = new Date(
          primaryMarket.close_time || 
          primaryMarket.expiration_time || 
          event.strike_date ||
          Date.now() + 7 * 24 * 60 * 60 * 1000
        )
        
        // Use event category or detect from title
        const category = event.category || detectCategory(title)
        
        markets.push({
          id: `kalshi-${event.event_ticker}`,
          title: title,
          description: event.sub_title || event.mutually_exclusive ? `${title} (${event.markets.length} outcomes)` : title,
          outcomes: [
            { id: 'yes', name: 'Yes', price: yesPrice },
            { id: 'no', name: 'No', price: noPrice },
          ],
          endDate,
          platform: 'kalshi' as PredictionPlatform,
          currentPrices: { yes: yesPrice, no: noPrice },
          volume: totalVolume,
          liquidity: primaryMarket.open_interest || 0,
          status: 'active',
          category,
          marketUrl: `https://kalshi.com/events/${event.event_ticker}`,
        })
        
        // Log first processed event for verification
        if (markets.length === 1) {
          console.log('[Kalshi] First processed event:', markets[0])
        }
      } catch (e) {
        console.debug('[Kalshi] Error parsing event:', e)
      }
    }
    
    // Apply search filter
    if (filters?.searchQuery) {
      const query = filters.searchQuery.toLowerCase()
      markets = markets.filter(m => 
        m.title.toLowerCase().includes(query) ||
        m.description.toLowerCase().includes(query) ||
        (m.category && m.category.toLowerCase().includes(query))
      )
    }
    
    // Apply category filter
    if (filters?.category && filters.category !== 'all') {
      markets = markets.filter(m => m.category === filters.category)
    }
    
    // Sort by volume
    markets.sort((a, b) => (b.volume || 0) - (a.volume || 0))
    
    console.log('[Kalshi] Processed:', markets.length, 'markets')
    return markets.slice(0, 50)
    
  } catch (error) {
    console.error('[Kalshi] Fetch error:', error)
    return []
  }
}

/**
 * Fetch a specific Kalshi event via proxy
 */
export async function fetchKalshiMarket(id: string): Promise<PredictionMarket | null> {
  try {
    const eventTicker = id.replace('kalshi-', '')
    const response = await fetch(`/api/kalshi?event=${eventTicker}`)
    if (!response.ok) return null
    
    const data = await response.json()
    const event = data.event
    
    if (!event) return null
    
    const title = event.title || 'Unknown'
    const primaryMarket = event.markets?.[0]
    
    let yesPrice = 0.5
    if (primaryMarket?.yes_bid !== undefined && primaryMarket?.yes_ask !== undefined) {
      yesPrice = ((primaryMarket.yes_bid + primaryMarket.yes_ask) / 2) / 100
    }
    
    const totalVolume = event.markets?.reduce((sum: number, m: any) => 
      sum + (m.volume || 0), 0
    ) || 0
    
    return {
      id: `kalshi-${event.event_ticker}`,
      title,
      description: event.sub_title || title,
      outcomes: [
        { id: 'yes', name: 'Yes', price: yesPrice },
        { id: 'no', name: 'No', price: 1 - yesPrice },
      ],
      endDate: new Date(primaryMarket?.close_time || Date.now() + 7 * 24 * 60 * 60 * 1000),
      platform: 'kalshi',
      currentPrices: { yes: yesPrice, no: 1 - yesPrice },
      volume: totalVolume,
      liquidity: primaryMarket?.open_interest || 0,
      status: 'active',
      category: event.category || detectCategory(title),
      marketUrl: `https://kalshi.com/events/${event.event_ticker}`,
    }
  } catch (error) {
    console.error('[Kalshi] Error fetching event:', error)
    return null
  }
}

/**
 * Fetch from all platforms
 */
export async function fetchAllMarkets(filters?: MarketSearchFilters): Promise<PredictionMarket[]> {
  console.log('[API] fetchAllMarkets called with:', filters)
  
  // If specific platform selected, only fetch from that one
  if (filters?.platform === 'polymarket') {
    return fetchPolymarketMarkets(filters)
  }
  if (filters?.platform === 'kalshi') {
    return fetchKalshiMarkets(filters)
  }
  
  // Fetch from both in parallel
  const results = await Promise.allSettled([
    fetchPolymarketMarkets(filters),
    fetchKalshiMarkets(filters),
  ])
  
  const polymarkets = results[0].status === 'fulfilled' ? results[0].value : []
  const kalshiMarkets = results[1].status === 'fulfilled' ? results[1].value : []
  
  console.log('[API] Combined - Polymarket:', polymarkets.length, 'Kalshi:', kalshiMarkets.length)
  
  // Combine and sort
  const all = [...polymarkets, ...kalshiMarkets]
  all.sort((a, b) => (b.volume || 0) - (a.volume || 0))
  
  return all
}

/**
 * Fetch specific market
 */
export async function fetchMarket(id: string): Promise<PredictionMarket | null> {
  if (id.startsWith('pm-')) return fetchPolymarketMarket(id)
  if (id.startsWith('kalshi-')) return fetchKalshiMarket(id)
  return null
}

/**
 * Detect category from text
 */
function detectCategory(text: string): string {
  const t = text.toLowerCase()
  
  if (t.includes('bitcoin') || t.includes('btc') || t.includes('ethereum') || t.includes('eth') || 
      t.includes('crypto') || t.includes('solana') || t.includes('blockchain') || t.includes('defi')) {
    return 'Crypto'
  }
  if (t.includes('trump') || t.includes('biden') || t.includes('harris') || t.includes('election') || 
      t.includes('president') || t.includes('congress') || t.includes('senate') || t.includes('vote') ||
      t.includes('democrat') || t.includes('republican') || t.includes('governor')) {
    return 'Politics'
  }
  if (t.includes('fed ') || t.includes('federal reserve') || t.includes('interest rate') || 
      t.includes('inflation') || t.includes('gdp') || t.includes('unemployment') || t.includes('recession') ||
      t.includes('stock') || t.includes('s&p') || t.includes('nasdaq') || t.includes('tariff')) {
    return 'Economics'
  }
  if (t.includes('rain') || t.includes('snow') || t.includes('temperature') || t.includes('weather') ||
      t.includes('hurricane') || t.includes('storm') || t.includes('climate')) {
    return 'Weather'
  }
  if (t.includes('nfl') || t.includes('nba') || t.includes('mlb') || t.includes('super bowl') ||
      t.includes('world cup') || t.includes('olympics') || t.includes('championship') ||
      t.includes('playoff') || t.includes('mvp')) {
    return 'Sports'
  }
  if (t.includes('ai ') || t.includes('artificial intelligence') || t.includes('openai') || 
      t.includes('chatgpt') || t.includes('tesla') || t.includes('spacex') || t.includes('apple') ||
      t.includes('google') || t.includes('microsoft') || t.includes('nvidia')) {
    return 'Technology'
  }
  if (t.includes('oscar') || t.includes('grammy') || t.includes('emmy') || t.includes('movie') ||
      t.includes('netflix') || t.includes('celebrity')) {
    return 'Entertainment'
  }
  
  return 'Other'
}

/**
 * Get available categories
 */
export function getAvailableCategories(): string[] {
  return ['Crypto', 'Politics', 'Economics', 'Weather', 'Sports', 'Technology', 'Entertainment', 'Other']
}

/**
 * Format volume for display
 */
export function formatVolume(volume: number): string {
  if (volume >= 1000000) return `$${(volume / 1000000).toFixed(1)}M`
  if (volume >= 1000) return `$${(volume / 1000).toFixed(0)}K`
  return `$${Math.round(volume)}`
}

/**
 * Format probability as percentage
 */
export function formatProbability(price: number): string {
  const pct = Math.round(price * 100)
  return `${Math.min(99, Math.max(1, pct))}%`
}

/**
 * Get time until market closes
 */
export function getTimeUntilClose(endDate: Date): string {
  const now = new Date()
  const diff = endDate.getTime() - now.getTime()
  
  if (diff < 0) return 'Closed'
  
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  
  if (days > 365) return `${Math.floor(days / 365)}y`
  if (days > 30) return `${Math.floor(days / 30)}mo`
  if (days > 0) return `${days}d`
  if (hours > 0) return `${hours}h`
  
  return `${Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))}m`
}
