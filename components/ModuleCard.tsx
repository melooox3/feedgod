'use client'

import { LucideIcon, ArrowUpRight } from 'lucide-react'
import { playPickupSound } from '@/lib/sound-utils'

interface ModuleCardProps {
  icon: LucideIcon
  backgroundIcon?: LucideIcon
  title: string
  description: string
  onClick: () => void
  accentColor?: string
}

export default function ModuleCard({ 
  icon: Icon, 
  backgroundIcon: BackgroundIcon,
  title, 
  description, 
  onClick,
}: ModuleCardProps) {
  const handleClick = () => {
    playPickupSound()
    onClick()
  }

  return (
    <button
      onClick={handleClick}
      className="group relative w-full text-left p-5 md:p-6 bg-[#252620]/60 backdrop-blur-sm rounded-xl border border-[#3a3b35] hover:border-[#4a4b45] card-lift overflow-hidden focus:outline-none focus-ring"
    >
      {/* Subtle hover gradient */}
      <div 
        className="absolute inset-0 rounded-xl bg-gradient-to-br from-feedgod-primary/[0.03] via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" 
      />
      
      {/* Background decorative icon - more subtle */}
      {BackgroundIcon && (
        <div className="absolute -bottom-6 -right-6 pointer-events-none">
          <BackgroundIcon 
            className="w-28 h-28 text-feedgod-primary/[0.04] transform rotate-12 group-hover:rotate-6 group-hover:scale-105 transition-all duration-500 ease-out" 
            strokeWidth={1}
          />
        </div>
      )}
      
      <div className="relative z-10">
        {/* Icon container with consistent styling */}
        <div className="w-10 h-10 mb-4 rounded-lg bg-[#2a2b25] border border-[#3a3b35] flex items-center justify-center group-hover:border-feedgod-primary/20 transition-colors duration-200">
          <Icon className="w-5 h-5 text-feedgod-primary" strokeWidth={1.75} />
        </div>
        
        {/* Title */}
        <h3 className="text-base font-semibold text-white mb-1.5 tracking-tight group-hover:text-feedgod-primary/90 transition-colors duration-200">
          {title}
        </h3>
        
        {/* Description */}
        <p className="text-sm text-gray-400 leading-relaxed line-clamp-2">
          {description}
        </p>
        
        {/* Arrow indicator - subtle */}
        <div className="mt-4 flex items-center text-feedgod-primary opacity-0 group-hover:opacity-100 transition-all duration-200 transform translate-x-0 group-hover:translate-x-0.5">
          <span className="text-xs font-medium">Get started</span>
          <ArrowUpRight className="w-3.5 h-3.5 ml-1" />
        </div>
      </div>
    </button>
  )
}
