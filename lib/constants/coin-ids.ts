/**
 * Shared CoinGecko ID mappings for cryptocurrency symbols.
 * This file centralizes all symbol-to-CoinGecko-ID conversions used across the app.
 */

/** Map of token symbols to their CoinGecko API IDs */
export const COINGECKO_IDS: Record<string, string> = {
  // Major cryptocurrencies
  'BTC': 'bitcoin',
  'ETH': 'ethereum',
  'SOL': 'solana',
  'BNB': 'binancecoin',
  'XRP': 'ripple',
  'ADA': 'cardano',
  'DOGE': 'dogecoin',
  'DOT': 'polkadot',
  'LTC': 'litecoin',
  'SHIB': 'shiba-inu',

  // Stablecoins
  'USDC': 'usd-coin',
  'USDT': 'tether',

  // Layer 2 and alt-L1s
  'MATIC': 'matic-network',
  'AVAX': 'avalanche-2',
  'ARB': 'arbitrum',
  'OP': 'optimism',
  'APT': 'aptos',
  'SUI': 'sui',
  'SEI': 'sei-network',
  'TIA': 'celestia',
  'INJ': 'injective-protocol',
  'ATOM': 'cosmos',
  'NEAR': 'near',
  'FTM': 'fantom',

  // DeFi tokens
  'LINK': 'chainlink',
  'UNI': 'uniswap',
  'AAVE': 'aave',
  'RNDR': 'render-token',

  // Solana ecosystem
  'BONK': 'bonk',
  'JUP': 'jupiter-exchange-solana',
  'WIF': 'dogwifcoin',
  'PYTH': 'pyth-network',
  'RAY': 'raydium',
  'ORCA': 'orca',
  'MSOL': 'marinade-staked-sol',
  'JITOSOL': 'jito-staked-sol',

  // Meme tokens
  'PEPE': 'pepe',
  'FLOKI': 'floki',
  'MEME': 'memecoin-2',
}

/**
 * Get CoinGecko ID for a token symbol.
 * Handles both single symbols (BTC) and pairs (BTC/USD).
 * Falls back to lowercase symbol if not found in mapping.
 *
 * @param symbol - Token symbol or trading pair (e.g., "BTC" or "BTC/USD")
 * @returns CoinGecko API ID
 */
export function getCoinGeckoId(symbol: string): string {
  // Extract base symbol from pair if needed (e.g., "BTC/USD" -> "BTC")
  const normalized = symbol
    .toUpperCase()
    .split('/')[0]
    .replace(/USDT?C?$/, '') // Remove trailing USD, USDT, USDC
  return COINGECKO_IDS[normalized] || normalized.toLowerCase()
}

/**
 * Map from full pair symbol to CoinGecko ID.
 * Primarily for backward compatibility with price-api.ts
 */
export const SYMBOL_TO_ID: Record<string, string> = {
  'BTC/USD': 'bitcoin',
  'ETH/USD': 'ethereum',
  'SOL/USD': 'solana',
  'BNB/USD': 'binancecoin',
  'ADA/USD': 'cardano',
  'XRP/USD': 'ripple',
  'DOGE/USD': 'dogecoin',
  'DOT/USD': 'polkadot',
  'MATIC/USD': 'matic-network',
  'AVAX/USD': 'avalanche-2',
}
