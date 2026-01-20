/**
 * USAGE EXAMPLE - Achievement Notification System
 *
 * This file demonstrates how to use the achievement toast and modal components.
 * Delete this file after reviewing the examples.
 */

"use client";

import { showAchievementToast } from "./achievement-toast";
import { AchievementModal, useAchievementModal } from "./achievement-modal";
import type { AchievementDefinition } from "@/lib/achievements/definitions";

/**
 * Example 1: Basic usage with toast and modal
 */
export function AchievementNotificationExample() {
  const { achievement, open, unlockedAt, showAchievement, setOpen } = useAchievementModal();

  const handleAchievementUnlock = (achievement: AchievementDefinition) => {
    // Show toast notification with confetti
    showAchievementToast(achievement, () => {
      // When user clicks the toast, open the detail modal
      showAchievement(achievement, new Date());
    });
  };

  return (
    <>
      {/* Your content */}
      <button onClick={() => handleAchievementUnlock(exampleAchievement)}>
        Unlock Achievement
      </button>

      {/* Achievement detail modal */}
      <AchievementModal
        achievement={achievement}
        open={open}
        onOpenChange={setOpen}
        unlockedAt={unlockedAt}
      />
    </>
  );
}

/**
 * Example 2: Programmatic usage in achievement service
 */
export async function checkAndUnlockAchievement(
  userId: string,
  achievementDef: AchievementDefinition,
  showModal: (achievement: AchievementDefinition, date?: Date) => void
) {
  // Check if user qualifies for achievement
  const qualifies = await checkAchievementCriteria(userId, achievementDef);

  if (qualifies) {
    // Save to database
    const unlockedAt = await saveAchievementToDatabase(userId, achievementDef);

    // Show toast notification
    showAchievementToast(achievementDef, () => {
      // Open modal on click
      showModal(achievementDef, unlockedAt);
    });
  }
}

/**
 * Example 3: Integration with layout/provider
 */
export function AchievementProvider({ children }: { children: React.ReactNode }) {
  const modalState = useAchievementModal();

  // You can expose the showAchievement function via context
  // so any component can trigger achievement notifications

  return (
    <>
      {children}
      <AchievementModal
        achievement={modalState.achievement}
        open={modalState.open}
        onOpenChange={modalState.setOpen}
        unlockedAt={modalState.unlockedAt}
      />
    </>
  );
}

// Mock functions for example
const exampleAchievement: AchievementDefinition = {
  name: "First Steps",
  description: "Complete your first tournament",
  category: "participation",
  icon: "trophy",
  criteria_type: "count",
  criteria_field: "tournaments_completed",
  criteria_value: 1,
  points: 10,
};

async function checkAchievementCriteria(
  userId: string,
  achievement: AchievementDefinition
): Promise<boolean> {
  // Implementation would check database
  return true;
}

async function saveAchievementToDatabase(
  userId: string,
  achievement: AchievementDefinition
): Promise<Date> {
  // Implementation would save to database
  return new Date();
}
