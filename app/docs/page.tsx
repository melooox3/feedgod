'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Link from 'next/link'
import { 
  Menu, 
  X, 
  ChevronDown, 
  ChevronRight,
  Book,
  Boxes,
  Rocket,
  Database,
  Target,
  Cloud,
  Trophy,
  Users,
  Globe,
  Swords,
  HelpCircle,
  Code,
  FileText,
  DollarSign,
  MessageCircle,
  ExternalLink,
  ArrowLeft,
  Copy,
  Check,
  Coins,
  Shield,
  Flame,
  ArrowRightLeft,
  Percent,
  TrendingUp,
  Lock,
  Zap,
  AlertTriangle,
  Info
} from 'lucide-react'
import Header from '@/components/Header'

// Navigation structure
const NAV_SECTIONS = [
  { 
    id: 'overview', 
    title: 'Overview', 
    icon: Book,
  },
  {
    id: 'products',
    title: 'Products',
    icon: Boxes,
    children: [
      { id: 'oracle-builder', title: 'Oracle Builder' },
      { id: 'feedgod-arena', title: 'FeedGod Arena' },
    ]
  },
  {
    id: 'getting-started',
    title: 'Getting Started',
    icon: Rocket,
  },
  {
    id: 'tokenomics',
    title: 'Tokenomics',
    icon: Coins,
    children: [
      { id: 'usdc-betting', title: 'USDC Betting System' },
      { id: 'protocol-fees', title: 'Protocol Fees' },
      { id: 'swtch-burns', title: '$SWTCH Burns' },
      { id: 'revenue-model', title: 'Revenue Model' },
    ]
  },
  {
    id: 'oracle-types',
    title: 'Oracle Types',
    icon: Database,
    children: [
      { id: 'price-feeds', title: 'Price Feeds' },
      { id: 'prediction-markets', title: 'Prediction Markets' },
      { id: 'weather-oracles', title: 'Weather' },
      { id: 'sports-oracles', title: 'Sports' },
      { id: 'social-oracles', title: 'Social' },
      { id: 'custom-api', title: 'Custom API' },
    ]
  },
  {
    id: 'arena',
    title: 'Arena Mechanics',
    icon: Swords,
    children: [
      { id: 'how-betting-works', title: 'How Betting Works' },
      { id: 'payout-structure', title: 'Payout Structure' },
      { id: 'parimutuel-system', title: 'Parimutuel System' },
      { id: 'leaderboard', title: 'Leaderboard' },
      { id: 'market-categories', title: 'Markets' },
      { id: 'curated-markets', title: 'Curated Markets' },
      { id: 'deposits-withdrawals', title: 'Deposits & Withdrawals' },
    ]
  },
  {
    id: 'security',
    title: 'Security & Trust',
    icon: Shield,
  },
  {
    id: 'technical-integration',
    title: 'Technical Integration',
    icon: Code,
  },
  {
    id: 'smart-contracts',
    title: 'Smart Contracts',
    icon: FileText,
  },
  {
    id: 'fees',
    title: 'Fee Structure',
    icon: DollarSign,
  },
  {
    id: 'faq',
    title: 'FAQ',
    icon: HelpCircle,
  },
  {
    id: 'support',
    title: 'Support',
    icon: MessageCircle,
  },
]

function CodeBlock({ code, language = 'typescript' }: { code: string; language?: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="relative group">
      <pre className="bg-[#1a1b16] border border-[#3a3b35] rounded-md p-3 overflow-x-auto text-xs">
        <code className="text-gray-400">{code}</code>
      </pre>
      <button
        onClick={handleCopy}
        className="absolute top-2 right-2 p-1.5 bg-[#252620] hover:bg-[#3a3b35] rounded transition-colors opacity-0 group-hover:opacity-100"
      >
        {copied ? (
          <Check className="w-3.5 h-3.5 text-green-400" />
        ) : (
          <Copy className="w-3.5 h-3.5 text-gray-500" />
        )}
      </button>
    </div>
  )
}

function InfoBox({ title, children, variant = 'info' }: { title?: string; children: React.ReactNode; variant?: 'info' | 'warning' | 'success' }) {
  const colors = {
    info: 'bg-blue-500/5 border-blue-500/20 text-blue-400',
    warning: 'bg-yellow-500/5 border-yellow-500/20 text-yellow-400',
    success: 'bg-green-500/5 border-green-500/20 text-green-400',
  }
  const icons = {
    info: Info,
    warning: AlertTriangle,
    success: Check,
  }
  const Icon = icons[variant]

  return (
    <div className={`${colors[variant]} border rounded-md p-3 mb-3`}>
      <div className="flex items-start gap-2.5">
        <Icon className="w-4 h-4 flex-shrink-0 mt-0.5" />
        <div>
          {title && <p className="font-medium text-sm mb-0.5">{title}</p>}
          <div className="text-xs opacity-90">{children}</div>
        </div>
      </div>
    </div>
  )
}

export default function DocsPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [activeSection, setActiveSection] = useState('overview')
  const [expandedSections, setExpandedSections] = useState<string[]>(['products', 'tokenomics', 'oracle-types', 'arena'])
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Track scroll position to highlight active section (throttled)
  useEffect(() => {
    const handleScroll = () => {
      // Throttle scroll handler to run at most every 100ms
      if (scrollTimeoutRef.current) return
      
      scrollTimeoutRef.current = setTimeout(() => {
        const sections = document.querySelectorAll('[data-section]')
        let current = 'overview'
        
        sections.forEach((section) => {
          const rect = section.getBoundingClientRect()
          if (rect.top <= 100) {
            current = section.getAttribute('data-section') || current
          }
        })
        
        setActiveSection(current)
        scrollTimeoutRef.current = null
      }, 100)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', handleScroll)
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current)
      }
    }
  }, [])

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => 
      prev.includes(sectionId) 
        ? prev.filter(id => id !== sectionId)
        : [...prev, sectionId]
    )
  }

  const scrollToSection = (sectionId: string) => {
    const element = document.querySelector(`[data-section="${sectionId}"]`)
    if (element) {
      const offset = 80
      const elementPosition = element.getBoundingClientRect().top + window.pageYOffset
      window.scrollTo({ top: elementPosition - offset, behavior: 'smooth' })
    }
    setSidebarOpen(false)
  }

  return (
    <div className="min-h-screen bg-[#1D1E19]">
      <Header />
      
      {/* Mobile Menu Button */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="lg:hidden fixed bottom-5 right-5 z-50 w-11 h-11 bg-feedgod-primary rounded-full flex items-center justify-center shadow-md"
      >
        {sidebarOpen ? (
          <X className="w-5 h-5 text-white" />
        ) : (
          <Menu className="w-5 h-5 text-white" />
        )}
      </button>

      <div className="flex max-w-7xl mx-auto px-4">
        {/* Sidebar */}
        <aside className={`
          fixed lg:sticky top-[73px] left-0 h-[calc(100vh-73px)] w-64 flex-shrink-0 bg-[#1D1E19] border-r border-[#3a3b35]
          transform transition-transform duration-300 z-40 overflow-y-auto
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}>
          <nav className="p-3 space-y-0.5">
            {NAV_SECTIONS.map((section) => {
              const Icon = section.icon
              const hasChildren = section.children && section.children.length > 0
              const isExpanded = expandedSections.includes(section.id)
              const isActive = activeSection === section.id || 
                section.children?.some(child => activeSection === child.id)

              return (
                <div key={section.id}>
                  <button
                    onClick={() => {
                      if (hasChildren) {
                        toggleSection(section.id)
                      } else {
                        scrollToSection(section.id)
                      }
                    }}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors ${
                      isActive
                        ? 'bg-[#252620] text-white'
                        : 'text-gray-500 hover:text-gray-300 hover:bg-[#252620]'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <Icon className="w-3.5 h-3.5" />
                      {section.title}
                    </span>
                    {hasChildren && (
                      isExpanded ? (
                        <ChevronDown className="w-3.5 h-3.5" />
                      ) : (
                        <ChevronRight className="w-3.5 h-3.5" />
                      )
                    )}
                  </button>

                  {hasChildren && isExpanded && (
                    <div className="ml-6 mt-0.5 space-y-0.5 border-l border-[#3a3b35] pl-2.5">
                      {section.children.map((child) => (
                        <button
                          key={child.id}
                          onClick={() => scrollToSection(child.id)}
                          className={`w-full text-left px-2 py-1 rounded text-[11px] transition-colors ${
                            activeSection === child.id
                              ? 'text-feedgod-primary'
                              : 'text-gray-600 hover:text-gray-300'
                          }`}
                        >
                          {child.title}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </nav>

          {/* Sidebar Footer */}
          <div className="p-3 border-t border-[#3a3b35]">
            <a
              href="https://docs.switchboard.xyz"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-[11px] text-gray-500 hover:text-feedgod-primary transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Switchboard Docs
            </a>
          </div>
        </aside>

        {/* Backdrop for mobile */}
        {sidebarOpen && (
          <div 
            className="fixed inset-0 bg-black/50 z-30 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Main Content - centered in remaining space */}
        <main className="flex-1 min-w-0 flex justify-center py-6 px-4 lg:px-6">
          <article className="max-w-[700px] w-full">
            {/* Back to Home */}
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-feedgod-primary transition-colors mb-6"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Back to FeedGod
            </Link>

          {/* Overview */}
          <section data-section="overview" className="mb-12">
            <h1 className="text-2xl font-semibold text-white mb-3">FeedGod Documentation</h1>
            <p className="text-sm text-gray-400 mb-4 leading-relaxed">
              FeedGod is the universal oracle factory for Solana. Create any data feed, prediction market oracle, or custom data source — no code required. Built on Switchboard's decentralized oracle infrastructure.
            </p>
            
            <InfoBox variant="info" title="What makes FeedGod unique?">
              <ul className="space-y-1">
                <li>• <strong>No-code oracle creation</strong> — Deploy oracles in minutes, not weeks</li>
                <li>• <strong>USDC-based Arena</strong> — Bet with stable value, no volatility risk</li>
                <li>• <strong>Deflationary $SWTCH</strong> — Protocol fees buy and burn $SWTCH</li>
                <li>• <strong>Fully transparent</strong> — All operations are on-chain and verifiable</li>
              </ul>
            </InfoBox>

            <div className="flex gap-2">
              <Link
                href="/"
                className="px-3.5 py-1.5 bg-feedgod-primary hover:bg-feedgod-primary/90 rounded-md text-white text-xs font-medium transition-colors"
              >
                Launch App
              </Link>
              <Link
                href="/arena"
                className="px-3.5 py-1.5 bg-[#252620] hover:bg-[#2a2b25] rounded-md text-white text-xs font-medium transition-colors"
              >
                Enter Arena
              </Link>
            </div>
          </section>

          {/* Products */}
          <section data-section="products" className="mb-12">
            <h2 className="text-lg font-semibold text-white mb-4">Products</h2>
            
            <div data-section="oracle-builder" className="mb-6">
              <h3 className="text-base font-medium text-white mb-2">Oracle Builder</h3>
              <p className="text-gray-500 text-sm mb-3">Create custom oracle feeds for any data source:</p>
              <ul className="space-y-1.5 text-gray-500 text-xs">
                <li className="flex items-start gap-1.5">
                  <span className="text-feedgod-primary">•</span>
                  <span><strong className="text-gray-300">Price Feeds</strong> — Crypto prices from multiple exchanges</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="text-feedgod-primary">•</span>
                  <span><strong className="text-gray-300">Prediction Markets</strong> — Polymarket and Kalshi resolution oracles</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="text-feedgod-primary">•</span>
                  <span><strong className="text-gray-300">Weather Oracles</strong> — Temperature, precipitation, humidity for 50+ cities</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="text-feedgod-primary">•</span>
                  <span><strong className="text-gray-300">Sports Oracles</strong> — Game outcomes, scores, and statistics</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="text-feedgod-primary">•</span>
                  <span><strong className="text-gray-300">Social Oracles</strong> — Twitter followers, YouTube subscribers</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="text-feedgod-primary">•</span>
                  <span><strong className="text-gray-300">Custom API Oracles</strong> — Connect any JSON API endpoint</span>
                </li>
              </ul>
            </div>

            <div data-section="feedgod-arena" className="mb-6">
              <h3 className="text-base font-medium text-white mb-2">FeedGod Arena</h3>
              <p className="text-gray-500 text-sm mb-3">
                A prediction game where users wager USDC on real-world outcomes.
              </p>
              <div className="bg-[#252620] rounded-md p-3 border border-[#3a3b35]">
                <p className="text-xs font-medium text-gray-300 mb-1.5">How it works:</p>
                <ol className="list-decimal list-inside space-y-0.5 text-[11px] text-gray-500">
                  <li>Connect your Solana wallet</li>
                  <li>Deposit USDC (stablecoin — no volatility)</li>
                  <li>Browse available markets</li>
                  <li>Predict UP or DOWN on any market</li>
                  <li>Win up to ~1.9x your wager if correct</li>
                  <li>Withdraw winnings in USDC anytime</li>
                </ol>
              </div>
            </div>
          </section>

          {/* Getting Started */}
          <section data-section="getting-started" className="mb-12">
            <h2 className="text-lg font-semibold text-white mb-4">Getting Started</h2>
            
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-white mb-2">Creating an Oracle</h3>
                <ol className="list-decimal list-inside space-y-1 text-xs text-gray-500">
                  <li>Visit <a href="/" className="text-feedgod-primary hover:underline">feedgod.vercel.app</a></li>
                  <li>Connect your Solana wallet</li>
                  <li>Select a module (Price Feed, Prediction Market, etc.)</li>
                  <li>Configure your oracle parameters</li>
                  <li>Click Deploy and sign the transaction</li>
                  <li>Copy the public key for integration</li>
                </ol>
              </div>

              <div>
                <h3 className="text-sm font-medium text-white mb-2">Using FeedGod Arena</h3>
                <ol className="list-decimal list-inside space-y-1 text-xs text-gray-500">
                  <li>Visit <a href="/arena" className="text-feedgod-primary hover:underline">feedgod.vercel.app/arena</a></li>
                  <li>Connect your wallet and deposit USDC</li>
                  <li>Browse markets and make predictions</li>
                  <li>Withdraw winnings anytime</li>
                </ol>
              </div>
            </div>
          </section>

          {/* TOKENOMICS - NEW COMPREHENSIVE SECTION */}
          <section data-section="tokenomics" className="mb-12">
            <h2 className="text-lg font-semibold text-white mb-2">Tokenomics</h2>
            <p className="text-sm text-gray-500 mb-4">
              FeedGod Arena uses a unique economic model designed for player safety and $SWTCH value accrual.
            </p>

            <InfoBox variant="success" title="Key Benefits">
              <ul className="space-y-1">
                <li><strong>For Players:</strong> Bet with USDC — no exposure to crypto volatility during your bet</li>
                <li><strong>For $SWTCH Holders:</strong> Protocol fees create constant buy pressure and token burns</li>
                <li><strong>For Switchboard:</strong> Sustainable revenue from betting volume</li>
              </ul>
            </InfoBox>

            <div data-section="usdc-betting" className="mb-6">
              <h3 className="text-sm font-medium text-white mb-2 flex items-center gap-1.5">
                <DollarSign className="w-4 h-4 text-green-400" />
                USDC Betting System
              </h3>
              <p className="text-xs text-gray-500 mb-3">
                All betting in FeedGod Arena happens in <strong className="text-gray-300">USDC</strong>, the most trusted stablecoin.
              </p>
              
              <div className="bg-[#252620] border border-[#3a3b35] rounded-md p-3 mb-3">
                <h4 className="font-medium text-gray-300 text-xs mb-2">Why USDC instead of $SWTCH?</h4>
                <div className="grid md:grid-cols-2 gap-3 text-[11px]">
                  <div>
                    <p className="text-gray-500 mb-1"><strong className="text-gray-400">With volatile tokens:</strong></p>
                    <ul className="text-gray-600 space-y-0.5">
                      <li>• Bet 100 $SWTCH @ $1</li>
                      <li>• Win 190 $SWTCH payout</li>
                      <li>• Token drops 30%</li>
                      <li className="text-red-400">• Won but lost money</li>
                    </ul>
                  </div>
                  <div>
                    <p className="text-gray-500 mb-1"><strong className="text-gray-400">With USDC:</strong></p>
                    <ul className="text-gray-600 space-y-0.5">
                      <li>• Bet $100 USDC</li>
                      <li>• Win $190 USDC</li>
                      <li>• Value stays stable</li>
                      <li className="text-green-400">• Actually won $90!</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="bg-[#252620] rounded-md p-3 border border-[#3a3b35]">
                <p className="font-medium text-gray-300 text-xs mb-2">How deposits work:</p>
                <ol className="list-decimal list-inside text-[11px] text-gray-500 space-y-1">
                  <li><strong className="text-gray-400">Deposit USDC</strong> — Send from wallet to Arena</li>
                  <li><strong className="text-gray-400">Place bets in USDC</strong> — All wagers in USDC</li>
                  <li><strong className="text-gray-400">Winnings in USDC</strong> — Stable payouts</li>
                  <li><strong className="text-gray-400">Withdraw anytime</strong> — No lockup</li>
                </ol>
              </div>
            </div>

            <div data-section="protocol-fees" className="mb-6">
              <h3 className="text-sm font-medium text-white mb-2 flex items-center gap-1.5">
                <Percent className="w-4 h-4 text-yellow-400" />
                Protocol Fees
              </h3>
              <p className="text-xs text-gray-500 mb-3">
                FeedGod Arena charges a <strong className="text-gray-300">5% fee on the winning pool</strong> when markets resolve.
              </p>

              <div className="flex items-center gap-2 text-[11px] mb-3">
                <div className="flex-1 bg-[#252620] rounded-md p-2.5 border border-[#3a3b35] text-center">
                  <p className="text-lg font-semibold text-feedgod-primary">5%</p>
                  <p className="text-gray-600 text-[10px]">Protocol Fee</p>
                </div>
                <ArrowRightLeft className="w-4 h-4 text-gray-600" />
                <div className="flex-1 bg-[#252620] rounded-md p-2.5 border border-[#3a3b35] text-center">
                  <p className="text-lg font-semibold text-green-400">0%</p>
                  <p className="text-gray-600 text-[10px]">Deposit Fee</p>
                </div>
                <ArrowRightLeft className="w-4 h-4 text-gray-600" />
                <div className="flex-1 bg-[#252620] rounded-md p-2.5 border border-[#3a3b35] text-center">
                  <p className="text-lg font-semibold text-green-400">0%</p>
                  <p className="text-gray-600 text-[10px]">Withdrawal</p>
                </div>
              </div>
            </div>

            <div data-section="swtch-burns" className="mb-6">
              <h3 className="text-sm font-medium text-white mb-2 flex items-center gap-1.5">
                <Flame className="w-4 h-4 text-orange-400" />
                $SWTCH Burns
              </h3>
              <p className="text-xs text-gray-500 mb-3">
                All protocol fees <strong className="text-gray-300">buy and burn $SWTCH</strong>, creating deflationary pressure.
              </p>
              
              <div className="bg-[#252620] border border-[#3a3b35] rounded-md p-3 mb-3">
                <h4 className="font-medium text-gray-300 text-xs mb-2">How it works:</h4>
                <div className="flex items-center gap-2 text-[10px]">
                  <div className="flex-1 bg-[#1D1E19] rounded p-2 text-center">
                    <DollarSign className="w-4 h-4 text-green-400 mx-auto mb-0.5" />
                    <p className="text-gray-300 font-medium">5% Fee</p>
                  </div>
                  <ArrowRightLeft className="w-3.5 h-3.5 text-gray-600" />
                  <div className="flex-1 bg-[#1D1E19] rounded p-2 text-center">
                    <ArrowRightLeft className="w-4 h-4 text-blue-400 mx-auto mb-0.5" />
                    <p className="text-gray-300 font-medium">Jupiter</p>
                  </div>
                  <ArrowRightLeft className="w-3.5 h-3.5 text-gray-600" />
                  <div className="flex-1 bg-[#1D1E19] rounded p-2 text-center">
                    <Flame className="w-4 h-4 text-orange-400 mx-auto mb-0.5" />
                    <p className="text-gray-300 font-medium">Burn</p>
                  </div>
                </div>
              </div>

              <InfoBox variant="info" title="Why burn?">
                <p>Burning permanently removes tokens from circulation, creating scarcity and benefiting $SWTCH holders.</p>
              </InfoBox>
            </div>

            <div data-section="revenue-model" className="mb-6">
              <h3 className="text-sm font-medium text-white mb-2 flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4 text-green-400" />
                Revenue Model
              </h3>
              <p className="text-xs text-gray-500 mb-3">
                Sustainable revenue through betting volume:
              </p>
              
              <div className="bg-[#252620] rounded-md p-3 border border-[#3a3b35] mb-3">
                <div className="space-y-2">
                  {[
                    { num: '1', color: 'green', title: 'Users bet USDC', desc: 'Stable value' },
                    { num: '2', color: 'yellow', title: '5% fee on winnings', desc: 'From successful predictions' },
                    { num: '3', color: 'blue', title: 'Fees buy $SWTCH', desc: 'Creates buy pressure' },
                    { num: '4', color: 'orange', title: '$SWTCH burned', desc: 'Reduces supply' },
                  ].map((step) => (
                    <div key={step.num} className="flex items-center gap-2">
                      <div className={`w-5 h-5 rounded-full bg-${step.color}-500/20 flex items-center justify-center flex-shrink-0`}>
                        <span className={`text-${step.color}-400 text-[10px] font-semibold`}>{step.num}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-gray-300 text-xs">{step.title}</p>
                        <span className="text-[10px] text-gray-600">— {step.desc}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="bg-[#252620] rounded-md p-2.5 border border-[#3a3b35] text-center">
                  <p className="text-lg font-semibold text-white">$1M</p>
                  <p className="text-[9px] text-gray-600">= $50K burned</p>
                </div>
                <div className="bg-[#252620] rounded-md p-2.5 border border-[#3a3b35] text-center">
                  <p className="text-lg font-semibold text-white">$10M</p>
                  <p className="text-[9px] text-gray-600">= $500K burned</p>
                </div>
                <div className="bg-[#252620] rounded-md p-2.5 border border-[#3a3b35] text-center">
                  <p className="text-lg font-semibold text-white">$100M</p>
                  <p className="text-[9px] text-gray-600">= $5M burned</p>
                </div>
              </div>
            </div>
          </section>

          {/* Oracle Types */}
          <section data-section="oracle-types" className="mb-12">
            <h2 className="text-lg font-semibold text-white mb-4">Oracle Types</h2>

            <div data-section="price-feeds" className="mb-5">
              <h3 className="text-sm font-medium text-white mb-2">Price Feeds</h3>
              <p className="text-xs text-gray-500 mb-3">Create reliable price feeds for any cryptocurrency.</p>
              
              <div className="grid md:grid-cols-2 gap-2 mb-3">
                <div className="bg-[#252620] rounded-md p-2.5 border border-[#3a3b35]">
                  <p className="text-xs font-medium text-gray-300 mb-1.5">Data Sources</p>
                  <ul className="text-[11px] text-gray-500 space-y-0.5">
                    <li>• CoinGecko, Binance, Coinbase</li>
                    <li>• Kraken, Pyth, Custom APIs</li>
                  </ul>
                </div>
                <div className="bg-[#252620] rounded-md p-2.5 border border-[#3a3b35]">
                  <p className="text-xs font-medium text-gray-300 mb-1.5">Configuration</p>
                  <ul className="text-[11px] text-gray-500 space-y-0.5">
                    <li>• Token pair, update interval</li>
                    <li>• Aggregation, deviation threshold</li>
                  </ul>
                </div>
              </div>
            </div>

            <div data-section="prediction-markets" className="mb-5">
              <h3 className="text-sm font-medium text-white mb-2">Prediction Market Oracles</h3>
              <p className="text-xs text-gray-500 mb-2">Resolve prediction market outcomes on-chain. Platforms: Polymarket, Kalshi</p>
            </div>

            <div data-section="weather-oracles" className="mb-5">
              <h3 className="text-sm font-medium text-white mb-2">Weather Oracles</h3>
              <p className="text-xs text-gray-500 mb-2">Verified weather data for 50+ cities via Open-Meteo API.</p>
              <div className="flex flex-wrap gap-1.5">
                {['Temperature', 'Precipitation', 'Humidity', 'Wind'].map(metric => (
                  <span key={metric} className="px-2 py-0.5 bg-[#252620] rounded text-[10px] text-gray-500">
                    {metric}
                  </span>
                ))}
              </div>
            </div>

            <div data-section="sports-oracles" className="mb-5">
              <h3 className="text-sm font-medium text-white mb-2">Sports Oracles</h3>
              <p className="text-xs text-gray-500 mb-2">Game outcomes for major leagues.</p>
              <div className="flex flex-wrap gap-1.5">
                {['NBA', 'NFL', 'Premier League', 'CS2', 'Dota 2'].map(league => (
                  <span key={league} className="px-2 py-0.5 bg-[#252620] border border-[#3a3b35] rounded text-[10px] text-gray-500">
                    {league}
                  </span>
                ))}
              </div>
            </div>

            <div data-section="social-oracles" className="mb-5">
              <h3 className="text-sm font-medium text-white mb-2">Social Oracles</h3>
              <p className="text-xs text-gray-500 mb-2">Track social media metrics: Twitter/X, YouTube, TikTok, Discord</p>
            </div>

            <div data-section="custom-api" className="mb-5">
              <h3 className="text-sm font-medium text-white mb-2">Custom API Oracles</h3>
              <p className="text-xs text-gray-500 mb-2">Connect any JSON API endpoint. Supports GET requests, custom headers, JSON path selection.</p>
            </div>
          </section>

          {/* Arena Mechanics */}
          <section data-section="arena" className="mb-12">
            <h2 className="text-lg font-semibold text-white mb-4">FeedGod Arena Mechanics</h2>
            <p className="text-xs text-gray-500 mb-4">
              Prediction game where users wager USDC on real-world data outcomes — from Amazon prices to Steam player counts.
            </p>

            <div data-section="how-betting-works" className="mb-5">
              <h3 className="text-sm font-medium text-white mb-2">How Betting Works</h3>
              <ol className="list-decimal list-inside space-y-1 text-xs text-gray-500">
                <li><strong className="text-gray-400">Choose a market</strong> — Browse categories</li>
                <li><strong className="text-gray-400">Predict</strong> — Will value go UP or DOWN?</li>
                <li><strong className="text-gray-400">Set wager</strong> — $1 - $1000 USDC</li>
                <li><strong className="text-gray-400">Wait</strong> — Markets resolve hourly/daily</li>
                <li><strong className="text-gray-400">Collect</strong> — Winners split pool</li>
              </ol>
            </div>

            <div data-section="payout-structure" className="mb-5">
              <h3 className="text-sm font-medium text-white mb-2">Payout Structure</h3>
              <p className="text-xs text-gray-500 mb-2">Arena uses a <strong className="text-gray-400">parimutuel pool</strong> system. All wagers go into a shared pool, winners split proportionally, 5% fee is deducted.</p>
            </div>

            <div data-section="parimutuel-system" className="mb-5">
              <h3 className="text-sm font-medium text-white mb-2">Parimutuel System</h3>
              
              <InfoBox variant="info" title="How it works">
                <p>All bets pooled together, winners split the total. Fewer people on your side = higher payout!</p>
              </InfoBox>
              
              <div className="grid grid-cols-2 gap-2 mt-3">
                <div className="bg-red-500/5 border border-red-500/20 rounded-md p-2.5 text-center">
                  <p className="text-[10px] text-red-400 mb-0.5">Crowded side</p>
                  <p className="text-base font-semibold text-white">~1.2x</p>
                </div>
                <div className="bg-green-500/5 border border-green-500/20 rounded-md p-2.5 text-center">
                  <p className="text-[10px] text-green-400 mb-0.5">Contrarian</p>
                  <p className="text-base font-semibold text-white">~5x+</p>
                </div>
              </div>
            </div>

            <div data-section="leaderboard" className="mb-5">
              <h3 className="text-sm font-medium text-white mb-2">Leaderboard</h3>
              <p className="text-xs text-gray-500 mb-2">Ranked by Points: wins (100pts), streaks (+25), volume (0.1pts/$1)</p>
            </div>

            <div data-section="market-categories" className="mb-5">
              <h3 className="text-sm font-medium text-white mb-2">Market Categories</h3>
              <div className="grid grid-cols-3 gap-1.5">
                {[
                  { name: 'Shopping', icon: '🛒' },
                  { name: 'Gaming', icon: '🎮' },
                  { name: 'Travel', icon: '✈️' },
                  { name: 'Weather', icon: '🌤️' },
                  { name: 'Social', icon: '👥' },
                  { name: 'Food', icon: '🍔' },
                ].map(category => (
                  <div key={category.name} className="bg-[#252620] rounded-md p-2 border border-[#3a3b35] text-center">
                    <span className="text-sm">{category.icon}</span>
                    <p className="text-[10px] text-gray-500">{category.name}</p>
                  </div>
                ))}
              </div>
            </div>

            <div data-section="curated-markets" className="mb-5">
              <h3 className="text-sm font-medium text-white mb-2 flex items-center gap-1.5">
                <Shield className="w-4 h-4 text-green-400" />
                Curated Markets
              </h3>
              <p className="text-xs text-gray-500 mb-2">
                All markets are <strong className="text-gray-400">manually verified</strong> to prevent manipulation. Data from trusted APIs only.
              </p>
              
              <div className="flex flex-wrap gap-1.5 mb-3">
                {['CoinGecko', 'Steam API', 'Open-Meteo', 'ESPN'].map(source => (
                  <span key={source} className="bg-[#252620] rounded px-2 py-0.5 text-[10px] text-gray-500">
                    {source}
                  </span>
                ))}
              </div>
              
              <InfoBox variant="warning">
                Custom oracle feeds you create don't appear in Arena — this protects users from manipulation.
              </InfoBox>
            </div>

            <div data-section="deposits-withdrawals" className="mb-5">
              <h3 className="text-sm font-medium text-white mb-2">Deposits & Withdrawals</h3>
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-[#252620] rounded-md p-2.5 border border-[#3a3b35]">
                  <p className="font-medium text-gray-300 text-xs mb-1 flex items-center gap-1.5">
                    <TrendingUp className="w-3.5 h-3.5 text-green-400" />
                    Deposit
                  </p>
                  <p className="text-[10px] text-gray-600">No fees, instant balance</p>
                </div>
                <div className="bg-[#252620] rounded-md p-2.5 border border-[#3a3b35]">
                  <p className="font-medium text-gray-300 text-xs mb-1 flex items-center gap-1.5">
                    <DollarSign className="w-3.5 h-3.5 text-blue-400" />
                    Withdraw
                  </p>
                  <p className="text-[10px] text-gray-600">No lockup, gas only</p>
                </div>
              </div>
            </div>
          </section>

          {/* Security */}
          <section data-section="security" className="mb-12">
            <h2 className="text-lg font-semibold text-white mb-4">Security & Trust</h2>
            
            <div className="grid grid-cols-2 gap-2 mb-3">
              <div className="bg-[#252620] rounded-md p-2.5 border border-[#3a3b35]">
                <div className="flex items-center gap-2 mb-1">
                  <Lock className="w-3.5 h-3.5 text-green-400" />
                  <p className="text-xs font-medium text-gray-300">Non-Custodial</p>
                </div>
                <p className="text-[10px] text-gray-600">Smart contract holds funds</p>
              </div>
              <div className="bg-[#252620] rounded-md p-2.5 border border-[#3a3b35]">
                <div className="flex items-center gap-2 mb-1">
                  <Shield className="w-3.5 h-3.5 text-blue-400" />
                  <p className="text-xs font-medium text-gray-300">Audited</p>
                </div>
                <p className="text-[10px] text-gray-600">Switchboard TEE security</p>
              </div>
              <div className="bg-[#252620] rounded-md p-2.5 border border-[#3a3b35]">
                <div className="flex items-center gap-2 mb-1">
                  <Globe className="w-3.5 h-3.5 text-purple-400" />
                  <p className="text-xs font-medium text-gray-300">Decentralized</p>
                </div>
                <p className="text-[10px] text-gray-600">Multiple data sources</p>
              </div>
              <div className="bg-[#252620] rounded-md p-2.5 border border-[#3a3b35]">
                <div className="flex items-center gap-2 mb-1">
                  <Zap className="w-3.5 h-3.5 text-yellow-400" />
                  <p className="text-xs font-medium text-gray-300">Instant</p>
                </div>
                <p className="text-[10px] text-gray-600">On-chain settlement</p>
              </div>
            </div>

            <InfoBox variant="warning" title="Risk">
              <p>Betting involves risk of loss. Only bet what you can afford to lose.</p>
            </InfoBox>
          </section>

          {/* Technical Integration */}
          <section data-section="technical-integration" className="mb-12">
            <h2 className="text-lg font-semibold text-white mb-4">Technical Integration</h2>

            <div className="mb-4">
              <h3 className="text-xs font-medium text-gray-400 mb-2">JavaScript/TypeScript</h3>
              <CodeBlock code={`import { PullFeed } from "@switchboard-xyz/on-demand";
const feed = new PullFeed(program, feedPubkey);
const [value, slot] = await feed.loadValue();`} />
            </div>

            <div className="mb-4">
              <h3 className="text-xs font-medium text-gray-400 mb-2">Rust/Anchor</h3>
              <CodeBlock code={`use switchboard_on_demand::PullFeedAccountData;
let feed_account = ctx.accounts.feed.load()?;
let value: f64 = feed_account.result.value.try_into()?;`} language="rust" />
            </div>

            <div className="bg-[#252620] rounded-md p-3 border border-[#3a3b35]">
              <p className="font-medium text-gray-300 text-xs mb-2">Resources</p>
              <ul className="space-y-1">
                <li>
                  <a href="https://docs.switchboard.xyz" target="_blank" rel="noopener noreferrer" className="text-feedgod-primary hover:underline flex items-center gap-1.5 text-[11px]">
                    <ExternalLink className="w-3 h-3" />
                    Switchboard Docs
                  </a>
                </li>
                <li>
                  <a href="https://github.com/switchboard-xyz/sb-on-demand-examples" target="_blank" rel="noopener noreferrer" className="text-feedgod-primary hover:underline flex items-center gap-1.5 text-[11px]">
                    <ExternalLink className="w-3 h-3" />
                    Example Integrations
                  </a>
                </li>
              </ul>
            </div>
          </section>

          {/* Smart Contracts */}
          <section data-section="smart-contracts" className="mb-12">
            <h2 className="text-lg font-semibold text-white mb-4">Smart Contracts</h2>
            
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-white mb-2">Arena Contract</h3>
                <p className="text-xs text-gray-500 mb-2">Handles deposits, wagers, resolution, payouts, and $SWTCH burns.</p>
                <p className="text-[10px] text-gray-600">Address: <span className="text-yellow-400">Deploying soon</span></p>
              </div>

              <div>
                <h3 className="text-sm font-medium text-white mb-2">Oracle Feeds</h3>
                <div className="bg-[#252620] border border-[#3a3b35] rounded-md p-2.5 font-mono text-[10px]">
                  <p className="text-gray-500"><span className="text-gray-600">Queue:</span> A43DyUGA7s8eXP...</p>
                  <p className="text-gray-500"><span className="text-gray-600">Program:</span> SBondMDrcV3K4kx...</p>
                </div>
              </div>
            </div>
          </section>

          {/* Fees */}
          <section data-section="fees" className="mb-12">
            <h2 className="text-lg font-semibold text-white mb-4">Fee Structure</h2>
            
            <div className="grid grid-cols-2 gap-2 mb-3">
              <div className="bg-[#252620] rounded-md p-2.5 border border-[#3a3b35]">
                <h3 className="font-medium text-gray-300 text-xs mb-2">Oracle Creation</h3>
                <ul className="space-y-1 text-[11px] text-gray-500">
                  <li className="flex justify-between">
                    <span>Deploy</span>
                    <span className="text-gray-400">~0.02 SOL</span>
                  </li>
                  <li className="flex justify-between">
                    <span>Ongoing</span>
                    <span className="text-green-400">Free</span>
                  </li>
                </ul>
              </div>
              
              <div className="bg-[#252620] rounded-md p-2.5 border border-[#3a3b35]">
                <h3 className="font-medium text-gray-300 text-xs mb-2">Arena</h3>
                <ul className="space-y-1 text-[11px] text-gray-500">
                  <li className="flex justify-between">
                    <span>Deposit/Withdraw</span>
                    <span className="text-green-400">Free</span>
                  </li>
                  <li className="flex justify-between">
                    <span>Protocol Fee</span>
                    <span className="text-gray-400">5%</span>
                  </li>
                </ul>
              </div>
            </div>

            <p className="text-[10px] text-gray-600">
              100% of fees → buy & burn $SWTCH
            </p>
          </section>

          {/* FAQ */}
          <section data-section="faq" className="mb-12">
            <h2 className="text-lg font-semibold text-white mb-4">FAQ</h2>
            
            <div className="space-y-2">
              {[
                { q: 'What is FeedGod?', a: 'No-code oracle factory built on Switchboard.' },
                { q: 'What is Arena?', a: 'Prediction game where you wager USDC on real-world outcomes.' },
                { q: 'Why USDC?', a: 'Stablecoin means your funds don\'t lose value to crypto volatility.' },
                { q: 'What happens to fees?', a: 'All fees buy and burn $SWTCH tokens.' },
                { q: 'Can I withdraw anytime?', a: 'Yes, no lockup periods. Gas only.' },
                { q: 'What wallets work?', a: 'Phantom, Solflare, Backpack, Ledger + WalletConnect.' },
              ].map((item, i) => (
                <div key={i} className="bg-[#252620] rounded-md p-2.5 border border-[#3a3b35]">
                  <p className="font-medium text-gray-300 text-xs mb-0.5">{item.q}</p>
                  <p className="text-[11px] text-gray-500">{item.a}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Support */}
          <section data-section="support" className="mb-12">
            <h2 className="text-lg font-semibold text-white mb-4">Support</h2>
            
            <div className="flex flex-wrap gap-2">
              <a
                href="https://twitter.com/switchboardxyz"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3 py-1.5 bg-[#252620] hover:bg-[#2a2b25] border border-[#3a3b35] rounded-md text-gray-400 text-xs transition-colors"
              >
                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
                X
              </a>
              <a
                href="https://discord.gg/switchboardxyz"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3 py-1.5 bg-[#252620] hover:bg-[#2a2b25] border border-[#3a3b35] rounded-md text-gray-400 text-xs transition-colors"
              >
                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
                </svg>
                Discord
              </a>
              <a
                href="https://github.com/switchboard-xyz"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3 py-1.5 bg-[#252620] hover:bg-[#2a2b25] border border-[#3a3b35] rounded-md text-gray-400 text-xs transition-colors"
              >
                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                  <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.17 6.839 9.49.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.604-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.464-1.11-1.464-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.167 22 16.418 22 12c0-5.523-4.477-10-10-10z"/>
                </svg>
                GitHub
              </a>
            </div>

            <div className="mt-4 p-2.5 bg-[#252620] border border-[#3a3b35] rounded-md">
              <p className="text-[10px] text-gray-600">
                <strong className="text-gray-500">Disclaimer:</strong> FeedGod Arena is for entertainment. You can lose money. Only bet what you can afford to lose. Not financial advice.
              </p>
            </div>

            <p className="text-center text-gray-600 mt-6 text-[10px]">
              Built on Switchboard 🥕
            </p>
          </section>
          </article>
        </main>
      </div>
    </div>
  )
}
