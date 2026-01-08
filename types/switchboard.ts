import { Blockchain, Network } from './feed'

// Functions (Off-chain Compute)
export interface FunctionConfig {
  id?: string
  name: string
  description?: string
  code: string
  language: 'javascript' | 'python' | 'rust' | 'typescript'
  runtime: 'node' | 'python' | 'wasm'
  trigger: 'cron' | 'on-demand' | 'event'
  schedule?: string // Cron expression
  timeout: number // seconds
  memory: number // MB
  environment: Record<string, string>
  secrets: string[] // Secret IDs to use
  blockchain: Blockchain
  network: Network
  enabled: boolean
  createdAt?: Date
  updatedAt?: Date
  isFavorite?: boolean
  userId?: string
}

// VRF (Verifiable Random Number Generator)
export interface VRFConfig {
  id?: string
  name: string
  description?: string
  callbackProgramId?: string
  callbackAccounts?: string[]
  authority?: string
  queue?: string
  min?: number
  max?: number
  numWords?: number // Number of random words to generate
  batchSize?: number
  blockchain: Blockchain
  network: Network
  enabled: boolean
  createdAt?: Date
  updatedAt?: Date
  isFavorite?: boolean
  userId?: string
}

// Secrets (API Keys and Sensitive Data)
export interface SecretConfig {
  id?: string
  name: string
  description?: string
  key: string // Secret key name
  value: string // Encrypted value (in production)
  type: 'api_key' | 'private_key' | 'webhook_url' | 'database_url' | 'custom'
  scope: 'function' | 'feed' | 'global'
  associatedResources: string[] // IDs of functions/feeds using this secret
  blockchain: Blockchain
  network: Network
  enabled: boolean
  createdAt?: Date
  updatedAt?: Date
  isFavorite?: boolean
  userId?: string
}

export type BuilderType = 'feed' | 'function' | 'vrf' | 'secret' | 'prediction' | 'weather' | 'sports' | 'social' | 'ai-judge' | 'custom-api' | 'governance'

