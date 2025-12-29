# Switchboard Feed Builder

An intuitive, AI-powered feed builder for creating Switchboard oracle feeds. Built with Next.js, TypeScript, and Tailwind CSS.

## Features

- 🤖 **AI-Powered Feed Creation**: Describe your feed in natural language and let AI generate the configuration
- 🎨 **Intuitive UI**: Clean, modern interface with Switchboard branding
- ⚡ **Real-Time Preview**: See your feed configuration in action before deploying
- 🔧 **Flexible Configuration**: Customize data sources, aggregators, and update intervals
- 📊 **Multiple Data Sources**: Support for CoinGecko, Binance, Coinbase, Kraken, Pyth, Chainlink, and custom APIs
- 🎯 **Smart Aggregation**: Choose from median, mean, or weighted aggregation methods

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Build for Production

```bash
npm run build
npm start
```

## Usage

1. **AI Assistant**: Use the AI assistant sidebar to describe your feed in natural language
   - Example: "Create a BTC/USD price feed using CoinGecko and Binance"
   - Example: "Build a SOL/USD feed with 30 second updates"

2. **Manual Configuration**: 
   - Set feed name, symbol, and description
   - Add data sources from the available list
   - Configure aggregator settings
   - Set update intervals and network

3. **Preview**: Check the preview tab to see how your feed will work

4. **Deploy**: Save and deploy your feed to Switchboard

## Project Structure

```
├── app/
│   ├── layout.tsx          # Root layout
│   ├── page.tsx            # Main page
│   └── globals.css         # Global styles
├── components/
│   ├── Header.tsx          # App header
│   ├── AIAssistant.tsx    # AI chat interface
│   ├── FeedBuilder.tsx    # Main builder component
│   ├── FeedConfiguration.tsx
│   ├── DataSourcesPanel.tsx
│   ├── AggregatorPanel.tsx
│   └── FeedPreview.tsx
├── lib/
│   └── ai-assistant.ts    # AI feed generation logic
└── types/
    └── feed.ts            # TypeScript types
```

## Technologies

- **Next.js 14**: React framework
- **TypeScript**: Type safety
- **Tailwind CSS**: Styling
- **Framer Motion**: Animations (ready for use)
- **Lucide React**: Icons

## Switchboard Integration

This is a demo implementation. To integrate with Switchboard:

1. Install `@switchboard-xyz/on-demand` SDK
2. Configure your Solana connection
3. Implement actual feed creation using Switchboard APIs
4. Connect to Switchboard Surge for real-time data

## License

MIT




