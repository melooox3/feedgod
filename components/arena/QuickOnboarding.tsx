'use client'

import { useState, useEffect } from 'react'
import { X, Wallet, TrendingUp, Trophy, ChevronRight, Sparkles } from 'lucide-react'
import { WALLET_CONFIG } from '@/lib/arena/arena-wallet'

const ONBOARDING_KEY = 'arena_onboarding_seen_v1'

interface QuickOnboardingProps {
  onComplete: () => void
  onStartBetting?: () => void
}

export default function QuickOnboarding({ onComplete, onStartBetting }: QuickOnboardingProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)

  useEffect(() => {
    // Check if user has seen onboarding
    const seen = localStorage.getItem(ONBOARDING_KEY)
    if (!seen) {
      // Small delay for smooth appearance
      setTimeout(() => setIsVisible(true), 500)
    }
  }, [])

  const handleDismiss = () => {
    localStorage.setItem(ONBOARDING_KEY, 'true')
    setIsVisible(false)
    onComplete()
  }

  const handleGetStarted = () => {
    localStorage.setItem(ONBOARDING_KEY, 'true')
    setIsVisible(false)
    onStartBetting?.()
    onComplete()
  }

  const steps = [
    {
      icon: Wallet,
      title: `You have ${WALLET_CONFIG.STARTING_BALANCE} Demo USDC`,
      description: 'Play with demo funds. No real money required to start.',
      color: 'text-green-400',
      bgColor: 'bg-green-500/10',
    },
    {
      icon: TrendingUp,
      title: 'Predict UP or DOWN',
      description: 'Pick a market and bet on whether the value will go up or down.',
      color: 'text-feedgod-primary',
      bgColor: 'bg-feedgod-primary/10',
    },
    {
      icon: Trophy,
      title: 'Win & Climb the Leaderboard',
      description: 'Correct predictions earn points. Compete for the top spots!',
      color: 'text-yellow-400',
      bgColor: 'bg-yellow-500/10',
    },
  ]

  if (!isVisible) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={handleDismiss}
      />

      {/* Modal */}
      <div className="relative bg-[#1D1E19] border border-[#3a3b35] rounded-xl max-w-md w-full p-6 animate-fade-in shadow-2xl">
        {/* Close button */}
        <button
          onClick={handleDismiss}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-300 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-feedgod-primary/10 rounded-full text-feedgod-primary text-xs font-medium mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            Welcome to the Arena
          </div>
          <h2 className="text-xl font-bold text-white mb-1">Ready to Predict?</h2>
          <p className="text-sm text-gray-400">Get started in under a minute</p>
        </div>

        {/* Steps */}
        <div className="space-y-3 mb-6">
          {steps.map((step, index) => {
            const Icon = step.icon
            return (
              <div
                key={index}
                className={`flex items-start gap-3 p-3 rounded-lg transition-all duration-300 ${
                  index === currentStep ? step.bgColor : 'bg-[#252620]'
                }`}
                onMouseEnter={() => setCurrentStep(index)}
              >
                <div className={`p-2 rounded-lg ${step.bgColor}`}>
                  <Icon className={`w-5 h-5 ${step.color}`} />
                </div>
                <div className="flex-1">
                  <h3 className="font-medium text-white text-sm">{step.title}</h3>
                  <p className="text-xs text-gray-400 mt-0.5">{step.description}</p>
                </div>
                <div className="text-gray-600 font-bold text-sm">{index + 1}</div>
              </div>
            )
          })}
        </div>

        {/* CTA Buttons */}
        <div className="flex gap-3">
          <button
            onClick={handleDismiss}
            className="flex-1 px-4 py-2.5 border border-[#3a3b35] rounded-lg text-sm text-gray-400 hover:text-white hover:border-gray-600 transition-colors"
          >
            Skip
          </button>
          <button
            onClick={handleGetStarted}
            className="flex-1 px-4 py-2.5 bg-feedgod-primary hover:bg-feedgod-primary/90 rounded-lg text-sm font-medium text-white flex items-center justify-center gap-2 transition-colors"
          >
            Start Betting
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}

// Helper to reset onboarding (for testing)
export function resetOnboarding() {
  localStorage.removeItem(ONBOARDING_KEY)
}
