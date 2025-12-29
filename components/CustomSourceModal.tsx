'use client'

import { useState } from 'react'
import { X, Plus } from 'lucide-react'
import { DataSource } from '@/types/feed'

interface CustomSourceModalProps {
  isOpen: boolean
  onClose: () => void
  onAdd: (source: DataSource) => void
}

export default function CustomSourceModal({ isOpen, onClose, onAdd }: CustomSourceModalProps) {
  const [name, setName] = useState('')
  const [url, setUrl] = useState('')
  const [type, setType] = useState<'api' | 'on-chain'>('api')

  if (!isOpen) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return

    const customSource: DataSource = {
      id: `custom-${Date.now()}`,
      name: name.trim(),
      type,
      url: url.trim() || undefined,
      enabled: true,
      weight: 1,
    }

    onAdd(customSource)
    setName('')
    setUrl('')
    setType('api')
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-feedgod-dark-secondary rounded-lg border border-feedgod-pink-200 dark:border-feedgod-dark-accent p-6 max-w-md w-full mx-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-feedgod-primary dark:text-feedgod-neon-pink">Add Custom Data Source</h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-feedgod-pink-100 rounded transition-colors star-glow"
          >
            <X className="w-4 h-4 text-feedgod-dark dark:text-feedgod-neon-cyan" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-feedgod-dark dark:text-feedgod-neon-cyan mb-2">
              Source Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-feedgod-pink-50 dark:bg-feedgod-dark-secondary border border-feedgod-pink-200 dark:border-feedgod-dark-accent rounded-lg px-4 py-2 text-feedgod-dark dark:text-feedgod-neon-cyan focus:outline-none focus:ring-2 focus:ring-feedgod-primary dark:focus:ring-feedgod-neon-pink"
              placeholder="My Custom API"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-feedgod-dark dark:text-feedgod-neon-cyan mb-2">
              Source Type
            </label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as 'api' | 'on-chain')}
              className="w-full bg-feedgod-pink-50 dark:bg-feedgod-dark-secondary border border-feedgod-pink-200 dark:border-feedgod-dark-accent rounded-lg px-4 py-2 text-feedgod-dark dark:text-feedgod-neon-cyan focus:outline-none focus:ring-2 focus:ring-feedgod-primary dark:focus:ring-feedgod-neon-pink"
            >
              <option value="api">API</option>
              <option value="on-chain">On-Chain</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-feedgod-dark dark:text-feedgod-neon-cyan mb-2">
              API URL (optional)
            </label>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="w-full bg-feedgod-pink-50 dark:bg-feedgod-dark-secondary border border-feedgod-pink-200 dark:border-feedgod-dark-accent rounded-lg px-4 py-2 text-feedgod-dark dark:text-feedgod-neon-cyan focus:outline-none focus:ring-2 focus:ring-feedgod-primary dark:focus:ring-feedgod-neon-pink"
              placeholder="https://api.example.com/price"
            />
            <p className="text-xs text-feedgod-pink-500 mt-1">
              Leave empty if using on-chain source
            </p>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-feedgod-pink-100 hover:bg-feedgod-pink-200 rounded-lg text-feedgod-dark text-sm font-medium transition-colors star-glow"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-feedgod-primary hover:bg-feedgod-secondary rounded-lg text-white text-sm font-medium transition-colors flex items-center justify-center gap-2 star-glow"
            >
              <Plus className="w-4 h-4" />
              Add Source
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

