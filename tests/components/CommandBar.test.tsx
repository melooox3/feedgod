import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import CommandBar from '@/components/navigation/CommandBar'

// Mock dependencies
vi.mock('@/lib/ai/ai-assistant-extended', () => ({
  generateFromPrompt: vi.fn().mockResolvedValue({
    name: 'Generated Feed',
    symbol: 'TEST/USD',
    dataSources: [],
    aggregator: { type: 'median' },
    updateInterval: 60,
    decimals: 8,
    blockchain: 'solana',
    network: 'mainnet',
    enabled: true,
  }),
}))

vi.mock('@/lib/ai/prompt-router', () => ({
  detectIntent: vi.fn().mockImplementation((query: string) => {
    if (query.includes('BTC') || query.includes('price')) {
      return { module: 'feed', label: 'Price Feed', icon: '\uD83D\uDCCA', parsed: {} }
    }
    if (query.includes('@')) {
      return { module: 'social', label: 'Social', icon: '\uD83D\uDC64', parsed: {} }
    }
    if (query.includes('weather') || query.includes('tokyo')) {
      return { module: 'weather', label: 'Weather', icon: '\u2600\uFE0F', parsed: {} }
    }
    return { module: 'feed', label: 'Price Feed', icon: '\uD83D\uDCCA', parsed: {} }
  }),
  EXAMPLE_PROMPTS: [
    { text: 'BTC price', icon: '\uD83D\uDCCA' },
    { text: '@elonmusk', icon: '\uD83D\uDC64' },
  ],
}))

vi.mock('@/lib/utils/sound-utils', () => ({
  playPickupSound: vi.fn(),
}))

vi.mock('@/lib/logger', () => ({
  logger: {
    api: {
      error: vi.fn(),
    },
  },
}))

describe('CommandBar', () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('renders with placeholder text', () => {
    render(<CommandBar />)

    expect(screen.getByPlaceholderText(/What do you want to oracle/)).toBeInTheDocument()
  })

  it('renders homepage placeholder when isHomepage is true', () => {
    render(<CommandBar isHomepage={true} />)

    expect(screen.getByPlaceholderText(/Try:/)).toBeInTheDocument()
  })

  it('renders tab-specific placeholder', () => {
    render(<CommandBar activeTab="feed" />)

    expect(screen.getByPlaceholderText(/Create a price feed/)).toBeInTheDocument()
  })

  it('handles input changes', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    render(<CommandBar isHomepage={true} />)

    const input = screen.getByRole('textbox')
    await user.type(input, 'BTC price')

    expect(input).toHaveValue('BTC price')
  })

  it('shows intent indicator on homepage when typing', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    render(<CommandBar isHomepage={true} />)

    const input = screen.getByRole('textbox')
    await user.type(input, 'BTC')

    expect(screen.getByText('Price Feed')).toBeInTheDocument()
  })

  it('detects social intent for @ mentions', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    render(<CommandBar isHomepage={true} />)

    const input = screen.getByRole('textbox')
    await user.type(input, '@elonmusk')

    expect(screen.getByText('Social')).toBeInTheDocument()
  })

  it('clears input when X button is clicked', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    render(<CommandBar activeTab="feed" />)

    const input = screen.getByRole('textbox')
    await user.type(input, 'test query')

    expect(input).toHaveValue('test query')

    // Find and click the clear button
    const clearButton = screen.getByRole('button')
    await user.click(clearButton)

    expect(input).toHaveValue('')
  })

  it('calls onModuleNavigate on homepage submit', async () => {
    const onModuleNavigate = vi.fn()
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })

    render(<CommandBar isHomepage={true} onModuleNavigate={onModuleNavigate} />)

    const input = screen.getByRole('textbox')
    await user.type(input, 'BTC price{Enter}')

    await act(async () => {
      vi.advanceTimersByTime(500)
    })

    expect(onModuleNavigate).toHaveBeenCalledWith('feed', expect.any(Object))
  })

  it('calls onSearch for search queries', async () => {
    const onSearch = vi.fn()
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })

    render(<CommandBar activeTab="feed" onSearch={onSearch} />)

    const input = screen.getByRole('textbox')
    await user.type(input, 'search bitcoin{Enter}')

    await act(async () => {
      vi.advanceTimersByTime(100)
    })

    expect(onSearch).toHaveBeenCalledWith('bitcoin')
  })

  it('shows example prompts when showExamples is true', () => {
    render(<CommandBar showExamples={true} />)

    expect(screen.getByText('BTC price')).toBeInTheDocument()
  })

  it('shows example prompts on homepage', () => {
    render(<CommandBar isHomepage={true} />)

    expect(screen.getByText('BTC price')).toBeInTheDocument()
    expect(screen.getByText('@elonmusk')).toBeInTheDocument()
  })

  it('fills input when example is clicked', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    render(<CommandBar isHomepage={true} />)

    await user.click(screen.getByText('BTC price'))

    const input = screen.getByRole('textbox')
    expect(input).toHaveValue('BTC price')
  })

  it('shows loading indicator during submission', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    render(<CommandBar isHomepage={true} onModuleNavigate={vi.fn()} />)

    const input = screen.getByRole('textbox')
    await user.type(input, 'BTC{Enter}')

    expect(screen.getByText(/Routing to/)).toBeInTheDocument()
  })

  it('disables input during loading', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    render(<CommandBar isHomepage={true} onModuleNavigate={vi.fn()} />)

    const input = screen.getByRole('textbox')
    await user.type(input, 'BTC{Enter}')

    expect(input).toBeDisabled()
  })

  describe('keyboard shortcuts', () => {
    it('focuses input on Cmd+K', async () => {
      render(<CommandBar />)

      const input = screen.getByRole('textbox')

      fireEvent.keyDown(window, { key: 'k', metaKey: true })

      expect(document.activeElement).toBe(input)
    })

    it('clears input on Escape', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
      render(<CommandBar />)

      const input = screen.getByRole('textbox')
      await user.type(input, 'test')

      fireEvent.keyDown(window, { key: 'Escape' })

      expect(input).toHaveValue('')
    })
  })
})
