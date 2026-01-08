import { Blockchain, Network } from './feed'

export type HttpMethod = 'GET' | 'POST'

export type TransformType = 'none' | 'multiply' | 'divide' | 'round' | 'floor' | 'ceil' | 'abs' | 'percentage'

export interface APIHeader {
  key: string
  value: string
  enabled: boolean
}

export interface TransformStep {
  type: TransformType
  value?: number // For multiply/divide
  decimals?: number // For round
}

export interface CustomAPIConfig {
  id?: string
  name: string
  description?: string
  url: string
  method: HttpMethod
  headers: APIHeader[]
  body?: string // For POST requests
  jsonPath: string
  transforms: TransformStep[]
  updateInterval: number // seconds
  blockchain: Blockchain
  network: Network
  enabled: boolean
  createdAt?: Date
  updatedAt?: Date
  lastValue?: number | string
  lastFetched?: Date
}

export interface APITestResult {
  success: boolean
  statusCode?: number
  data?: any
  error?: string
  responseTime?: number // ms
  headers?: Record<string, string>
}

export interface JSONPathResult {
  path: string
  value: any
  type: 'string' | 'number' | 'boolean' | 'object' | 'array' | 'null'
}

// Popular API templates
export interface APITemplate {
  name: string
  description: string
  url: string
  method: HttpMethod
  headers: APIHeader[]
  suggestedPath: string
  category: string
  icon: string
}

export const API_TEMPLATES: APITemplate[] = [
  {
    name: 'CoinGecko BTC Price',
    description: 'Bitcoin price in USD from CoinGecko',
    url: 'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd',
    method: 'GET',
    headers: [],
    suggestedPath: '$.bitcoin.usd',
    category: 'Crypto',
    icon: '₿',
  },
  {
    name: 'CoinGecko ETH Price',
    description: 'Ethereum price in USD from CoinGecko',
    url: 'https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd',
    method: 'GET',
    headers: [],
    suggestedPath: '$.ethereum.usd',
    category: 'Crypto',
    icon: 'Ξ',
  },
  {
    name: 'Open-Meteo Weather',
    description: 'Current temperature for a location',
    url: 'https://api.open-meteo.com/v1/forecast?latitude=40.71&longitude=-74.01&current_weather=true',
    method: 'GET',
    headers: [],
    suggestedPath: '$.current_weather.temperature',
    category: 'Weather',
    icon: '🌡️',
  },
  {
    name: 'GitHub Repo Stars',
    description: 'Star count for any GitHub repository',
    url: 'https://api.github.com/repos/solana-labs/solana',
    method: 'GET',
    headers: [],
    suggestedPath: '$.stargazers_count',
    category: 'Social',
    icon: '⭐',
  },
  {
    name: 'Reddit Subreddit Subscribers',
    description: 'Subscriber count for any subreddit',
    url: 'https://www.reddit.com/r/solana/about.json',
    method: 'GET',
    headers: [{ key: 'User-Agent', value: 'FeedGod/1.0', enabled: true }],
    suggestedPath: '$.data.subscribers',
    category: 'Social',
    icon: '📱',
  },
  {
    name: 'Exchange Rate (USD/EUR)',
    description: 'USD to EUR exchange rate',
    url: 'https://open.er-api.com/v6/latest/USD',
    method: 'GET',
    headers: [],
    suggestedPath: '$.rates.EUR',
    category: 'Finance',
    icon: '💱',
  },
  {
    name: 'IP Geolocation',
    description: 'Get geolocation data for an IP',
    url: 'https://ipapi.co/8.8.8.8/json/',
    method: 'GET',
    headers: [],
    suggestedPath: '$.country_name',
    category: 'Utility',
    icon: '🌍',
  },
  {
    name: 'Random Number (1-100)',
    description: 'Random number from random.org',
    url: 'https://www.random.org/integers/?num=1&min=1&max=100&col=1&base=10&format=plain',
    method: 'GET',
    headers: [],
    suggestedPath: '$', // Plain text response
    category: 'Utility',
    icon: '🎲',
  },
]

export const TRANSFORM_TYPES: {
  value: TransformType
  label: string
  description: string
  requiresValue: boolean
}[] = [
  { value: 'none', label: 'None', description: 'Use raw value', requiresValue: false },
  { value: 'multiply', label: 'Multiply', description: 'Multiply by a number', requiresValue: true },
  { value: 'divide', label: 'Divide', description: 'Divide by a number', requiresValue: true },
  { value: 'round', label: 'Round', description: 'Round to N decimals', requiresValue: true },
  { value: 'floor', label: 'Floor', description: 'Round down to integer', requiresValue: false },
  { value: 'ceil', label: 'Ceiling', description: 'Round up to integer', requiresValue: false },
  { value: 'abs', label: 'Absolute', description: 'Convert to positive', requiresValue: false },
  { value: 'percentage', label: 'To Percentage', description: 'Multiply by 100', requiresValue: false },
]


