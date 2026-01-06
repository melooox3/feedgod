import { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const eventTicker = searchParams.get('event') || ''
  
  try {
    // Use EVENTS endpoint - returns cleaner, top-level event data
    let url = 'https://api.elections.kalshi.com/trade-api/v2/events?limit=100&status=open&with_nested_markets=true'
    
    // If a specific event is requested
    if (eventTicker) {
      url = `https://api.elections.kalshi.com/trade-api/v2/events/${eventTicker}`
    }
    
    console.log('[Kalshi Proxy] Fetching:', url)
    
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'FeedGod/1.0',
      },
      next: { revalidate: 60 }, // Cache for 60 seconds
    })
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error('[Kalshi Proxy] API error:', response.status, errorText)
      return Response.json(
        { error: `Kalshi API error: ${response.status}`, details: errorText },
        { status: response.status }
      )
    }
    
    const data = await response.json()
    console.log('[Kalshi Proxy] Events returned:', data.events?.length || (data.event ? 1 : 0))
    
    return Response.json(data)
  } catch (error) {
    console.error('[Kalshi Proxy] Error:', error)
    return Response.json(
      { error: 'Failed to fetch from Kalshi', details: String(error) },
      { status: 500 }
    )
  }
}
