'use server';

import { createClient } from '@/lib/supabase/server';
import { createRateLimiter, checkRateLimit } from '@/lib/rate-limit';

// Rate limiter: 30 submissions per minute per user
const scoreSubmissionLimiter = createRateLimiter({
  requests: 30,
  window: '1 m',
  prefix: '@infinity-tournament/score-submission',
});

export interface SubmitScoresParams {
  matchId: string;
  scores: Record<string, number>;
  isPlayer1: boolean;
  gameSystemId?: string;
}

export interface SubmitScoresResult {
  success: boolean;
  error?: string;
  rateLimitExceeded?: boolean;
  rateLimitHeaders?: {
    limit: string;
    remaining: string;
    reset: string;
  };
}

/**
 * Submit scores for a match with rate limiting
 */
export async function submitScores(
  params: SubmitScoresParams
): Promise<SubmitScoresResult> {
  const supabase = await createClient();

  // Get authenticated user
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { success: false, error: 'Not authenticated' };
  }

  // Apply rate limit by user ID
  const rateLimitResult = await checkRateLimit(scoreSubmissionLimiter, user.id);

  if (!rateLimitResult.success) {
    return {
      success: false,
      error: 'Too many score submissions. Please try again later.',
      rateLimitExceeded: true,
      rateLimitHeaders: {
        limit: rateLimitResult.headers['X-RateLimit-Limit'],
        remaining: rateLimitResult.headers['X-RateLimit-Remaining'],
        reset: rateLimitResult.headers['X-RateLimit-Reset'],
      },
    };
  }

  try {
    // Verify user is a participant in this match
    const { data: match, error: matchError } = await supabase
      .from('matches')
      .select('player1_id, player2_id, confirmed_by_p1, confirmed_by_p2, scores')
      .eq('id', params.matchId)
      .single();

    if (matchError || !match) {
      return { success: false, error: 'Match not found' };
    }

    // Verify user is a participant
    if (match.player1_id !== user.id && match.player2_id !== user.id) {
      return { success: false, error: 'Unauthorized: Not a participant in this match' };
    }

    // Determine which player the user is
    const isPlayer1 = match.player1_id === user.id;

    // Check if already confirmed
    const alreadyConfirmed = isPlayer1
      ? match.confirmed_by_p1
      : match.confirmed_by_p2;

    if (alreadyConfirmed) {
      return { success: false, error: 'Scores already confirmed' };
    }

    // Build scores JSONB update
    const currentScores = match.scores || { player1: {}, player2: {} };
    const newScores = isPlayer1
      ? { ...currentScores, player1: params.scores }
      : { ...currentScores, player2: params.scores };

    // Determine confirmation status
    const otherPlayerConfirmed = isPlayer1
      ? match.confirmed_by_p2
      : match.confirmed_by_p1;

    const confirmationStatus =
      otherPlayerConfirmed || (isPlayer1 ? currentScores.player2 : currentScores.player1)
        ? 'partial'
        : 'pending';

    // Build update data
    const updateData: Record<string, unknown> = {
      scores: newScores,
      confirmation_status: confirmationStatus,
    };

    // Set confirmation flag
    if (isPlayer1) {
      updateData.confirmed_by_p1 = true;
    } else {
      updateData.confirmed_by_p2 = true;
    }

    // Also update legacy fields for backwards compatibility (Infinity only)
    if (params.gameSystemId === 'infinity') {
      const prefix = isPlayer1 ? 'player1' : 'player2';
      if (params.scores.op !== undefined)
        updateData[`${prefix}_op`] = params.scores.op;
      if (params.scores.vp !== undefined)
        updateData[`${prefix}_vp`] = params.scores.vp;
      if (params.scores.ap !== undefined)
        updateData[`${prefix}_ap`] = params.scores.ap;
    }

    // Update match
    const { error: updateError } = await supabase
      .from('matches')
      .update(updateData)
      .eq('id', params.matchId);

    if (updateError) {
      return { success: false, error: updateError.message };
    }

    return {
      success: true,
      rateLimitHeaders: {
        limit: rateLimitResult.headers['X-RateLimit-Limit'],
        remaining: rateLimitResult.headers['X-RateLimit-Remaining'],
        reset: rateLimitResult.headers['X-RateLimit-Reset'],
      },
    };
  } catch (err) {
    console.error('Error submitting scores:', err);
    return { success: false, error: 'Failed to submit scores' };
  }
}

export interface ConfirmMatchParams {
  matchId: string;
  gameSystemId?: string;
}

export interface ConfirmMatchResult {
  success: boolean;
  error?: string;
  rateLimitExceeded?: boolean;
  rateLimitHeaders?: {
    limit: string;
    remaining: string;
    reset: string;
  };
}

/**
 * Confirm match result with rate limiting
 */
export async function confirmMatch(
  params: ConfirmMatchParams
): Promise<ConfirmMatchResult> {
  const supabase = await createClient();

  // Get authenticated user
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { success: false, error: 'Not authenticated' };
  }

  // Apply rate limit by user ID (use same limiter as score submission)
  const rateLimitResult = await checkRateLimit(scoreSubmissionLimiter, user.id);

  if (!rateLimitResult.success) {
    return {
      success: false,
      error: 'Too many requests. Please try again later.',
      rateLimitExceeded: true,
      rateLimitHeaders: {
        limit: rateLimitResult.headers['X-RateLimit-Limit'],
        remaining: rateLimitResult.headers['X-RateLimit-Remaining'],
        reset: rateLimitResult.headers['X-RateLimit-Reset'],
      },
    };
  }

  try {
    // Get fresh match data
    const { data: match, error: matchError } = await supabase
      .from('matches')
      .select('*')
      .eq('id', params.matchId)
      .single();

    if (matchError || !match) {
      return { success: false, error: 'Match not found' };
    }

    // Verify user is a participant
    if (match.player1_id !== user.id && match.player2_id !== user.id) {
      return { success: false, error: 'Unauthorized: Not a participant in this match' };
    }

    const isPlayer1 = match.player1_id === user.id;

    // Import game system dynamically to determine winner
    const { getGameSystem } = await import('@infinity-tournament/shared/games');
    const gameSystem = getGameSystem(params.gameSystemId || 'infinity');

    // Determine winner using game system's function
    const matchScores = match.scores || {
      player1: {
        op: match.player1_op || 0,
        vp: match.player1_vp || 0,
        ap: match.player1_ap || 0,
      },
      player2: {
        op: match.player2_op || 0,
        vp: match.player2_vp || 0,
        ap: match.player2_ap || 0,
      },
    };

    const winnerId = gameSystem.scoring.determineWinner({
      player1Id: match.player1_id,
      player2Id: match.player2_id,
      player1: matchScores.player1,
      player2: matchScores.player2,
    });

    const updateData: Record<string, unknown> = isPlayer1
      ? { confirmed_by_p1: true }
      : { confirmed_by_p2: true };

    // Check if both confirmed
    const bothConfirmed = isPlayer1
      ? match.confirmed_by_p2
      : match.confirmed_by_p1;

    if (bothConfirmed) {
      Object.assign(updateData, {
        confirmation_status: 'completed',
        winner_id: winnerId,
      });
    } else {
      Object.assign(updateData, {
        confirmation_status: 'partial',
      });
    }

    const { error: updateError } = await supabase
      .from('matches')
      .update(updateData)
      .eq('id', params.matchId);

    if (updateError) {
      return { success: false, error: updateError.message };
    }

    return {
      success: true,
      rateLimitHeaders: {
        limit: rateLimitResult.headers['X-RateLimit-Limit'],
        remaining: rateLimitResult.headers['X-RateLimit-Remaining'],
        reset: rateLimitResult.headers['X-RateLimit-Reset'],
      },
    };
  } catch (err) {
    console.error('Error confirming match:', err);
    return { success: false, error: 'Failed to confirm match' };
  }
}
