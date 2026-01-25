import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  extractValue,
  generatePath,
  applyTransforms,
  getValueType,
  formatValue,
  isValidUrl,
  generateJobDefinition
} from '@/lib/custom-api'
import type { TransformStep } from '@/types/custom-api'

describe('custom-api', () => {
  describe('extractValue', () => {
    const testData = {
      user: {
        name: 'John',
        age: 30,
        address: {
          city: 'NYC',
        },
      },
      items: [
        { id: 1, value: 100 },
        { id: 2, value: 200 },
      ],
      price: 99.99,
    }

    it('returns root data for $ path', () => {
      expect(extractValue(testData, '$')).toEqual(testData)
    })

    it('returns root data for empty path', () => {
      expect(extractValue(testData, '')).toEqual(testData)
    })

    it('extracts simple nested value', () => {
      expect(extractValue(testData, '$.user.name')).toBe('John')
    })

    it('extracts deeply nested value', () => {
      expect(extractValue(testData, '$.user.address.city')).toBe('NYC')
    })

    it('extracts array element by index', () => {
      expect(extractValue(testData, '$.items[0].value')).toBe(100)
    })

    it('extracts all array elements with wildcard', () => {
      expect(extractValue(testData, '$.items[*].value')).toEqual([100, 200])
    })

    it('handles path without $ prefix', () => {
      expect(extractValue(testData, 'price')).toBe(99.99)
    })

    it('returns undefined for non-existent path', () => {
      expect(extractValue(testData, '$.nonexistent')).toBeUndefined()
    })

    it('returns undefined for path through null', () => {
      expect(extractValue({ foo: null }, '$.foo.bar')).toBeUndefined()
    })
  })

  describe('generatePath', () => {
    it('returns $ for empty keys', () => {
      expect(generatePath([])).toBe('$')
    })

    it('generates path for string keys', () => {
      expect(generatePath(['user', 'name'])).toBe('$.user.name')
    })

    it('generates path with array index', () => {
      expect(generatePath(['items', 0, 'value'])).toBe('$.items[0].value')
    })

    it('handles special characters in keys', () => {
      expect(generatePath(['data', 'my-key'])).toBe('$.data["my-key"]')
    })
  })

  describe('applyTransforms', () => {
    it('applies multiply transform', () => {
      const transforms: TransformStep[] = [{ type: 'multiply', value: 2 }]
      expect(applyTransforms(50, transforms)).toBe(100)
    })

    it('applies divide transform', () => {
      const transforms: TransformStep[] = [{ type: 'divide', value: 2 }]
      expect(applyTransforms(100, transforms)).toBe(50)
    })

    it('applies round transform', () => {
      const transforms: TransformStep[] = [{ type: 'round', decimals: 2 }]
      expect(applyTransforms(99.999, transforms)).toBe(100)
    })

    it('applies floor transform', () => {
      const transforms: TransformStep[] = [{ type: 'floor' }]
      expect(applyTransforms(99.9, transforms)).toBe(99)
    })

    it('applies ceil transform', () => {
      const transforms: TransformStep[] = [{ type: 'ceil' }]
      expect(applyTransforms(99.1, transforms)).toBe(100)
    })

    it('applies abs transform', () => {
      const transforms: TransformStep[] = [{ type: 'abs' }]
      expect(applyTransforms(-50, transforms)).toBe(50)
    })

    it('applies percentage transform', () => {
      const transforms: TransformStep[] = [{ type: 'percentage' }]
      expect(applyTransforms(0.5, transforms)).toBe(50)
    })

    it('applies multiple transforms in order', () => {
      const transforms: TransformStep[] = [
        { type: 'multiply', value: 100 },
        { type: 'round', decimals: 0 },
      ]
      expect(applyTransforms(0.5555, transforms)).toBe(56)
    })

    it('converts string to number before transforms', () => {
      const transforms: TransformStep[] = [{ type: 'multiply', value: 2 }]
      expect(applyTransforms('25', transforms)).toBe(50)
    })

    it('handles divide by zero', () => {
      const transforms: TransformStep[] = [{ type: 'divide', value: 0 }]
      expect(applyTransforms(100, transforms)).toBe(100)
    })
  })

  describe('getValueType', () => {
    it('returns correct type for null', () => {
      expect(getValueType(null)).toBe('null')
    })

    it('returns correct type for array', () => {
      expect(getValueType([1, 2, 3])).toBe('array')
    })

    it('returns correct type for object', () => {
      expect(getValueType({ foo: 'bar' })).toBe('object')
    })

    it('returns correct type for string', () => {
      expect(getValueType('hello')).toBe('string')
    })

    it('returns correct type for number', () => {
      expect(getValueType(42)).toBe('number')
    })

    it('returns correct type for boolean', () => {
      expect(getValueType(true)).toBe('boolean')
    })
  })

  describe('formatValue', () => {
    it('formats null', () => {
      expect(formatValue(null)).toBe('null')
    })

    it('formats undefined', () => {
      expect(formatValue(undefined)).toBe('undefined')
    })

    it('formats arrays', () => {
      expect(formatValue([1, 2, 3])).toBe('Array(3)')
    })

    it('formats objects', () => {
      expect(formatValue({ a: 1, b: 2 })).toBe('Object(2 keys)')
    })

    it('formats short strings with quotes', () => {
      expect(formatValue('hello')).toBe('"hello"')
    })

    it('truncates long strings', () => {
      const longString = 'a'.repeat(60)
      expect(formatValue(longString)).toBe(`"${'a'.repeat(50)}..."`)
    })

    it('formats numbers', () => {
      expect(formatValue(42)).toBe('42')
    })
  })

  describe('isValidUrl', () => {
    it('validates http URLs', () => {
      expect(isValidUrl('http://example.com')).toBe(true)
    })

    it('validates https URLs', () => {
      expect(isValidUrl('https://api.example.com/data')).toBe(true)
    })

    it('rejects invalid URLs', () => {
      expect(isValidUrl('not-a-url')).toBe(false)
    })

    it('rejects non-http protocols', () => {
      expect(isValidUrl('ftp://example.com')).toBe(false)
    })

    it('rejects javascript protocol', () => {
      expect(isValidUrl('javascript:alert(1)')).toBe(false)
    })
  })

  describe('generateJobDefinition', () => {
    it('generates basic job with http task', () => {
      const config = {
        url: 'https://api.example.com/data',
        method: 'GET' as const,
        headers: [],
        jsonPath: '$',
        transforms: [],
      }

      const job = generateJobDefinition(config)

      expect(job).toHaveProperty('tasks')
      expect((job as any).tasks[0].httpTask).toBeDefined()
      expect((job as any).tasks[0].httpTask.url).toBe(config.url)
    })

    it('includes headers when provided', () => {
      const config = {
        url: 'https://api.example.com/data',
        method: 'GET' as const,
        headers: [{ key: 'Authorization', value: 'Bearer token', enabled: true }],
        jsonPath: '$.price',
        transforms: [],
      }

      const job = generateJobDefinition(config)

      expect((job as any).tasks[0].httpTask.headers).toBeDefined()
      expect((job as any).tasks[0].httpTask.headers.Authorization).toBe('Bearer token')
    })

    it('adds json parse task for non-root path', () => {
      const config = {
        url: 'https://api.example.com/data',
        method: 'GET' as const,
        headers: [],
        jsonPath: '$.data.price',
        transforms: [],
      }

      const job = generateJobDefinition(config)

      expect((job as any).tasks[1].jsonParseTask).toBeDefined()
      expect((job as any).tasks[1].jsonParseTask.path).toBe('$.data.price')
    })

    it('adds transform tasks', () => {
      const config = {
        url: 'https://api.example.com/data',
        method: 'GET' as const,
        headers: [],
        jsonPath: '$.price',
        transforms: [
          { type: 'multiply' as const, value: 100 },
          { type: 'divide' as const, value: 10 },
        ],
      }

      const job = generateJobDefinition(config)

      expect((job as any).tasks.some((t: any) => t.multiplyTask)).toBe(true)
      expect((job as any).tasks.some((t: any) => t.divideTask)).toBe(true)
    })

    it('ignores disabled headers', () => {
      const config = {
        url: 'https://api.example.com/data',
        method: 'GET' as const,
        headers: [
          { key: 'Authorization', value: 'Bearer token', enabled: false },
          { key: 'Accept', value: 'application/json', enabled: true },
        ],
        jsonPath: '$',
        transforms: [],
      }

      const job = generateJobDefinition(config)
      const headers = (job as any).tasks[0].httpTask.headers

      expect(headers).toBeDefined()
      expect(headers.Authorization).toBeUndefined()
      expect(headers.Accept).toBe('application/json')
    })
  })
})
