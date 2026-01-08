import { Blockchain, Network } from './feed'

export type ResolutionType = 'binary' | 'numeric' | 'categorical' | 'text'

export type TrustedSource = 
  | 'news' 
  | 'twitter' 
  | 'wikipedia' 
  | 'weather' 
  | 'sports' 
  | 'finance' 
  | 'government' 
  | 'custom'

export interface AIJudgeConfig {
  id?: string
  name: string
  question: string
  description?: string
  resolutionType: ResolutionType
  resolutionDate: Date
  resolutionCriteria?: string
  trustedSources: TrustedSource[]
  customSources?: string[]
  categories?: string[] // For categorical resolution
  minValue?: number // For numeric resolution
  maxValue?: number // For numeric resolution
  blockchain: Blockchain
  network: Network
  enabled: boolean
  createdAt?: Date
  updatedAt?: Date
  resolved?: boolean
  resolvedValue?: string | number | boolean
  resolvedAt?: Date
  confidence?: number // AI confidence 0-100
}

export interface AIResolutionRequest {
  question: string
  resolutionType: ResolutionType
  resolutionCriteria?: string
  trustedSources: TrustedSource[]
  customSources?: string[]
  categories?: string[]
  currentDate: string
}

export interface AIResolutionResponse {
  success: boolean
  answer: string | number | boolean
  reasoning: string
  sources: string[]
  confidence: number // 0-100
  timestamp: string
  warning?: string
}

// Resolution type metadata
export const RESOLUTION_TYPES: {
  value: ResolutionType
  label: string
  description: string
  icon: string
  example: string
}[] = [
  {
    value: 'binary',
    label: 'Yes / No',
    description: 'Simple true/false questions',
    icon: '⚖️',
    example: 'Did Taylor Swift release a new album this week?',
  },
  {
    value: 'numeric',
    label: 'Number',
    description: 'Questions with numeric answers',
    icon: '🔢',
    example: 'What is Bitcoin\'s price today?',
  },
  {
    value: 'categorical',
    label: 'Multiple Choice',
    description: 'Select from predefined options',
    icon: '📋',
    example: 'Who won the Super Bowl?',
  },
  {
    value: 'text',
    label: 'Free Text',
    description: 'Open-ended text responses',
    icon: '📝',
    example: 'What was the headline news today?',
  },
]

// Trusted source metadata
export const TRUSTED_SOURCES: {
  value: TrustedSource
  label: string
  description: string
  icon: string
}[] = [
  {
    value: 'news',
    label: 'News Outlets',
    description: 'Major news sources (AP, Reuters, BBC)',
    icon: '📰',
  },
  {
    value: 'twitter',
    label: 'Twitter/X',
    description: 'Social media posts and trends',
    icon: '𝕏',
  },
  {
    value: 'wikipedia',
    label: 'Wikipedia',
    description: 'Encyclopedia entries',
    icon: '📚',
  },
  {
    value: 'weather',
    label: 'Weather Services',
    description: 'Weather data providers',
    icon: '🌤️',
  },
  {
    value: 'sports',
    label: 'Sports Data',
    description: 'Sports scores and results',
    icon: '🏆',
  },
  {
    value: 'finance',
    label: 'Financial Data',
    description: 'Market data and prices',
    icon: '📈',
  },
  {
    value: 'government',
    label: 'Government Sources',
    description: 'Official government data',
    icon: '🏛️',
  },
  {
    value: 'custom',
    label: 'Custom URLs',
    description: 'Specify your own sources',
    icon: '🔗',
  },
]

// Example questions for inspiration
export const EXAMPLE_QUESTIONS: {
  question: string
  type: ResolutionType
  sources: TrustedSource[]
  category: string
}[] = [
  {
    question: 'Did Taylor Swift release a new album this week?',
    type: 'binary',
    sources: ['news', 'twitter'],
    category: 'Entertainment',
  },
  {
    question: 'Is the general sentiment about Bitcoin bullish today?',
    type: 'binary',
    sources: ['twitter', 'news', 'finance'],
    category: 'Crypto',
  },
  {
    question: 'Did it snow in New York City today?',
    type: 'binary',
    sources: ['weather', 'news'],
    category: 'Weather',
  },
  {
    question: 'Who won the Super Bowl?',
    type: 'categorical',
    sources: ['sports', 'news'],
    category: 'Sports',
  },
  {
    question: 'What is the current price of Ethereum in USD?',
    type: 'numeric',
    sources: ['finance'],
    category: 'Crypto',
  },
  {
    question: 'Has Elon Musk tweeted about Dogecoin in the last 24 hours?',
    type: 'binary',
    sources: ['twitter'],
    category: 'Crypto',
  },
  {
    question: 'Did any country declare a national holiday today?',
    type: 'binary',
    sources: ['news', 'government'],
    category: 'World Events',
  },
  {
    question: 'What was the top trending topic on Twitter today?',
    type: 'text',
    sources: ['twitter'],
    category: 'Social',
  },
]


