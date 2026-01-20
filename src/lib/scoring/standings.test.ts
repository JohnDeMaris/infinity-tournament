import { describe, it, expect, vi, beforeEach } from 'vitest';
import { calculateStandings, determineWinner, determineMatchWinner } from './standings';

// Mock the game system module
vi.mock('@infinity-tournament/shared/games', () => ({
  getGameSystem: vi.fn(() => ({
    id: 'infinity',
    name: 'Infinity',
    scoring: {
      fields: [
        { name: 'op', label: 'Objective Points', min: 0, max: 10 },
        { name: 'vp', label: 'Victory Points', min: 0 },
        { name: 'ap', label: 'Army Points', min: 0 },
      ],
      tiebreakers: ['op', 'vp', 'sos'],
      determineWinner: (scores: { player1Id: string; player2Id: string; player1: Record<string, number>; player2: Record<string, number> }) => {
        const p1op = scores.player1.op ?? 0;
        const p2op = scores.player2.op ?? 0;
        if (p1op > p2op) return scores.player1Id;
        if (p2op > p1op) return scores.player2Id;
        return null; // Draw
      },
    },
  })),
}));

const createMatch = (
  player1_id: string,
  player2_id: string | null,
  p1Scores: { op: number; vp: number; ap: number },
  p2Scores: { op: number; vp: number; ap: number } | null,
  winner_id: string | null,
  is_bye = false
) => ({
  player1_id,
  player2_id,
  player1_op: p1Scores.op,
  player1_vp: p1Scores.vp,
  player1_ap: p1Scores.ap,
  player2_op: p2Scores?.op ?? null,
  player2_vp: p2Scores?.vp ?? null,
  player2_ap: p2Scores?.ap ?? null,
  scores: null,
  winner_id,
  is_bye,
  confirmation_status: 'completed',
});

const createPlayer = (id: string, name: string, faction: string | null = null) => ({
  id,
  name,
  faction,
});

describe('calculateStandings', () => {
  it('should return empty standings for empty players', () => {
    const result = calculateStandings([], []);
    expect(result).toEqual([]);
  });

  it('should return standings with zero scores for players with no matches', () => {
    const players = [createPlayer('p1', 'Player 1'), createPlayer('p2', 'Player 2')];
    const matches: ReturnType<typeof createMatch>[] = [];

    const result = calculateStandings(players, matches);

    expect(result).toHaveLength(2);
    expect(result[0].total_op).toBe(0);
    expect(result[0].total_vp).toBe(0);
    expect(result[0].total_ap).toBe(0);
    expect(result[0].wins).toBe(0);
    expect(result[0].losses).toBe(0);
    expect(result[0].draws).toBe(0);
    expect(result[0].sos).toBe(0);
  });

  it('should calculate standings from completed matches', () => {
    const players = [
      createPlayer('p1', 'Player 1'),
      createPlayer('p2', 'Player 2'),
    ];
    const matches = [
      createMatch('p1', 'p2', { op: 8, vp: 150, ap: 50 }, { op: 2, vp: 75, ap: 25 }, 'p1'),
    ];

    const result = calculateStandings(players, matches);

    const p1 = result.find(s => s.user_id === 'p1')!;
    expect(p1.total_op).toBe(8);
    expect(p1.total_vp).toBe(150);
    expect(p1.total_ap).toBe(50);
    expect(p1.wins).toBe(1);
    expect(p1.losses).toBe(0);
    expect(p1.matches_played).toBe(1);

    const p2 = result.find(s => s.user_id === 'p2')!;
    expect(p2.total_op).toBe(2);
    expect(p2.total_vp).toBe(75);
    expect(p2.total_ap).toBe(25);
    expect(p2.wins).toBe(0);
    expect(p2.losses).toBe(1);
    expect(p2.matches_played).toBe(1);
  });

  it('should rank players by tiebreaker order (OP > VP > SoS)', () => {
    const players = [
      createPlayer('p1', 'Player 1'),
      createPlayer('p2', 'Player 2'),
      createPlayer('p3', 'Player 3'),
    ];
    const matches = [
      // p1 beats p2
      createMatch('p1', 'p2', { op: 8, vp: 100, ap: 50 }, { op: 2, vp: 80, ap: 25 }, 'p1'),
      // p3 beats p1
      createMatch('p3', 'p1', { op: 7, vp: 90, ap: 40 }, { op: 3, vp: 60, ap: 30 }, 'p3'),
      // p2 beats p3
      createMatch('p2', 'p3', { op: 6, vp: 85, ap: 35 }, { op: 4, vp: 70, ap: 20 }, 'p2'),
    ];

    const result = calculateStandings(players, matches);

    // Rankings based on total OP:
    // p1: 8 + 3 = 11 OP
    // p3: 7 + 4 = 11 OP
    // p2: 2 + 6 = 8 OP
    // p1 and p3 tied on OP, use VP:
    // p1: 100 + 60 = 160 VP
    // p3: 90 + 70 = 160 VP
    // Still tied, use SoS (sum of opponents' OP)

    expect(result[0].total_op).toBe(11);
    expect(result[1].total_op).toBe(11);
    expect(result[2].total_op).toBe(8);
  });

  it('should handle byes correctly', () => {
    const players = [
      createPlayer('p1', 'Player 1'),
      createPlayer('p2', 'Player 2'),
      createPlayer('p3', 'Player 3'),
    ];
    const matches = [
      createMatch('p1', 'p2', { op: 8, vp: 100, ap: 50 }, { op: 2, vp: 80, ap: 25 }, 'p1'),
      // p3 gets a bye
      createMatch('p3', null, { op: 10, vp: 0, ap: 0 }, null, 'p3', true),
    ];

    const result = calculateStandings(players, matches);

    const p3 = result.find(s => s.user_id === 'p3')!;
    expect(p3.total_op).toBe(10);
    expect(p3.wins).toBe(1); // Bye counts as a win
    expect(p3.matches_played).toBe(1);
  });

  it('should handle draws', () => {
    const players = [
      createPlayer('p1', 'Player 1'),
      createPlayer('p2', 'Player 2'),
    ];
    const matches = [
      createMatch('p1', 'p2', { op: 5, vp: 100, ap: 50 }, { op: 5, vp: 100, ap: 50 }, null),
    ];

    const result = calculateStandings(players, matches);

    const p1 = result.find(s => s.user_id === 'p1')!;
    expect(p1.wins).toBe(0);
    expect(p1.losses).toBe(0);
    expect(p1.draws).toBe(1);

    const p2 = result.find(s => s.user_id === 'p2')!;
    expect(p2.wins).toBe(0);
    expect(p2.losses).toBe(0);
    expect(p2.draws).toBe(1);
  });

  it('should only include completed/confirmed matches', () => {
    const players = [createPlayer('p1', 'Player 1'), createPlayer('p2', 'Player 2')];
    const matches = [
      {
        ...createMatch('p1', 'p2', { op: 8, vp: 100, ap: 50 }, { op: 2, vp: 80, ap: 25 }, 'p1'),
        confirmation_status: 'pending', // Not completed
      },
    ];

    const result = calculateStandings(players, matches);

    // Should have zero scores since match is not completed
    const p1 = result.find(s => s.user_id === 'p1')!;
    expect(p1.total_op).toBe(0);
    expect(p1.wins).toBe(0);
  });

  it('should assign ranks correctly with ties', () => {
    const players = [
      createPlayer('p1', 'Player 1'),
      createPlayer('p2', 'Player 2'),
      createPlayer('p3', 'Player 3'),
      createPlayer('p4', 'Player 4'),
    ];
    const matches = [
      // p1 and p2 have same OP, same VP (tied)
      createMatch('p1', 'p3', { op: 8, vp: 100, ap: 50 }, { op: 2, vp: 50, ap: 25 }, 'p1'),
      createMatch('p2', 'p4', { op: 8, vp: 100, ap: 50 }, { op: 2, vp: 50, ap: 25 }, 'p2'),
    ];

    const result = calculateStandings(players, matches);

    // p1 and p2 should be tied at rank 1
    const p1 = result.find(s => s.user_id === 'p1')!;
    const p2 = result.find(s => s.user_id === 'p2')!;

    // Both should have same rank (1) since they're tied
    expect(p1.rank).toBe(p2.rank);
    expect(p1.rank).toBeLessThanOrEqual(2);

    // p3 and p4 should be tied at a lower rank
    const p3 = result.find(s => s.user_id === 'p3')!;
    const p4 = result.find(s => s.user_id === 'p4')!;
    expect(p3.rank).toBe(p4.rank);
  });

  it('should include player name and faction in standings', () => {
    const players = [
      createPlayer('p1', 'Alice', 'PanOceania'),
      createPlayer('p2', 'Bob', 'Yu Jing'),
    ];
    const matches: ReturnType<typeof createMatch>[] = [];

    const result = calculateStandings(players, matches);

    const p1 = result.find(s => s.user_id === 'p1')!;
    expect(p1.player_name).toBe('Alice');
    expect(p1.faction).toBe('PanOceania');

    const p2 = result.find(s => s.user_id === 'p2')!;
    expect(p2.player_name).toBe('Bob');
    expect(p2.faction).toBe('Yu Jing');
  });

  it('should calculate SoS (Strength of Schedule)', () => {
    const players = [
      createPlayer('p1', 'Player 1'),
      createPlayer('p2', 'Player 2'),
      createPlayer('p3', 'Player 3'),
    ];
    const matches = [
      // p1 beats p2, p2 scores 2 OP
      createMatch('p1', 'p2', { op: 8, vp: 100, ap: 50 }, { op: 2, vp: 50, ap: 25 }, 'p1'),
      // p2 beats p3, p3 scores 4 OP
      createMatch('p2', 'p3', { op: 6, vp: 80, ap: 40 }, { op: 4, vp: 60, ap: 30 }, 'p2'),
    ];

    const result = calculateStandings(players, matches);

    // p1's SoS = sum of opponents' OP = p2's OP = 2 + 6 = 8
    const p1 = result.find(s => s.user_id === 'p1')!;
    expect(p1.sos).toBe(8); // p2 has 8 total OP

    // p2's SoS = p1's OP + p3's OP = 8 + 4 = 12
    const p2 = result.find(s => s.user_id === 'p2')!;
    expect(p2.sos).toBe(12);

    // p3's SoS = p2's OP = 8
    const p3 = result.find(s => s.user_id === 'p3')!;
    expect(p3.sos).toBe(8);
  });
});

describe('determineWinner', () => {
  it('should return player1 for bye', () => {
    const result = determineWinner('p1', null, 10, null);
    expect(result).toBe('p1');
  });

  it('should return player1 when p1 has higher OP', () => {
    const result = determineWinner('p1', 'p2', 8, 2);
    expect(result).toBe('p1');
  });

  it('should return player2 when p2 has higher OP', () => {
    const result = determineWinner('p1', 'p2', 2, 8);
    expect(result).toBe('p2');
  });

  it('should return null for draw', () => {
    const result = determineWinner('p1', 'p2', 5, 5);
    expect(result).toBeNull();
  });

  it('should return null when player2 OP is null', () => {
    const result = determineWinner('p1', 'p2', 5, null);
    expect(result).toBeNull();
  });
});

describe('determineMatchWinner', () => {
  it('should return player1 for bye match', () => {
    const match = createMatch('p1', null, { op: 10, vp: 0, ap: 0 }, null, null, true);
    const result = determineMatchWinner(match);
    expect(result).toBe('p1');
  });

  it('should return winner based on OP comparison', () => {
    const match = createMatch('p1', 'p2', { op: 8, vp: 100, ap: 50 }, { op: 2, vp: 150, ap: 75 }, null);
    const result = determineMatchWinner(match);
    expect(result).toBe('p1');
  });

  it('should return null for draw', () => {
    const match = createMatch('p1', 'p2', { op: 5, vp: 100, ap: 50 }, { op: 5, vp: 100, ap: 50 }, null);
    const result = determineMatchWinner(match);
    expect(result).toBeNull();
  });
});
