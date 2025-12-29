'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Github } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="border-t border-feedgod-pink-200 dark:border-feedgod-dark-accent bg-feedgod-pink-50/80 dark:bg-feedgod-dark-bg/80 backdrop-blur-sm mt-auto">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <Link
              href="https://switchboard.xyz"
              target="_blank"
              className="flex items-center gap-3 star-glow-on-hover"
            >
              <img
                src="/symbol-colored.svg"
                alt="Switchboard"
                width={32}
                height={32}
                className="flex-shrink-0"
              />
              <img
                src="/wordmark-white.svg"
                alt="Switchboard"
                width={120}
                height={24}
                className="flex-shrink-0 invert dark:invert-0"
              />
            </Link>
          </div>
          
          <div className="flex flex-col items-center md:items-end gap-3">
            <div className="flex items-center gap-4">
              <Link
                href="https://github.com/switchboard-xyz"
                target="_blank"
                className="flex items-center gap-2 text-sm text-feedgod-pink-500 dark:text-feedgod-neon-cyan hover:text-feedgod-primary dark:hover:text-feedgod-neon-pink transition-colors star-glow-on-hover"
              >
                <Github className="w-4 h-4" />
                <span>GitHub</span>
              </Link>
              <Link
                href="https://switchboard.xyz"
                target="_blank"
                className="text-sm text-feedgod-pink-500 dark:text-feedgod-neon-cyan hover:text-feedgod-primary dark:hover:text-feedgod-neon-pink transition-colors star-glow-on-hover"
              >
                switchboard.xyz
              </Link>
            </div>
            <Link
              href="https://x.com/melooox3"
              target="_blank"
              className="pixel-font text-feedgod-pink-400 dark:text-feedgod-neon-cyan lowercase text-xs hover:text-feedgod-primary dark:hover:text-feedgod-neon-pink transition-colors star-glow-on-hover"
              style={{ fontSize: '10px' }}
            >
              made by melo
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}

