'use client'

import { useState, useEffect } from 'react'
import { Blockchain, Network } from '@/types/feed'
import { estimateDeploymentCost, CostEstimate } from '@/lib/blockchain/gas-estimator'

export function useCostEstimate(
  blockchain: Blockchain,
  network: Network,
  operationType: 'feed' | 'function' | 'vrf' | 'secret' = 'feed',
  updateInterval: number = 30000 // 30 seconds
) {
  const [estimate, setEstimate] = useState<CostEstimate | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let intervalId: NodeJS.Timeout

    const fetchEstimate = async () => {
      setIsLoading(true)
      try {
        const cost = await estimateDeploymentCost(blockchain, network, operationType)
        setEstimate(cost)
      } catch (error) {
        console.error('Error fetching cost estimate:', error)
      } finally {
        setIsLoading(false)
      }
    }

    // Fetch immediately
    fetchEstimate()

    // Set up interval for updates
    intervalId = setInterval(fetchEstimate, updateInterval)

    return () => {
      if (intervalId) clearInterval(intervalId)
    }
  }, [blockchain, network, operationType, updateInterval])

  return { estimate, isLoading }
}


