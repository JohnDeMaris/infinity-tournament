import { createClient } from '@/lib/supabase/server';
import { achievementDefinitions, type AchievementDefinition } from './definitions';

interface PlayerAchievementProgress {
  achievement: AchievementDefinition;
  unlocked: boolean;
  unlockedAt?: string;
  progress?: {
    current: number;
    required: number;
  };
}

/**
 * Get all achievements for a player with unlock status and progress
 */
export async function getPlayerAchievements(
  userId: string
): Promise<PlayerAchievementProgress[]> {
  const supabase = await createClient();

  // Get unlocked achievements
  const { data: userAchievements } = await supabase
    .from('user_achievements')
    .select('achievement_id, unlocked_at, achievements(name)')
    .eq('user_id', userId);

  const unlockedMap = new Map(
    userAchievements?.map((ua: any) => [
      ua.achievements?.name,
      ua.unlocked_at,
    ]) || []
  );

  // Get player stats for progress calculation
  const stats = await getPlayerStatsForAchievements(userId);

  // Build achievement list with progress
  return achievementDefinitions.map((achievement) => {
    const unlocked = unlockedMap.has(achievement.name);
    const unlockedAt = unlockedMap.get(achievement.name);

    let progress: { current: number; required: number } | undefined;

    // Calculate progress for locked achievements
    if (!unlocked && achievement.criteria_field && achievement.criteria_value !== null) {
      const current = stats[achievement.criteria_field] || 0;
      const required = achievement.criteria_value;
      progress = { current, required };
    }

    return {
      achievement,
      unlocked,
      unlockedAt,
      progress,
    };
  });
}

/**
 * Get player stats for achievement progress calculation
 */
async function getPlayerStatsForAchievements(
  userId: string
): Promise<Record<string, number>> {
  const supabase = await createClient();

  // Count completed tournaments (tournaments where user has registrations)
  const { count: tournamentsCompleted } = await supabase
    .from('registrations')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId);

  // Count matches won
  const { count: matchesWon } = await supabase
    .from('matches')
    .select('*', { count: 'exact', head: true })
    .eq('winner_id', userId);

  // Count tournament wins (1st place finishes)
  const { count: tournamentWins } = await supabase
    .from('registrations')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('placement', 1);

  // Count tournaments organized
  const { count: tournamentsOrganized } = await supabase
    .from('tournaments')
    .select('*', { count: 'exact', head: true })
    .eq('organizer_id', userId);

  // Count unique factions played
  const { data: factionData } = await supabase
    .from('registrations')
    .select('faction')
    .eq('user_id', userId)
    .not('faction', 'is', null);

  const uniqueFactions = new Set(factionData?.map((r: any) => r.faction) || []);

  // Count same faction tournaments (most played faction)
  const factionCounts: Record<string, number> = {};
  factionData?.forEach((r: any) => {
    if (r.faction) {
      factionCounts[r.faction] = (factionCounts[r.faction] || 0) + 1;
    }
  });
  const sameFactionTournaments = Math.max(...Object.values(factionCounts), 0);

  return {
    tournaments_completed: tournamentsCompleted || 0,
    matches_won: matchesWon || 0,
    tournament_wins: tournamentWins || 0,
    tournaments_organized: tournamentsOrganized || 0,
    unique_factions_played: uniqueFactions.size,
    same_faction_tournaments: sameFactionTournaments,
    undefeated_tournament: 0, // This would need special logic to track
    early_adopter: 0, // This would need to check user creation date
  };
}
