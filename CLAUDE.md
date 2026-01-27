# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build & Development Commands

```bash
npm run dev          # Start development server (localhost:3000)
npm run build        # Production build
npm run lint         # ESLint check
npm run test         # Run all unit tests (vitest)
npm run test:watch   # Watch mode for tests
npm run test:coverage # Tests with coverage report
```

### Running Single Tests

```bash
npx vitest run tests/lib/price-api.test.ts       # Single test file
npx vitest run -t "test name pattern"            # By test name
```

### E2E Tests (Playwright)

```bash
npx playwright test                              # Run all e2e tests
npx playwright test e2e/home.spec.ts             # Single e2e file
```

## Architecture Overview

FeedGod is a Next.js 14 application for building Switchboard oracle feeds with AI assistance. It has two main features:

1. **Oracle Feed Builder** (`/`) - Create price feeds, weather oracles, sports data, social metrics, custom APIs
2. **Arena** (`/arena`) - Prediction markets with parimutuel betting on real-world outcomes

### Core Data Flow

```
CommandBar (prompt) → prompt-router.ts (intent detection) → Builder Component → switchboard.ts (deployment)
                                                                              ↓
                                                              price-api.ts / surge-client.ts (live data)
```

### Key Directories

- `app/` - Next.js App Router pages and API routes
- `components/` - React components (all client-side with `'use client'`)
- `lib/` - Business logic, API clients, utilities
- `hooks/` - Custom React hooks (useFeedConfig, usePriceFetching, useDebounce)
- `types/` - TypeScript interfaces (FeedConfig, Market, BuilderType)

### Module System

The app uses a module-based architecture. Each oracle type is a "module" with its own builder:

| Module ID | Builder Component | Purpose |
|-----------|------------------|---------|
| `feed` | FeedBuilder | Price oracle feeds |
| `prediction` | PredictionMarketBuilder | Polymarket/Kalshi integration |
| `weather` | WeatherBuilder | Weather data oracles |
| `sports` | SportsBuilder | Sports outcomes |
| `social` | SocialBuilder | Social media metrics |
| `custom-api` | CustomAPIBuilder | Any JSON API → oracle |
| `ai-judge` | AIJudgeBuilder | AI-resolved questions |

Modules are defined in `app/page.tsx` (MODULES array) and routed via `lib/prompt-router.ts`.

### Wallet Integration

Uses Reown AppKit (formerly WalletConnect) with wagmi for EVM chains:

- Provider: `lib/web3modal-provider.tsx`
- Config: `lib/web3modal-config.ts`
- Supported networks: mainnet, arbitrum, optimism, base, polygon, sepolia

### Arena Betting System

Parimutuel betting with virtual balances:

- `lib/arena-api.ts` - Market generation, odds calculation
- `lib/arena-storage.ts` - Prediction persistence (localStorage)
- `lib/arena-wallet.ts` - User balance management
- `lib/arena-resolver.ts` - Market resolution logic

Markets are **curated only** - user-generated markets go through approval (see `lib/arena-markets.ts`).

### Price Data Sources

Live prices fetched from multiple sources with fallback:

1. **Surge** (Switchboard oracle) - `lib/surge-client.ts`
2. **CoinGecko** - Public API
3. **Binance/Coinbase/Kraken** - Exchange APIs

Symbol mapping in `lib/coin-ids.ts`.

## Configuration

### Environment Variables

```bash
SURGE_API_URL=http://localhost:9000  # Local Surge instance
SURGE_API_KEY=your_key               # Surge API authentication
OPENAI_API_KEY=your_key              # Optional: AI features
```

### Path Alias

`@/*` maps to project root (configured in tsconfig.json and vitest.config.ts).

## Testing Conventions

- Unit tests in `tests/` mirror source structure
- Test setup in `tests/setup.ts` (mocks for localStorage, observers)
- Use `vi.fn()` for mocks (vitest)
- Component tests use `@testing-library/react`

## Styling

- Tailwind CSS with custom `feedgod-*` color palette (see `tailwind.config.js`)
- Primary brand color: `#ff0d6e` (feedgod-primary)
- Dark theme only (class="dark" on html)
- Custom gradients: `gradient-bg`, `feedgod-btn`, `feedgod-accent`

## Type Definitions

Key types to understand:

```typescript
// types/feed.ts
FeedConfig       // Oracle feed configuration
DataSource       // Price data source (coingecko, binance, etc.)
Blockchain       // 'solana' | 'ethereum' | 'monad'

// types/switchboard.ts
BuilderType      // Module identifier (feed, prediction, weather, etc.)
FunctionConfig   // Off-chain compute function
VRFConfig        // Verifiable randomness

// types/arena.ts
Market           // Prediction market definition
MarketCategory   // shopping, gaming, travel, weather, social, food
```

## CI Pipeline

GitHub Actions runs on push/PR to main:
1. lint → typecheck → test (parallel)
2. build (requires all above)
3. e2e (requires build)
