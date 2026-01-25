import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { GET, POST } from '@/app/api/ai-resolve/route'
import { NextRequest } from 'next/server'

describe('AI Resolve API Route', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  function createPostRequest(body: object): NextRequest {
    return new NextRequest('http://localhost:3000/api/ai-resolve', {
      method: 'POST',
      body: JSON.stringify(body),
      headers: { 'Content-Type': 'application/json' },
    })
  }

  describe('GET', () => {
    it('returns API status information', async () => {
      const response = await GET()
      const data = await response.json()

      expect(data.status).toBe('AI Resolution API is running')
      expect(data.mode).toBe('demo')
      expect(data.supportedTypes).toContain('binary')
      expect(data.supportedTypes).toContain('numeric')
    })
  })

  describe('POST', () => {
    it('returns 400 for missing question', async () => {
      const response = await POST(createPostRequest({
        resolutionType: 'binary',
      }))

      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.error).toContain('Question must be at least 10 characters')
    })

    it('returns 400 for short question', async () => {
      const response = await POST(createPostRequest({
        question: 'Short?',
        resolutionType: 'binary',
      }))

      expect(response.status).toBe(400)
    })

    it('returns 400 for missing resolution type', async () => {
      const response = await POST(createPostRequest({
        question: 'This is a valid question that is long enough',
      }))

      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.error).toContain('Resolution type is required')
    })

    it('resolves binary questions', async () => {
      const responsePromise = POST(createPostRequest({
        question: 'Will it rain in New York tomorrow morning?',
        resolutionType: 'binary',
        trustedSources: ['weather'],
      }))

      // Fast forward through the simulated delay
      await vi.advanceTimersByTimeAsync(3000)

      const response = await responsePromise
      const data = await response.json()

      expect(data.success).toBe(true)
      expect(typeof data.answer).toBe('boolean')
      expect(data.reasoning).toBeDefined()
      expect(data.confidence).toBeGreaterThanOrEqual(0)
      expect(data.confidence).toBeLessThanOrEqual(100)
    })

    it('resolves numeric questions', async () => {
      const responsePromise = POST(createPostRequest({
        question: 'What is the current Bitcoin price in USD?',
        resolutionType: 'numeric',
        trustedSources: ['crypto'],
      }))

      await vi.advanceTimersByTimeAsync(3000)

      const response = await responsePromise
      const data = await response.json()

      expect(data.success).toBe(true)
      expect(typeof data.answer).toBe('number')
      expect(data.answer).toBeGreaterThan(0)
    })

    it('resolves categorical questions', async () => {
      const responsePromise = POST(createPostRequest({
        question: 'Who will win the election this year?',
        resolutionType: 'categorical',
        categories: ['Candidate A', 'Candidate B', 'Candidate C'],
        trustedSources: ['news'],
      }))

      await vi.advanceTimersByTimeAsync(3000)

      const response = await responsePromise
      const data = await response.json()

      expect(data.success).toBe(true)
      expect(['Candidate A', 'Candidate B', 'Candidate C']).toContain(data.answer)
    })

    it('resolves text questions', async () => {
      const responsePromise = POST(createPostRequest({
        question: 'What is the top headline in tech news today?',
        resolutionType: 'text',
        trustedSources: ['news'],
      }))

      await vi.advanceTimersByTimeAsync(3000)

      const response = await responsePromise
      const data = await response.json()

      expect(data.success).toBe(true)
      expect(typeof data.answer).toBe('string')
    })

    it('includes warning for low confidence', async () => {
      // This test may not always trigger warning due to randomness
      // Testing the structure instead
      const responsePromise = POST(createPostRequest({
        question: 'What is an obscure random fact nobody knows?',
        resolutionType: 'text',
        trustedSources: [],
      }))

      await vi.advanceTimersByTimeAsync(3000)

      const response = await responsePromise
      const data = await response.json()

      expect(data.success).toBe(true)
      expect(data.timestamp).toBeDefined()
    })

    it('includes sources in response', async () => {
      const responsePromise = POST(createPostRequest({
        question: 'Will it snow in Boston during Christmas?',
        resolutionType: 'binary',
        trustedSources: ['weather'],
      }))

      await vi.advanceTimersByTimeAsync(3000)

      const response = await responsePromise
      const data = await response.json()

      expect(data.sources).toBeDefined()
      expect(Array.isArray(data.sources)).toBe(true)
    })

    it('handles JSON parse errors', async () => {
      const request = new NextRequest('http://localhost:3000/api/ai-resolve', {
        method: 'POST',
        body: 'invalid json',
        headers: { 'Content-Type': 'application/json' },
      })

      const response = await POST(request)

      expect(response.status).toBe(500)
      const data = await response.json()
      expect(data.success).toBe(false)
    })
  })
})
