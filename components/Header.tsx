'use client'

import Link from 'next/link'
import { Book, Compass, Swords } from 'lucide-react'
import WalletButton from './WalletButton'

export default function Header() {
  const handleLogoClick = (e: React.MouseEvent) => {
    e.preventDefault()
    window.location.href = '/'
  }

  return (
    <header className="border-b border-feedgod-dark-accent bg-feedgod-dark-secondary/80 backdrop-blur-sm sticky top-0 z-50 w-full">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <a href="/" onClick={handleLogoClick} className="flex items-center gap-3 cursor-pointer">
              <span className="gradient-text lowercase" style={{ fontFamily: 'Arial, sans-serif', fontSize: '32px', fontWeight: '900', letterSpacing: '-2px' }}>feedgod. 🥕</span>
            </a>
            <span className="text-feedgod-dark-accent">/</span>
            <Link 
              href="https://switchboard.xyz" 
              target="_blank"
              className="pixel-font text-gray-400 lowercase hover:text-feedgod-primary transition-colors" 
              style={{ fontSize: '13px' }}
            >
              powered by Switchboard
            </Link>
          </div>

          <nav className="flex items-center gap-2">
            <Link
              href="/arena"
              prefetch={true}
              className="group flex items-center gap-2 text-sm text-gray-300 hover:text-feedgod-primary transition-colors rounded-lg px-3 py-2"
            >
              <Swords className="w-4 h-4 group-hover:text-feedgod-primary transition-colors" />
              <span>Arena</span>
            </Link>
            <Link
              href="/explore"
              prefetch={true}
              className="group flex items-center gap-2 text-sm text-gray-300 hover:text-feedgod-primary transition-colors rounded-lg px-3 py-2"
            >
              <Compass className="w-4 h-4 group-hover:text-feedgod-primary transition-colors" />
              <span>Explore</span>
            </Link>
            <Link
              href="/docs"
              prefetch={true}
              className="group flex items-center gap-2 text-sm text-gray-300 hover:text-feedgod-primary transition-colors rounded-lg px-3 py-2"
            >
              <Book className="w-4 h-4 group-hover:text-feedgod-primary transition-colors" />
              <span>Docs</span>
            </Link>
            
            <div className="w-px h-6 bg-feedgod-dark-accent mx-2" />
            
            <WalletButton />
          </nav>
        </div>
      </div>
    </header>
  )
}
