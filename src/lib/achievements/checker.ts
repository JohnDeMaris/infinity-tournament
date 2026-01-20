import { createClient } from '@/lib/supabase/client';
import { achievementDefinitions, type AchievementDefinition } from './definitions';

/**
 * Check and unlock achievements for a user
 */
export async function checkAndUnlockAchievements(userId: string): Promise<string[]> {
  const supabase = createClient();
  const unlockedNames: string[] = [];

  // Get user's current achievements
  const { data: userAchievements } = await supabase
    .from('user_achievements')
    .select('achievement_id, achievements(name)')
    .eq('user_id', userId);

  const unlockedAchievementNames = new Set(
    userAchievements?.map((ua: any) => ua.achievements?.name) || []
  );

  // Get user stats
  const stats = await getUserStats(userId);

  // Check each achievement
  for (const achievement of achievementDefinitions) {
    if (unlockedAchievementNames.has(achievement.name)) {
      continue; // Already unlocked
    }

    if (checkAchievementCriteria(achievement, stats)) {
      const unlocked = await unlockAchievement(userId, achievement.name);
      if (unlocked) {
        unlockedNames.push(achievement.name);
      }
    }
  }

  return unlockedNames;
}

/**
 * Get user statistics for achievement checking
 */
async function getUserStats(userId: string) {
  const supabase = createClient();

  // Count completed tournaments
  const { count: tournamentsCompleted } = await supabase
    .from('registrations')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId);

  // Count matches won
  const { count: matchesWon } = await supabase
    .from('matches')
    .select('*', { count: 'exact', head: true })
    .eq('winner_id', userId);

  // Count tournaments organized
  const { count: tournamentsOrganized } = await supabase
    .from('tournaments')
    .select('*', { count: 'exact', head: true })
    .eq('organizer_id', userId);

  return {
    tournaments_completed: tournamentsCompleted || 0,
    matches_won: matchesWon || 0,
    tournaments_organized: tournamentsOrganized || 0,
  };
}

/**
 * Check if achievement criteria is met
 */
function checkAchievementCriteria(
  achievement: AchievementDefinition,
  stats: Record<string, number>
): boolean {
  if (!achievement.criteria_field || achievement.criteria_value === null) {
    return false; // Boolean achievements need special handling
  }

  const value = stats[achievement.criteria_field] || 0;

  switch (achievement.criteria_type) {
    case 'count':
    case 'threshold':
      return value >= achievement.criteria_value;
    case 'boolean':
      return value > 0;
    default:
      return false;
  }
}

/**
 * Unlock an achievement for a user
 */
async function unlockAchievement(userId: string, achievementName: string): Promise<boolean> {
  const supabase = createClient();

  // Get achievement ID by name
  const { data: achievement } = await supabase
    .from('achievements')
    .select('id')
    .eq('name', achievementName)
    .single();

  if (!achievement) {
    console.error(`Achievement not found: ${achievementName}`);
    return false;
  }

  // Insert user achievement
  const { error } = await supabase.from('user_achievements').insert({
    user_id: userId,
    achievement_id: achievement.id,
  });

  if (error) {
    console.error(`Failed to unlock achievement: ${error.message}`);
    return false;
  }

  return true;
}

/**
 * Get user's unlocked achievements
 */
export async function getUserAchievements(userId: string) {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('user_achievements')
    .select('*, achievements(*)')
    .eq('user_id', userId)
    .order('unlocked_at', { ascending: false });

  if (error) {
    console.error('Failed to get user achievements:', error);
    return [];
  }

  return data || [];
}
