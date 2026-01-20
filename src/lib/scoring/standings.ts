import type { Standing, Match, MatchScores } from '@/types';
import { getGameSystem } from '@infinity-tournament/shared/games';
import type { MatchScores as GameMatchScores } from '@infinity-tournament/shared/games';

interface PlayerMatchData {
  id: string;
  name: string;
  faction: string | null;
}

interface MatchData {
  player1_id: string;
  player2_id: string | null;
  // Legacy fields (for backwards compatibility)
  player1_op: number | null;
  player1_vp: number | null;
  player1_ap: number | null;
  player2_op: number | null;
  player2_vp: number | null;
  player2_ap: number | null;
  // Generic scores
  scores: MatchScores | null;
  winner_id: string | null;
  is_bye: boolean;
  confirmation_status: string;
}

/**
 * Calculate tournament standings from match data
 *
 * Uses game system configuration for:
 * - Score field aggregation
 * - Tiebreaker order
 * - Strength of Schedule calculation
 */
export function calculateStandings(
  players: PlayerMatchData[],
  matches: MatchData[],
  gameSystemId: string = 'infinity'
): Standing[] {
  const gameSystem = getGameSystem(gameSystemId);
  const scoreFields = gameSystem.scoring.fields;
  const tiebreakers = gameSystem.scoring.tiebreakers;

  // Only consider completed/confirmed matches
  const completedMatches = matches.filter(
    (m) =>
      m.confirmation_status === 'completed' ||
      m.confirmation_status === 'confirmed'
  );

  // Build stats for each player
  // Using generic scores map instead of hard-coded op/vp/ap
  const statsMap = new Map<
    string,
    {
      scores: Record<string, number>;
      wins: number;
      losses: number;
      draws: number;
      matchesPlayed: number;
      opponents: string[];
    }
  >();

  // Initialize all players with zero scores for each field
  for (const player of players) {
    const initialScores: Record<string, number> = {};
    scoreFields.forEach((field) => {
      initialScores[field.name] = 0;
    });
    statsMap.set(player.id, {
      scores: initialScores,
      wins: 0,
      losses: 0,
      draws: 0,
      matchesPlayed: 0,
      opponents: [],
    });
  }

  // Aggregate match data
  for (const match of completedMatches) {
    // Get scores from generic scores JSONB or fallback to legacy fields
    const p1Scores = getPlayerScores(match, 'player1', scoreFields);
    const p2Scores = getPlayerScores(match, 'player2', scoreFields);

    // Player 1 stats
    const p1Stats = statsMap.get(match.player1_id);
    if (p1Stats) {
      // Add scores from this match
      scoreFields.forEach((field) => {
        p1Stats.scores[field.name] += p1Scores[field.name] || 0;
      });
      p1Stats.matchesPlayed += 1;

      if (match.is_bye) {
        p1Stats.wins += 1; // Bye counts as a win
      } else if (match.winner_id === match.player1_id) {
        p1Stats.wins += 1;
      } else if (match.winner_id === match.player2_id) {
        p1Stats.losses += 1;
      } else {
        p1Stats.draws += 1;
      }

      if (match.player2_id) {
        p1Stats.opponents.push(match.player2_id);
      }
    }

    // Player 2 stats (if not a bye)
    if (match.player2_id) {
      const p2Stats = statsMap.get(match.player2_id);
      if (p2Stats) {
        // Add scores from this match
        scoreFields.forEach((field) => {
          p2Stats.scores[field.name] += p2Scores[field.name] || 0;
        });
        p2Stats.matchesPlayed += 1;

        if (match.winner_id === match.player2_id) {
          p2Stats.wins += 1;
        } else if (match.winner_id === match.player1_id) {
          p2Stats.losses += 1;
        } else {
          p2Stats.draws += 1;
        }

        p2Stats.opponents.push(match.player1_id);
      }
    }
  }

  // Calculate SoS (Strength of Schedule) - sum of first tiebreaker field from opponents
  const primaryTiebreaker = tiebreakers[0] || 'op';
  const sosMap = new Map<string, number>();
  for (const [playerId, stats] of statsMap.entries()) {
    let sos = 0;
    for (const oppId of stats.opponents) {
      const oppStats = statsMap.get(oppId);
      if (oppStats) {
        sos += oppStats.scores[primaryTiebreaker] || 0;
      }
    }
    sosMap.set(playerId, sos);
  }

  // Build standings array
  const standings: Standing[] = players.map((player) => {
    const stats = statsMap.get(player.id)!;
    return {
      rank: 0, // Will be assigned after sorting
      user_id: player.id,
      player_name: player.name,
      faction: player.faction as Standing['faction'],
      // Legacy fields for backwards compatibility
      total_op: stats.scores.op || 0,
      total_vp: stats.scores.vp || 0,
      total_ap: stats.scores.ap || 0,
      // Generic scores
      scores: { ...stats.scores },
      wins: stats.wins,
      losses: stats.losses,
      draws: stats.draws,
      sos: sosMap.get(player.id) || 0,
      matches_played: stats.matchesPlayed,
    };
  });

  // Sort by tiebreaker hierarchy from game system config
  standings.sort((a, b) => {
    // Go through tiebreakers in order
    for (const tiebreaker of tiebreakers) {
      const aValue = tiebreaker === 'sos' ? a.sos : (a.scores?.[tiebreaker] ?? 0);
      const bValue = tiebreaker === 'sos' ? b.sos : (b.scores?.[tiebreaker] ?? 0);
      if (aValue !== bValue) {
        return bValue - aValue; // Descending order
      }
    }
    return 0;
  });

  // Assign ranks (handle ties)
  let currentRank = 1;
  for (let i = 0; i < standings.length; i++) {
    if (i > 0) {
      const prev = standings[i - 1];
      const curr = standings[i];

      // Check if tied with previous on all tiebreakers
      let isTied = true;
      for (const tiebreaker of tiebreakers) {
        const prevValue = tiebreaker === 'sos' ? prev.sos : (prev.scores?.[tiebreaker] ?? 0);
        const currValue = tiebreaker === 'sos' ? curr.sos : (curr.scores?.[tiebreaker] ?? 0);
        if (prevValue !== currValue) {
          isTied = false;
          break;
        }
      }

      if (!isTied) {
        currentRank = i + 1;
      }
    }
    standings[i].rank = currentRank;
  }

  return standings;
}

/**
 * Get scores for a player from a match
 * Tries generic scores first, falls back to legacy fields
 */
function getPlayerScores(
  match: MatchData,
  player: 'player1' | 'player2',
  scoreFields: { name: string }[]
): Record<string, number> {
  const scores: Record<string, number> = {};

  // Try generic scores first
  const genericScores = player === 'player1'
    ? match.scores?.player1
    : match.scores?.player2;

  if (genericScores && Object.keys(genericScores).length > 0) {
    return genericScores;
  }

  // Fallback to legacy fields (Infinity-specific)
  if (player === 'player1') {
    scores.op = match.player1_op || 0;
    scores.vp = match.player1_vp || 0;
    scores.ap = match.player1_ap || 0;
  } else {
    scores.op = match.player2_op || 0;
    scores.vp = match.player2_vp || 0;
    scores.ap = match.player2_ap || 0;
  }

  return scores;
}

/**
 * Determine winner of a match based on scores
 * Uses game system's determineWinner function
 *
 * @deprecated Use gameSystem.scoring.determineWinner instead
 */
export function determineWinner(
  player1Id: string,
  player2Id: string | null,
  player1Op: number,
  player2Op: number | null,
  gameSystemId: string = 'infinity'
): string | null {
  if (player2Id === null) {
    // Bye - player 1 wins by default
    return player1Id;
  }

  if (player2Op === null) {
    return null;
  }

  const gameSystem = getGameSystem(gameSystemId);

  const matchScores: GameMatchScores = {
    player1Id,
    player2Id,
    player1: { op: player1Op },
    player2: { op: player2Op },
  };

  return gameSystem.scoring.determineWinner(matchScores);
}

/**
 * Determine winner using full match scores
 */
export function determineMatchWinner(
  match: MatchData,
  gameSystemId: string = 'infinity'
): string | null {
  if (match.player2_id === null || match.is_bye) {
    return match.player1_id;
  }

  const gameSystem = getGameSystem(gameSystemId);
  const scoreFields = gameSystem.scoring.fields;

  const p1Scores = getPlayerScores(match, 'player1', scoreFields);
  const p2Scores = getPlayerScores(match, 'player2', scoreFields);

  const matchScores: GameMatchScores = {
    player1Id: match.player1_id,
    player2Id: match.player2_id,
    player1: p1Scores,
    player2: p2Scores,
  };

  return gameSystem.scoring.determineWinner(matchScores);
}
