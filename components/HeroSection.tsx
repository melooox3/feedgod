'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { Swords } from 'lucide-react'

const prompts = [
  "create oracles like a god",
  "prove it rained in Tokyo last Tuesday",
  "predict anything, win points",
  "deploy SOL/USD feed in 10 seconds",
  "resolve Polymarket bets on-chain",
  "track $CHILLCOCK across all DEXs",
  "build CS2 match outcome resolver",
  "aggregate 5 exchanges with median pricing",
  "pipe Kalshi odds into smart contracts",
  "stream X followers on-chain",
  "monitor NBA game outcomes",
  "build YouTube subscriber tracker",
  "oracle any API endpoint",
  "track NFT floor prices",
]

type TypewriterState = 'typing' | 'pausing' | 'erasing' | 'waiting'

export default function HeroSection() {
  const [displayText, setDisplayText] = useState('')
  const [promptIndex, setPromptIndex] = useState(0)
  const [state, setState] = useState<TypewriterState>('typing')
  const [charIndex, setCharIndex] = useState(0)

  const currentPrompt = prompts[promptIndex]

  const getTypingDelay = useCallback(() => {
    const base = 45
    const variance = 25
    return base + Math.random() * variance
  }, [])

  const getErasingDelay = useCallback(() => {
    return 25
  }, [])

  useEffect(() => {
    let timeoutId: NodeJS.Timeout

    switch (state) {
      case 'typing':
        if (charIndex < currentPrompt.length) {
          timeoutId = setTimeout(() => {
            setDisplayText(currentPrompt.slice(0, charIndex + 1))
            setCharIndex(prev => prev + 1)
          }, getTypingDelay())
        } else {
          setState('pausing')
        }
        break

      case 'pausing':
        timeoutId = setTimeout(() => {
          setState('erasing')
        }, 2200)
        break

      case 'erasing':
        if (displayText.length > 0) {
          timeoutId = setTimeout(() => {
            setDisplayText(prev => prev.slice(0, -1))
          }, getErasingDelay())
        } else {
          setState('waiting')
        }
        break

      case 'waiting':
        timeoutId = setTimeout(() => {
          const nextIndex = (promptIndex + 1) % prompts.length
          setPromptIndex(nextIndex)
          setCharIndex(0)
          setState('typing')
        }, 400)
        break
    }

    return () => {
      if (timeoutId) clearTimeout(timeoutId)
    }
  }, [state, charIndex, displayText, currentPrompt, promptIndex, getTypingDelay, getErasingDelay])

  return (
    <section className="text-center pt-20 pb-16 md:pt-28 md:pb-20 px-4">
      {/* Headline container with fixed height to prevent layout shift */}
      <div className="min-h-[100px] md:min-h-[130px] flex items-center justify-center mb-8">
        <h1 
          className="text-2xl md:text-4xl lg:text-5xl gradient-text lowercase leading-tight"
          style={{ 
            fontFamily: 'Arial, sans-serif', 
            fontWeight: 900, 
            letterSpacing: '-1.5px', 
          }}
        >
          <span className="inline">{displayText}</span>
          <span 
            className="typewriter-cursor inline-block w-[2px] md:w-[3px] h-[0.85em] bg-feedgod-primary ml-0.5 align-middle rounded-full"
            style={{ marginBottom: '-0.05em' }}
          />
        </h1>
      </div>
      
      {/* Enter Arena Button with intense glow effect */}
      <Link 
        href="/arena" 
        className="group inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-feedgod-primary to-[#d63384] rounded-xl text-white font-semibold transition-all duration-300 hover:scale-110 shadow-[0_0_30px_rgba(255,13,110,0.4)] hover:shadow-[0_0_60px_rgba(255,13,110,0.8),0_0_100px_rgba(255,13,110,0.4)] animate-fade-in animate-delay-1 relative overflow-visible"
      >
        {/* Animated glow ring */}
        <span className="absolute -inset-1 bg-gradient-to-r from-feedgod-primary to-[#d63384] rounded-xl blur-lg opacity-0 group-hover:opacity-75 transition-all duration-500" />
        
        {/* Button background */}
        <span className="absolute inset-0 bg-gradient-to-r from-feedgod-primary to-[#d63384] rounded-xl" />
        
        {/* White flash overlay */}
        <span className="absolute inset-0 bg-white/0 group-hover:bg-white/20 transition-all duration-200 rounded-xl" />
        
        {/* Swords icon with crazy animation */}
        <Swords className="w-6 h-6 relative z-10 transition-all duration-300 group-hover:scale-125 group-hover:rotate-[20deg] group-hover:drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]" />
        
        <span className="relative z-10 text-lg">Enter Arena</span>
      </Link>
      
      {/* CSS for shake animation */}
      <style jsx>{`
        .group:hover :global(svg) {
          animation: swordShake 0.4s ease-in-out;
        }
        @keyframes swordShake {
          0%, 100% { transform: scale(1.25) rotate(20deg); }
          25% { transform: scale(1.3) rotate(25deg); }
          50% { transform: scale(1.25) rotate(15deg); }
          75% { transform: scale(1.3) rotate(25deg); }
        }
      `}</style>
      
      {/* Subhead - below button, three lines */}
      <div className="text-sm max-w-md mx-auto leading-relaxed animate-fade-in animate-delay-2 mt-8 space-y-1">
        <p className="text-gray-400">Earn points. Climb the leaderboard.</p>
        <p className="text-gray-500">Any data. Any chain. No code.</p>
        <p className="text-gray-500">By Switchboard</p>
      </div>
    </section>
  )
}
