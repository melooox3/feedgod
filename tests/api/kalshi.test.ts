import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { GET } from '@/app/api/kalshi/route'
import { NextRequest } from 'next/server'

describe('Kalshi API Route', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn())
    vi.spyOn(console, 'log').mockImplementation(() => {})
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  function createRequest(params: Record<string, string> = {}): NextRequest {
    const url = new URL('http://localhost:3000/api/kalshi')
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.set(key, value)
    })
    return new NextRequest(url)
  }

  it('fetches events list when no event specified', async () => {
    const mockEvents = {
      events: [
        { ticker: 'PRES-2024', title: 'Presidential Election' },
        { ticker: 'FED-RATE', title: 'Fed Rate Decision' },
      ],
    }

    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockEvents),
    } as Response)

    const response = await GET(createRequest())
    const data = await response.json()

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('events?limit=100'),
      expect.any(Object)
    )
    expect(data.events).toHaveLength(2)
  })

  it('fetches specific event when event ticker provided', async () => {
    const mockEvent = {
      event: {
        ticker: 'PRES-2024',
        title: 'Presidential Election',
        markets: [],
      },
    }

    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockEvent),
    } as Response)

    const response = await GET(createRequest({ event: 'PRES-2024' }))
    const data = await response.json()

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('events/PRES-2024'),
      expect.any(Object)
    )
    expect(data.event.ticker).toBe('PRES-2024')
  })

  it('returns error response for API failure', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: false,
      status: 503,
      text: () => Promise.resolve('Service unavailable'),
    } as Response)

    const response = await GET(createRequest())

    expect(response.status).toBe(503)
    const data = await response.json()
    expect(data.error).toContain('Kalshi API error')
  })

  it('returns 500 for network errors', async () => {
    vi.mocked(fetch).mockRejectedValueOnce(new Error('Network error'))

    const response = await GET(createRequest())

    expect(response.status).toBe(500)
    const data = await response.json()
    expect(data.error).toBe('Failed to fetch from Kalshi')
  })

  it('includes correct headers in request', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ events: [] }),
    } as Response)

    await GET(createRequest())

    expect(fetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        headers: expect.objectContaining({
          'Accept': 'application/json',
          'User-Agent': 'FeedGod/1.0',
        }),
      })
    )
  })
})
