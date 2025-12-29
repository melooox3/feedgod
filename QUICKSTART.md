# Quick Start Guide

## Prerequisites

You need Node.js installed to run this application. If you don't have it:

1. Download Node.js from https://nodejs.org/ (LTS version recommended)
2. Install it
3. Restart your terminal/command prompt

## Running the Application

### Step 1: Install Dependencies

Open a terminal in this directory and run:

```bash
npm install
```

### Step 2: Start the Development Server

```bash
npm run dev
```

### Step 3: Open in Browser

Once the server starts, you'll see:
```
✓ Ready in X seconds
○ Local:        http://localhost:3000
```

Open **http://localhost:3000** in your browser to see the Feed Builder!

## What You'll See

1. **Header** - Switchboard branding with links to docs and explorer
2. **AI Assistant** (left sidebar) - Chat interface to create feeds using natural language
3. **Feed Builder** (main area) - Configuration panels for:
   - Basic feed settings (name, symbol, interval)
   - Data sources (CoinGecko, Binance, etc.)
   - Aggregator settings (median, mean, weighted)
   - Live preview of your feed

## Try It Out

1. In the AI Assistant, type: **"Create a BTC/USD price feed using CoinGecko and Binance"**
2. Watch as the feed configuration is automatically generated
3. Explore the different tabs to customize your feed
4. Check the Preview tab to see a simulated live feed

## Troubleshooting

- **"npm is not recognized"**: Install Node.js first
- **Port 3000 already in use**: Change the port in `package.json` or stop the other application
- **Build errors**: Make sure all dependencies are installed with `npm install`




