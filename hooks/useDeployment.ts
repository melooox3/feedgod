'use client'

import { useState, useCallback } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import { FeedConfig } from '@/types/feed'
import { playPickupSound } from '@/lib/sound-utils'
import { logger } from '@/lib/logger'
import {
  createPriceFeed,
  DeploymentResult,
  storeDeployedFeed,
} from '@/lib/switchboard'

interface UseDeploymentProps {
  config: FeedConfig | null
}

interface UseDeploymentReturn {
  // Wallet state
  wallet: ReturnType<typeof useWallet>
  isWalletConnected: boolean

  // Deployment state
  isDeploying: boolean
  deploymentResult: DeploymentResult | null
  showDeploymentModal: boolean

  // Clipboard state
  copiedText: string | null

  // Actions
  handleSave: () => void
  handleDeploy: () => Promise<void>
  handleCopyToClipboard: (text: string, id: string) => void
  closeDeploymentModal: () => void
}

/**
 * Custom hook for managing feed deployment and wallet interactions
 * Handles saving to localStorage and deploying to Switchboard
 */
export function useDeployment({
  config,
}: UseDeploymentProps): UseDeploymentReturn {
  const wallet = useWallet()

  const [isDeploying, setIsDeploying] = useState(false)
  const [deploymentResult, setDeploymentResult] = useState<DeploymentResult | null>(null)
  const [showDeploymentModal, setShowDeploymentModal] = useState(false)
  const [copiedText, setCopiedText] = useState<string | null>(null)

  const isWalletConnected = wallet.connected && wallet.publicKey !== null

  /**
   * Save feed configuration to localStorage
   */
  const handleSave = useCallback(() => {
    if (!config) return

    playPickupSound()

    const feedToSave: FeedConfig = {
      ...config,
      id: config.id || `feed-${Date.now()}`,
      updatedAt: new Date(),
      createdAt: config.createdAt || new Date(),
    }

    const savedFeeds = localStorage.getItem('savedFeeds')
    const feeds = savedFeeds ? JSON.parse(savedFeeds) : []
    const existingIndex = feeds.findIndex((f: FeedConfig) => f.id === feedToSave.id)

    if (existingIndex >= 0) {
      feeds[existingIndex] = feedToSave
    } else {
      feeds.push(feedToSave)
    }

    localStorage.setItem('savedFeeds', JSON.stringify(feeds))
    alert('Feed saved! Check your profile to manage saved feeds.')
  }, [config])

  /**
   * Deploy feed to Switchboard
   */
  const handleDeploy = useCallback(async () => {
    if (!config) return

    playPickupSound()

    // Check wallet connection
    if (!wallet.connected || !wallet.publicKey) {
      alert('Please connect your wallet to deploy a feed.')
      return
    }

    // Check if Solana is selected (only Solana supported for now)
    if (config.blockchain !== 'solana') {
      alert('Currently, only Solana deployment is supported. Please select Solana as the blockchain.')
      return
    }

    setIsDeploying(true)
    setShowDeploymentModal(true)
    setDeploymentResult(null)

    try {
      // Prepare config for deployment
      const deployConfig: FeedConfig = {
        ...config,
        dataSources: config.dataSources.filter(s => s.enabled),
      }

      // Call the Switchboard deployment function
      const result = await createPriceFeed(deployConfig, wallet)

      setDeploymentResult(result)

      if (result.success && result.publicKey) {
        storeDeployedFeed(deployConfig, result)
        playPickupSound()
      }
    } catch (error) {
      logger.deployment.error('Error:', error)
      setDeploymentResult({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown deployment error'
      })
    } finally {
      setIsDeploying(false)
    }
  }, [config, wallet])

  /**
   * Copy text to clipboard with visual feedback
   */
  const handleCopyToClipboard = useCallback((text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopiedText(id)
    setTimeout(() => setCopiedText(null), 2000)
  }, [])

  /**
   * Close deployment modal and reset state
   */
  const closeDeploymentModal = useCallback(() => {
    setShowDeploymentModal(false)
    setDeploymentResult(null)
  }, [])

  return {
    wallet,
    isWalletConnected,
    isDeploying,
    deploymentResult,
    showDeploymentModal,
    copiedText,
    handleSave,
    handleDeploy,
    handleCopyToClipboard,
    closeDeploymentModal,
  }
}
