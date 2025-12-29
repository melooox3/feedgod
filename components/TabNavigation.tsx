'use client'

import { Database, Code, Dice6, Key } from 'lucide-react'
import { BuilderType } from '@/types/switchboard'
import { playPickupSound } from '@/lib/sound-utils'

interface TabNavigationProps {
  activeTab: BuilderType
  onTabChange: (tab: BuilderType) => void
}

const TABS: { id: BuilderType; label: string; icon: typeof Database; description: string }[] = [
  {
    id: 'feed',
    label: 'Feed Builder',
    icon: Database,
    description: 'Create price feeds and data oracles',
  },
  {
    id: 'function',
    label: 'Functions',
    icon: Code,
    description: 'Off-chain compute & custom logic',
  },
  {
    id: 'vrf',
    label: 'VRF',
    icon: Dice6,
    description: 'Verifiable random numbers',
  },
  {
    id: 'secret',
    label: 'Secrets',
    icon: Key,
    description: 'API keys & sensitive data',
  },
]

export default function TabNavigation({ activeTab, onTabChange }: TabNavigationProps) {
  return (
    <div className="border-b border-feedgod-pink-200 dark:border-feedgod-dark-accent bg-white/60 dark:bg-feedgod-dark-secondary/80 backdrop-blur-sm rounded-t-lg">
      <div className="flex gap-1 px-2 pt-2">
        {TABS.map((tab) => {
          const Icon = tab.icon
          return (
            <button
              key={tab.id}
              onClick={() => {
                playPickupSound()
                onTabChange(tab.id)
              }}
              className={`flex items-center gap-2 px-4 py-3 rounded-t-lg transition-colors relative ${
                activeTab === tab.id
                  ? 'bg-feedgod-pink-50 dark:bg-feedgod-dark-accent text-feedgod-primary dark:text-feedgod-neon-pink border-b-2 border-feedgod-primary dark:border-feedgod-neon-pink'
                  : 'text-feedgod-pink-500 dark:text-feedgod-neon-cyan/70 hover:text-feedgod-primary dark:hover:text-feedgod-neon-pink hover:bg-feedgod-pink-50/50 dark:hover:bg-feedgod-dark-accent/50'
              } star-glow-on-hover`}
              title={tab.description}
            >
              <Icon className="w-4 h-4" />
              <span className="font-medium text-sm">{tab.label}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

