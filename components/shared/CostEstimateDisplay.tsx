'use client'

import { DollarSign } from 'lucide-react'
import { useCostEstimate } from '@/lib/hooks/use-cost-estimate'
import type { Blockchain } from '@/types/feed'

type OperationType = 'feed' | 'function' | 'vrf' | 'secret'

interface CostEstimateDisplayProps {
  blockchain: Blockchain | string
  network: string
  operationType: OperationType
}

export function CostEstimateDisplay({
  blockchain,
  network,
  operationType,
}: CostEstimateDisplayProps): JSX.Element {
  const { estimate, isLoading } = useCostEstimate(
    blockchain as Blockchain,
    network as 'mainnet' | 'testnet' | 'devnet',
    operationType
  )

  if (isLoading || !estimate) {
    return (
      <div className="px-4 py-3 bg-[#252620] rounded-lg border border-[#3a3b35]">
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <DollarSign className="w-4 h-4 animate-pulse" />
          <span>Calculating deployment cost...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="px-4 py-3 bg-[#252620] rounded-lg border border-[#3a3b35]">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <DollarSign className="w-4 h-4" />
          <span>Estimated Cost:</span>
        </div>
        <div className="text-right">
          <div className="text-base font-semibold text-white">
            {estimate.estimatedCost} {estimate.currency}
          </div>
          {estimate.usdEstimate && (
            <div className="text-xs text-gray-400">{estimate.usdEstimate}</div>
          )}
        </div>
      </div>
      {estimate.gasPrice && (
        <div className="mt-2 text-xs text-gray-400">
          Gas: {estimate.gasPrice} gwei
        </div>
      )}
    </div>
  )
}
