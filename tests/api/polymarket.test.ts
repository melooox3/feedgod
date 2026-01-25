import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { GET } from '@/app/api/polymarket/route'
import { NextRequest } from 'next/server'

describe('Polymarket API Route', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn())
    vi.spyOn(console, 'log').mockImplementation(() => {})
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  function createRequest(params: Record<string, string> = {}): NextRequest {
    const url = new URL('http://localhost:3000/api/polymarket')
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.set(key, value)
    })
    return new NextRequest(url)
  }

  it('fetches markets by default', async () => {
    const mockMarkets = [
      { id: '1', question: 'Will BTC reach $100k?' },
      { id: '2', question: 'Will ETH reach $5k?' },
    ]

    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockMarkets),
    } as Response)

    const response = await GET(createRequest())
    const data = await response.json()

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('markets?closed=false'),
      expect.any(Object)
    )
    expect(data).toHaveLength(2)
  })

  it('includes search parameter when provided', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve([]),
    } as Response)

    await GET(createRequest({ search: 'bitcoin' }))

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('text_query=bitcoin'),
      expect.any(Object)
    )
  })

  it('uses custom endpoint when specified', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve([]),
    } as Response)

    await GET(createRequest({ endpoint: 'events' }))

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/events?'),
      expect.any(Object)
    )
  })

  it('returns error response for API failure', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: false,
      status: 500,
      text: () => Promise.resolve('Internal server error'),
    } as Response)

    const response = await GET(createRequest())

    expect(response.status).toBe(500)
    const data = await response.json()
    expect(data.error).toContain('Polymarket API error')
  })

  it('returns 500 for network errors', async () => {
    vi.mocked(fetch).mockRejectedValueOnce(new Error('Connection refused'))

    const response = await GET(createRequest())

    expect(response.status).toBe(500)
    const data = await response.json()
    expect(data.error).toBe('Failed to fetch from Polymarket')
  })

  it('encodes search parameter properly', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve([]),
    } as Response)

    await GET(createRequest({ search: 'bitcoin price' }))

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('text_query=bitcoin%20price'),
      expect.any(Object)
    )
  })
})
