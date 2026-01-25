import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { GET, POST } from '@/app/api/proxy/route'
import { NextRequest } from 'next/server'

describe('Proxy API Route', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn())
    vi.spyOn(console, 'log').mockImplementation(() => {})
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  function createGetRequest(url?: string, headers: Record<string, string> = {}): NextRequest {
    const reqUrl = new URL('http://localhost:3000/api/proxy')
    if (url) {
      reqUrl.searchParams.set('url', url)
    }
    return new NextRequest(reqUrl, {
      headers: new Headers(headers),
    })
  }

  function createPostRequest(url: string, body: string): NextRequest {
    const reqUrl = new URL('http://localhost:3000/api/proxy')
    reqUrl.searchParams.set('url', url)
    return new NextRequest(reqUrl, {
      method: 'POST',
      body,
    })
  }

  describe('GET', () => {
    it('returns 400 when url parameter is missing', async () => {
      const response = await GET(createGetRequest())

      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.error).toBe('Missing url parameter')
    })

    it('returns 400 for invalid URL', async () => {
      const response = await GET(createGetRequest('not-a-valid-url'))

      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.error).toBe('Invalid URL')
    })

    it('returns 400 for non-http/https protocols', async () => {
      const response = await GET(createGetRequest('ftp://example.com/file'))

      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.error).toBe('Invalid URL protocol')
    })

    it('proxies valid http request', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        text: () => Promise.resolve('{"data": "test"}'),
      } as Response)

      const response = await GET(createGetRequest('https://api.example.com/data'))

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.data).toBe('test')
    })

    it('forwards safe headers', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        text: () => Promise.resolve('{}'),
      } as Response)

      await GET(createGetRequest('https://api.example.com', {
        'authorization': 'Bearer token123',
        'x-api-key': 'api-key-123',
      }))

      expect(fetch).toHaveBeenCalledWith(
        'https://api.example.com',
        expect.objectContaining({
          headers: expect.objectContaining({
            'authorization': 'Bearer token123',
            'x-api-key': 'api-key-123',
          }),
        })
      )
    })

    it('handles non-JSON response', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'text/plain' }),
        text: () => Promise.resolve('Plain text response'),
      } as Response)

      const response = await GET(createGetRequest('https://api.example.com'))
      const data = await response.json()

      expect(data._raw).toBe('Plain text response')
      expect(data._type).toBe('text')
    })

    it('includes proxy status headers', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        text: () => Promise.resolve('{}'),
      } as Response)

      const response = await GET(createGetRequest('https://api.example.com'))

      expect(response.headers.get('X-Proxy-Status')).toBe('200')
      expect(response.headers.get('X-Proxy-Content-Type')).toBe('application/json')
    })

    it('returns 500 for network errors', async () => {
      vi.mocked(fetch).mockRejectedValueOnce(new Error('Network error'))

      const response = await GET(createGetRequest('https://api.example.com'))

      expect(response.status).toBe(500)
      const data = await response.json()
      expect(data.error).toBe('Network error')
    })
  })

  describe('POST', () => {
    it('returns 400 when url parameter is missing', async () => {
      const reqUrl = new URL('http://localhost:3000/api/proxy')
      const request = new NextRequest(reqUrl, {
        method: 'POST',
        body: '{}',
      })

      const response = await POST(request)

      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.error).toBe('Missing url parameter')
    })

    it('proxies POST request with body', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        status: 201,
        text: () => Promise.resolve('{"created": true}'),
      } as Response)

      const response = await POST(createPostRequest(
        'https://api.example.com/create',
        '{"name": "test"}'
      ))

      expect(fetch).toHaveBeenCalledWith(
        'https://api.example.com/create',
        expect.objectContaining({
          method: 'POST',
          body: '{"name": "test"}',
        })
      )

      const data = await response.json()
      expect(data.created).toBe(true)
    })

    it('handles POST network errors', async () => {
      vi.mocked(fetch).mockRejectedValueOnce(new Error('Connection timeout'))

      const response = await POST(createPostRequest(
        'https://api.example.com',
        '{}'
      ))

      expect(response.status).toBe(500)
      const data = await response.json()
      expect(data.error).toBe('Connection timeout')
    })
  })
})
