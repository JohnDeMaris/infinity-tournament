import type { GameSystem, MatchScores } from '../types';
import { INFINITY_FACTIONS } from './factions';
import { INFINITY_HIDDEN_INFO } from './hidden-info';
import { parseInfinityArmyCode, validateInfinityList } from './parser';

/**
 * Infinity: The Game - Game System Implementation
 *
 * This module defines how Infinity tournaments work:
 * - Scoring: OP (Objective Points), VP (Victory Points), AP (Army Points)
 * - Tiebreakers: OP > VP > AP > SoS
 * - Winner determination: Higher OP wins, ties are draws
 */

/**
 * Determine match winner for Infinity
 *
 * Rules:
 * - Higher Objective Points (OP) wins
 * - If OP is tied, it's a draw (VP/AP don't affect win/loss)
 * - Bye matches: Player 1 automatically wins
 */
function determineInfinityWinner(scores: MatchScores): string | null {
  // Bye match - player 1 wins
  if (scores.player2Id === null || scores.player2 === null) {
    return scores.player1Id;
  }

  const p1Op = scores.player1.op ?? 0;
  const p2Op = scores.player2.op ?? 0;

  if (p1Op > p2Op) {
    return scores.player1Id;
  } else if (p2Op > p1Op) {
    return scores.player2Id;
  }

  // OP tied = draw
  return null;
}

/**
 * Infinity Game System Configuration
 */
export const infinityGame: GameSystem = {
  id: 'infinity',
  name: 'Infinity: The Game',
  version: 'N5',
  description: 'Corvus Belli\'s 28mm sci-fi skirmish wargame',

  scoring: {
    fields: [
      {
        name: 'op',
        label: 'Objective Points',
        shortLabel: 'OP',
        min: 0,
        max: 10,
        required: true,
        description: 'Points scored from mission objectives (0-10)',
      },
      {
        name: 'vp',
        label: 'Victory Points',
        shortLabel: 'VP',
        min: 0,
        required: true,
        description: 'Points killed value of enemy units',
      },
      {
        name: 'ap',
        label: 'Army Points',
        shortLabel: 'AP',
        min: 0,
        maxFromTournament: 'pointLimit',
        required: true,
        description: 'Points of your surviving army (0 to point limit)',
      },
    ],
    tiebreakers: ['op', 'vp', 'ap', 'sos'],
    byeScores: {
      op: 10,
      vp: 0,
      ap: 0,
    },
    determineWinner: determineInfinityWinner,
  },

  lists: {
    factions: INFINITY_FACTIONS,
    pointLevels: [150, 200, 300, 400],
    parser: parseInfinityArmyCode,
    validator: validateInfinityList,
  },

  hiddenInfo: INFINITY_HIDDEN_INFO,

  ui: {
    colors: {
      primary: '#E53935', // Red
      secondary: '#1E88E5', // Blue
    },
    logo: '/games/infinity/logo.svg',
    icon: '/games/infinity/icon.svg',
  },
};

// Re-export submodules
export * from './factions';
export * from './hidden-info';
export * from './match-state';
export * from './parser';
