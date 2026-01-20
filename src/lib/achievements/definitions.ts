import type { Achievement } from '@/types/database';

/**
 * Achievement category types
 */
export type AchievementCategory = 'participation' | 'performance' | 'faction' | 'community';

/**
 * Achievement definition (without database ID)
 */
export interface AchievementDefinition {
  name: string;
  description: string;
  category: AchievementCategory;
  icon: string;
  criteria_type: 'count' | 'boolean' | 'threshold';
  criteria_field: string | null;
  criteria_value: number | null;
  points: number;
}

/**
 * All achievement definitions
 */
export const achievementDefinitions: AchievementDefinition[] = [
  // Participation achievements
  {
    name: 'First Steps',
    description: 'Complete your first tournament',
    category: 'participation',
    icon: 'trophy',
    criteria_type: 'count',
    criteria_field: 'tournaments_completed',
    criteria_value: 1,
    points: 10,
  },
  {
    name: 'Regular',
    description: 'Complete 10 tournaments',
    category: 'participation',
    icon: 'calendar',
    criteria_type: 'count',
    criteria_field: 'tournaments_completed',
    criteria_value: 10,
    points: 25,
  },
  {
    name: 'Veteran',
    description: 'Complete 50 tournaments',
    category: 'participation',
    icon: 'medal',
    criteria_type: 'count',
    criteria_field: 'tournaments_completed',
    criteria_value: 50,
    points: 50,
  },

  // Performance achievements
  {
    name: 'First Blood',
    description: 'Win your first match',
    category: 'performance',
    icon: 'swords',
    criteria_type: 'count',
    criteria_field: 'matches_won',
    criteria_value: 1,
    points: 10,
  },
  {
    name: 'Champion',
    description: 'Win a tournament (1st place)',
    category: 'performance',
    icon: 'crown',
    criteria_type: 'count',
    criteria_field: 'tournament_wins',
    criteria_value: 1,
    points: 50,
  },
  {
    name: 'Undefeated',
    description: 'Complete a tournament without losing a match',
    category: 'performance',
    icon: 'shield',
    criteria_type: 'boolean',
    criteria_field: 'undefeated_tournament',
    criteria_value: null,
    points: 75,
  },

  // Faction achievements
  {
    name: 'Faction Loyalist',
    description: 'Play 10 tournaments with the same faction',
    category: 'faction',
    icon: 'flag',
    criteria_type: 'count',
    criteria_field: 'same_faction_tournaments',
    criteria_value: 10,
    points: 30,
  },
  {
    name: 'Versatile',
    description: 'Play tournaments with 5 different factions',
    category: 'faction',
    icon: 'sparkles',
    criteria_type: 'count',
    criteria_field: 'unique_factions_played',
    criteria_value: 5,
    points: 40,
  },

  // Community achievements
  {
    name: 'Organizer',
    description: 'Organize your first tournament',
    category: 'community',
    icon: 'users',
    criteria_type: 'count',
    criteria_field: 'tournaments_organized',
    criteria_value: 1,
    points: 25,
  },
  {
    name: 'Early Adopter',
    description: 'Join during the beta period',
    category: 'community',
    icon: 'rocket',
    criteria_type: 'boolean',
    criteria_field: 'early_adopter',
    criteria_value: null,
    points: 15,
  },
];

/**
 * Get achievements by category
 */
export function getAchievementsByCategory(category: AchievementCategory): AchievementDefinition[] {
  return achievementDefinitions.filter(a => a.category === category);
}

/**
 * Get achievement by name
 */
export function getAchievementByName(name: string): AchievementDefinition | undefined {
  return achievementDefinitions.find(a => a.name === name);
}
