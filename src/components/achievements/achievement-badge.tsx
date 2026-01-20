'use client';

import { Trophy, Calendar, Medal, Swords, Crown, Shield, Flag, Sparkles, Users, Rocket } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import type { AchievementDefinition } from '@/lib/achievements/definitions';

interface AchievementBadgeProps {
  achievement: AchievementDefinition;
  unlocked: boolean;
  progress?: {
    current: number;
    required: number;
  };
  className?: string;
}

const iconMap: Record<string, typeof Trophy> = {
  trophy: Trophy,
  calendar: Calendar,
  medal: Medal,
  swords: Swords,
  crown: Crown,
  shield: Shield,
  flag: Flag,
  sparkles: Sparkles,
  users: Users,
  rocket: Rocket,
};

export function AchievementBadge({
  achievement,
  unlocked,
  progress,
  className,
}: AchievementBadgeProps) {
  const Icon = iconMap[achievement.icon] || Trophy;
  const progressPercentage = progress
    ? Math.min(100, (progress.current / progress.required) * 100)
    : 0;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className={cn(
              'relative flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all cursor-pointer',
              unlocked
                ? 'bg-primary/5 border-primary hover:bg-primary/10'
                : 'bg-muted/30 border-muted-foreground/20 hover:bg-muted/50',
              className
            )}
          >
            {/* Icon */}
            <div
              className={cn(
                'w-12 h-12 rounded-full flex items-center justify-center transition-all',
                unlocked
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground'
              )}
            >
              <Icon className="w-6 h-6" />
            </div>

            {/* Name */}
            <div className="text-center">
              <p
                className={cn(
                  'text-sm font-medium',
                  unlocked ? 'text-foreground' : 'text-muted-foreground'
                )}
              >
                {achievement.name}
              </p>
            </div>

            {/* Points Badge */}
            <Badge
              variant={unlocked ? 'default' : 'outline'}
              className="text-xs"
            >
              {achievement.points} pts
            </Badge>

            {/* Progress bar for incomplete achievements */}
            {!unlocked && progress && (
              <div className="w-full mt-1">
                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary/40 transition-all"
                    style={{ width: `${progressPercentage}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs">
          <div className="space-y-2">
            <p className="font-semibold">{achievement.name}</p>
            <p className="text-sm text-muted-foreground">
              {achievement.description}
            </p>
            {!unlocked && progress && (
              <p className="text-xs text-muted-foreground">
                Progress: {progress.current} / {progress.required}
              </p>
            )}
            <div className="flex items-center gap-2 text-xs">
              <Badge variant="outline" className="text-xs">
                {achievement.category}
              </Badge>
              <span className="text-muted-foreground">
                {achievement.points} points
              </span>
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
