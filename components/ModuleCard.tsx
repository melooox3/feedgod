'use client'

import { LucideIcon } from 'lucide-react'
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
      className="group relative w-full text-left p-6 md:p-8 bg-feedgod-dark-secondary/80 backdrop-blur-sm rounded-2xl border border-feedgod-dark-accent hover:border-feedgod-primary/50 transition-all duration-300 hover:shadow-lg hover:shadow-feedgod-primary/10 overflow-hidden"
    >
      {/* Subtle gradient overlay on hover */}
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-feedgod-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      
      {/* Background decorative icon */}
      {BackgroundIcon && (
        <div className="absolute -bottom-4 -right-4 pointer-events-none">
          <BackgroundIcon 
            className="w-32 h-32 text-feedgod-primary/[0.08] transform rotate-12 group-hover:rotate-6 group-hover:scale-110 transition-all duration-500" 
            strokeWidth={1}
          />
        </div>
      )}
      
      <div className="relative z-10">
        {/* Icon */}
        <div className="w-12 h-12 mb-5 rounded-xl bg-feedgod-dark-accent/50 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
          <Icon className="w-6 h-6 text-feedgod-primary" />
        </div>
        
        {/* Title */}
        <h3 className="text-xl font-semibold text-white mb-2 group-hover:gradient-text transition-colors">
          {title}
        </h3>
        
        {/* Description */}
        <p className="text-sm text-gray-400 leading-relaxed">
          {description}
        </p>
        
        {/* Arrow indicator */}
        <div className="mt-4 flex items-center gradient-text opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-0 group-hover:translate-x-1">
          <span className="text-sm font-medium">Get started</span>
          <svg className="w-4 h-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </div>
    </button>
  )
}
