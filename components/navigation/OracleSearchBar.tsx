"use client";

import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { Search, Loader2, X, Sparkles, ArrowRight } from "lucide-react";
import { BuilderType, ParsedPrompt } from "@/types/switchboard";
import { detectIntent, DetectedIntent } from "@/lib/ai/prompt-router";
import { playPickupSound } from "@/lib/utils/sound-utils";

interface OracleSearchBarProps {
  onModuleNavigate: (module: BuilderType, parsed?: ParsedPrompt) => void;
  placeholder?: string;
  autoFocus?: boolean;
}

// Suggestion types for autocomplete
interface Suggestion {
  id: string;
  text: string;
  module: BuilderType;
  icon: string;
  label: string;
  parsed?: ParsedPrompt;
  isExample?: boolean;
}

// Popular oracle types with common search terms
const POPULAR_ORACLE_SUGGESTIONS: Suggestion[] = [
  {
    id: "btc-usd",
    text: "BTC/USD",
    module: "feed",
    icon: "📊",
    label: "Bitcoin Price Feed",
  },
  {
    id: "eth-usd",
    text: "ETH/USD",
    module: "feed",
    icon: "📊",
    label: "Ethereum Price Feed",
  },
  {
    id: "sol-usd",
    text: "SOL/USD",
    module: "feed",
    icon: "📊",
    label: "Solana Price Feed",
  },
  {
    id: "trump-odds",
    text: "Trump election odds",
    module: "prediction",
    icon: "🎯",
    label: "Prediction Market",
  },
  {
    id: "tokyo-weather",
    text: "Tokyo weather",
    module: "weather",
    icon: "🌤️",
    label: "Weather Oracle",
  },
  {
    id: "elon-followers",
    text: "@elonmusk followers",
    module: "social",
    icon: "👥",
    label: "Social Oracle",
  },
  {
    id: "lakers-game",
    text: "Lakers game score",
    module: "sports",
    icon: "🏆",
    label: "Sports Oracle",
  },
  {
    id: "custom-api",
    text: "Custom API endpoint",
    module: "custom-api",
    icon: "🌐",
    label: "Custom API",
  },
  {
    id: "ai-judge",
    text: "AI resolves any question",
    module: "ai-judge",
    icon: "🧠",
    label: "AI Judge",
  },
  {
    id: "random-number",
    text: "Random number generator",
    module: "vrf",
    icon: "🎲",
    label: "VRF Oracle",
  },
];

// Token suggestions for price feeds
const TOKEN_SUGGESTIONS = [
  { symbol: "BTC", name: "Bitcoin" },
  { symbol: "ETH", name: "Ethereum" },
  { symbol: "SOL", name: "Solana" },
  { symbol: "DOGE", name: "Dogecoin" },
  { symbol: "AVAX", name: "Avalanche" },
  { symbol: "LINK", name: "Chainlink" },
  { symbol: "MATIC", name: "Polygon" },
  { symbol: "DOT", name: "Polkadot" },
  { symbol: "ADA", name: "Cardano" },
  { symbol: "ATOM", name: "Cosmos" },
  { symbol: "UNI", name: "Uniswap" },
  { symbol: "XRP", name: "Ripple" },
  { symbol: "ARB", name: "Arbitrum" },
  { symbol: "OP", name: "Optimism" },
  { symbol: "APT", name: "Aptos" },
  { symbol: "SUI", name: "Sui" },
  { symbol: "NEAR", name: "Near Protocol" },
  { symbol: "HYPE", name: "Hyperliquid" },
  { symbol: "JUP", name: "Jupiter" },
  { symbol: "BONK", name: "Bonk" },
];

// City suggestions for weather
const CITY_SUGGESTIONS = [
  "New York",
  "Tokyo",
  "London",
  "Paris",
  "Dubai",
  "Singapore",
  "Sydney",
  "Los Angeles",
  "San Francisco",
  "Chicago",
  "Miami",
  "Seattle",
  "Berlin",
  "Hong Kong",
  "Seoul",
  "Mumbai",
  "Toronto",
  "Vancouver",
  "Amsterdam",
];

export default function OracleSearchBar({
  onModuleNavigate,
  placeholder = "Search for oracles... (e.g., 'BTC price', 'ETH/USD', 'Tokyo weather')",
  autoFocus = false,
}: OracleSearchBarProps) {
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Detect intent as user types
  const detectedIntent: DetectedIntent | null = useMemo(() => {
    if (!input || input.length < 2) return null;
    return detectIntent(input);
  }, [input]);

  // Generate suggestions based on input
  const suggestions: Suggestion[] = useMemo(() => {
    if (!input || input.length < 1) {
      // Show popular suggestions when no input
      return POPULAR_ORACLE_SUGGESTIONS.slice(0, 6);
    }

    const inputLower = input.toLowerCase().trim();
    const results: Suggestion[] = [];

    // Check for token/price related queries
    const priceKeywords = ["price", "feed", "usd", "usdt", "/", "-"];
    const isPriceQuery =
      priceKeywords.some((kw) => inputLower.includes(kw)) ||
      TOKEN_SUGGESTIONS.some(
        (t) =>
          inputLower.includes(t.symbol.toLowerCase()) ||
          inputLower.includes(t.name.toLowerCase()),
      );

    if (isPriceQuery || inputLower.length <= 4) {
      // Filter token suggestions that match input
      const matchingTokens = TOKEN_SUGGESTIONS.filter(
        (t) =>
          t.symbol.toLowerCase().includes(inputLower) ||
          t.name.toLowerCase().includes(inputLower) ||
          inputLower.includes(t.symbol.toLowerCase()) ||
          inputLower.includes(t.name.toLowerCase()),
      ).slice(0, 4);

      matchingTokens.forEach((token) => {
        results.push({
          id: `${token.symbol.toLowerCase()}-usd`,
          text: `${token.symbol}/USD`,
          module: "feed",
          icon: "📊",
          label: `${token.name} Price Feed`,
          parsed: {
            symbol: `${token.symbol}/USD`,
            baseToken: token.symbol,
            quoteToken: "USD",
          },
        });
      });
    }

    // Check for weather queries
    const weatherKeywords = [
      "weather",
      "temp",
      "temperature",
      "rain",
      "forecast",
      "hot",
      "cold",
    ];
    const isWeatherQuery = weatherKeywords.some((kw) =>
      inputLower.includes(kw),
    );

    if (isWeatherQuery) {
      const matchingCities = CITY_SUGGESTIONS.filter(
        (city) =>
          city
            .toLowerCase()
            .includes(
              inputLower
                .replace(/weather|temp|temperature|in|at|for/gi, "")
                .trim(),
            ) || inputLower.includes(city.toLowerCase()),
      ).slice(0, 3);

      if (matchingCities.length === 0) {
        // Suggest popular cities if no match
        CITY_SUGGESTIONS.slice(0, 3).forEach((city) => {
          results.push({
            id: `weather-${city.toLowerCase().replace(" ", "-")}`,
            text: `${city} weather`,
            module: "weather",
            icon: "🌤️",
            label: "Weather Oracle",
            parsed: { city },
          });
        });
      } else {
        matchingCities.forEach((city) => {
          results.push({
            id: `weather-${city.toLowerCase().replace(" ", "-")}`,
            text: `${city} weather`,
            module: "weather",
            icon: "🌤️",
            label: "Weather Oracle",
            parsed: { city },
          });
        });
      }
    }

    // Check for prediction market queries
    const predictionKeywords = [
      "odds",
      "election",
      "trump",
      "biden",
      "predict",
      "polymarket",
      "kalshi",
      "bet",
      "win",
    ];
    const isPredictionQuery = predictionKeywords.some((kw) =>
      inputLower.includes(kw),
    );

    if (isPredictionQuery) {
      results.push({
        id: "prediction-election",
        text: input,
        module: "prediction",
        icon: "🎯",
        label: "Prediction Market",
        parsed: { market: input },
      });
    }

    // Check for social queries
    const socialKeywords = [
      "@",
      "followers",
      "subscribers",
      "twitter",
      "youtube",
      "tiktok",
      "elon",
      "musk",
    ];
    const isSocialQuery = socialKeywords.some((kw) => inputLower.includes(kw));

    if (isSocialQuery) {
      const usernameMatch = input.match(/@?(\w+)/i);
      const username =
        usernameMatch?.[1] ||
        input.replace(/followers|subscribers|twitter|youtube/gi, "").trim();
      results.push({
        id: "social-user",
        text: `@${username} followers`,
        module: "social",
        icon: "👥",
        label: "Social Oracle",
        parsed: { username, platform: "twitter" },
      });
    }

    // Check for sports queries
    const sportsKeywords = [
      "game",
      "score",
      "match",
      "vs",
      "nba",
      "nfl",
      "lakers",
      "warriors",
      "soccer",
      "football",
    ];
    const isSportsQuery = sportsKeywords.some((kw) => inputLower.includes(kw));

    if (isSportsQuery) {
      results.push({
        id: "sports-match",
        text: input,
        module: "sports",
        icon: "🏆",
        label: "Sports Oracle",
        parsed: { team: input },
      });
    }

    // Check for custom API queries
    const apiKeywords = [
      "api",
      "http",
      "https",
      "endpoint",
      "json",
      "fetch",
      "url",
    ];
    const isApiQuery =
      apiKeywords.some((kw) => inputLower.includes(kw)) ||
      input.startsWith("http");

    if (isApiQuery) {
      results.push({
        id: "custom-api",
        text: input.startsWith("http") ? input : "Custom API endpoint",
        module: "custom-api",
        icon: "🌐",
        label: "Custom API Oracle",
        parsed: input.startsWith("http") ? { url: input } : {},
      });
    }

    // Check for AI judge queries
    const aiKeywords = [
      "ai",
      "judge",
      "resolve",
      "question",
      "decide",
      "answer",
    ];
    const isAiQuery = aiKeywords.some((kw) => inputLower.includes(kw));

    if (isAiQuery) {
      results.push({
        id: "ai-judge",
        text: input,
        module: "ai-judge",
        icon: "🧠",
        label: "AI Judge Oracle",
        parsed: { question: input },
      });
    }

    // Check for VRF queries
    const vrfKeywords = [
      "random",
      "vrf",
      "dice",
      "lottery",
      "shuffle",
      "nft mint",
    ];
    const isVrfQuery = vrfKeywords.some((kw) => inputLower.includes(kw));

    if (isVrfQuery) {
      results.push({
        id: "vrf",
        text: input,
        module: "vrf",
        icon: "🎲",
        label: "VRF Oracle",
      });
    }

    // If no specific matches, use detected intent as suggestion
    if (results.length === 0 && detectedIntent) {
      results.push({
        id: "detected-intent",
        text: input,
        module: detectedIntent.module,
        icon: detectedIntent.icon,
        label: detectedIntent.label,
        parsed: detectedIntent.parsed,
      });
    }

    // Fallback: add price feed suggestion for any input
    if (results.length === 0 && input.length >= 2) {
      const upperInput = input.toUpperCase();
      results.push({
        id: "fallback-feed",
        text: `${upperInput}/USD`,
        module: "feed",
        icon: "📊",
        label: "Price Feed",
        parsed: {
          symbol: `${upperInput}/USD`,
          baseToken: upperInput,
          quoteToken: "USD",
        },
      });
    }

    // Limit results
    return results.slice(0, 6);
  }, [input, detectedIntent]);

  // Reset selected index when suggestions change
  useEffect(() => {
    setSelectedIndex(-1);
  }, [suggestions]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only handle when focused
      if (document.activeElement !== inputRef.current) return;

      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev < suggestions.length - 1 ? prev + 1 : prev,
        );
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
      } else if (e.key === "Escape") {
        setInput("");
        inputRef.current?.blur();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [suggestions.length]);

  // Global Cmd/Ctrl+K handler
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handleGlobalKeyDown);
    return () => window.removeEventListener("keydown", handleGlobalKeyDown);
  }, []);

  const handleSuggestionClick = useCallback(
    (suggestion: Suggestion) => {
      playPickupSound();
      setIsLoading(true);

      // Small delay for visual feedback
      setTimeout(() => {
        onModuleNavigate(suggestion.module, suggestion.parsed);
        setInput("");
        setIsLoading(false);
      }, 150);
    },
    [onModuleNavigate],
  );

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (isLoading) return;

      // If a suggestion is selected, use it
      if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
        handleSuggestionClick(suggestions[selectedIndex]);
        return;
      }

      // Otherwise use detected intent
      if (!input.trim()) return;

      setIsLoading(true);
      playPickupSound();

      try {
        const intent = detectIntent(input.trim());

        // Small delay for visual feedback
        await new Promise((resolve) => setTimeout(resolve, 200));

        onModuleNavigate(intent.module, intent.parsed);
        setInput("");
      } finally {
        setIsLoading(false);
      }
    },
    [
      input,
      isLoading,
      selectedIndex,
      suggestions,
      onModuleNavigate,
      handleSuggestionClick,
    ],
  );

  const showSuggestions = isFocused && suggestions.length > 0 && !isLoading;

  return (
    <div className="relative w-full">
      {/* Search Input */}
      <form onSubmit={handleSubmit} className="relative">
        <div className="relative flex items-center group">
          {/* Search icon */}
          <div className="absolute left-4 md:left-5 flex items-center pointer-events-none z-10">
            {isLoading ? (
              <Loader2 className="w-5 h-5 md:w-6 md:h-6 animate-spin text-feedgod-primary dark:text-feedgod-neon-pink" />
            ) : (
              <Search className="w-5 h-5 md:w-6 md:h-6 text-feedgod-pink-400 dark:text-feedgod-neon-cyan/70 group-focus-within:text-feedgod-primary dark:group-focus-within:text-feedgod-neon-pink transition-colors" />
            )}
          </div>

          {/* Main input */}
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setTimeout(() => setIsFocused(false), 200)}
            placeholder={placeholder}
            autoFocus={autoFocus}
            className="w-full bg-white dark:bg-feedgod-dark-secondary border-2 border-feedgod-pink-200 dark:border-feedgod-dark-accent rounded-xl md:rounded-2xl pl-12 md:pl-14 pr-24 md:pr-28 py-4 md:py-5 text-feedgod-dark dark:text-white placeholder-feedgod-pink-400 dark:placeholder-feedgod-neon-cyan/50 focus:outline-none focus:ring-2 focus:ring-feedgod-primary/30 dark:focus:ring-feedgod-neon-pink/30 focus:border-feedgod-primary dark:focus:border-feedgod-neon-pink transition-all text-base md:text-lg shadow-sm hover:shadow-md focus:shadow-lg"
            disabled={isLoading}
          />

          {/* Right side: Intent indicator or Clear button */}
          <div className="absolute right-4 md:right-5 flex items-center gap-2">
            {/* Intent indicator */}
            {detectedIntent && input.length >= 2 && !isLoading && (
              <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 bg-feedgod-primary/10 dark:bg-feedgod-neon-pink/10 border border-feedgod-primary/30 dark:border-feedgod-neon-pink/30 rounded-lg">
                <span className="text-sm">{detectedIntent.icon}</span>
                <span className="text-xs font-medium text-feedgod-primary dark:text-feedgod-neon-pink">
                  {detectedIntent.label}
                </span>
              </div>
            )}

            {/* Clear button */}
            {input && !isLoading && (
              <button
                type="button"
                onClick={() => setInput("")}
                className="p-1.5 hover:bg-feedgod-pink-100 dark:hover:bg-feedgod-dark-accent rounded-lg transition-colors"
              >
                <X className="w-4 h-4 text-feedgod-pink-400 dark:text-feedgod-neon-cyan/70" />
              </button>
            )}

            {/* Keyboard shortcut hint */}
            {!input && !isLoading && (
              <kbd className="hidden md:inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-feedgod-pink-500 dark:text-feedgod-neon-cyan/70 bg-feedgod-pink-50 dark:bg-feedgod-dark-accent border border-feedgod-pink-200 dark:border-feedgod-dark-accent rounded">
                <span className="text-[10px]">⌘</span>K
              </kbd>
            )}
          </div>
        </div>
      </form>

      {/* Autocomplete Suggestions Dropdown */}
      {showSuggestions && (
        <div
          ref={suggestionsRef}
          className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-feedgod-dark-secondary border border-feedgod-pink-200 dark:border-feedgod-dark-accent rounded-xl shadow-xl z-50 overflow-hidden"
        >
          {/* Suggestions header */}
          {input.length < 2 && (
            <div className="px-4 py-2 border-b border-feedgod-pink-100 dark:border-feedgod-dark-accent">
              <div className="flex items-center gap-2 text-xs text-feedgod-pink-500 dark:text-feedgod-neon-cyan/60">
                <Sparkles className="w-3 h-3" />
                <span>Popular oracle types</span>
              </div>
            </div>
          )}

          {/* Suggestions list */}
          <div className="max-h-80 overflow-y-auto">
            {suggestions.map((suggestion, index) => (
              <button
                key={suggestion.id}
                onClick={() => handleSuggestionClick(suggestion)}
                onMouseEnter={() => setSelectedIndex(index)}
                className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
                  selectedIndex === index
                    ? "bg-feedgod-primary/10 dark:bg-feedgod-neon-pink/10"
                    : "hover:bg-feedgod-pink-50 dark:hover:bg-feedgod-dark-accent/50"
                }`}
              >
                {/* Icon */}
                <div
                  className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    selectedIndex === index
                      ? "bg-feedgod-primary/20 dark:bg-feedgod-neon-pink/20"
                      : "bg-feedgod-pink-100 dark:bg-feedgod-dark-accent"
                  }`}
                >
                  <span className="text-lg">{suggestion.icon}</span>
                </div>

                {/* Text content */}
                <div className="flex-1 min-w-0">
                  <p
                    className={`font-medium truncate ${
                      selectedIndex === index
                        ? "text-feedgod-primary dark:text-feedgod-neon-pink"
                        : "text-feedgod-dark dark:text-white"
                    }`}
                  >
                    {suggestion.text}
                  </p>
                  <p className="text-xs text-feedgod-pink-500 dark:text-feedgod-neon-cyan/60 truncate">
                    {suggestion.label}
                  </p>
                </div>

                {/* Arrow indicator */}
                <ArrowRight
                  className={`w-4 h-4 flex-shrink-0 transition-opacity ${
                    selectedIndex === index
                      ? "opacity-100 text-feedgod-primary dark:text-feedgod-neon-pink"
                      : "opacity-0"
                  }`}
                />
              </button>
            ))}
          </div>

          {/* Footer hint */}
          <div className="px-4 py-2 border-t border-feedgod-pink-100 dark:border-feedgod-dark-accent bg-feedgod-pink-50/50 dark:bg-feedgod-dark-accent/30">
            <div className="flex items-center justify-between text-xs text-feedgod-pink-500 dark:text-feedgod-neon-cyan/60">
              <span>
                Press{" "}
                <kbd className="px-1.5 py-0.5 bg-white dark:bg-feedgod-dark-secondary rounded text-[10px]">
                  ↵
                </kbd>{" "}
                to select
              </span>
              <span>
                <kbd className="px-1.5 py-0.5 bg-white dark:bg-feedgod-dark-secondary rounded text-[10px]">
                  ↑↓
                </kbd>{" "}
                to navigate
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Loading state */}
      {isLoading && (
        <div className="absolute top-full left-0 right-0 mt-2 flex items-center justify-center gap-3 px-4 py-4 bg-gradient-to-r from-feedgod-primary/10 to-feedgod-pink-200/20 dark:from-feedgod-neon-pink/10 dark:to-feedgod-dark-accent border border-feedgod-pink-200 dark:border-feedgod-dark-accent rounded-xl shadow-lg">
          <Loader2 className="w-5 h-5 animate-spin text-feedgod-primary dark:text-feedgod-neon-pink" />
          <span className="text-sm font-medium text-feedgod-dark dark:text-feedgod-neon-cyan">
            Routing to {detectedIntent?.label || "Builder"}...
          </span>
          {detectedIntent && (
            <span className="text-lg">{detectedIntent.icon}</span>
          )}
        </div>
      )}
    </div>
  );
}
