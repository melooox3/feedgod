'use client'

import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { FeedConfig, DataSource, Blockchain } from '@/types/feed'
import { playPickupSound } from '@/lib/sound-utils'
import { useDebounce } from './useDebounce'

// Debounce delay for config updates (ms)
const CONFIG_UPDATE_DEBOUNCE = 150

const AVAILABLE_SOURCES: DataSource[] = [
  { id: 'coingecko', name: 'CoinGecko', type: 'api', enabled: true, weight: 1 },
  { id: 'binance', name: 'Binance', type: 'api', enabled: true, weight: 1 },
  { id: 'coinbase', name: 'Coinbase', type: 'api', enabled: true, weight: 1 },
  { id: 'kraken', name: 'Kraken', type: 'api', enabled: true, weight: 1 },
  { id: 'pyth', name: 'Pyth Network', type: 'on-chain', enabled: true, weight: 1 },
  { id: 'chainlink', name: 'Chainlink', type: 'on-chain', enabled: true, weight: 1 },
]

const DEFAULT_CONFIG: FeedConfig = {
  name: 'BTC/USD Feed',
  symbol: 'BTC/USD',
  dataSources: AVAILABLE_SOURCES.slice(0, 3).map(s => ({ ...s })),
  aggregator: { type: 'median' },
  updateInterval: 60,
  decimals: 8,
  blockchain: 'solana',
  network: 'mainnet',
  enabled: true,
}

interface UseFeedConfigProps {
  config: FeedConfig | null
  onConfigChange: (config: FeedConfig) => void
}

interface UseFeedConfigReturn {
  localConfig: FeedConfig | null
  availableSources: DataSource[]
  availableToAdd: DataSource[]
  enabledSources: DataSource[]
  handleConfigUpdate: (updates: Partial<FeedConfig>) => void
  toggleSource: (sourceId: string) => void
  addSource: (source: DataSource) => void
  removeSource: (sourceId: string) => void
  updateSourceWeight: (sourceId: string, weight: number) => void
}

/**
 * Custom hook for managing feed configuration state
 * Handles synchronization with parent component and local state management
 */
export function useFeedConfig({
  config,
  onConfigChange,
}: UseFeedConfigProps): UseFeedConfigReturn {
  const [localConfig, setLocalConfig] = useState<FeedConfig | null>(config)

  // Debounced callback for parent notification to prevent excessive re-renders
  const debouncedOnConfigChange = useDebounce(onConfigChange, CONFIG_UPDATE_DEBOUNCE)

  // Refs to track state changes and prevent unnecessary updates
  const isLocalUpdateRef = useRef(false)
  const lastBlockchainChangeRef = useRef<{ blockchain: string; network: string } | null>(null)
  const lastConfigIdRef = useRef<string | undefined>(undefined)
  const currentBlockchainRef = useRef<Blockchain | undefined>(localConfig?.blockchain)

  // Sync local config with parent prop changes
  useEffect(() => {
    // Skip if we just made a local update
    if (isLocalUpdateRef.current) {
      isLocalUpdateRef.current = false
      setTimeout(() => {
        lastBlockchainChangeRef.current = null
      }, 2000)
      return
    }

    const currentConfigId = config?.id
    const isDifferentFeedById = lastConfigIdRef.current !== currentConfigId

    const isDifferentFeedByContent = config && localConfig && (
      config.symbol !== localConfig.symbol ||
      config.name !== localConfig.name ||
      config.updateInterval !== localConfig.updateInterval
    )

    const isDifferentFeed = isDifferentFeedById || isDifferentFeedByContent

    // Same feed - preserve local state completely
    if (localConfig && !isDifferentFeed) {
      return
    }

    if (config && isDifferentFeed) {
      // Different feed - update but preserve blockchain/network from local if exists
      lastConfigIdRef.current = currentConfigId

      const preservedBlockchain = localConfig?.blockchain ?? config.blockchain
      const preservedNetwork = localConfig?.network ?? config.network

      const configToSet = {
        ...config,
        blockchain: preservedBlockchain,
        network: preservedNetwork,
      }

      setLocalConfig(configToSet)

      // Initialize sources if empty
      if (config.dataSources.length === 0) {
        const defaultSources = AVAILABLE_SOURCES.slice(0, 3).map(s => ({ ...s }))
        const updatedConfig = { ...configToSet, dataSources: defaultSources }
        setLocalConfig(updatedConfig)
        onConfigChange(updatedConfig)
      }
    } else if (!config && !localConfig) {
      // Create default config only if we don't have one
      lastConfigIdRef.current = undefined
      setLocalConfig(DEFAULT_CONFIG)
      onConfigChange(DEFAULT_CONFIG)
    }
  }, [config?.id, config?.symbol, config?.name, config?.updateInterval, localConfig, onConfigChange, config])

  const handleConfigUpdate = useCallback((updates: Partial<FeedConfig>) => {
    if (!localConfig) return

    const isNetworkOnlyUpdate = updates.network !== undefined && updates.blockchain === undefined

    // Track blockchain/network changes
    if (updates.blockchain !== undefined || updates.network !== undefined) {
      if (updates.blockchain !== undefined) {
        currentBlockchainRef.current = updates.blockchain
      }

      lastBlockchainChangeRef.current = {
        blockchain: updates.blockchain !== undefined
          ? updates.blockchain
          : (currentBlockchainRef.current || localConfig.blockchain),
        network: updates.network !== undefined
          ? updates.network
          : localConfig.network,
      }
      isLocalUpdateRef.current = true
    } else {
      isLocalUpdateRef.current = true
    }

    // Use blockchain from ref when only updating network
    const blockchainToUse = isNetworkOnlyUpdate
      ? (currentBlockchainRef.current || localConfig.blockchain)
      : (updates.blockchain !== undefined ? updates.blockchain : localConfig.blockchain)

    const updated = isNetworkOnlyUpdate
      ? { ...localConfig, network: updates.network ?? localConfig.network, blockchain: blockchainToUse }
      : { ...localConfig, ...updates, blockchain: blockchainToUse, network: updates.network ?? localConfig.network }

    if (updated.blockchain) {
      currentBlockchainRef.current = updated.blockchain
    }

    setLocalConfig(updated)

    // Notify parent with debouncing to prevent excessive re-renders
    debouncedOnConfigChange(updated)
  }, [localConfig, debouncedOnConfigChange])

  const toggleSource = useCallback((sourceId: string) => {
    if (!localConfig) return
    playPickupSound()
    const updatedSources = localConfig.dataSources.map(s =>
      s.id === sourceId ? { ...s, enabled: !s.enabled } : s
    )
    handleConfigUpdate({ dataSources: updatedSources })
  }, [localConfig, handleConfigUpdate])

  const addSource = useCallback((source: DataSource) => {
    if (!localConfig) return
    if (localConfig.dataSources.find(s => s.id === source.id)) return
    playPickupSound()
    handleConfigUpdate({ dataSources: [...localConfig.dataSources, { ...source }] })
  }, [localConfig, handleConfigUpdate])

  const removeSource = useCallback((sourceId: string) => {
    if (!localConfig) return
    handleConfigUpdate({
      dataSources: localConfig.dataSources.filter(s => s.id !== sourceId),
    })
  }, [localConfig, handleConfigUpdate])

  const updateSourceWeight = useCallback((sourceId: string, weight: number) => {
    if (!localConfig) return
    const updatedSources = localConfig.dataSources.map(s =>
      s.id === sourceId ? { ...s, weight } : s
    )
    handleConfigUpdate({ dataSources: updatedSources })
  }, [localConfig, handleConfigUpdate])

  // Memoized computed values - prevent recalculation on every render
  const enabledSources = useMemo(
    () => localConfig?.dataSources.filter(s => s.enabled) ?? [],
    [localConfig?.dataSources]
  )

  const availableToAdd = useMemo(
    () => AVAILABLE_SOURCES.filter(
      s => !localConfig?.dataSources.find(ds => ds.id === s.id)
    ),
    [localConfig?.dataSources]
  )

  return {
    localConfig,
    availableSources: AVAILABLE_SOURCES,
    availableToAdd,
    enabledSources,
    handleConfigUpdate,
    toggleSource,
    addSource,
    removeSource,
    updateSourceWeight,
  }
}

export { AVAILABLE_SOURCES, DEFAULT_CONFIG }
