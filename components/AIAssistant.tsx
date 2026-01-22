'use client'

import { useState, useRef, useEffect } from 'react'
import { Send, Sparkles, Loader2, CheckCircle2 } from 'lucide-react'
import { FeedConfig } from '@/types/feed'
import { generateFeedFromPrompt } from '@/lib/ai-assistant'

interface AIAssistantProps {
  onFeedGenerated: (config: FeedConfig) => void
  currentConfig: FeedConfig | null
}

export default function AIAssistant({ onFeedGenerated, currentConfig }: AIAssistantProps) {
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([
    {
      role: 'assistant',
      content: "Hi! I'm your AI assistant. I can help you create Switchboard feeds using natural language. Try saying something like 'Create a BTC/USD price feed using CoinGecko and Binance' or 'Build a SOL/USD feed with 1 minute updates'."
    }
  ])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    const userMessage = input.trim()
    setInput('')
    setMessages(prev => [...prev, { role: 'user', content: userMessage }])
    setIsLoading(true)

    try {
      const config = await generateFeedFromPrompt(userMessage)
      
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: `I've created a feed configuration for "${config.name}". Here's what I set up:\n\n- Symbol: ${config.symbol}\n- Data Sources: ${config.dataSources.length}\n- Update Interval: ${config.updateInterval}s\n- Aggregator: ${config.aggregator.type}\n\nYou can review and adjust the configuration in the builder panel.`
        }
      ])

      onFeedGenerated(config)
    } catch (error) {
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: `I encountered an error: ${error instanceof Error ? error.message : 'Unknown error'}. Could you try rephrasing your request?`
        }
      ])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="h-[calc(100vh-120px)] flex flex-col bg-feedgod-dark-secondary rounded-lg border border-feedgod-dark-secondaryer">
      <div className="p-4 border-b border-feedgod-dark-secondaryer">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-feedgod-primary" />
          <h2 className="text-lg font-semibold text-white">AI Assistant</h2>
        </div>
        <p className="text-xs text-gray-400 mt-1">
          Describe your feed in natural language
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message, idx) => (
          <div
            key={idx}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-lg px-4 py-2 ${
                message.role === 'user'
                  ? 'bg-feedgod-primary dark:text-feedgod-primary text-white'
                  : 'bg-feedgod-dark-secondaryer text-gray-300'
              }`}
            >
              <p className="text-sm whitespace-pre-wrap">{message.content}</p>
            </div>
          </div>
        ))}
        
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-feedgod-dark-secondaryer rounded-lg px-4 py-2">
              <Loader2 className="w-4 h-4 animate-spin text-feedgod-primary" />
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSubmit} className="p-4 border-t border-feedgod-dark-secondaryer">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Describe your feed..."
            className="flex-1 bg-feedgod-dark-secondaryer border border-feedgod-dark-secondaryer rounded-lg px-4 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-feedgod-primary dark:text-feedgod-primary"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="px-4 py-2 bg-feedgod-primary dark:text-feedgod-primary hover:bg-feedgod-primary dark:text-feedgod-primary/80 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors flex items-center gap-2 text-white text-sm font-medium"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Examples: "BTC/USD feed", "SOL price with 30s updates", "ETH/USD using multiple sources"
        </p>
      </form>
    </div>
  )
}




