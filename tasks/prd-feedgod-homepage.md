# PRD: FeedGod Homepage

## Overview
The FeedGod Homepage serves as the unified entry point for two distinct user experiences: The Builder (oracle deployment utility for developers) and The Arena (prediction market platform for traders). The homepage must provide equal prominence to both flows, handle wallet authentication, and route users seamlessly to their chosen destination.

## Goals
- Provide a clear, balanced entry point for both Builder and Arena users
- Establish wallet connection that persists across all application views
- Enable natural language search for oracle modules (Builder flow entry)
- Provide direct navigation to The Arena
- Detect connected network and handle chain switching when needed

## Quality Gates

These commands must pass for every user story:
- `pnpm typecheck` - Type checking
- `pnpm lint` - Linting

For UI stories, also include:
- Verify in browser using dev-browser skill

## User Stories

### US-001: Create homepage layout with 50/50 split
As a visitor, I want to see both The Builder and The Arena options with equal prominence so that I can quickly identify which experience suits my needs.

**Acceptance Criteria:**
- [ ] Homepage displays two distinct sections/cards for Builder and Arena
- [ ] Both sections have equal visual weight (size, positioning)
- [ ] Builder section includes search bar and brief description
- [ ] Arena section includes "Enter Arena" CTA and brief description
- [ ] Layout is responsive (stacks vertically on mobile)

### US-002: Implement wallet connection component
As a user, I want to connect my wallet from the homepage so that my connection persists when I navigate to Builder or Arena.

**Acceptance Criteria:**
- [ ] Wallet connect button visible in navigation/header
- [ ] Uses existing wallet adapter setup in codebase
- [ ] Connection state stored in global context/store
- [ ] Connected wallet address displayed (truncated format)
- [ ] Disconnect option available
- [ ] Connection persists across page navigation

### US-003: Implement natural language search bar
As a developer, I want to search for oracle types using natural language so that I can quickly find the module I need.

**Acceptance Criteria:**
- [ ] Search bar prominently displayed in Builder section
- [ ] Accepts natural language input (e.g., "BTC price", "ETH/USD")
- [ ] Shows autocomplete/suggestions as user types
- [ ] Matches search terms to available Switchboard oracle modules
- [ ] Pressing Enter or clicking a result navigates to Builder with module pre-selected

### US-004: Display clickable module tiles
As a developer, I want to see popular oracle modules as clickable tiles so that I can quickly select one without searching.

**Acceptance Criteria:**
- [ ] Display grid of module tiles below search bar
- [ ] Each tile shows module name and icon/visual
- [ ] Tiles are clickable and navigate to Builder with module pre-selected
- [ ] Show at least 6-8 popular modules
- [ ] "View All" option to see complete module list

### US-005: Implement Arena entry CTA
As a trader, I want a clear call-to-action to enter The Arena so that I can quickly access prediction markets.

**Acceptance Criteria:**
- [ ] "Enter Arena" button/CTA prominently displayed
- [ ] Visual styling differentiates it from Builder section (gamified aesthetic)
- [ ] Clicking CTA navigates to Arena market listing view
- [ ] Brief tagline explains Arena purpose (e.g., "Predict. Win. Earn.")

### US-006: Implement network detection and switching
As a user, I want the app to detect my connected network and prompt me to switch if needed so that I can interact with the correct chain.

**Acceptance Criteria:**
- [ ] App detects currently connected chain on wallet connection
- [ ] If chain doesn't match required network, show switch prompt
- [ ] Switch prompt includes button to trigger network switch in wallet
- [ ] After successful switch, UI updates to reflect correct network
- [ ] Handle switch rejection gracefully with user feedback

## Functional Requirements
- FR-1: The homepage must load and be interactive within 3 seconds on standard connections
- FR-2: Wallet connection state must be accessible via React context or global store
- FR-3: Search functionality must query available Switchboard modules and return results within 500ms
- FR-4: Navigation to Builder must pass selected module as URL parameter or state
- FR-5: Navigation to Arena must not require any pre-selection

## Non-Goals
- User authentication beyond wallet connection
- Displaying live market data on homepage
- Builder configuration on homepage (happens in Builder view)
- Betting functionality on homepage (happens in Arena view)

## Technical Considerations
- Leverage existing wallet adapter setup detected in codebase
- Search should filter from a cached/static list of modules for speed
- Consider prefetching Builder and Arena routes for faster navigation
- Wallet state should use React Context for cross-component access

## Success Metrics
- Users can connect wallet and navigate to either flow within 30 seconds
- Search correctly identifies modules for common queries (BTC, ETH, SOL prices)
- No wallet disconnection when navigating between views

## Open Questions
- Should we show any live stats on homepage (e.g., total oracles deployed, active markets)?
- Should there be an onboarding tooltip for first-time visitors?