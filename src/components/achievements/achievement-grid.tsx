'use client';

import { AchievementBadge } from './achievement-badge';
import type { AchievementDefinition } from '@/lib/achievements/definitions';

interface PlayerAchievement {
  achievement: AchievementDefinition;
  unlocked: boolean;
  progress?: {
    current: number;
    required: number;
  };
}

interface AchievementGridProps {
  achievements: PlayerAchievement[];
  className?: string;
}

export function AchievementGrid({ achievements, className }: AchievementGridProps) {
  // Sort achievements: unlocked first, then by points (descending)
  const sortedAchievements = [...achievements].sort((a, b) => {
    if (a.unlocked && !b.unlocked) return -1;
    if (!a.unlocked && b.unlocked) return 1;
    return b.achievement.points - a.achievement.points;
  });

  const unlockedCount = achievements.filter(a => a.unlocked).length;
  const totalPoints = achievements
    .filter(a => a.unlocked)
    .reduce((sum, a) => sum + a.achievement.points, 0);

  return (
    <div className={className}>
      {/* Summary Stats */}
      <div className="flex items-center gap-6 mb-6 text-sm">
        <div>
          <span className="text-muted-foreground">Unlocked: </span>
          <span className="font-semibold">
            {unlockedCount} / {achievements.length}
          </span>
        </div>
        <div>
          <span className="text-muted-foreground">Total Points: </span>
          <span className="font-semibold">{totalPoints}</span>
        </div>
      </div>

      {/* Achievement Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {sortedAchievements.map((item, index) => (
          <AchievementBadge
            key={index}
            achievement={item.achievement}
            unlocked={item.unlocked}
            progress={item.progress}
          />
        ))}
      </div>

      {achievements.length === 0 && (
        <p className="text-center text-muted-foreground py-8">
          No achievements available yet.
        </p>
      )}
    </div>
  );
}
