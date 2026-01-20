import { createClient } from '@/lib/supabase/server';

export interface PlayerOverallStats {
  userId: string;
  tournamentsPlayed: number;
  matchesPlayed: number;
  wins: number;
  losses: number;
  draws: number;
  winRate: number; // percentage
  avgOP: number;
}

export interface FactionStats {
  faction: string;
  matchesPlayed: number;
  wins: number;
  losses: number;
  draws: number;
  winRate: number;
}

export interface TournamentResult {
  tournamentId: string;
  tournamentName: string;
  date: string;
  location: string;
  faction: string | null;
  placement: number | null;
  totalPlayers: number;
  matchesWon: number;
  matchesLost: number;
  matchesDrawn: number;
  totalOP: number;
  totalVP: number;
  totalAP: number;
}

export interface HeadToHeadRecord {
  opponentId: string;
  opponentName: string;
  matchesPlayed: number;
  wins: number;
  losses: number;
  draws: number;
}

/**
 * Helper to get player scores from match (handles both legacy and new format)
 */
function getPlayerScore(
  match: any,
  playerId: string,
  field: 'op' | 'vp' | 'ap'
): number {
  const isPlayer1 = match.player1_id === playerId;

  // Try new format first (scores JSONB)
  if (match.scores) {
    const playerKey = isPlayer1 ? 'player1' : 'player2';
    if (match.scores[playerKey] && match.scores[playerKey][field] !== undefined) {
      return match.scores[playerKey][field];
    }
  }

  // Fallback to legacy format
  const legacyField = isPlayer1 ? `player1_${field}` : `player2_${field}`;
  return match[legacyField] || 0;
}

/**
 * Get overall stats for a player
 */
export async function getPlayerStats(userId: string): Promise<PlayerOverallStats | null> {
  const supabase = await createClient();

  // Get all matches where player participated (excluding byes)
  const { data: matches, error } = await supabase
    .from('matches')
    .select(`
      id,
      player1_id,
      player2_id,
      winner_id,
      is_bye,
      player1_op,
      player2_op,
      player1_vp,
      player2_vp,
      player1_ap,
      player2_ap,
      scores,
      round:rounds!inner(
        tournament_id
      )
    `)
    .or(`player1_id.eq.${userId},player2_id.eq.${userId}`)
    .eq('is_bye', false);

  if (error) {
    console.error('Error fetching player stats:', error);
    return null;
  }

  if (!matches || matches.length === 0) {
    return {
      userId,
      tournamentsPlayed: 0,
      matchesPlayed: 0,
      wins: 0,
      losses: 0,
      draws: 0,
      winRate: 0,
      avgOP: 0,
    };
  }

  // Calculate stats
  let wins = 0;
  let losses = 0;
  let draws = 0;
  let totalOP = 0;
  const tournamentIds = new Set<string>();

  for (const match of matches) {
    // Count tournament
    if (match.round && Array.isArray(match.round) && match.round.length > 0) {
      tournamentIds.add(match.round[0].tournament_id);
    }

    // Count wins/losses/draws
    if (match.winner_id === userId) {
      wins++;
    } else if (match.winner_id === null) {
      draws++;
    } else {
      losses++;
    }

    // Sum OP
    totalOP += getPlayerScore(match, userId, 'op');
  }

  const matchesPlayed = matches.length;
  const winRate = matchesPlayed > 0 ? (wins / matchesPlayed) * 100 : 0;
  const avgOP = matchesPlayed > 0 ? totalOP / matchesPlayed : 0;

  return {
    userId,
    tournamentsPlayed: tournamentIds.size,
    matchesPlayed,
    wins,
    losses,
    draws,
    winRate,
    avgOP,
  };
}

/**
 * Get stats broken down by faction
 */
export async function getPlayerFactionStats(userId: string): Promise<FactionStats[]> {
  const supabase = await createClient();

  // Get all registrations with matches
  const { data: registrations, error: regError } = await supabase
    .from('registrations')
    .select(`
      tournament_id,
      army_faction
    `)
    .eq('user_id', userId);

  if (regError || !registrations) {
    console.error('Error fetching registrations:', regError);
    return [];
  }

  // Get all matches for this player
  const { data: matches, error: matchError } = await supabase
    .from('matches')
    .select(`
      id,
      player1_id,
      player2_id,
      winner_id,
      is_bye,
      round:rounds!inner(
        tournament_id
      )
    `)
    .or(`player1_id.eq.${userId},player2_id.eq.${userId}`)
    .eq('is_bye', false);

  if (matchError || !matches) {
    console.error('Error fetching matches:', matchError);
    return [];
  }

  // Build map of tournament_id -> faction
  const tournamentFactionMap = new Map<string, string>();
  for (const reg of registrations) {
    if (reg.army_faction) {
      tournamentFactionMap.set(reg.tournament_id, reg.army_faction);
    }
  }

  // Aggregate stats by faction
  const factionStatsMap = new Map<string, {
    wins: number;
    losses: number;
    draws: number;
    matchesPlayed: number;
  }>();

  for (const match of matches) {
    if (!match.round || !Array.isArray(match.round) || match.round.length === 0) {
      continue;
    }

    const tournamentId = match.round[0].tournament_id;
    const faction = tournamentFactionMap.get(tournamentId);

    if (!faction) continue;

    if (!factionStatsMap.has(faction)) {
      factionStatsMap.set(faction, {
        wins: 0,
        losses: 0,
        draws: 0,
        matchesPlayed: 0,
      });
    }

    const stats = factionStatsMap.get(faction)!;
    stats.matchesPlayed++;

    if (match.winner_id === userId) {
      stats.wins++;
    } else if (match.winner_id === null) {
      stats.draws++;
    } else {
      stats.losses++;
    }
  }

  // Convert to array
  const result: FactionStats[] = [];
  for (const [faction, stats] of factionStatsMap.entries()) {
    result.push({
      faction,
      matchesPlayed: stats.matchesPlayed,
      wins: stats.wins,
      losses: stats.losses,
      draws: stats.draws,
      winRate: stats.matchesPlayed > 0 ? (stats.wins / stats.matchesPlayed) * 100 : 0,
    });
  }

  return result.sort((a, b) => b.matchesPlayed - a.matchesPlayed);
}

/**
 * Get tournament history for a player
 */
export async function getPlayerTournamentHistory(userId: string): Promise<TournamentResult[]> {
  const supabase = await createClient();

  // Get all registrations with tournament details
  const { data: registrations, error: regError } = await supabase
    .from('registrations')
    .select(`
      tournament_id,
      army_faction,
      tournament:tournaments(
        id,
        name,
        date_start,
        location
      )
    `)
    .eq('user_id', userId);

  if (regError || !registrations) {
    console.error('Error fetching tournament registrations:', regError);
    return [];
  }

  const results: TournamentResult[] = [];

  for (const reg of registrations) {
    if (!reg.tournament || !Array.isArray(reg.tournament) || reg.tournament.length === 0) {
      continue;
    }

    const tournament = reg.tournament[0];
    const tournamentId = reg.tournament_id;

    // Get all matches for this tournament
    const { data: matches, error: matchError } = await supabase
      .from('matches')
      .select(`
        id,
        player1_id,
        player2_id,
        winner_id,
        is_bye,
        player1_op,
        player2_op,
        player1_vp,
        player2_vp,
        player1_ap,
        player2_ap,
        scores,
        round:rounds!inner(
          tournament_id
        )
      `)
      .or(`player1_id.eq.${userId},player2_id.eq.${userId}`)
      .eq('rounds.tournament_id', tournamentId)
      .eq('is_bye', false);

    if (matchError) {
      console.error('Error fetching matches for tournament:', matchError);
      continue;
    }

    // Calculate stats for this tournament
    let matchesWon = 0;
    let matchesLost = 0;
    let matchesDrawn = 0;
    let totalOP = 0;
    let totalVP = 0;
    let totalAP = 0;

    if (matches) {
      for (const match of matches) {
        if (match.winner_id === userId) {
          matchesWon++;
        } else if (match.winner_id === null) {
          matchesDrawn++;
        } else {
          matchesLost++;
        }

        totalOP += getPlayerScore(match, userId, 'op');
        totalVP += getPlayerScore(match, userId, 'vp');
        totalAP += getPlayerScore(match, userId, 'ap');
      }
    }

    // Get total players count
    const { count: totalPlayers } = await supabase
      .from('registrations')
      .select('*', { count: 'exact', head: true })
      .eq('tournament_id', tournamentId);

    // Get placement (would need standings calculation)
    // For now, set to null - could be enhanced with standings query
    const placement = null;

    results.push({
      tournamentId,
      tournamentName: tournament.name,
      date: tournament.date_start,
      location: tournament.location,
      faction: reg.army_faction,
      placement,
      totalPlayers: totalPlayers || 0,
      matchesWon,
      matchesLost,
      matchesDrawn,
      totalOP,
      totalVP,
      totalAP,
    });
  }

  // Sort by date, most recent first
  return results.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

/**
 * Get head-to-head record against a specific opponent
 */
export async function getHeadToHead(userId: string, opponentId: string): Promise<HeadToHeadRecord | null> {
  const supabase = await createClient();

  // Get opponent info
  const { data: opponent, error: userError } = await supabase
    .from('users')
    .select('name')
    .eq('id', opponentId)
    .single();

  if (userError || !opponent) {
    console.error('Error fetching opponent:', userError);
    return null;
  }

  // Get all matches between these two players
  const { data: matches, error: matchError } = await supabase
    .from('matches')
    .select('id, player1_id, player2_id, winner_id, is_bye')
    .or(`and(player1_id.eq.${userId},player2_id.eq.${opponentId}),and(player1_id.eq.${opponentId},player2_id.eq.${userId})`)
    .eq('is_bye', false);

  if (matchError) {
    console.error('Error fetching head-to-head matches:', matchError);
    return null;
  }

  if (!matches || matches.length === 0) {
    return {
      opponentId,
      opponentName: opponent.name,
      matchesPlayed: 0,
      wins: 0,
      losses: 0,
      draws: 0,
    };
  }

  // Calculate record
  let wins = 0;
  let losses = 0;
  let draws = 0;

  for (const match of matches) {
    if (match.winner_id === userId) {
      wins++;
    } else if (match.winner_id === null) {
      draws++;
    } else {
      losses++;
    }
  }

  return {
    opponentId,
    opponentName: opponent.name,
    matchesPlayed: matches.length,
    wins,
    losses,
    draws,
  };
}

/**
 * Get all head-to-head records for a player
 */
export async function getAllHeadToHead(userId: string): Promise<HeadToHeadRecord[]> {
  const supabase = await createClient();

  // Get all matches for this player
  const { data: matches, error: matchError } = await supabase
    .from('matches')
    .select('id, player1_id, player2_id, winner_id, is_bye')
    .or(`player1_id.eq.${userId},player2_id.eq.${userId}`)
    .eq('is_bye', false);

  if (matchError || !matches) {
    console.error('Error fetching matches:', matchError);
    return [];
  }

  // Build set of unique opponent IDs
  const opponentIds = new Set<string>();
  for (const match of matches) {
    if (match.player1_id === userId && match.player2_id) {
      opponentIds.add(match.player2_id);
    } else if (match.player2_id === userId) {
      opponentIds.add(match.player1_id);
    }
  }

  // Get all head-to-head records
  const records: HeadToHeadRecord[] = [];
  for (const opponentId of opponentIds) {
    const record = await getHeadToHead(userId, opponentId);
    if (record) {
      records.push(record);
    }
  }

  // Sort by matches played (most matches first)
  return records.sort((a, b) => b.matchesPlayed - a.matchesPlayed);
}
