"use client";

import { LucideIcon } from "lucide-react";
import { playPickupSound } from "@/lib/sound-utils";

export interface ModuleTileData {
  id: string;
  title: string;
  icon: LucideIcon;
}

interface ModuleTilesProps {
  modules: ModuleTileData[];
  onModuleSelect: (moduleId: string) => void;
  onViewAll: () => void;
  maxVisible?: number;
}

export default function ModuleTiles({
  modules,
  onModuleSelect,
  onViewAll,
  maxVisible = 8,
}: ModuleTilesProps) {
  const visibleModules = modules.slice(0, maxVisible);
  const hasMore = modules.length > maxVisible;

  const handleModuleClick = (moduleId: string) => {
    playPickupSound();
    onModuleSelect(moduleId);
  };

  const handleViewAllClick = () => {
    playPickupSound();
    onViewAll();
  };

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-feedgod-pink-500 dark:text-feedgod-neon-cyan/70 uppercase tracking-wider">
          Popular Modules
        </h3>
        <button
          onClick={handleViewAllClick}
          className="text-sm font-medium text-feedgod-primary dark:text-feedgod-neon-pink hover:text-feedgod-primary/80 dark:hover:text-feedgod-neon-pink/80 transition-colors flex items-center gap-1"
        >
          View All
          <svg
            className="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {visibleModules.map((module) => {
          const Icon = module.icon;
          return (
            <button
              key={module.id}
              onClick={() => handleModuleClick(module.id)}
              className="group relative flex flex-col items-center justify-center p-4 bg-white/60 dark:bg-feedgod-dark-secondary/50 backdrop-blur-sm rounded-xl border border-feedgod-pink-200/60 dark:border-feedgod-dark-accent/40 hover:border-feedgod-primary/50 dark:hover:border-feedgod-neon-pink/50 transition-all duration-200 hover:shadow-md hover:shadow-feedgod-primary/10 dark:hover:shadow-feedgod-neon-pink/10 hover:scale-[1.02] active:scale-[0.98]"
            >
              {/* Icon container */}
              <div className="w-10 h-10 mb-2 rounded-lg bg-feedgod-pink-100/80 dark:bg-feedgod-dark-accent/50 flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                <Icon className="w-5 h-5 text-feedgod-primary dark:text-feedgod-neon-pink" />
              </div>

              {/* Module name */}
              <span className="text-sm font-medium text-feedgod-dark dark:text-white group-hover:text-feedgod-primary dark:group-hover:text-feedgod-neon-pink transition-colors text-center">
                {module.title}
              </span>
            </button>
          );
        })}

        {/* View All tile - shown if there are more modules */}
        {hasMore && (
          <button
            onClick={handleViewAllClick}
            className="group flex flex-col items-center justify-center p-4 bg-feedgod-pink-50/60 dark:bg-feedgod-dark-accent/30 backdrop-blur-sm rounded-xl border border-dashed border-feedgod-pink-300/60 dark:border-feedgod-dark-accent/60 hover:border-feedgod-primary/50 dark:hover:border-feedgod-neon-pink/50 transition-all duration-200 hover:shadow-md hover:shadow-feedgod-primary/10 dark:hover:shadow-feedgod-neon-pink/10"
          >
            <div className="w-10 h-10 mb-2 rounded-lg bg-feedgod-pink-100/50 dark:bg-feedgod-dark-accent/30 flex items-center justify-center">
              <span className="text-lg font-semibold text-feedgod-primary dark:text-feedgod-neon-pink">
                +{modules.length - maxVisible}
              </span>
            </div>
            <span className="text-sm font-medium text-feedgod-pink-500 dark:text-feedgod-neon-cyan/70 group-hover:text-feedgod-primary dark:group-hover:text-feedgod-neon-pink transition-colors">
              More
            </span>
          </button>
        )}
      </div>
    </div>
  );
}
