'use client'

import { ethers } from 'ethers'
import { Blockchain, Network } from '@/types/feed'

export interface CostEstimate {
  estimatedCost: string
  currency: string
  gasPrice?: string
  gasLimit?: number
  usdEstimate?: string
}

// Estimated gas limits for different operations (in wei/gas units)
const ESTIMATED_GAS_LIMITS = {
  feed_deployment: 500000, // Estimated gas for feed deployment
  function_deployment: 800000,
  vrf_deployment: 600000,
  secret_storage: 200000,
}

// Solana transaction costs (in lamports)
const SOLANA_COSTS = {
  feed_deployment: 0.001, // ~0.001 SOL per feed
  function_deployment: 0.002,
  vrf_deployment: 0.0015,
  secret_storage: 0.0005,
}

// Network RPC endpoints for gas price fetching
const NETWORK_RPCS: Record<string, string> = {
  'ethereum-mainnet': 'https://eth.llamarpc.com',
  'ethereum-testnet': 'https://rpc.sepolia.org',
  'monad-mainnet': 'https://rpc-mainnet.monadinfra.com',
  'monad-testnet': 'https://testnet-rpc.monad.xyz',
  'monad-devnet': 'https://testnet-rpc.monad.xyz',
}

export async function estimateDeploymentCost(
  blockchain: Blockchain,
  network: Network,
  operationType: 'feed' | 'function' | 'vrf' | 'secret' = 'feed'
): Promise<CostEstimate> {
  if (blockchain === 'solana') {
    const solCost = SOLANA_COSTS[`${operationType}_deployment` as keyof typeof SOLANA_COSTS] || SOLANA_COSTS.feed_deployment
    
    // Fetch SOL price in USD
    let solPriceUSD = 100 // Default fallback
    try {
      const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd')
      const data = await response.json()
      solPriceUSD = data.solana?.usd || 100
    } catch (error) {
      console.error('Error fetching SOL price:', error)
    }

    const usdEstimate = (solCost * solPriceUSD).toFixed(4)

    return {
      estimatedCost: solCost.toFixed(6),
      currency: 'SOL',
      usdEstimate: `$${usdEstimate}`,
    }
  }

  // Handle Monad separately with fixed very cheap prices (no RPC call needed)
  if (blockchain === 'monad') {
    // Monad has extremely cheap gas fees - use fixed very low values
    // Monad's gas prices are typically 100-1000x cheaper than Ethereum
    const effectiveGasPrice = BigInt(100000000) // 0.1 gwei (very cheap for Monad)
    const gasLimit = ESTIMATED_GAS_LIMITS[`${operationType}_deployment` as keyof typeof ESTIMATED_GAS_LIMITS] || ESTIMATED_GAS_LIMITS.feed_deployment
    
    // Calculate total cost with Monad's cheap gas
    const totalCostWei = effectiveGasPrice * BigInt(gasLimit)
    const totalCostEth = Number(totalCostWei) / 1e18
    
    // Monad transactions are extremely cheap (typically < $0.01)
    // Use a very conservative estimate
    const monCost = Math.max(totalCostEth, 0.00001) // Minimum 0.00001 MON
    const usdEstimate = (monCost * 0.1).toFixed(6) // Very low USD estimate
    
    return {
      estimatedCost: monCost.toFixed(8), // Show more decimals for very small amounts
      currency: 'MON',
      gasPrice: ethers.formatUnits(effectiveGasPrice, 'gwei'),
      gasLimit,
      usdEstimate: `$${usdEstimate}`,
    }
  }
  
  // For Ethereum, fetch actual gas prices
  // At this point, blockchain can only be 'ethereum' (solana and monad already handled)
  if (blockchain !== 'ethereum') {
    // This should never happen, but TypeScript needs this check for type narrowing
    throw new Error(`Unsupported blockchain: ${blockchain}`)
  }
  
  const networkKey = `${blockchain}-${network}`
  const rpcUrl = NETWORK_RPCS[networkKey] || NETWORK_RPCS['ethereum-mainnet']

  try {
    const provider = new ethers.JsonRpcProvider(rpcUrl)

    // Get current gas price
    const feeData = await provider.getFeeData()
    const gasPrice = feeData.gasPrice || BigInt(0)
    const maxFeePerGas = feeData.maxFeePerGas || gasPrice

    // Use EIP-1559 fees if available, otherwise use legacy gas price
    const effectiveGasPrice = maxFeePerGas > BigInt(0) ? maxFeePerGas : gasPrice
    const gasLimit = ESTIMATED_GAS_LIMITS[`${operationType}_deployment` as keyof typeof ESTIMATED_GAS_LIMITS] || ESTIMATED_GAS_LIMITS.feed_deployment

    // Fetch ETH price in USD
    let ethPriceUSD = 2000 // Default fallback
    try {
      const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd')
      const data = await response.json()
      ethPriceUSD = data.ethereum?.usd || 2000
    } catch (error) {
      console.error('Error fetching ETH price:', error)
    }

    // Calculate total cost
    const totalCostWei = effectiveGasPrice * BigInt(gasLimit)
    const totalCostEth = Number(totalCostWei) / 1e18
    const usdEstimate = (totalCostEth * ethPriceUSD).toFixed(4)

    return {
      estimatedCost: totalCostEth.toFixed(6),
      currency: 'ETH',
      gasPrice: ethers.formatUnits(effectiveGasPrice, 'gwei'),
      gasLimit,
      usdEstimate: `$${usdEstimate}`,
    }
  } catch (error) {
    console.error('Error estimating gas cost:', error)
    return {
      estimatedCost: '0.001',
      currency: 'ETH',
      usdEstimate: '$2.00',
    }
  }
}


