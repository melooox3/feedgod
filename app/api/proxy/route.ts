import { NextRequest, NextResponse } from 'next/server'

/**
 * Generic API Proxy
 * Allows fetching from any URL while avoiding CORS issues
 */

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const targetUrl = searchParams.get('url')
  
  if (!targetUrl) {
    return NextResponse.json({ error: 'Missing url parameter' }, { status: 400 })
  }
  
  // Validate URL
  try {
    const url = new URL(targetUrl)
    if (!['http:', 'https:'].includes(url.protocol)) {
      return NextResponse.json({ error: 'Invalid URL protocol' }, { status: 400 })
    }
  } catch {
    return NextResponse.json({ error: 'Invalid URL' }, { status: 400 })
  }
  
  try {
    // Forward custom headers from request
    const customHeaders: Record<string, string> = {}
    request.headers.forEach((value, key) => {
      // Only forward safe headers
      if (['authorization', 'x-api-key', 'user-agent', 'accept'].includes(key.toLowerCase())) {
        customHeaders[key] = value
      }
    })
    
    console.log(`[Proxy] Fetching: ${targetUrl}`)
    
    const response = await fetch(targetUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json, text/plain, */*',
        'User-Agent': 'FeedGod/1.0 (Oracle Builder)',
        ...customHeaders,
      },
    })
    
    const contentType = response.headers.get('content-type') || ''
    const text = await response.text()
    
    // Try to parse as JSON
    let data: any
    try {
      data = JSON.parse(text)
    } catch {
      // Return as wrapped text if not JSON
      data = { _raw: text.trim(), _type: 'text' }
    }
    
    return NextResponse.json(data, {
      status: response.status,
      headers: {
        'X-Proxy-Status': String(response.status),
        'X-Proxy-Content-Type': contentType,
      },
    })
    
  } catch (error) {
    console.error('[Proxy] Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Proxy fetch failed' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const targetUrl = searchParams.get('url')
  
  if (!targetUrl) {
    return NextResponse.json({ error: 'Missing url parameter' }, { status: 400 })
  }
  
  try {
    const body = await request.text()
    
    const response = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'User-Agent': 'FeedGod/1.0 (Oracle Builder)',
      },
      body,
    })
    
    const text = await response.text()
    let data: any
    try {
      data = JSON.parse(text)
    } catch {
      data = { _raw: text.trim(), _type: 'text' }
    }
    
    return NextResponse.json(data, { status: response.status })
    
  } catch (error) {
    console.error('[Proxy POST] Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Proxy fetch failed' },
      { status: 500 }
    )
  }
}

