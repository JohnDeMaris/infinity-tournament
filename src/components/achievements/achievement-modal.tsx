"use client";

import { useState } from "react";
import * as Icons from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import type { AchievementDefinition } from "@/lib/achievements/definitions";
import { cn } from "@/lib/utils";

interface AchievementModalProps {
  achievement: AchievementDefinition | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  unlockedAt?: Date;
}

/**
 * Achievement detail modal
 */
export function AchievementModal({
  achievement,
  open,
  onOpenChange,
  unlockedAt,
}: AchievementModalProps) {
  if (!achievement) return null;

  const IconComponent = getIconComponent(achievement.icon);
  const categoryInfo = getCategoryInfo(achievement.category);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="sr-only">Achievement Details</DialogTitle>
          <DialogDescription className="sr-only">
            View details about your unlocked achievement
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Achievement Icon & Badge */}
          <div className="flex flex-col items-center gap-4 pt-4">
            <div className="relative">
              {/* Glow effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-amber-500 to-yellow-500 rounded-full blur-xl opacity-50 animate-pulse" />

              {/* Icon container */}
              <div className="relative w-24 h-24 bg-gradient-to-br from-amber-500 to-yellow-500 rounded-full flex items-center justify-center shadow-lg">
                <IconComponent className="w-12 h-12 text-white" />
              </div>
            </div>

            {/* Category badge */}
            <div
              className={cn(
                "px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider",
                categoryInfo.className
              )}
            >
              {categoryInfo.label}
            </div>
          </div>

          {/* Achievement Info */}
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-bold">{achievement.name}</h2>
            <p className="text-muted-foreground">{achievement.description}</p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-4 pt-4 border-t">
            <div className="text-center">
              <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                {achievement.points}
              </div>
              <div className="text-sm text-muted-foreground">Points</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                {unlockedAt ? formatDate(unlockedAt) : "—"}
              </div>
              <div className="text-sm text-muted-foreground">Unlocked</div>
            </div>
          </div>

          {/* Criteria Info */}
          {achievement.criteria_type && achievement.criteria_value && (
            <div className="bg-muted/50 rounded-lg p-4">
              <div className="text-sm text-muted-foreground mb-1">
                Requirements
              </div>
              <div className="text-sm font-medium">
                {getCriteriaText(achievement)}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Hook for managing achievement modal state
 */
export function useAchievementModal() {
  const [achievement, setAchievement] = useState<AchievementDefinition | null>(null);
  const [open, setOpen] = useState(false);
  const [unlockedAt, setUnlockedAt] = useState<Date | undefined>();

  const showAchievement = (
    achievementData: AchievementDefinition,
    unlockedDate?: Date
  ) => {
    setAchievement(achievementData);
    setUnlockedAt(unlockedDate);
    setOpen(true);
  };

  const closeModal = () => {
    setOpen(false);
  };

  return {
    achievement,
    open,
    unlockedAt,
    showAchievement,
    closeModal,
    setOpen,
  };
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
 * Get category display info
 */
function getCategoryInfo(category: string) {
  const categoryMap: Record<
    string,
    { label: string; className: string }
  > = {
    participation: {
      label: "Participation",
      className: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
    },
    performance: {
      label: "Performance",
      className: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
    },
    faction: {
      label: "Faction",
      className: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
    },
    community: {
      label: "Community",
      className: "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200",
    },
  };

  return (
    categoryMap[category] || {
      label: category,
      className: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200",
    }
  );
}

/**
 * Get criteria description text
 */
function getCriteriaText(achievement: AchievementDefinition): string {
  if (achievement.criteria_type === "count" && achievement.criteria_value) {
    return `Reach ${achievement.criteria_value} ${achievement.criteria_field?.replace(/_/g, " ")}`;
  }
  if (achievement.criteria_type === "threshold" && achievement.criteria_value) {
    return `Achieve ${achievement.criteria_value} ${achievement.criteria_field?.replace(/_/g, " ")}`;
  }
  if (achievement.criteria_type === "boolean") {
    return achievement.criteria_field?.replace(/_/g, " ") || "Complete special condition";
  }
  return "Complete special requirements";
}

/**
 * Format date for display
 */
function formatDate(date: Date): string {
  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

  if (diffInDays === 0) {
    return "Today";
  } else if (diffInDays === 1) {
    return "Yesterday";
  } else if (diffInDays < 7) {
    return `${diffInDays}d ago`;
  } else {
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
    });
  }
}
