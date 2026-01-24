"use client";

import { useState, useCallback, useEffect } from "react";
import { useEVMWallet } from "@/lib/evm-wallet-provider";
import { useToast } from "@/components/Toast";
import { AlertTriangle, ArrowRight, Loader2, X } from "lucide-react";
import { Blockchain, Network } from "@/types/feed";

// Chain IDs for supported networks
const CHAIN_IDS: Record<string, number> = {
  "ethereum-mainnet": 1,
  "ethereum-testnet": 11155111, // Sepolia
  "monad-mainnet": 143,
  "monad-testnet": 10143,
  "monad-devnet": 10143,
};

// Chain configurations for wallet_addEthereumChain
const CHAIN_CONFIGS: Record<
  number,
  {
    chainId: string;
    chainName: string;
    nativeCurrency: { name: string; symbol: string; decimals: number };
    rpcUrls: string[];
    blockExplorerUrls?: string[];
  }
> = {
  1: {
    chainId: "0x1",
    chainName: "Ethereum Mainnet",
    nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
    rpcUrls: ["https://eth.llamarpc.com"],
    blockExplorerUrls: ["https://etherscan.io"],
  },
  11155111: {
    chainId: "0xaa36a7",
    chainName: "Sepolia Testnet",
    nativeCurrency: { name: "Sepolia Ether", symbol: "ETH", decimals: 18 },
    rpcUrls: ["https://rpc.sepolia.org"],
    blockExplorerUrls: ["https://sepolia.etherscan.io"],
  },
  143: {
    chainId: "0x8f",
    chainName: "Monad Mainnet",
    nativeCurrency: { name: "Monad", symbol: "MON", decimals: 18 },
    rpcUrls: ["https://rpc-mainnet.monadinfra.com"],
    blockExplorerUrls: ["https://explorer.monad.xyz"],
  },
  10143: {
    chainId: "0x279f",
    chainName: "Monad Testnet",
    nativeCurrency: { name: "Monad", symbol: "MON", decimals: 18 },
    rpcUrls: ["https://testnet-rpc.monad.xyz"],
    blockExplorerUrls: ["https://testnet.explorer.monad.xyz"],
  },
};

// Human-readable chain names
const CHAIN_NAMES: Record<number, string> = {
  1: "Ethereum Mainnet",
  11155111: "Sepolia Testnet",
  143: "Monad Mainnet",
  10143: "Monad Testnet",
};

interface NetworkMismatchBannerProps {
  requiredBlockchain: Blockchain;
  requiredNetwork: Network;
}

export default function NetworkMismatchBanner({
  requiredBlockchain,
  requiredNetwork,
}: NetworkMismatchBannerProps) {
  const { isConnected, chainId, switchChain } = useEVMWallet();
  const toast = useToast();
  const [isSwitching, setIsSwitching] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  // Only applies to EVM chains (ethereum, monad)
  const isEVMChain =
    requiredBlockchain === "ethereum" || requiredBlockchain === "monad";

  // Get the required chain ID
  const networkKey = `${requiredBlockchain}-${requiredNetwork}`;
  const requiredChainId = CHAIN_IDS[networkKey];

  // Check if there's a mismatch
  const hasMismatch =
    isConnected &&
    isEVMChain &&
    chainId !== null &&
    chainId !== requiredChainId;

  // Reset dismissed state when required network changes
  useEffect(() => {
    setDismissed(false);
  }, [requiredBlockchain, requiredNetwork]);

  const handleSwitchNetwork = useCallback(async () => {
    if (!requiredChainId) return;

    setIsSwitching(true);
    try {
      // First try to switch to the chain
      await switchChain(requiredChainId);
      toast.success(
        `Switched to ${CHAIN_NAMES[requiredChainId] || "the required network"}`,
      );
    } catch (error: unknown) {
      // If chain not found, try to add it
      const err = error as { code?: number };
      if (
        err?.code === 4902 &&
        typeof window !== "undefined" &&
        window.ethereum
      ) {
        const chainConfig = CHAIN_CONFIGS[requiredChainId];
        if (chainConfig) {
          try {
            await window.ethereum.request({
              method: "wallet_addEthereumChain",
              params: [chainConfig],
            });
            toast.success(`Added and switched to ${chainConfig.chainName}`);
          } catch (addError: unknown) {
            const addErr = addError as { code?: number };
            if (addErr?.code === 4001) {
              toast.warning("Network addition was rejected");
            } else {
              toast.error("Failed to add network to wallet");
            }
          }
        } else {
          toast.error("Network configuration not available");
        }
      } else if (err?.code === 4001) {
        toast.warning("Network switch was rejected");
      } else {
        toast.error("Failed to switch network");
      }
    } finally {
      setIsSwitching(false);
    }
  }, [requiredChainId, switchChain, toast]);

  // Don't render if no mismatch, not EVM, or dismissed
  if (!hasMismatch || !isEVMChain || dismissed) {
    return null;
  }

  const currentChainName = chainId
    ? CHAIN_NAMES[chainId] || `Chain ${chainId}`
    : "Unknown";
  const requiredChainName = requiredChainId
    ? CHAIN_NAMES[requiredChainId] || `${requiredBlockchain} ${requiredNetwork}`
    : "Unknown";

  return (
    <div className="bg-amber-50 dark:bg-amber-500/20 border border-amber-200 dark:border-amber-500/30 rounded-lg p-4 mb-4">
      <div className="flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-amber-700 dark:text-amber-300">
            Network Mismatch Detected
          </h3>
          <p className="text-sm text-amber-600 dark:text-amber-400 mt-1">
            Your wallet is connected to <strong>{currentChainName}</strong>, but
            this feed requires <strong>{requiredChainName}</strong>.
          </p>
          <div className="flex items-center gap-3 mt-3">
            <button
              onClick={handleSwitchNetwork}
              disabled={isSwitching}
              className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 disabled:bg-amber-400 text-white text-sm font-medium rounded-lg transition-colors"
            >
              {isSwitching ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Switching...
                </>
              ) : (
                <>
                  Switch to {requiredChainName}
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
            <button
              onClick={() => setDismissed(true)}
              className="p-2 text-amber-500 hover:text-amber-600 dark:text-amber-400 dark:hover:text-amber-300 transition-colors"
              aria-label="Dismiss"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
