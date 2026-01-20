'use client';

import { useState, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';

interface RoundClockProps {
  startTime: Date | string;
  durationMinutes: number;
  className?: string;
}

export function RoundClock({
  startTime,
  durationMinutes,
  className,
}: RoundClockProps) {
  const [remainingSeconds, setRemainingSeconds] = useState<number | null>(null);

  const calculateRemaining = useCallback(() => {
    const start = typeof startTime === 'string' ? new Date(startTime) : startTime;
    const endTime = new Date(start.getTime() + durationMinutes * 60 * 1000);
    const now = new Date();
    const diffMs = endTime.getTime() - now.getTime();
    return Math.max(0, Math.floor(diffMs / 1000));
  }, [startTime, durationMinutes]);

  useEffect(() => {
    // Initial calculation
    setRemainingSeconds(calculateRemaining());

    // Update every second
    const interval = setInterval(() => {
      setRemainingSeconds(calculateRemaining());
    }, 1000);

    return () => clearInterval(interval);
  }, [calculateRemaining]);

  // Don't render until we have a value (avoid hydration mismatch)
  if (remainingSeconds === null) {
    return (
      <div
        className={cn(
          'font-mono text-2xl font-bold tabular-nums',
          className
        )}
      >
        --:--
      </div>
    );
  }

  const isExpired = remainingSeconds === 0;
  const isWarning = !isExpired && remainingSeconds < 5 * 60; // Less than 5 minutes

  const minutes = Math.floor(remainingSeconds / 60);
  const seconds = remainingSeconds % 60;
  const displayTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  if (isExpired) {
    return (
      <div
        className={cn(
          'font-mono text-2xl font-bold',
          'text-red-600 dark:text-red-500',
          className
        )}
      >
        Round Complete
      </div>
    );
  }

  return (
    <div
      className={cn(
        'font-mono text-2xl font-bold tabular-nums',
        isWarning && 'text-orange-500 dark:text-orange-400 animate-pulse',
        !isWarning && 'text-foreground',
        className
      )}
    >
      {displayTime}
    </div>
  );
}
