"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import {
  Database,
  Code,
  Dice6,
  Key,
  ArrowLeft,
  Plus,
  Target,
  TrendingUp,
  Scale,
  Terminal,
  Sparkles,
  Shield,
  Cloud,
  Thermometer,
  Trophy,
  Gamepad2,
  Users,
  Heart,
  Brain,
  Zap,
  Globe,
  Link2,
  Loader2,
  Wrench,
  Swords,
  Search,
} from "lucide-react";

import { BuilderErrorBoundary } from "@/components/ErrorBoundary";
import { useToast } from "@/components/Toast";
import Header from "@/components/Header";
import ModuleCard from "@/components/ModuleCard";
import BulkFeedCreator from "@/components/BulkFeedCreator";
import CommandBar from "@/components/CommandBar";
import { FeedConfig } from "@/types/feed";
import {
  FunctionConfig,
  VRFConfig,
  SecretConfig,
  BuilderType,
  ParsedPrompt,
} from "@/types/switchboard";
import { playPickupSound } from "@/lib/sound-utils";
import { logger } from "@/lib/logger";

// Loading fallback for dynamically imported builders
function BuilderLoadingFallback(): JSX.Element {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="text-center">
        <Loader2 className="w-8 h-8 text-feedgod-primary animate-spin mx-auto mb-4" />
        <p className="text-feedgod-pink-500 dark:text-feedgod-neon-cyan/70">
          Loading builder...
        </p>
      </div>
    </div>
  );
}

// Lazy load builder components - only one is shown at a time
const FeedBuilder = dynamic(() => import("@/components/FeedBuilder"), {
  loading: () => <BuilderLoadingFallback />,
  ssr: false,
});
const FunctionBuilder = dynamic(() => import("@/components/FunctionBuilder"), {
  loading: () => <BuilderLoadingFallback />,
  ssr: false,
});
const VRFBuilder = dynamic(() => import("@/components/VRFBuilder"), {
  loading: () => <BuilderLoadingFallback />,
  ssr: false,
});
const SecretBuilder = dynamic(() => import("@/components/SecretBuilder"), {
  loading: () => <BuilderLoadingFallback />,
  ssr: false,
});
const PredictionMarketBuilder = dynamic(
  () => import("@/components/PredictionMarketBuilder"),
  { loading: () => <BuilderLoadingFallback />, ssr: false },
);
const WeatherBuilder = dynamic(() => import("@/components/WeatherBuilder"), {
  loading: () => <BuilderLoadingFallback />,
  ssr: false,
});
const SportsBuilder = dynamic(() => import("@/components/SportsBuilder"), {
  loading: () => <BuilderLoadingFallback />,
  ssr: false,
});
const SocialBuilder = dynamic(() => import("@/components/SocialBuilder"), {
  loading: () => <BuilderLoadingFallback />,
  ssr: false,
});
const AIJudgeBuilder = dynamic(() => import("@/components/AIJudgeBuilder"), {
  loading: () => <BuilderLoadingFallback />,
  ssr: false,
});
const CustomAPIBuilder = dynamic(
  () => import("@/components/CustomAPIBuilder"),
  { loading: () => <BuilderLoadingFallback />, ssr: false },
);

const MODULES = [
  {
    id: "feed" as BuilderType,
    title: "Price Feeds",
    description:
      "Aggregate real-time price data from multiple sources into reliable on-chain oracles.",
    icon: Database,
    backgroundIcon: TrendingUp,
  },
  {
    id: "prediction" as BuilderType,
    title: "Prediction Markets",
    description:
      "Create oracles for Polymarket & Kalshi markets. Resolve bets on-chain.",
    icon: Target,
    backgroundIcon: Scale,
  },
  {
    id: "function" as BuilderType,
    title: "Functions",
    description:
      "Run custom off-chain computation and push results on-chain with verifiable execution.",
    icon: Code,
    backgroundIcon: Terminal,
  },
  {
    id: "vrf" as BuilderType,
    title: "VRF",
    description:
      "Generate verifiable random numbers for games, NFTs, and fair selection mechanisms.",
    icon: Dice6,
    backgroundIcon: Sparkles,
  },
  {
    id: "secret" as BuilderType,
    title: "Secrets",
    description:
      "Securely store and manage API keys and sensitive data for your oracle functions.",
    icon: Key,
    backgroundIcon: Shield,
  },
  {
    id: "weather" as BuilderType,
    title: "Weather",
    description:
      "Deploy real-time weather data oracles for any city. Power insurance, gaming, and DeFi.",
    icon: Cloud,
    backgroundIcon: Thermometer,
  },
  {
    id: "sports" as BuilderType,
    title: "Sports",
    description:
      "Create oracles for sports match outcomes. Soccer, NBA, NFL, and esports supported.",
    icon: Trophy,
    backgroundIcon: Gamepad2,
  },
  {
    id: "social" as BuilderType,
    title: "Social Media",
    description:
      "Track Twitter, YouTube, and TikTok metrics on-chain. Followers, engagement, viral content.",
    icon: Users,
    backgroundIcon: Heart,
  },
  {
    id: "ai-judge" as BuilderType,
    title: "AI Judge",
    description:
      "Any question → on-chain answer. AI resolves real-world events without custom code.",
    icon: Brain,
    backgroundIcon: Zap,
  },
  {
    id: "custom-api" as BuilderType,
    title: "Custom API",
    description:
      "Turn any JSON API into an on-chain oracle. Click to select values, auto-generate paths.",
    icon: Globe,
    backgroundIcon: Link2,
  },
];

type HomeView = "landing" | "builder" | "arena";

export default function Home() {
  const [currentView, setCurrentView] = useState<HomeView>("landing");
  const [activeModule, setActiveModule] = useState<BuilderType | null>(null);
  const [feedConfig, setFeedConfig] = useState<FeedConfig | null>(null);
  const [functionConfig, setFunctionConfig] = useState<FunctionConfig | null>(
    null,
  );
  const [vrfConfig, setVRFConfig] = useState<VRFConfig | null>(null);
  const [secretConfig, setSecretConfig] = useState<SecretConfig | null>(null);
  const [showBulkCreator, setShowBulkCreator] = useState(false);
  const toast = useToast();

  // Load config from sessionStorage if available (from profile page)
  useEffect(() => {
    const loadConfig = sessionStorage.getItem("loadConfig");
    if (!loadConfig) return;

    try {
      const parsed = JSON.parse(loadConfig);
      const type = (parsed.type || "feed") as BuilderType;

      const parseDates = (config: Record<string, unknown>) => ({
        ...config,
        createdAt: config.createdAt
          ? new Date(config.createdAt as string)
          : new Date(),
        updatedAt: config.updatedAt
          ? new Date(config.updatedAt as string)
          : new Date(),
      });

      switch (type) {
        case "feed":
          setFeedConfig(parseDates(parsed) as FeedConfig);
          break;
        case "function":
          setFunctionConfig(parseDates(parsed) as FunctionConfig);
          break;
        case "vrf":
          setVRFConfig(parseDates(parsed) as VRFConfig);
          break;
        case "secret":
          setSecretConfig(parseDates(parsed) as SecretConfig);
          break;
        default:
          return;
      }
      setCurrentView("builder");
      setActiveModule(type);
      sessionStorage.removeItem("loadConfig");
    } catch (e) {
      logger.config.error("Error loading config:", e);
    }
  }, []);

  const handleSearch = (query: string) => {
    logger.router.debug("Searching for:", query);
    toast.info(
      `Searching for: ${query} (In production, this would search existing Switchboard resources)`,
    );
  };

  const handleBulkFeedsGenerated = (feeds: FeedConfig[]) => {
    const savedFeeds = localStorage.getItem("savedFeeds");
    const existingFeeds = savedFeeds ? JSON.parse(savedFeeds) : [];

    feeds.forEach((feed) => {
      const feedToSave = {
        ...feed,
        id:
          feed.id ||
          `feed-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      existingFeeds.push(feedToSave);
    });

    localStorage.setItem("savedFeeds", JSON.stringify(existingFeeds));
    toast.success(
      `Successfully created ${feeds.length} feeds! Check your profile to manage them.`,
    );
    setShowBulkCreator(false);
  };

  const handleBack = () => {
    playPickupSound();
    setActiveModule(null);
    // Stay in builder view when going back from a module
  };

  const handleModuleSelect = (moduleId: BuilderType) => {
    playPickupSound();
    setCurrentView("builder");
    setActiveModule(moduleId);
  };

  // Smart module navigation from universal prompt
  const handleSmartNavigate = (module: BuilderType, parsed?: ParsedPrompt) => {
    playPickupSound();
    setCurrentView("builder");
    setActiveModule(module);

    // Pre-fill module state if parsed data is available
    // This could be extended to pass the parsed data to each builder
    logger.router.debug("Smart navigate to:", module, "with parsed:", parsed);

    // Store parsed data in session storage for the builder to pick up
    if (parsed) {
      sessionStorage.setItem(
        "smartPromptData",
        JSON.stringify({ module, parsed }),
      );
    }
  };

  const renderBuilder = () => {
    const builderContent = (() => {
      switch (activeModule) {
        case "feed":
          return (
            <FeedBuilder config={feedConfig} onConfigChange={setFeedConfig} />
          );
        case "prediction":
          return <PredictionMarketBuilder />;
        case "function":
          return (
            <FunctionBuilder
              config={functionConfig}
              onConfigChange={setFunctionConfig}
            />
          );
        case "vrf":
          return (
            <VRFBuilder config={vrfConfig} onConfigChange={setVRFConfig} />
          );
        case "secret":
          return (
            <SecretBuilder
              config={secretConfig}
              onConfigChange={setSecretConfig}
            />
          );
        case "weather":
          return <WeatherBuilder />;
        case "sports":
          return <SportsBuilder />;
        case "social":
          return <SocialBuilder />;
        case "ai-judge":
          return <AIJudgeBuilder />;
        case "custom-api":
          return <CustomAPIBuilder />;
        default:
          return null;
      }
    })();

    if (!builderContent) return null;

    // Wrap builder in error boundary with module-specific name
    return (
      <BuilderErrorBoundary name={getModuleTitle()} key={activeModule}>
        {builderContent}
      </BuilderErrorBoundary>
    );
  };

  const getModuleTitle = () => {
    const activeModuleConfig = MODULES.find((m) => m.id === activeModule);
    return activeModuleConfig?.title || "";
  };

  const handleEnterBuilder = () => {
    playPickupSound();
    setCurrentView("builder");
  };

  const handleEnterArena = () => {
    playPickupSound();
    setCurrentView("arena");
    toast.info(
      "The Arena is coming soon! Stay tuned for competitive oracle challenges.",
    );
  };

  const handleBackToLanding = () => {
    playPickupSound();
    setCurrentView("landing");
    setActiveModule(null);
  };

  return (
    <main className="min-h-screen">
      <Header />

      {currentView === "landing" && !activeModule ? (
        // 50/50 Split Landing View
        <div className="container mx-auto px-4 py-8 md:py-16 max-w-6xl">
          {/* Hero tagline */}
          <div className="text-center mb-12 md:mb-16">
            <h1
              className="text-3xl md:text-5xl lg:text-6xl text-feedgod-primary dark:text-feedgod-neon-pink mb-4"
              style={{
                fontFamily: "Arial, sans-serif",
                fontWeight: 900,
                letterSpacing: "-2px",
                lineHeight: "1.2",
              }}
            >
              create oracles like a god
            </h1>
            <p className="text-sm md:text-base text-feedgod-pink-500 dark:text-feedgod-neon-cyan/80 max-w-2xl mx-auto">
              <span className="text-feedgod-dark dark:text-white font-medium">
                Any data. Any chain. No code.
              </span>
            </p>
          </div>

          {/* 50/50 Split Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
            {/* The Builder Card */}
            <div className="group relative p-8 md:p-10 bg-white/60 dark:bg-feedgod-dark-secondary/50 backdrop-blur-sm rounded-2xl border border-feedgod-pink-200/60 dark:border-feedgod-dark-accent/40 hover:border-feedgod-primary/50 dark:hover:border-feedgod-neon-pink/50 transition-all duration-300 hover:shadow-xl hover:shadow-feedgod-primary/10 dark:hover:shadow-feedgod-neon-pink/10 overflow-hidden flex flex-col min-h-[400px]">
              {/* Background decorative icon */}
              <div className="absolute -bottom-8 -right-8 pointer-events-none">
                <Wrench
                  className="w-48 h-48 text-feedgod-primary/[0.06] dark:text-feedgod-neon-pink/[0.08] transform rotate-12 group-hover:rotate-6 group-hover:scale-110 transition-all duration-500"
                  strokeWidth={1}
                />
              </div>

              {/* Gradient overlay on hover */}
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-feedgod-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

              <div className="relative z-10 flex flex-col flex-1">
                {/* Icon */}
                <div className="w-16 h-16 mb-6 rounded-xl bg-feedgod-pink-100/80 dark:bg-feedgod-dark-accent/50 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <Wrench className="w-8 h-8 text-feedgod-primary dark:text-feedgod-neon-pink" />
                </div>

                {/* Title */}
                <h2 className="text-2xl md:text-3xl font-bold text-feedgod-dark dark:text-white mb-3 group-hover:text-feedgod-primary dark:group-hover:text-feedgod-neon-pink transition-colors">
                  The Builder
                </h2>

                {/* Description */}
                <p className="text-feedgod-pink-500 dark:text-feedgod-neon-cyan/70 leading-relaxed mb-6">
                  Create custom oracles with our visual builder. Deploy price
                  feeds, prediction markets, VRF, weather data, sports outcomes,
                  and more — all without writing code.
                </p>

                {/* Search bar preview */}
                <div className="flex-1 flex flex-col justify-end">
                  <div className="relative mb-6">
                    <div className="flex items-center gap-3 px-4 py-3 bg-feedgod-pink-50/80 dark:bg-feedgod-dark-accent/30 rounded-xl border border-feedgod-pink-200/50 dark:border-feedgod-dark-accent/50">
                      <Search className="w-5 h-5 text-feedgod-pink-400 dark:text-feedgod-neon-cyan/50" />
                      <span className="text-feedgod-pink-400 dark:text-feedgod-neon-cyan/50 text-sm">
                        Describe your oracle or search existing feeds...
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={handleEnterBuilder}
                    className="w-full py-4 px-6 bg-feedgod-primary dark:bg-feedgod-neon-pink text-white font-semibold rounded-xl hover:bg-feedgod-primary/90 dark:hover:bg-feedgod-neon-pink/90 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-feedgod-primary/20 dark:shadow-feedgod-neon-pink/20"
                  >
                    Enter The Builder
                  </button>
                </div>
              </div>
            </div>

            {/* The Arena Card */}
            <div className="group relative p-8 md:p-10 bg-white/60 dark:bg-feedgod-dark-secondary/50 backdrop-blur-sm rounded-2xl border border-feedgod-pink-200/60 dark:border-feedgod-dark-accent/40 hover:border-feedgod-neon-purple/50 dark:hover:border-feedgod-neon-cyan/50 transition-all duration-300 hover:shadow-xl hover:shadow-feedgod-neon-purple/10 dark:hover:shadow-feedgod-neon-cyan/10 overflow-hidden flex flex-col min-h-[400px]">
              {/* Background decorative icon */}
              <div className="absolute -bottom-8 -right-8 pointer-events-none">
                <Swords
                  className="w-48 h-48 text-feedgod-neon-purple/[0.08] dark:text-feedgod-neon-cyan/[0.08] transform -rotate-12 group-hover:-rotate-6 group-hover:scale-110 transition-all duration-500"
                  strokeWidth={1}
                />
              </div>

              {/* Gradient overlay on hover */}
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-feedgod-neon-purple/5 dark:from-feedgod-neon-cyan/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

              <div className="relative z-10 flex flex-col flex-1">
                {/* Icon */}
                <div className="w-16 h-16 mb-6 rounded-xl bg-feedgod-neon-purple/10 dark:bg-feedgod-neon-cyan/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <Swords className="w-8 h-8 text-feedgod-neon-purple dark:text-feedgod-neon-cyan" />
                </div>

                {/* Title */}
                <h2 className="text-2xl md:text-3xl font-bold text-feedgod-dark dark:text-white mb-3 group-hover:text-feedgod-neon-purple dark:group-hover:text-feedgod-neon-cyan transition-colors">
                  The Arena
                </h2>

                {/* Description */}
                <p className="text-feedgod-pink-500 dark:text-feedgod-neon-cyan/70 leading-relaxed mb-6">
                  Compete against other oracle builders in timed challenges.
                  Prove your skills, climb the leaderboard, and earn rewards for
                  building the fastest, most accurate oracles.
                </p>

                {/* Coming soon badge */}
                <div className="flex-1 flex flex-col justify-end">
                  <div className="mb-6 flex items-center gap-2">
                    <span className="px-3 py-1 text-xs font-medium bg-feedgod-neon-purple/10 dark:bg-feedgod-neon-cyan/10 text-feedgod-neon-purple dark:text-feedgod-neon-cyan rounded-full">
                      Coming Soon
                    </span>
                  </div>

                  <button
                    onClick={handleEnterArena}
                    className="w-full py-4 px-6 bg-feedgod-neon-purple dark:bg-feedgod-neon-cyan text-white dark:text-feedgod-dark-bg font-semibold rounded-xl hover:bg-feedgod-neon-purple/90 dark:hover:bg-feedgod-neon-cyan/90 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-feedgod-neon-purple/20 dark:shadow-feedgod-neon-cyan/20"
                  >
                    Enter The Arena
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : currentView === "builder" && !activeModule ? (
        // Builder view: Module Selection
        <div className="container mx-auto px-4 max-w-5xl">
          {/* Back to landing */}
          <div className="py-6">
            <button
              onClick={handleBackToLanding}
              className="inline-flex items-center gap-2 text-feedgod-pink-500 dark:text-feedgod-neon-cyan/80 hover:text-feedgod-primary dark:hover:text-feedgod-neon-pink transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="text-sm font-medium">Back to home</span>
            </button>
          </div>

          {/* Quick Command Bar - Universal Smart Prompt */}
          <div className="mb-12 max-w-2xl mx-auto">
            <CommandBar
              onModuleNavigate={handleSmartNavigate}
              onSearch={handleSearch}
              isHomepage={true}
              showExamples={true}
            />
          </div>

          {/* Module Selection Grid */}
          <div className="pb-20">
            <h2 className="text-center text-sm font-medium text-feedgod-pink-500 dark:text-feedgod-neon-cyan/70 uppercase tracking-wider mb-8">
              Choose a module to get started
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
              {MODULES.map((module) => (
                <ModuleCard
                  key={module.id}
                  icon={module.icon}
                  backgroundIcon={module.backgroundIcon}
                  title={module.title}
                  description={module.description}
                  onClick={() => handleModuleSelect(module.id)}
                />
              ))}
            </div>
          </div>
        </div>
      ) : (
        // Builder view
        <div className="container mx-auto px-4 py-6">
          {/* Breadcrumb / Back navigation */}
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={handleBack}
              className="inline-flex items-center gap-2 text-feedgod-pink-500 dark:text-feedgod-neon-cyan/80 hover:text-feedgod-primary dark:hover:text-feedgod-neon-pink transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="text-sm font-medium">Back to modules</span>
            </button>

            <div className="flex items-center gap-3">
              {activeModule === "feed" && (
                <button
                  onClick={() => setShowBulkCreator(true)}
                  className="px-4 py-2 bg-feedgod-pink-100 dark:bg-feedgod-dark-secondary hover:bg-feedgod-pink-200 dark:hover:bg-feedgod-dark-accent rounded-lg text-feedgod-dark dark:text-feedgod-neon-cyan text-sm font-medium transition-colors flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>Bulk Create</span>
                </button>
              )}
            </div>
          </div>

          {/* Module Title */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-feedgod-dark dark:text-white">
              {getModuleTitle()}
            </h1>
          </div>

          {/* Command Bar for this module */}
          <div className="mb-6">
            <CommandBar
              onFeedGenerated={setFeedConfig}
              onFunctionGenerated={setFunctionConfig}
              onVRFGenerated={setVRFConfig}
              onSecretGenerated={setSecretConfig}
              onSearch={handleSearch}
              activeTab={activeModule ?? undefined}
            />
          </div>

          {/* Builder Content */}
          <div className="bg-white/40 dark:bg-feedgod-dark-secondary/30 rounded-2xl border border-feedgod-pink-200/50 dark:border-feedgod-dark-accent/30 backdrop-blur-sm p-6">
            {renderBuilder()}
          </div>
        </div>
      )}

      {/* Bulk Feed Creator Modal */}
      <BulkFeedCreator
        isOpen={showBulkCreator}
        onClose={() => setShowBulkCreator(false)}
        onFeedsGenerated={handleBulkFeedsGenerated}
      />
    </main>
  );
}
