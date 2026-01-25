import { APIHeader, APITestResult, TransformStep, TransformType } from '@/types/custom-api'

/**
 * Test an API endpoint and return the response
 */
export async function testEndpoint(
  url: string,
  method: 'GET' | 'POST' = 'GET',
  headers: APIHeader[] = [],
  body?: string
): Promise<APITestResult> {
  const startTime = Date.now()
  
  try {
    // Build headers object
    const headerObj: Record<string, string> = {}
    headers.filter(h => h.enabled && h.key).forEach(h => {
      headerObj[h.key] = h.value
    })
    
    // Use our proxy to avoid CORS
    const proxyUrl = `/api/proxy?url=${encodeURIComponent(url)}`
    
    const response = await fetch(proxyUrl, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headerObj,
      },
      body: method === 'POST' && body ? body : undefined,
    })
    
    const responseTime = Date.now() - startTime
    
    // Try to parse as JSON
    let data: any
    const contentType = response.headers.get('content-type')
    const text = await response.text()
    
    try {
      data = JSON.parse(text)
    } catch {
      // If not JSON, wrap in object
      data = { _raw: text.trim() }
    }
    
    if (!response.ok) {
      return {
        success: false,
        statusCode: response.status,
        error: `HTTP ${response.status}: ${response.statusText}`,
        data,
        responseTime,
      }
    }
    
    return {
      success: true,
      statusCode: response.status,
      data,
      responseTime,
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      responseTime: Date.now() - startTime,
    }
  }
}

/**
 * Extract a value from JSON using a JSONPath-like expression
 * Supports: $.key.nested, $.array[0], $.array[*].field
 */
export function extractValue(data: any, path: string): any {
  if (!path || path === '$') {
    return data
  }
  
  // Remove leading $. if present
  let cleanPath = path.startsWith('$.') ? path.slice(2) : path.startsWith('$') ? path.slice(1) : path
  
  // Handle empty path
  if (!cleanPath) {
    return data
  }
  
  // Split path into parts, handling array notation
  const parts = cleanPath.split(/\.|\[|\]/).filter(Boolean)
  
  let current = data
  
  for (const part of parts) {
    if (current === null || current === undefined) {
      return undefined
    }
    
    // Handle array wildcard
    if (part === '*' && Array.isArray(current)) {
      // Return array of values from remaining path
      const remainingPath = parts.slice(parts.indexOf(part) + 1).join('.')
      if (remainingPath) {
        return current.map(item => extractValue(item, remainingPath))
      }
      return current
    }
    
    // Handle numeric index
    const numIndex = parseInt(part, 10)
    if (!isNaN(numIndex) && Array.isArray(current)) {
      current = current[numIndex]
    } else {
      current = current[part]
    }
  }
  
  return current
}

/**
 * Generate a JSONPath from a sequence of keys
 */
export function generatePath(keys: (string | number)[]): string {
  if (keys.length === 0) return '$'
  
  let path = '$'
  for (const key of keys) {
    if (typeof key === 'number') {
      path += `[${key}]`
    } else if (/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(key)) {
      path += `.${key}`
    } else {
      // Key with special characters
      path += `["${key}"]`
    }
  }
  return path
}

/**
 * Apply transforms to a value
 */
export function applyTransforms(value: any, transforms: TransformStep[]): any {
  let result = value
  
  // Convert to number if possible for numeric transforms
  if (typeof result === 'string') {
    const parsed = parseFloat(result)
    if (!isNaN(parsed)) {
      result = parsed
    }
  }
  
  for (const transform of transforms) {
    if (typeof result !== 'number') continue
    
    switch (transform.type) {
      case 'multiply':
        result = result * (transform.value || 1)
        break
      case 'divide':
        result = transform.value ? result / transform.value : result
        break
      case 'round':
        const factor = Math.pow(10, transform.decimals || 0)
        result = Math.round(result * factor) / factor
        break
      case 'floor':
        result = Math.floor(result)
        break
      case 'ceil':
        result = Math.ceil(result)
        break
      case 'abs':
        result = Math.abs(result)
        break
      case 'percentage':
        result = result * 100
        break
    }
  }
  
  return result
}

/**
 * Get the type of a JSON value
 */
export function getValueType(value: any): 'string' | 'number' | 'boolean' | 'object' | 'array' | 'null' {
  if (value === null) return 'null'
  if (Array.isArray(value)) return 'array'
  return typeof value as any
}

/**
 * Format a value for display
 */
export function formatValue(value: any): string {
  if (value === null) return 'null'
  if (value === undefined) return 'undefined'
  if (typeof value === 'object') {
    if (Array.isArray(value)) {
      return `Array(${value.length})`
    }
    return `Object(${Object.keys(value).length} keys)`
  }
  if (typeof value === 'string' && value.length > 50) {
    return `"${value.slice(0, 50)}..."`
  }
  if (typeof value === 'string') {
    return `"${value}"`
  }
  return String(value)
}

/**
 * Validate a URL
 */
export function isValidUrl(string: string): boolean {
  try {
    const url = new URL(string)
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}

/**
 * Generate Switchboard job definition for a custom API
 */
export function generateJobDefinition(config: {
  url: string
  method: 'GET' | 'POST'
  headers: APIHeader[]
  jsonPath: string
  transforms: TransformStep[]
}): object {
  const tasks: any[] = []
  
  // HTTP task
  const httpTask: any = {
    httpTask: {
      url: config.url,
      method: config.method,
    }
  }
  
  // Add headers if present
  const activeHeaders = config.headers.filter(h => h.enabled && h.key)
  if (activeHeaders.length > 0) {
    httpTask.httpTask.headers = activeHeaders.reduce((acc, h) => {
      acc[h.key] = h.value
      return acc
    }, {} as Record<string, string>)
  }
  
  tasks.push(httpTask)
  
  // JSON parse task
  if (config.jsonPath && config.jsonPath !== '$') {
    tasks.push({
      jsonParseTask: {
        path: config.jsonPath,
      }
    })
  }
  
  // Transform tasks
  for (const transform of config.transforms) {
    switch (transform.type) {
      case 'multiply':
        tasks.push({ multiplyTask: { scalar: transform.value } })
        break
      case 'divide':
        tasks.push({ divideTask: { scalar: transform.value } })
        break
      // Other transforms would be handled by the oracle
    }
  }
  
  return { tasks }
}


