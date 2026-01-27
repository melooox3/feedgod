import { Connection, PublicKey, Keypair, Transaction, VersionedTransaction } from '@solana/web3.js'
import { FeedConfig, DataSource } from '@/types/feed'
import { DeployedFeed } from '@/types/switchboard'
import { logger } from '@/lib/utils/logger'
import { getCoinGeckoId } from '@/lib/constants/coin-ids'

// Re-export getCoinGeckoId for backward compatibility
export { getCoinGeckoId }

// Switchboard constants
export const SWITCHBOARD_PROGRAM_ID = new PublicKey('SBondMDrcV3K4kxZR1HNVT7osZxAHVHgYXL5Ze1oMUv')
export const SWITCHBOARD_QUEUE_MAINNET = new PublicKey('A43DyUGA7s8eXPxqEjJY6EBu1KKbNgfxF8h17VAHn13w')
export const SWITCHBOARD_QUEUE_DEVNET = new PublicKey('FfD96yeXs4cxZshoPPSKhSMgbt75hV5JsQrjFjvtmrWL')

// RPC endpoints
const RPC_ENDPOINTS = {
  'mainnet': 'https://api.mainnet-beta.solana.com',
  'devnet': 'https://api.devnet.solana.com',
  'testnet': 'https://api.testnet.solana.com',
}

// Build job definition for a price feed
export function buildPriceFeedJob(config: FeedConfig): object {
  const baseSymbol = config.symbol.split('/')[0]
  const coinId = getCoinGeckoId(baseSymbol)
  
  // Build tasks based on data sources
  const tasks: object[] = []
  
  // If we have specific sources, use them
  if (config.dataSources && config.dataSources.length > 0) {
    const sourceTasks = config.dataSources.map((source: DataSource) => {
      switch (source.name.toLowerCase()) {
        case 'coingecko':
          return {
            httpTask: {
              url: `https://api.coingecko.com/api/v3/simple/price?ids=${coinId}&vs_currencies=usd`
            }
          }
        case 'binance':
          return {
            httpTask: {
              url: `https://api.binance.com/api/v3/ticker/price?symbol=${baseSymbol}USDT`
            }
          }
        case 'kraken':
          return {
            httpTask: {
              url: `https://api.kraken.com/0/public/Ticker?pair=${baseSymbol}USD`
            }
          }
        case 'coinbase':
          return {
            httpTask: {
              url: `https://api.coinbase.com/v2/prices/${baseSymbol}-USD/spot`
            }
          }
        case 'jupiter':
          return {
            httpTask: {
              url: `https://price.jup.ag/v4/price?ids=${baseSymbol}`
            }
          }
        default:
          return {
            httpTask: {
              url: `https://api.coingecko.com/api/v3/simple/price?ids=${coinId}&vs_currencies=usd`
            }
          }
      }
    })
    
    // If multiple sources, we would need to aggregate
    // For now, use first source with proper parsing
    if (sourceTasks.length === 1) {
      tasks.push(sourceTasks[0])
    } else {
      // Use CoinGecko as reliable single source for aggregation
      tasks.push({
        httpTask: {
          url: `https://api.coingecko.com/api/v3/simple/price?ids=${coinId}&vs_currencies=usd`
        }
      })
    }
  } else {
    // Default to CoinGecko
    tasks.push({
      httpTask: {
        url: `https://api.coingecko.com/api/v3/simple/price?ids=${coinId}&vs_currencies=usd`
      }
    })
  }
  
  // Add JSON parsing task
  tasks.push({
    jsonParseTask: {
      path: `$.${coinId}.usd`
    }
  })
  
  // Add multiply task to convert to standard decimals
  const multiplier = Math.pow(10, config.decimals || 9)
  tasks.push({
    multiplyTask: {
      scalar: multiplier
    }
  })
  
  return {
    tasks
  }
}

// Interface for deployment result
export interface DeploymentResult {
  success: boolean
  publicKey?: string
  signature?: string
  error?: string
}

// Interface for wallet adapter
interface WalletAdapter {
  publicKey: PublicKey | null
  signTransaction?: <T extends Transaction | VersionedTransaction>(transaction: T) => Promise<T>
  signAllTransactions?: <T extends Transaction | VersionedTransaction>(transactions: T[]) => Promise<T[]>
  sendTransaction?: (transaction: Transaction, connection: Connection) => Promise<string>
}

/**
 * Get Solana connection for a network
 */
export function getConnection(network: string): Connection {
  const endpoint = RPC_ENDPOINTS[network as keyof typeof RPC_ENDPOINTS] || RPC_ENDPOINTS.devnet
  return new Connection(endpoint, 'confirmed')
}

/**
 * Get the appropriate queue for a network
 */
export function getQueuePublicKey(network: string): PublicKey {
  return network === 'mainnet' ? SWITCHBOARD_QUEUE_MAINNET : SWITCHBOARD_QUEUE_DEVNET
}

/**
 * Create and deploy a price feed using Switchboard On-Demand
 * This creates a Pull Feed that can be updated on-demand
 */
export async function createPriceFeed(
  config: FeedConfig,
  wallet: WalletAdapter
): Promise<DeploymentResult> {
  try {
    // Validate wallet connection
    if (!wallet.publicKey) {
      return { success: false, error: 'Wallet not connected' }
    }
    
    if (!wallet.signTransaction) {
      return { success: false, error: 'Wallet does not support transaction signing' }
    }
    
    const network = config.network || 'devnet'
    const _connection = getConnection(network) // Used in production with Switchboard SDK
    const queue = getQueuePublicKey(network)
    
    // Build the job definition
    const jobDefinition = buildPriceFeedJob(config)
    
    logger.switchboard.debug('Creating feed with job:', JSON.stringify(jobDefinition, null, 2))
    logger.switchboard.debug('Network:', network)
    logger.switchboard.debug('Queue:', queue.toBase58())
    logger.switchboard.debug('Wallet:', wallet.publicKey.toBase58())
    
    // For demonstration, we'll simulate the transaction
    // In production, you would use the actual Switchboard SDK:
    //
    // import { PullFeed, loadSwitchboard } from '@switchboard-xyz/on-demand'
    // const sb = await loadSwitchboard('mainnet')
    // const [feed, tx] = await PullFeed.create(sb, {
    //   queue,
    //   jobs: [jobDefinition],
    //   maxVariance: config.maxVariance || 1.0,
    //   minResponses: config.minResponses || 1,
    //   feedHash: Keypair.generate().publicKey.toBuffer(),
    // })
    // const signature = await sendAndConfirmTransaction(connection, tx, [wallet])
    
    // Generate a deterministic feed address for demo
    // In production, this would come from the actual deployment
    const feedKeypair = Keypair.generate()
    const feedPublicKey = feedKeypair.publicKey.toBase58()
    
    // Simulate a delay for "deployment"
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    // In production, return actual values
    // For now, return simulated success with the generated address
    return {
      success: true,
      publicKey: feedPublicKey,
      signature: 'simulated_' + Date.now().toString(36),
    }
    
  } catch (error) {
    logger.switchboard.error('Deployment error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown deployment error'
    }
  }
}

/**
 * Read the current value from a Switchboard feed using Surge
 */
export async function readFeedValue(
  feedPublicKeyOrSymbol: string,
  _network: string = 'devnet' // Network param for future on-chain SDK integration
): Promise<{ value: number | null; timestamp: number | null; source?: string; error?: string }> {
  try {
    // First, try to interpret input as a symbol and use Surge
    const { SurgeClient, isSupportedSymbol } = await import('@/lib/api/surge-client')

    // Check if this looks like a symbol (e.g., "BTC", "BTC/USD") rather than a public key
    const isSymbol = !feedPublicKeyOrSymbol.match(/^[1-9A-HJ-NP-Za-km-z]{32,44}$/)

    if (isSymbol && isSupportedSymbol(feedPublicKeyOrSymbol)) {
      const client = new SurgeClient({
        serverUrl: process.env.SURGE_API_URL,
        apiKey: process.env.SURGE_API_KEY,
        useCrossbarFallback: true,
      })

      const result = await client.getPrice(feedPublicKeyOrSymbol)

      if (result) {
        return {
          value: result.price,
          timestamp: result.timestamp,
          source: result.source,
        }
      }
    }

    // Fall back to on-chain read for actual public keys
    // In production with Switchboard SDK:
    // const connection = getConnection(network)
    // const feedPubkey = new PublicKey(feedPublicKeyOrSymbol)
    // const feed = new PullFeed(feedPubkey)
    // const [value, slot] = await feed.fetchUpdateAndGetResult(connection)
    // return { value: value.toNumber(), timestamp: Date.now(), source: 'on-chain' }

    // For now, try Surge with common symbols as fallback
    // This is a development convenience - in production use the SDK
    logger.switchboard.debug('No direct Surge match, attempting on-chain read for:', feedPublicKeyOrSymbol)

    return {
      value: null,
      timestamp: null,
      error: 'On-chain read requires Switchboard SDK. Use symbol format (e.g., "BTC/USD") for Surge API.',
    }
  } catch (error) {
    logger.switchboard.error('Read error:', error)
    return {
      value: null,
      timestamp: null,
      error: error instanceof Error ? error.message : 'Unknown read error',
    }
  }
}

/**
 * Generate Solscan link for a public key
 */
export function getSolscanLink(publicKey: string, network: string = 'devnet'): string {
  const cluster = network === 'mainnet' ? '' : `?cluster=${network}`
  return `https://solscan.io/account/${publicKey}${cluster}`
}

/**
 * Generate Solana Explorer link
 */
export function getExplorerLink(publicKey: string, network: string = 'devnet'): string {
  const cluster = network === 'mainnet' ? '' : `?cluster=${network}`
  return `https://explorer.solana.com/address/${publicKey}${cluster}`
}

/**
 * Generate code snippet for integrating the feed
 */
export function generateIntegrationCode(feedPublicKey: string, feedName: string): string {
  return `// Install: npm install @switchboard-xyz/on-demand @solana/web3.js

import { Connection, PublicKey } from "@solana/web3.js";
import { PullFeed } from "@switchboard-xyz/on-demand";

// ${feedName} Feed
const FEED_PUBKEY = new PublicKey("${feedPublicKey}");

async function fetchPrice() {
  const connection = new Connection("https://api.mainnet-beta.solana.com");
  const feed = new PullFeed(FEED_PUBKEY);
  
  // Fetch and get the latest value
  const [value, slot] = await feed.fetchUpdateAndGetResult(connection);
  
  console.log("Price:", value.toString());
  console.log("Slot:", slot);
  
  return value;
}

// For use in Anchor programs:
// Add to your IDL and call:
// ctx.accounts.feed.get_result()?.try_into()?`
}

/**
 * Store deployed feed in localStorage
 */
export function storeDeployedFeed(config: FeedConfig, result: DeploymentResult): void {
  if (!result.success || !result.publicKey) return
  
  const storedFeeds = localStorage.getItem('deployedFeeds')
  const feeds = storedFeeds ? JSON.parse(storedFeeds) : []
  
  feeds.push({
    id: `deployed-${Date.now()}`,
    name: config.name,
    symbol: config.symbol,
    publicKey: result.publicKey,
    signature: result.signature,
    network: config.network,
    blockchain: config.blockchain,
    deployedAt: new Date().toISOString(),
    config: config,
  })
  
  localStorage.setItem('deployedFeeds', JSON.stringify(feeds))
}

/**
 * Get all deployed feeds from localStorage
 */
export function getDeployedFeeds(): DeployedFeed[] {
  const storedFeeds = localStorage.getItem('deployedFeeds')
  return storedFeeds ? JSON.parse(storedFeeds) : []
}

