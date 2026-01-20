import type { Pairing, PlayerStats } from '@/types';

interface PlayerForPairing {
  id: string;
  totalOp: number;
  totalVp: number;
  totalAp: number;
  opponents: string[];
  receivedBye: boolean;
}

/**
 * Generates Swiss pairings for a round
 *
 * Algorithm:
 * 1. Sort players by standing (OP > VP > AP descending)
 * 2. For each unpaired player (from top), find the highest-ranked
 *    opponent they haven't played yet
 * 3. If odd number of players, give bye to lowest-ranked unpaired
 *    player who hasn't had a bye yet
 */
export function generateSwissPairings(
  players: PlayerForPairing[],
  tableAssignment: 'sequential' | 'random' = 'sequential'
): Pairing[] {
  if (players.length === 0) {
    return [];
  }

  // Sort players by standing (descending)
  const sorted = [...players].sort((a, b) => {
    if (a.totalOp !== b.totalOp) return b.totalOp - a.totalOp;
    if (a.totalVp !== b.totalVp) return b.totalVp - a.totalVp;
    return b.totalAp - a.totalAp;
  });

  const pairings: Pairing[] = [];
  const paired = new Set<string>();

  // Create a set of previous matchups for O(1) lookup
  const previousMatchups = new Set<string>();
  for (const player of players) {
    for (const oppId of player.opponents) {
      previousMatchups.add(matchupKey(player.id, oppId));
    }
  }

  // Pair players greedily from top
  for (const player of sorted) {
    if (paired.has(player.id)) continue;

    // Find the highest-ranked unpaired opponent they haven't played
    let opponent: PlayerForPairing | null = null;

    for (const potentialOpponent of sorted) {
      if (potentialOpponent.id === player.id) continue;
      if (paired.has(potentialOpponent.id)) continue;
      if (previousMatchups.has(matchupKey(player.id, potentialOpponent.id))) {
        continue;
      }

      opponent = potentialOpponent;
      break;
    }

    if (opponent) {
      pairings.push({
        player1_id: player.id,
        player2_id: opponent.id,
        is_bye: false,
      });
      paired.add(player.id);
      paired.add(opponent.id);
    }
  }

  // Handle odd player - give bye to lowest unpaired who hasn't had one
  const unpaired = sorted.filter((p) => !paired.has(p.id));

  if (unpaired.length === 1) {
    pairings.push({
      player1_id: unpaired[0].id,
      player2_id: null,
      is_bye: true,
    });
  } else if (unpaired.length > 1) {
    // This shouldn't happen in normal circumstances, but handle it
    // by pairing remaining players even if they've played before
    console.warn('Multiple unpaired players - forcing pairings');

    for (let i = 0; i < unpaired.length; i += 2) {
      if (i + 1 < unpaired.length) {
        pairings.push({
          player1_id: unpaired[i].id,
          player2_id: unpaired[i + 1].id,
          is_bye: false,
        });
      } else {
        // Odd one out gets bye
        pairings.push({
          player1_id: unpaired[i].id,
          player2_id: null,
          is_bye: true,
        });
      }
    }
  }

  // Assign table numbers
  const tablesNeeded = pairings.length;
  let tables: number[];

  if (tableAssignment === 'random') {
    tables = Array.from({ length: tablesNeeded }, (_, i) => i + 1);
    shuffleArray(tables);
  } else {
    tables = Array.from({ length: tablesNeeded }, (_, i) => i + 1);
  }

  return pairings.map((pairing, idx) => ({
    ...pairing,
    table_number: tables[idx],
  }));
}

/**
 * Round 1 pairings - random matchups
 */
export function generateRound1Pairings(
  playerIds: string[],
  tableAssignment: 'sequential' | 'random' = 'sequential'
): Pairing[] {
  const shuffled = [...playerIds];
  shuffleArray(shuffled);

  const pairings: Pairing[] = [];

  for (let i = 0; i < shuffled.length; i += 2) {
    if (i + 1 < shuffled.length) {
      pairings.push({
        player1_id: shuffled[i],
        player2_id: shuffled[i + 1],
        is_bye: false,
      });
    } else {
      // Odd player gets bye
      pairings.push({
        player1_id: shuffled[i],
        player2_id: null,
        is_bye: true,
      });
    }
  }

  // Assign table numbers
  const tablesNeeded = pairings.length;
  let tables: number[];

  if (tableAssignment === 'random') {
    tables = Array.from({ length: tablesNeeded }, (_, i) => i + 1);
    shuffleArray(tables);
  } else {
    tables = Array.from({ length: tablesNeeded }, (_, i) => i + 1);
  }

  return pairings.map((pairing, idx) => ({
    ...pairing,
    table_number: tables[idx],
  }));
}

/**
 * Create a unique key for a matchup (order-independent)
 */
function matchupKey(player1: string, player2: string): string {
  return [player1, player2].sort().join('-');
}

/**
 * Fisher-Yates shuffle
 */
function shuffleArray<T>(array: T[]): void {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

/**
 * Build player stats from match history for pairing
 */
export function buildPlayerStats(
  playerIds: string[],
  matches: {
    player1_id: string;
    player2_id: string | null;
    player1_op: number | null;
    player1_vp: number | null;
    player1_ap: number | null;
    player2_op: number | null;
    player2_vp: number | null;
    player2_ap: number | null;
    is_bye: boolean;
  }[]
): PlayerForPairing[] {
  const statsMap = new Map<string, PlayerForPairing>();

  // Initialize all players
  for (const id of playerIds) {
    statsMap.set(id, {
      id,
      totalOp: 0,
      totalVp: 0,
      totalAp: 0,
      opponents: [],
      receivedBye: false,
    });
  }

  // Aggregate from matches
  for (const match of matches) {
    const p1Stats = statsMap.get(match.player1_id);
    if (p1Stats) {
      p1Stats.totalOp += match.player1_op || 0;
      p1Stats.totalVp += match.player1_vp || 0;
      p1Stats.totalAp += match.player1_ap || 0;

      if (match.is_bye) {
        p1Stats.receivedBye = true;
      } else if (match.player2_id) {
        p1Stats.opponents.push(match.player2_id);
      }
    }

    if (match.player2_id) {
      const p2Stats = statsMap.get(match.player2_id);
      if (p2Stats) {
        p2Stats.totalOp += match.player2_op || 0;
        p2Stats.totalVp += match.player2_vp || 0;
        p2Stats.totalAp += match.player2_ap || 0;
        p2Stats.opponents.push(match.player1_id);
      }
    }
  }

  return Array.from(statsMap.values());
}
