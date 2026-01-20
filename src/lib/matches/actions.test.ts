/**
 * Tests for match score submission with rate limiting
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { submitScores, confirmMatch } from './actions';

// Mock dependencies
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}));

vi.mock('@/lib/rate-limit', () => ({
  createRateLimiter: vi.fn(),
  checkRateLimit: vi.fn(),
}));

describe('Score Submission Rate Limiting', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should enforce rate limit of 30 submissions per minute', async () => {
    const { createClient } = await import('@/lib/supabase/server');
    const { checkRateLimit } = await import('@/lib/rate-limit');

    // Mock authenticated user
    const mockSupabase = {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: 'user-123' } },
          error: null,
        }),
      },
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: null,
        error: null,
      }),
    };

    (createClient as any).mockResolvedValue(mockSupabase);

    // Mock rate limit exceeded
    (checkRateLimit as any).mockResolvedValue({
      success: false,
      limit: 30,
      remaining: 0,
      reset: Date.now() + 60000,
      headers: {
        'X-RateLimit-Limit': '30',
        'X-RateLimit-Remaining': '0',
        'X-RateLimit-Reset': String(Date.now() + 60000),
      },
    });

    const result = await submitScores({
      matchId: 'match-123',
      scores: { op: 10, vp: 5, ap: 3 },
      isPlayer1: true,
      gameSystemId: 'infinity',
    });

    expect(result.success).toBe(false);
    expect(result.rateLimitExceeded).toBe(true);
    expect(result.error).toContain('Too many score submissions');
  });

  it('should allow score submission when under rate limit', async () => {
    const { createClient } = await import('@/lib/supabase/server');
    const { checkRateLimit } = await import('@/lib/rate-limit');

    // Mock authenticated user
    const mockSupabase = {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: 'user-123' } },
          error: null,
        }),
      },
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: {
          player1_id: 'user-123',
          player2_id: 'user-456',
          confirmed_by_p1: false,
          confirmed_by_p2: false,
          scores: { player1: {}, player2: {} },
        },
        error: null,
      }),
      update: vi.fn().mockReturnThis(),
    };

    (createClient as any).mockResolvedValue(mockSupabase);

    // Mock rate limit not exceeded
    (checkRateLimit as any).mockResolvedValue({
      success: true,
      limit: 30,
      remaining: 25,
      reset: Date.now() + 60000,
      headers: {
        'X-RateLimit-Limit': '30',
        'X-RateLimit-Remaining': '25',
        'X-RateLimit-Reset': String(Date.now() + 60000),
      },
    });

    mockSupabase.update.mockResolvedValue({ error: null });

    const result = await submitScores({
      matchId: 'match-123',
      scores: { op: 10, vp: 5, ap: 3 },
      isPlayer1: true,
      gameSystemId: 'infinity',
    });

    expect(result.success).toBe(true);
    expect(result.rateLimitExceeded).toBeUndefined();
  });

  it('should rate limit by user ID, not IP address', async () => {
    const { createClient } = await import('@/lib/supabase/server');
    const { checkRateLimit } = await import('@/lib/rate-limit');

    // Mock authenticated user
    const mockSupabase = {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: 'user-123' } },
          error: null,
        }),
      },
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: null,
        error: null,
      }),
    };

    (createClient as any).mockResolvedValue(mockSupabase);
    (checkRateLimit as any).mockResolvedValue({
      success: false,
      limit: 30,
      remaining: 0,
      reset: Date.now() + 60000,
      headers: {
        'X-RateLimit-Limit': '30',
        'X-RateLimit-Remaining': '0',
        'X-RateLimit-Reset': String(Date.now() + 60000),
      },
    });

    await submitScores({
      matchId: 'match-123',
      scores: { op: 10, vp: 5, ap: 3 },
      isPlayer1: true,
      gameSystemId: 'infinity',
    });

    // Verify checkRateLimit was called with user ID
    expect(checkRateLimit).toHaveBeenCalledWith(
      expect.anything(),
      'user-123' // User ID, not IP
    );
  });
});
