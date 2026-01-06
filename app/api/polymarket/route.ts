import { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const endpoint = searchParams.get('endpoint') || 'markets'
  const search = searchParams.get('search') || ''
  
  try {
    // Build the Polymarket API URL
    let url = `https://gamma-api.polymarket.com/${endpoint}?closed=false&limit=100&order=volume&ascending=false`
    
    // Add search parameter if provided
    if (search) {
      url += `&text_query=${encodeURIComponent(search)}`
    }
    
    console.log('[Polymarket Proxy] Fetching:', url)
    
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'FeedGod/1.0',
      },
      next: { revalidate: 60 }, // Cache for 60 seconds
    })
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error('[Polymarket Proxy] API error:', response.status, errorText)
      return Response.json(
        { error: `Polymarket API error: ${response.status}`, details: errorText },
        { status: response.status }
      )
    }
    
    const data = await response.json()
    console.log('[Polymarket Proxy] Success:', Array.isArray(data) ? data.length : 'non-array', 'items')
    
    return Response.json(data)
  } catch (error) {
    console.error('[Polymarket Proxy] Error:', error)
    return Response.json(
      { error: 'Failed to fetch from Polymarket', details: String(error) },
      { status: 500 }
    )
  }
}

