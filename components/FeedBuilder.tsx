"use client";

import { useState } from "react";
import {
  Play,
  Save,
  CheckCircle2,
  XCircle,
  TrendingUp,
  TrendingDown,
  Settings,
  Clock,
  Hash,
  RefreshCw,
  Plus,
  DollarSign,
  Database,
  Loader2,
  ExternalLink,
  Copy,
  CheckCircle,
  X,
  Rocket,
} from "lucide-react";
import { FeedConfig, DataSource } from "@/types/feed";
import { playPickupSound } from "@/lib/sound-utils";
import { useCostEstimate } from "@/lib/use-cost-estimate";
import {
  useFeedConfig,
  usePriceFetching,
  useDeployment,
  AVAILABLE_SOURCES,
} from "@/hooks";
import ChainSelector from "./ChainSelector";
import NetworkMismatchBanner from "./NetworkMismatchBanner";
import CustomSourceModal from "./CustomSourceModal";
import { getSolscanLink, generateIntegrationCode } from "@/lib/switchboard";

interface FeedBuilderProps {
  config: FeedConfig | null;
  onConfigChange: (config: FeedConfig) => void;
}

// Chain logo mapping
const CHAIN_LOGOS: Record<string, string> = {
  solana: "/solana.png",
  ethereum: "/ethereum.png",
  monad: "/monad.png",
};

/**
 * Format price with appropriate decimal places
 * For prices < 1, show 5 decimal places, otherwise show 2
 */
function formatPrice(price: number): string {
  if (price < 1) {
    return price.toLocaleString(undefined, {
      minimumFractionDigits: 5,
      maximumFractionDigits: 5,
    });
  }
  return price.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/**
 * Cost Estimate Display Component
 */
function CostEstimateDisplay({
  blockchain,
  network,
  operationType,
}: {
  blockchain: string;
  network: string;
  operationType: "feed" | "function" | "vrf" | "secret";
}) {
  const { estimate, isLoading } = useCostEstimate(
    blockchain as "solana" | "ethereum" | "monad",
    network as "mainnet" | "devnet" | "testnet",
    operationType,
  );

  if (isLoading || !estimate) {
    return (
      <div className="px-4 py-3 bg-feedgod-pink-50 dark:bg-feedgod-dark-secondary rounded-lg border border-feedgod-pink-200 dark:border-feedgod-dark-accent">
        <div className="flex items-center gap-2 text-sm text-feedgod-pink-500 dark:text-feedgod-neon-cyan/70">
          <DollarSign className="w-4 h-4 animate-pulse" />
          <span>Calculating deployment cost...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-3 bg-feedgod-pink-50 dark:bg-feedgod-dark-secondary rounded-lg border border-feedgod-pink-200 dark:border-feedgod-dark-accent">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-feedgod-pink-500 dark:text-feedgod-neon-cyan/70">
          <DollarSign className="w-4 h-4" />
          <span>Estimated Cost:</span>
        </div>
        <div className="text-right">
          <div className="text-lg font-bold text-feedgod-primary dark:text-feedgod-neon-pink">
            {estimate.estimatedCost} {estimate.currency}
          </div>
          {estimate.usdEstimate && (
            <div className="text-xs text-feedgod-pink-500 dark:text-feedgod-neon-cyan/70">
              {estimate.usdEstimate}
            </div>
          )}
        </div>
      </div>
      {estimate.gasPrice && (
        <div className="mt-2 text-xs text-feedgod-pink-500 dark:text-feedgod-neon-cyan/70">
          Gas: {estimate.gasPrice} gwei
        </div>
      )}
    </div>
  );
}

/**
 * Price Display Section Component
 */
function PriceDisplay({
  config,
  currentPrice,
  priceChange,
  enabledSourcesCount,
  isLoading,
  onRefresh,
}: {
  config: FeedConfig;
  currentPrice: number | null;
  priceChange: number | null;
  enabledSourcesCount: number;
  isLoading: boolean;
  onRefresh: () => void;
}) {
  return (
    <div className="bg-white/60 dark:bg-feedgod-dark-secondary/80 rounded-lg border border-feedgod-pink-200 dark:border-feedgod-dark-accent p-8 backdrop-blur-sm relative overflow-hidden">
      {/* Subtle chain logo watermark */}
      <div className="absolute -right-8 -bottom-8 opacity-5 dark:opacity-10 pointer-events-none">
        <img
          src={CHAIN_LOGOS[config.blockchain] || CHAIN_LOGOS.solana}
          alt=""
          className="w-48 h-48 object-contain"
        />
      </div>

      <div className="flex items-start justify-between relative z-10">
        <div className="flex-1">
          <div className="flex items-center gap-4 mb-4">
            <h2 className="text-2xl font-bold text-feedgod-primary">
              {config.symbol}
            </h2>
            {/* Chain badge */}
            <div className="flex items-center gap-1.5 px-2 py-1 bg-feedgod-pink-100 dark:bg-feedgod-dark-accent rounded-full">
              <img
                src={CHAIN_LOGOS[config.blockchain] || CHAIN_LOGOS.solana}
                alt={config.blockchain}
                className="w-4 h-4 object-contain"
              />
              <span className="text-xs font-medium text-feedgod-pink-600 dark:text-feedgod-neon-cyan capitalize">
                {config.blockchain}
              </span>
            </div>
            {priceChange !== null &&
              (priceChange >= 0 ? (
                <TrendingUp className="w-6 h-6 text-green-600" />
              ) : (
                <TrendingDown className="w-6 h-6 text-red-500" />
              ))}
          </div>
          {isLoading || currentPrice === null ? (
            <div className="text-5xl font-bold text-feedgod-pink-400 mb-2">
              Loading...
            </div>
          ) : (
            <>
              <p className="text-6xl font-bold text-feedgod-primary dark:text-feedgod-neon-pink mb-3">
                ${formatPrice(currentPrice)}
              </p>
              <p
                className={`text-lg font-medium mb-4 ${priceChange !== null && priceChange >= 0 ? "text-green-600" : "text-red-500"}`}
              >
                {priceChange !== null
                  ? `${priceChange >= 0 ? "+" : ""}${priceChange.toFixed(2)}%`
                  : "N/A"}{" "}
                (24h)
              </p>
              <p className="text-sm text-feedgod-pink-500 dark:text-feedgod-neon-cyan/70">
                Aggregated from {enabledSourcesCount} source
                {enabledSourcesCount !== 1 ? "s" : ""} using{" "}
                {config.aggregator.type} method
              </p>
            </>
          )}
        </div>
        <button
          onClick={onRefresh}
          className="p-3 hover:bg-feedgod-pink-100 rounded-lg transition-colors star-glow"
          title="Refresh prices"
        >
          <RefreshCw className="w-5 h-5 text-feedgod-pink-500 hover:text-feedgod-primary" />
        </button>
      </div>
    </div>
  );
}

/**
 * Data Sources Panel Component
 */
function DataSourcesPanel({
  dataSources,
  sourcePrices,
  availableToAdd,
  onToggleSource,
  onRemoveSource,
  onAddSource,
  onUpdateWeight,
  onShowCustomModal,
}: {
  dataSources: DataSource[];
  sourcePrices: Record<string, { price: number; status: "active" | "error" }>;
  availableToAdd: DataSource[];
  onToggleSource: (id: string) => void;
  onRemoveSource: (id: string) => void;
  onAddSource: (source: DataSource) => void;
  onUpdateWeight: (id: string, weight: number) => void;
  onShowCustomModal: () => void;
}) {
  return (
    <div className="bg-white/60 dark:bg-feedgod-dark-secondary/80 rounded-lg border border-feedgod-pink-200 dark:border-feedgod-dark-accent p-6 backdrop-blur-sm">
      <h3 className="text-lg font-semibold text-feedgod-primary mb-4">
        Data Sources
      </h3>
      <p className="text-sm text-feedgod-pink-500 mb-4">
        Select which sources to use for price aggregation
      </p>

      {/* Selected Sources */}
      <div className="space-y-3 mb-4 max-h-[500px] overflow-y-auto">
        {dataSources.map((source) => {
          const sourcePrice = sourcePrices[source.id];
          return (
            <div
              key={source.id}
              className="bg-feedgod-pink-50 dark:bg-feedgod-dark-secondary rounded-lg p-4 border border-feedgod-pink-200 dark:border-feedgod-dark-accent"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={source.enabled}
                    onChange={() => onToggleSource(source.id)}
                    className="w-4 h-4 rounded border-feedgod-pink-300 dark:border-feedgod-dark-accent bg-white dark:bg-feedgod-dark-secondary text-feedgod-primary dark:text-feedgod-neon-pink focus:ring-feedgod-primary dark:focus:ring-feedgod-neon-pink cursor-pointer star-glow-on-hover"
                  />
                  <div>
                    <p className="text-feedgod-dark dark:text-feedgod-neon-cyan font-medium">
                      {source.name}
                    </p>
                    <p className="text-xs text-feedgod-pink-500 dark:text-feedgod-neon-cyan/70 capitalize">
                      {source.type}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => onRemoveSource(source.id)}
                  className="text-red-500 hover:text-red-600 text-sm star-glow"
                >
                  Remove
                </button>
              </div>
              {source.enabled && sourcePrice && (
                <div className="mt-3 pt-3 border-t border-feedgod-pink-200">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-feedgod-pink-500">Price</span>
                    <div className="flex items-center gap-2">
                      {sourcePrice.status === "active" ? (
                        <CheckCircle2 className="w-3 h-3 text-green-500" />
                      ) : (
                        <XCircle className="w-3 h-3 text-red-500" />
                      )}
                      <span
                        className={`text-sm font-medium ${
                          sourcePrice.status === "active"
                            ? "text-feedgod-dark dark:text-feedgod-neon-cyan"
                            : "text-feedgod-pink-400 dark:text-feedgod-neon-cyan/50"
                        }`}
                      >
                        ${formatPrice(sourcePrice.price)}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs text-feedgod-pink-500 dark:text-feedgod-neon-cyan/70">
                      Weight
                    </span>
                    <input
                      type="number"
                      value={source.weight || 1}
                      onChange={(e) =>
                        onUpdateWeight(
                          source.id,
                          parseFloat(e.target.value) || 1,
                        )
                      }
                      className="w-20 bg-white dark:bg-feedgod-dark-secondary border border-feedgod-pink-200 dark:border-feedgod-dark-accent rounded px-2 py-1 text-sm text-feedgod-dark dark:text-feedgod-neon-cyan focus:outline-none focus:ring-2 focus:ring-feedgod-primary dark:focus:ring-feedgod-neon-pink"
                      min="0"
                      step="0.1"
                    />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Add Source */}
      <div className="mt-4 space-y-2">
        {availableToAdd.length > 0 && (
          <details className="mb-2">
            <summary className="text-sm text-feedgod-primary cursor-pointer hover:text-feedgod-secondary star-glow">
              + Add Pre-built Sources ({availableToAdd.length} available)
            </summary>
            <div className="mt-2 space-y-2">
              {availableToAdd.map((source) => (
                <button
                  key={source.id}
                  onClick={() => onAddSource(source)}
                  className="w-full text-left p-3 bg-feedgod-pink-50 dark:bg-feedgod-dark-secondary hover:bg-feedgod-pink-100 dark:hover:bg-feedgod-dark-accent rounded-lg transition-colors star-glow-on-hover"
                >
                  <div className="font-medium text-feedgod-dark dark:text-feedgod-neon-cyan text-sm">
                    {source.name}
                  </div>
                  <div className="text-xs text-feedgod-pink-500 dark:text-feedgod-neon-cyan/70 capitalize mt-1">
                    {source.type}
                  </div>
                </button>
              ))}
            </div>
          </details>
        )}
        <button
          onClick={onShowCustomModal}
          className="w-full text-left p-3 bg-feedgod-pink-100 dark:bg-feedgod-dark-accent hover:bg-feedgod-pink-200 dark:hover:bg-feedgod-dark-secondary rounded-lg transition-colors flex items-center gap-2 star-glow-on-hover"
        >
          <Plus className="w-4 h-4 text-feedgod-primary" />
          <span className="text-sm font-medium text-feedgod-primary">
            Add Custom Source
          </span>
        </button>
      </div>
    </div>
  );
}

/**
 * Deployment Modal Component
 */
function DeploymentModal({
  config,
  isDeploying,
  deploymentResult,
  copiedText,
  onClose,
  onRetry,
  onCopy,
}: {
  config: FeedConfig;
  isDeploying: boolean;
  deploymentResult: {
    success: boolean;
    publicKey?: string;
    signature?: string;
    error?: string;
  } | null;
  copiedText: string | null;
  onClose: () => void;
  onRetry: () => void;
  onCopy: (text: string, id: string) => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-white dark:bg-feedgod-dark-secondary rounded-2xl border border-feedgod-pink-200 dark:border-feedgod-dark-accent shadow-2xl overflow-hidden relative">
        {/* Subtle chain watermark */}
        <div className="absolute -right-12 -top-12 opacity-5 dark:opacity-10 pointer-events-none">
          <img
            src={CHAIN_LOGOS[config.blockchain || "solana"]}
            alt=""
            className="w-64 h-64 object-contain"
          />
        </div>

        {/* Header */}
        <div className="p-6 border-b border-feedgod-pink-200 dark:border-feedgod-dark-accent relative z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-lg flex items-center justify-center relative ${
                  isDeploying
                    ? "bg-feedgod-primary/20"
                    : deploymentResult?.success
                      ? "bg-emerald-500/20"
                      : "bg-red-500/20"
                }`}
              >
                {isDeploying ? (
                  <Loader2 className="w-5 h-5 text-feedgod-primary animate-spin" />
                ) : deploymentResult?.success ? (
                  <CheckCircle className="w-5 h-5 text-emerald-500" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-500" />
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold text-feedgod-dark dark:text-white">
                    {isDeploying
                      ? "Deploying Feed..."
                      : deploymentResult?.success
                        ? "Deployment Successful!"
                        : "Deployment Failed"}
                  </h3>
                  <img
                    src={CHAIN_LOGOS[config.blockchain || "solana"]}
                    alt={config.blockchain}
                    className="w-5 h-5 object-contain"
                  />
                </div>
                <p className="text-sm text-feedgod-pink-500 dark:text-feedgod-neon-cyan/70">
                  {config.name}
                </p>
              </div>
            </div>
            {!isDeploying && (
              <button
                onClick={onClose}
                className="p-2 hover:bg-feedgod-pink-100 dark:hover:bg-feedgod-dark-accent rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-feedgod-pink-500" />
              </button>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {isDeploying ? (
            <div className="text-center py-8">
              <Rocket className="w-16 h-16 text-feedgod-primary mx-auto mb-4 animate-bounce" />
              <p className="text-feedgod-dark dark:text-white font-medium mb-2">
                Building and deploying your feed...
              </p>
              <p className="text-sm text-feedgod-pink-500 dark:text-feedgod-neon-cyan/70">
                Please confirm the transaction in your wallet
              </p>
              <div className="mt-6 flex items-center justify-center gap-2">
                <div className="w-2 h-2 rounded-full bg-feedgod-primary animate-pulse" />
                <div
                  className="w-2 h-2 rounded-full bg-feedgod-primary animate-pulse"
                  style={{ animationDelay: "0.2s" }}
                />
                <div
                  className="w-2 h-2 rounded-full bg-feedgod-primary animate-pulse"
                  style={{ animationDelay: "0.4s" }}
                />
              </div>
            </div>
          ) : deploymentResult?.success ? (
            <div className="space-y-6">
              {/* Public Key */}
              <div>
                <label className="block text-sm font-medium text-feedgod-dark dark:text-feedgod-neon-cyan mb-2">
                  Feed Public Key
                </label>
                <div className="flex items-center gap-2 bg-feedgod-pink-50 dark:bg-feedgod-dark-accent rounded-lg p-3">
                  <code className="flex-1 text-sm font-mono text-feedgod-primary dark:text-feedgod-neon-pink break-all">
                    {deploymentResult.publicKey}
                  </code>
                  <button
                    onClick={() =>
                      onCopy(deploymentResult.publicKey!, "pubkey")
                    }
                    className="p-2 hover:bg-feedgod-pink-100 dark:hover:bg-feedgod-dark-secondary rounded transition-colors flex-shrink-0"
                    title="Copy public key"
                  >
                    {copiedText === "pubkey" ? (
                      <CheckCircle className="w-4 h-4 text-emerald-500" />
                    ) : (
                      <Copy className="w-4 h-4 text-feedgod-pink-500" />
                    )}
                  </button>
                </div>
              </div>

              {/* Links */}
              <div className="flex gap-3">
                <a
                  href={getSolscanLink(
                    deploymentResult.publicKey!,
                    config.network || "devnet",
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 px-4 py-3 bg-feedgod-pink-100 dark:bg-feedgod-dark-accent hover:bg-feedgod-pink-200 rounded-lg text-feedgod-dark dark:text-white font-medium transition-colors flex items-center justify-center gap-2"
                >
                  <ExternalLink className="w-4 h-4" />
                  View on Solscan
                </a>
              </div>

              {/* Integration Code */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-feedgod-dark dark:text-feedgod-neon-cyan">
                    Integration Code
                  </label>
                  <button
                    onClick={() =>
                      onCopy(
                        generateIntegrationCode(
                          deploymentResult.publicKey!,
                          config.name || "Feed",
                        ),
                        "code",
                      )
                    }
                    className="text-xs text-feedgod-primary hover:text-feedgod-secondary flex items-center gap-1"
                  >
                    {copiedText === "code" ? (
                      <>
                        <CheckCircle className="w-3 h-3" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        Copy code
                      </>
                    )}
                  </button>
                </div>
                <div className="bg-feedgod-dark dark:bg-black rounded-lg p-4 overflow-x-auto max-h-48">
                  <pre className="text-xs text-green-400 font-mono whitespace-pre-wrap">
                    {generateIntegrationCode(
                      deploymentResult.publicKey!,
                      config.name || "Feed",
                    )}
                  </pre>
                </div>
              </div>

              {/* Transaction Signature */}
              {deploymentResult.signature && (
                <div className="text-xs text-feedgod-pink-500 dark:text-feedgod-neon-cyan/60">
                  Transaction: {deploymentResult.signature.slice(0, 20)}...
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
              <p className="text-feedgod-dark dark:text-white font-medium mb-2">
                Deployment Failed
              </p>
              <p className="text-sm text-red-500 bg-red-50 dark:bg-red-500/10 rounded-lg p-3">
                {deploymentResult?.error || "Unknown error occurred"}
              </p>
              <button
                onClick={onRetry}
                className="mt-6 px-6 py-2 bg-feedgod-primary hover:bg-feedgod-secondary rounded-lg text-white font-medium transition-colors"
              >
                Try Again
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        {!isDeploying && deploymentResult?.success && (
          <div className="px-6 pb-6">
            <button
              onClick={onClose}
              className="w-full px-4 py-3 bg-feedgod-primary hover:bg-feedgod-secondary rounded-lg text-white font-medium transition-colors"
            >
              Done
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Main FeedBuilder Component
 * Uses custom hooks for state management, price fetching, and deployment
 */
export default function FeedBuilder({
  config,
  onConfigChange,
}: FeedBuilderProps) {
  const [showCustomModal, setShowCustomModal] = useState(false);

  // Custom hooks for separated concerns
  const {
    localConfig,
    availableToAdd,
    enabledSources,
    handleConfigUpdate,
    toggleSource,
    addSource,
    removeSource,
    updateSourceWeight,
  } = useFeedConfig({ config, onConfigChange });

  const {
    currentPrice,
    priceChange,
    sourcePrices,
    isLoadingPrices,
    refreshPrices,
  } = usePriceFetching({ config: localConfig });

  const {
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
  } = useDeployment({ config: localConfig });

  if (!localConfig) {
    return (
      <div className="bg-feedgod-pink-50 dark:bg-feedgod-dark-secondary rounded-lg border border-feedgod-pink-200 dark:border-feedgod-dark-accent p-12 text-center">
        <div className="text-xl font-semibold text-feedgod-primary mb-2">
          Loading Feed Builder...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Module Header */}
      <div className="bg-white/60 dark:bg-feedgod-dark-secondary/80 rounded-lg border border-feedgod-pink-200 dark:border-feedgod-dark-accent p-6 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-pink-500 flex items-center justify-center">
            <Database className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-feedgod-primary dark:text-feedgod-neon-pink">
              Price Feed Builder
            </h2>
            <p className="text-sm text-feedgod-pink-500 dark:text-feedgod-neon-cyan/70">
              Aggregate real-time price data from multiple sources into reliable
              on-chain oracles
            </p>
          </div>
        </div>
      </div>

      {/* Network Mismatch Banner */}
      <NetworkMismatchBanner
        requiredBlockchain={localConfig.blockchain}
        requiredNetwork={localConfig.network}
      />

      {/* Price Display */}
      <PriceDisplay
        config={localConfig}
        currentPrice={currentPrice}
        priceChange={priceChange}
        enabledSourcesCount={enabledSources.length}
        isLoading={isLoadingPrices}
        onRefresh={refreshPrices}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Configuration */}
        <div className="lg:col-span-2 space-y-6">
          {/* Feed Configuration */}
          <div className="bg-white/60 dark:bg-feedgod-dark-secondary/80 rounded-lg border border-feedgod-pink-200 dark:border-feedgod-dark-accent p-6 backdrop-blur-sm">
            <h3 className="text-lg font-semibold text-feedgod-primary mb-4 flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Feed Configuration
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Symbol */}
              <div>
                <label className="block text-sm font-medium text-feedgod-dark dark:text-feedgod-neon-cyan mb-2">
                  Symbol
                </label>
                <input
                  type="text"
                  value={localConfig.symbol}
                  onChange={(e) =>
                    handleConfigUpdate({ symbol: e.target.value })
                  }
                  className="w-full bg-feedgod-pink-50 dark:bg-feedgod-dark-secondary border border-feedgod-pink-200 dark:border-feedgod-dark-accent rounded-lg px-4 py-2 text-feedgod-dark dark:text-feedgod-neon-cyan focus:outline-none focus:ring-2 focus:ring-feedgod-primary dark:focus:ring-feedgod-neon-pink"
                  placeholder="BTC/USD"
                />
              </div>

              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-feedgod-dark mb-2">
                  Feed Name
                </label>
                <input
                  type="text"
                  value={localConfig.name}
                  onChange={(e) => handleConfigUpdate({ name: e.target.value })}
                  className="w-full bg-feedgod-pink-50 dark:bg-feedgod-dark-secondary border border-feedgod-pink-200 dark:border-feedgod-dark-accent rounded-lg px-4 py-2 text-feedgod-dark dark:text-feedgod-neon-cyan focus:outline-none focus:ring-2 focus:ring-feedgod-primary dark:focus:ring-feedgod-neon-pink"
                  placeholder="My Custom Feed"
                />
              </div>

              {/* Update Interval */}
              <div>
                <label className="block text-sm font-medium text-feedgod-dark dark:text-feedgod-neon-cyan mb-2 flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Update Interval (seconds)
                </label>
                <input
                  type="number"
                  value={localConfig.updateInterval}
                  onChange={(e) =>
                    handleConfigUpdate({
                      updateInterval: parseInt(e.target.value) || 60,
                    })
                  }
                  className="w-full bg-feedgod-pink-50 dark:bg-feedgod-dark-secondary border border-feedgod-pink-200 dark:border-feedgod-dark-accent rounded-lg px-4 py-2 text-feedgod-dark dark:text-feedgod-neon-cyan focus:outline-none focus:ring-2 focus:ring-feedgod-primary dark:focus:ring-feedgod-neon-pink"
                  min="1"
                />
                <p className="text-xs text-feedgod-pink-500 dark:text-feedgod-neon-cyan/70 mt-1">
                  Updates every {localConfig.updateInterval}s
                </p>
              </div>

              {/* Decimals */}
              <div>
                <label className="block text-sm font-medium text-feedgod-dark dark:text-feedgod-neon-cyan mb-2 flex items-center gap-2">
                  <Hash className="w-4 h-4" />
                  Decimal Precision
                </label>
                <input
                  type="number"
                  value={localConfig.decimals}
                  onChange={(e) =>
                    handleConfigUpdate({
                      decimals: parseInt(e.target.value) || 8,
                    })
                  }
                  className="w-full bg-feedgod-pink-50 dark:bg-feedgod-dark-secondary border border-feedgod-pink-200 dark:border-feedgod-dark-accent rounded-lg px-4 py-2 text-feedgod-dark dark:text-feedgod-neon-cyan focus:outline-none focus:ring-2 focus:ring-feedgod-primary dark:focus:ring-feedgod-neon-pink"
                  min="0"
                  max="18"
                />
                <p className="text-xs text-feedgod-pink-500 dark:text-feedgod-neon-cyan/70 mt-1">
                  {localConfig.decimals} decimal places
                </p>
              </div>

              {/* Chain Selector */}
              <div className="md:col-span-2">
                <ChainSelector
                  blockchain={localConfig.blockchain}
                  network={localConfig.network}
                  onBlockchainChange={(blockchain) =>
                    handleConfigUpdate({ blockchain })
                  }
                  onNetworkChange={(network) => handleConfigUpdate({ network })}
                />
              </div>

              {/* Aggregator Type */}
              <div>
                <label className="block text-sm font-medium text-feedgod-dark dark:text-feedgod-neon-cyan mb-2">
                  Aggregation Method
                </label>
                <select
                  value={localConfig.aggregator.type}
                  onChange={(e) =>
                    handleConfigUpdate({
                      aggregator: {
                        ...localConfig.aggregator,
                        type: e.target.value as "median" | "mean" | "weighted",
                      },
                    })
                  }
                  className="w-full bg-feedgod-pink-50 dark:bg-feedgod-dark-secondary border border-feedgod-pink-200 dark:border-feedgod-dark-accent rounded-lg px-4 py-2 text-feedgod-dark dark:text-feedgod-neon-cyan focus:outline-none focus:ring-2 focus:ring-feedgod-primary dark:focus:ring-feedgod-neon-pink"
                >
                  <option value="median">Median (Most Robust)</option>
                  <option value="mean">Mean (Average)</option>
                  <option value="weighted">Weighted Average</option>
                </select>
                <p className="text-xs text-feedgod-pink-500 dark:text-feedgod-neon-cyan/70 mt-1">
                  {localConfig.aggregator.type === "median" &&
                    "Uses middle value from all sources"}
                  {localConfig.aggregator.type === "mean" &&
                    "Averages all source prices"}
                  {localConfig.aggregator.type === "weighted" &&
                    "Weights by source reliability"}
                </p>
              </div>
            </div>

            {/* Advanced Settings */}
            <div className="mt-6 pt-6 border-t border-feedgod-pink-200 dark:border-feedgod-dark-accent">
              <h4 className="text-sm font-medium text-feedgod-dark dark:text-feedgod-neon-cyan mb-4">
                Advanced Settings
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-feedgod-dark dark:text-feedgod-neon-cyan mb-2">
                    Min Sources Required
                  </label>
                  <input
                    type="number"
                    value={localConfig.aggregator.minSources || 2}
                    onChange={(e) =>
                      handleConfigUpdate({
                        aggregator: {
                          ...localConfig.aggregator,
                          minSources: parseInt(e.target.value) || 2,
                        },
                      })
                    }
                    className="w-full bg-feedgod-pink-50 dark:bg-feedgod-dark-secondary border border-feedgod-pink-200 dark:border-feedgod-dark-accent rounded-lg px-4 py-2 text-feedgod-dark dark:text-feedgod-neon-cyan focus:outline-none focus:ring-2 focus:ring-feedgod-primary dark:focus:ring-feedgod-neon-pink"
                    min="1"
                    max={localConfig.dataSources.length}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-feedgod-dark dark:text-feedgod-neon-cyan mb-2">
                    Deviation Threshold (%)
                  </label>
                  <input
                    type="number"
                    value={
                      localConfig.aggregator.deviationThreshold
                        ? localConfig.aggregator.deviationThreshold * 100
                        : 5
                    }
                    onChange={(e) =>
                      handleConfigUpdate({
                        aggregator: {
                          ...localConfig.aggregator,
                          deviationThreshold:
                            (parseFloat(e.target.value) || 5) / 100,
                        },
                      })
                    }
                    className="w-full bg-feedgod-pink-50 dark:bg-feedgod-dark-secondary border border-feedgod-pink-200 dark:border-feedgod-dark-accent rounded-lg px-4 py-2 text-feedgod-dark dark:text-feedgod-neon-cyan focus:outline-none focus:ring-2 focus:ring-feedgod-primary dark:focus:ring-feedgod-neon-pink"
                    min="0"
                    max="100"
                    step="0.1"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Sources & Actions */}
        <div className="space-y-6">
          {/* Data Sources Panel */}
          <DataSourcesPanel
            dataSources={localConfig.dataSources}
            sourcePrices={sourcePrices}
            availableToAdd={availableToAdd}
            onToggleSource={toggleSource}
            onRemoveSource={removeSource}
            onAddSource={addSource}
            onUpdateWeight={updateSourceWeight}
            onShowCustomModal={() => setShowCustomModal(true)}
          />

          {/* Aggregated Price Summary */}
          <div className="bg-white/60 dark:bg-feedgod-dark-secondary/80 rounded-lg border border-feedgod-pink-200 dark:border-feedgod-dark-accent p-6 backdrop-blur-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-feedgod-pink-500 dark:text-feedgod-neon-cyan/70">
                Aggregated Price
              </span>
              <span className="text-sm font-medium text-feedgod-dark dark:text-feedgod-neon-cyan capitalize">
                {localConfig.aggregator.type}
              </span>
            </div>
            {isLoadingPrices || currentPrice === null ? (
              <p className="text-2xl font-bold text-feedgod-pink-400">
                Loading...
              </p>
            ) : (
              <p className="text-2xl font-bold text-feedgod-primary dark:text-feedgod-neon-pink">
                ${formatPrice(currentPrice)}
              </p>
            )}
            <p className="text-xs text-feedgod-pink-500 mt-1">
              {enabledSources.length} active source
              {enabledSources.length !== 1 ? "s" : ""}
            </p>
          </div>

          {/* Cost Estimation */}
          <CostEstimateDisplay
            blockchain={localConfig.blockchain}
            network={localConfig.network}
            operationType="feed"
          />

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={handleSave}
              className="flex-1 px-4 py-3 bg-feedgod-pink-200 dark:bg-feedgod-dark-secondary hover:bg-feedgod-pink-300 dark:hover:bg-feedgod-dark-accent rounded-lg text-feedgod-dark dark:text-feedgod-neon-cyan text-sm font-medium transition-colors flex items-center justify-center gap-2 star-glow-on-hover"
            >
              <Save className="w-4 h-4" />
              Save
            </button>
            <button
              onClick={handleDeploy}
              disabled={isDeploying || !isWalletConnected}
              className="flex-1 px-4 py-3 bg-feedgod-primary hover:bg-feedgod-secondary disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-white text-sm font-medium transition-colors flex items-center justify-center gap-2 star-glow-on-hover"
              title={!isWalletConnected ? "Connect wallet to deploy" : ""}
            >
              {isDeploying ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Deploying...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" />
                  {isWalletConnected ? "Deploy" : "Connect Wallet"}
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Custom Source Modal */}
      <CustomSourceModal
        isOpen={showCustomModal}
        onClose={() => setShowCustomModal(false)}
        onAdd={(source) => addSource(source)}
      />

      {/* Deployment Modal */}
      {showDeploymentModal && (
        <DeploymentModal
          config={localConfig}
          isDeploying={isDeploying}
          deploymentResult={deploymentResult}
          copiedText={copiedText}
          onClose={closeDeploymentModal}
          onRetry={handleDeploy}
          onCopy={handleCopyToClipboard}
        />
      )}
    </div>
  );
}
