'use client'

import { useState, useRef, useEffect } from 'react'
import { Play, Pause } from 'lucide-react'

export default function MusicPlayer() {
  const [isPlaying, setIsPlaying] = useState(false)
  const audioRef = useRef<HTMLAudioElement>(null)

  useEffect(() => {
    // Auto-play when component mounts
    const tryPlay = async () => {
      if (audioRef.current) {
        try {
          await audioRef.current.play()
          setIsPlaying(true)
        } catch (error) {
          // Auto-play might be blocked by browser
          // Try again on any user interaction
          const handleUserInteraction = async () => {
            if (audioRef.current) {
              try {
                await audioRef.current.play()
                setIsPlaying(true)
              } catch (e) {
                // Still blocked
              }
            }
            // Remove listeners after first interaction
            document.removeEventListener('click', handleUserInteraction, true)
            document.removeEventListener('keydown', handleUserInteraction, true)
            document.removeEventListener('touchstart', handleUserInteraction, true)
            document.removeEventListener('mousedown', handleUserInteraction, true)
          }
          document.addEventListener('click', handleUserInteraction, true)
          document.addEventListener('keydown', handleUserInteraction, true)
          document.addEventListener('touchstart', handleUserInteraction, true)
          document.addEventListener('mousedown', handleUserInteraction, true)
        }
      }
    }
    
    // Try immediately
    tryPlay()
    
    // Also try after a short delay in case the audio isn't ready
    const timeout = setTimeout(tryPlay, 300)
    
    return () => clearTimeout(timeout)
  }, [])

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause()
      } else {
        audioRef.current.play()
      }
      setIsPlaying(!isPlaying)
    }
  }

  return (
    <div className="flex items-center gap-2">
      <audio
        ref={audioRef}
        src="/sound_fac75a50-238f-4a71-9290-bfe7b9112030.mp3"
        loop
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
      />
      <button
        onClick={togglePlay}
        className="p-2 bg-feedgod-pink-100 dark:bg-feedgod-dark-secondary hover:bg-feedgod-pink-200 dark:hover:bg-feedgod-dark-accent rounded-lg text-feedgod-primary dark:text-feedgod-neon-pink transition-colors star-glow-on-hover"
        title={isPlaying ? 'Pause' : 'Play'}
      >
        {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
      </button>
    </div>
  )
}
