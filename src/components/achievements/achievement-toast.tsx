"use client";

import { useEffect } from "react";
import { toast } from "sonner";
import confetti from "canvas-confetti";
import * as Icons from "lucide-react";
import type { AchievementDefinition } from "@/lib/achievements/definitions";

interface AchievementToastProps {
  achievement: AchievementDefinition;
  onToastClick?: () => void;
}

/**
 * Show achievement unlock toast with celebration effect
 */
export function showAchievementToast(
  achievement: AchievementDefinition,
  onToastClick?: () => void
) {
  // Trigger confetti celebration
  triggerConfetti();

  // Get the icon component
  const IconComponent = getIconComponent(achievement.icon);

  // Show custom toast
  toast.custom(
    (t) => (
      <div
        onClick={() => {
          onToastClick?.();
          toast.dismiss(t);
        }}
        className="bg-gradient-to-r from-amber-500 to-yellow-500 dark:from-amber-600 dark:to-yellow-600 text-white rounded-lg shadow-lg p-4 cursor-pointer hover:shadow-xl transition-shadow duration-200 border border-amber-400 dark:border-amber-700"
      >
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
            <IconComponent className="w-6 h-6" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-semibold uppercase tracking-wider opacity-90">
                Achievement Unlocked
              </span>
            </div>
            <h3 className="font-bold text-lg leading-tight mb-1">
              {achievement.name}
            </h3>
            <p className="text-sm opacity-90 leading-tight">
              {achievement.description}
            </p>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-xs font-medium bg-white/20 px-2 py-1 rounded">
                +{achievement.points} points
              </span>
              <span className="text-xs opacity-75">Click to view</span>
            </div>
          </div>
        </div>
      </div>
    ),
    {
      duration: 5000,
      position: "top-center",
    }
  );
}

/**
 * Trigger confetti celebration effect
 */
function triggerConfetti() {
  const duration = 2000;
  const animationEnd = Date.now() + duration;
  const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 999999 };

  function randomInRange(min: number, max: number) {
    return Math.random() * (max - min) + min;
  }

  const interval = setInterval(() => {
    const timeLeft = animationEnd - Date.now();

    if (timeLeft <= 0) {
      clearInterval(interval);
      return;
    }

    const particleCount = 50 * (timeLeft / duration);

    // Fire confetti from two points
    confetti({
      ...defaults,
      particleCount,
      origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
      colors: ["#fbbf24", "#f59e0b", "#d97706", "#ffffff"],
    });
    confetti({
      ...defaults,
      particleCount,
      origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
      colors: ["#fbbf24", "#f59e0b", "#d97706", "#ffffff"],
    });
  }, 250);
}

/**
 * Get icon component by name
 */
function getIconComponent(iconName: string): React.ComponentType<{ className?: string }> {
  const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
    trophy: Icons.Trophy,
    calendar: Icons.Calendar,
    medal: Icons.Medal,
    swords: Icons.Swords,
    crown: Icons.Crown,
    shield: Icons.Shield,
    flag: Icons.Flag,
    sparkles: Icons.Sparkles,
    users: Icons.Users,
    rocket: Icons.Rocket,
  };

  return iconMap[iconName] || Icons.Award;
}

/**
 * Achievement toast component (for programmatic usage)
 */
export function AchievementToast({ achievement, onToastClick }: AchievementToastProps) {
  useEffect(() => {
    showAchievementToast(achievement, onToastClick);
  }, [achievement, onToastClick]);

  return null;
}
