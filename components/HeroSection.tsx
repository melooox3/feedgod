'use client'

import { useState, useEffect, useCallback } from 'react'

const prompts = [
  "create oracles like a god",
  "prove it rained in Tokyo last Tuesday",
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
    const base = 40
    const variance = 20
    return base + Math.random() * variance
  }, [])

  const getErasingDelay = useCallback(() => {
    return 30
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
        }, 2000)
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
        }, 500)
        break
    }

    return () => {
      if (timeoutId) clearTimeout(timeoutId)
    }
  }, [state, charIndex, displayText, currentPrompt, promptIndex, getTypingDelay, getErasingDelay])

  return (
    <section className="text-center py-16 md:py-24 px-4">
      <div className="min-h-[120px] md:min-h-[160px] flex items-center justify-center mb-6">
        <h1 
          className="text-3xl md:text-5xl lg:text-6xl gradient-text lowercase"
          style={{ 
            fontFamily: 'Arial, sans-serif', 
            fontWeight: 900, 
            letterSpacing: '-2px', 
            lineHeight: '1.2' 
          }}
        >
          <span className="inline">{displayText}</span>
          <span 
            className="typewriter-cursor inline-block w-[3px] md:w-[4px] h-[0.9em] bg-feedgod-primary ml-1 align-middle"
            style={{ marginBottom: '-0.1em' }}
          />
        </h1>
      </div>
      <p className="text-sm md:text-base text-gray-400 max-w-2xl mx-auto leading-relaxed">
        <span className="text-white font-medium">Any data. Any chain. No code.</span>
      </p>
    </section>
  )
}
