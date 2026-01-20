import { FACTIONS, type Faction } from '@/types';

/**
 * @deprecated This parser is deprecated. Use parseInfinityArmyCode from @infinity-tournament/shared/games instead.
 *
 * Parse army list code from Infinity Army builder
 *
 * Army codes typically contain lines like:
 * - FACTION: PanOceania
 * - POINTS: 300/300
 *
 * This is a simple parser - it doesn't validate the actual army contents.
 */
export function parseArmyCode(code: string): {
  faction: Faction | null;
  points: number | null;
} {
  const lines = code.split('\n');

  let faction: Faction | null = null;
  let points: number | null = null;

  for (const line of lines) {
    const trimmed = line.trim();

    // Look for faction
    if (trimmed.toUpperCase().startsWith('FACTION:')) {
      const factionPart = trimmed.substring(8).trim();

      // Try to match to known factions
      for (const knownFaction of FACTIONS) {
        if (
          factionPart.toLowerCase().includes(knownFaction.toLowerCase()) ||
          knownFaction.toLowerCase().includes(factionPart.toLowerCase())
        ) {
          faction = knownFaction;
          break;
        }
      }

      // Also check for common abbreviations/aliases
      const factionAliases: Record<string, Faction> = {
        pano: 'PanOceania',
        yj: 'Yu Jing',
        ca: 'Combined Army',
        haq: 'Haqqislam',
        noms: 'Nomads',
        nomads: 'Nomads',
        tohaa: 'Tohaa',
        aleph: 'ALEPH',
        na2: 'NA2',
        o12: 'O-12',
        ariadna: 'Ariadna',
      };

      const lowerFaction = factionPart.toLowerCase();
      if (!faction && factionAliases[lowerFaction]) {
        faction = factionAliases[lowerFaction];
      }
    }

    // Look for points
    if (trimmed.toUpperCase().startsWith('POINTS:')) {
      const pointsPart = trimmed.substring(7).trim();
      // Extract first number (could be "300/300" format)
      const match = pointsPart.match(/(\d+)/);
      if (match) {
        points = parseInt(match[1], 10);
      }
    }
  }

  return { faction, points };
}

/**
 * @deprecated This function is deprecated. Use validateInfinityList from @infinity-tournament/shared/games instead.
 *
 * Validate that army code looks reasonable
 */
export function validateArmyCode(code: string): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!code || code.trim().length === 0) {
    errors.push('Army code is required');
    return { isValid: false, errors };
  }

  if (code.trim().length < 10) {
    errors.push('Army code seems too short');
  }

  // Could add more validation here

  return {
    isValid: errors.length === 0,
    errors,
  };
}
