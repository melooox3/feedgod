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

// Icon names from Lucide
export type ResolutionIconName = 'Scale' | 'Hash' | 'ListChecks' | 'FileText'
export type SourceIconName = 'Newspaper' | 'XLogo' | 'BookOpen' | 'Cloud' | 'Trophy' | 'TrendingUp' | 'Landmark' | 'Link'

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
  iconName: ResolutionIconName
  example: string
}[] = [
  {
    value: 'binary',
    label: 'Yes / No',
    description: 'Simple true/false questions',
    iconName: 'Scale',
    example: 'Did Taylor Swift release a new album this week?',
  },
  {
    value: 'numeric',
    label: 'Number',
    description: 'Questions with numeric answers',
    iconName: 'Hash',
    example: 'What is Bitcoin\'s price today?',
  },
  {
    value: 'categorical',
    label: 'Multiple Choice',
    description: 'Select from predefined options',
    iconName: 'ListChecks',
    example: 'Who won the Super Bowl?',
  },
  {
    value: 'text',
    label: 'Free Text',
    description: 'Open-ended text responses',
    iconName: 'FileText',
    example: 'What was the headline news today?',
  },
]

// Trusted source metadata
export const TRUSTED_SOURCES: {
  value: TrustedSource
  label: string
  description: string
  iconName: SourceIconName
}[] = [
  {
    value: 'news',
    label: 'News Outlets',
    description: 'Major news sources (AP, Reuters, BBC)',
    iconName: 'Newspaper',
  },
  {
    value: 'twitter',
    label: 'X (Twitter)',
    description: 'Social media posts and trends',
    iconName: 'XLogo',
  },
  {
    value: 'wikipedia',
    label: 'Wikipedia',
    description: 'Encyclopedia entries',
    iconName: 'BookOpen',
  },
  {
    value: 'weather',
    label: 'Weather Services',
    description: 'Weather data providers',
    iconName: 'Cloud',
  },
  {
    value: 'sports',
    label: 'Sports Data',
    description: 'Sports scores and results',
    iconName: 'Trophy',
  },
  {
    value: 'finance',
    label: 'Financial Data',
    description: 'Market data and prices',
    iconName: 'TrendingUp',
  },
  {
    value: 'government',
    label: 'Government Sources',
    description: 'Official government data',
    iconName: 'Landmark',
  },
  {
    value: 'custom',
    label: 'Custom URLs',
    description: 'Specify your own sources',
    iconName: 'Link',
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
    question: 'What was the closing price of NVIDIA stock today?',
    type: 'numeric',
    sources: ['finance'],
    category: 'Finance',
  },
  {
    question: 'Who won the most recent Grammy for Album of the Year?',
    type: 'categorical',
    sources: ['news', 'wikipedia'],
    category: 'Entertainment',
  },
  {
    question: 'Which team won the latest NBA Finals?',
    type: 'categorical',
    sources: ['sports', 'news'],
    category: 'Sports',
  },
  {
    question: 'Did it rain in London today?',
    type: 'binary',
    sources: ['weather'],
    category: 'Weather',
  },
  {
    question: 'What was the highest temperature in Dubai this week?',
    type: 'numeric',
    sources: ['weather'],
    category: 'Weather',
  },
  {
    question: 'Did Elon Musk tweet about cryptocurrency today?',
    type: 'binary',
    sources: ['twitter'],
    category: 'Crypto',
  },
  {
    question: 'What was the US unemployment rate announced this month?',
    type: 'numeric',
    sources: ['government', 'news'],
    category: 'Economy',
  },
]
