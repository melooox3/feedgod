'use client'

import Link from 'next/link'
import { Book, Moon, Sun, MessageCircle } from 'lucide-react'
import WalletButton from './WalletButton'
import { Plus } from 'lucide-react'
import MusicPlayer from './MusicPlayer'
import { useTheme } from '@/contexts/ThemeContext'

export default function Header() {
  const { theme, toggleTheme } = useTheme()

  return (
    <header className="border-b border-feedgod-pink-200 dark:border-feedgod-dark-accent bg-feedgod-pink-50/80 dark:bg-feedgod-dark-bg/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-3">
              <span className="text-feedgod-primary dark:text-feedgod-neon-pink lowercase" style={{ fontFamily: 'Arial, sans-serif', fontSize: '32px', fontWeight: '900', letterSpacing: '-2px' }}>feedgod. 🥕</span>
            </Link>
            <span className="text-feedgod-pink-300 dark:text-feedgod-neon-cyan">/</span>
            <span className="pixel-font text-feedgod-pink-400 dark:text-feedgod-neon-cyan lowercase" style={{ fontSize: '13px' }}>powered by Switchboard</span>
          </div>

          <nav className="flex items-center gap-4">
            <MusicPlayer />
            <button
              onClick={toggleTheme}
              className="p-2 bg-feedgod-pink-100 dark:bg-feedgod-dark-secondary hover:bg-feedgod-pink-200 dark:hover:bg-feedgod-dark-accent rounded-lg text-feedgod-primary dark:text-feedgod-neon-pink transition-colors star-glow-on-hover"
              title={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
            >
              {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
            </button>
            <Link
              href="https://switchboard.xyz"
              target="_blank"
              className="flex-shrink-0 star-glow-on-hover"
            >
              <img
                src="/symbol-colored.svg"
                alt="Switchboard"
                width={24}
                height={24}
                className="flex-shrink-0"
              />
            </Link>
            <Link
              href="https://docs.switchboard.xyz/"
              target="_blank"
              className="flex items-center gap-2 text-sm text-feedgod-pink-500 dark:text-feedgod-neon-cyan hover:text-feedgod-primary dark:hover:text-feedgod-neon-pink transition-colors star-glow-on-hover rounded-lg px-2 py-1"
            >
              <Book className="w-4 h-4" />
              <span>Docs</span>
            </Link>
            <Link
              href="https://explorer.switchboardlabs.xyz/"
              target="_blank"
              className="text-sm text-feedgod-pink-500 dark:text-feedgod-neon-cyan hover:text-feedgod-primary dark:hover:text-feedgod-neon-pink transition-colors star-glow-on-hover rounded-lg px-2 py-1"
            >
              Explorer
            </Link>
            <Link
              href="https://discord.gg/switchboardxyz"
              target="_blank"
              className="flex items-center gap-2 text-sm text-feedgod-pink-500 dark:text-feedgod-neon-cyan hover:text-feedgod-primary dark:hover:text-feedgod-neon-pink transition-colors star-glow-on-hover rounded-lg px-2 py-1"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
              </svg>
              <span>Discord</span>
            </Link>
            <WalletButton />
          </nav>
        </div>
      </div>
    </header>
  )
}
