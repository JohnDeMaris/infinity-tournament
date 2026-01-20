import type { ParsedList, ValidationResult, TournamentRules } from '../types';
import { findFaction, INFINITY_FACTIONS } from './factions';

/**
 * Parse Infinity Army builder export code
 *
 * The Infinity Army app exports lists in a specific text format.
 * This parser extracts faction, points, and basic unit information.
 *
 * Example export format:
 * ────────────────────────────────────────────────────────
 * Combined Army
 * ────────────────────────────────────────────────────────
 *
 * GROUP 1
 * AVATAR (Lieutenant) Spitfire, MULTI Heavy Grenade Launcher / 2 DA CC Weapons. (2.5 | 124)
 * FRAACTA (Drop Troop) Spitfire, Light Shotgun / Pistol, CCW. (1.5 | 36)
 * ...
 *
 *  SWC | 5.5
 * Points | 300
 */

/**
 * Parse an Infinity Army export code
 */
export function parseInfinityArmyCode(code: string): ParsedList {
  const result: ParsedList = {
    raw: code,
    faction: null,
    points: null,
    units: [],
    errors: [],
    warnings: [],
  };

  if (!code || code.trim().length < 10) {
    result.errors = ['Army list code is too short or empty'];
    return result;
  }

  const lines = code.split('\n').map((l) => l.trim());

  // Try to find faction in first few lines
  for (let i = 0; i < Math.min(5, lines.length); i++) {
    const line = lines[i];
    if (!line || line.startsWith('─') || line.startsWith('-')) continue;

    const faction = findFaction(line);
    if (faction) {
      result.faction = faction.name;
      break;
    }
  }

  // Try to find points total
  // Look for "Points | XXX" or similar patterns
  const pointsPatterns = [
    /Points\s*\|\s*(\d+)/i,
    /Total:\s*(\d+)\s*pts/i,
    /(\d+)\s*(?:pts|points)$/i,
  ];

  for (const line of lines) {
    for (const pattern of pointsPatterns) {
      const match = line.match(pattern);
      if (match) {
        result.points = parseInt(match[1], 10);
        break;
      }
    }
    if (result.points !== null) break;
  }

  // Parse SWC if present
  const swcPattern = /SWC\s*\|\s*([\d.]+)/i;
  for (const line of lines) {
    const match = line.match(swcPattern);
    if (match) {
      (result as ParsedList & { swc?: number }).swc = parseFloat(match[1]);
      break;
    }
  }

  // Parse individual units (basic extraction)
  const unitPattern = /^([A-Z][A-Za-z\s\-']+(?:\([^)]+\))?)\s+.*\([\d.]+\s*\|\s*(\d+)\)/;
  const units: { name: string; cost: number }[] = [];

  for (const line of lines) {
    const match = line.match(unitPattern);
    if (match) {
      units.push({
        name: match[1].trim(),
        cost: parseInt(match[2], 10),
      });
    }
  }

  result.units = units;

  // Validation warnings
  if (!result.faction) {
    result.warnings?.push('Could not detect faction from list');
  }

  if (!result.points) {
    result.warnings?.push('Could not detect points total from list');
  }

  return result;
}

/**
 * Validate a parsed Infinity list against tournament rules
 */
export function validateInfinityList(
  list: ParsedList,
  rules: TournamentRules
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check points limit
  if (list.points !== null) {
    if (list.points > rules.pointLimit) {
      errors.push(
        `List exceeds point limit: ${list.points} > ${rules.pointLimit}`
      );
    } else if (list.points < rules.pointLimit - 10) {
      warnings.push(
        `List is significantly under point limit: ${list.points} / ${rules.pointLimit}`
      );
    }
  } else {
    warnings.push('Could not validate points - total not detected');
  }

  // Check faction is valid
  if (list.faction) {
    const faction = findFaction(list.faction);
    if (!faction) {
      warnings.push(`Unknown faction: ${list.faction}`);
    }
  }

  // Check SWC limit (typically pointLimit / 50)
  const expectedSwcLimit = rules.pointLimit / 50;
  const listSwc = (list as ParsedList & { swc?: number }).swc;
  if (listSwc !== undefined && listSwc > expectedSwcLimit) {
    errors.push(
      `List exceeds SWC limit: ${listSwc} > ${expectedSwcLimit}`
    );
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Try to detect faction from a raw army list code
 */
export function detectFaction(code: string): string | null {
  const parsed = parseInfinityArmyCode(code);
  return parsed.faction;
}

/**
 * Extract points from a raw army list code
 */
export function extractPoints(code: string): number | null {
  const parsed = parseInfinityArmyCode(code);
  return parsed.points;
}
