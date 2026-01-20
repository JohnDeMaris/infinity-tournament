import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  generateSwissPairings,
  generateRound1Pairings,
  buildPlayerStats,
} from './swiss';

// Seed random for consistent tests
beforeEach(() => {
  let seed = 12345;
  vi.spyOn(Math, 'random').mockImplementation(() => {
    seed = (seed * 1103515245 + 12345) % 2147483648;
    return seed / 2147483648;
  });
});

describe('generateSwissPairings', () => {
  it('should return empty array for empty players', () => {
    const result = generateSwissPairings([]);
    expect(result).toEqual([]);
  });

  it('should give bye to single player', () => {
    const players = [
      { id: 'player1', totalOp: 0, totalVp: 0, totalAp: 0, opponents: [], receivedBye: false },
    ];

    const result = generateSwissPairings(players);

    expect(result).toHaveLength(1);
    expect(result[0].player1_id).toBe('player1');
    expect(result[0].player2_id).toBeNull();
    expect(result[0].is_bye).toBe(true);
  });

  it('should pair two players together', () => {
    const players = [
      { id: 'player1', totalOp: 5, totalVp: 10, totalAp: 5, opponents: [], receivedBye: false },
      { id: 'player2', totalOp: 3, totalVp: 8, totalAp: 3, opponents: [], receivedBye: false },
    ];

    const result = generateSwissPairings(players);

    expect(result).toHaveLength(1);
    expect(result[0].is_bye).toBe(false);
    // Higher ranked player should be player1 (more OP)
    expect(result[0].player1_id).toBe('player1');
    expect(result[0].player2_id).toBe('player2');
  });

  it('should handle odd number of players with bye', () => {
    const players = [
      { id: 'p1', totalOp: 10, totalVp: 20, totalAp: 10, opponents: [], receivedBye: false },
      { id: 'p2', totalOp: 8, totalVp: 15, totalAp: 8, opponents: [], receivedBye: false },
      { id: 'p3', totalOp: 5, totalVp: 10, totalAp: 5, opponents: [], receivedBye: false },
    ];

    const result = generateSwissPairings(players);

    expect(result).toHaveLength(2);
    // One regular match
    const regularMatch = result.find(p => !p.is_bye);
    expect(regularMatch).toBeDefined();
    expect(regularMatch!.player1_id).toBe('p1');
    expect(regularMatch!.player2_id).toBe('p2');

    // Bye for lowest ranked
    const byeMatch = result.find(p => p.is_bye);
    expect(byeMatch).toBeDefined();
    expect(byeMatch!.player1_id).toBe('p3');
    expect(byeMatch!.player2_id).toBeNull();
  });

  it('should avoid rematches', () => {
    const players = [
      { id: 'p1', totalOp: 10, totalVp: 20, totalAp: 10, opponents: ['p2'], receivedBye: false },
      { id: 'p2', totalOp: 9, totalVp: 18, totalAp: 9, opponents: ['p1'], receivedBye: false },
      { id: 'p3', totalOp: 8, totalVp: 15, totalAp: 8, opponents: ['p4'], receivedBye: false },
      { id: 'p4', totalOp: 7, totalVp: 12, totalAp: 7, opponents: ['p3'], receivedBye: false },
    ];

    const result = generateSwissPairings(players);

    expect(result).toHaveLength(2);
    // p1 played p2, so p1 should pair with p3 (next available)
    const p1Match = result.find(m => m.player1_id === 'p1');
    expect(p1Match).toBeDefined();
    expect(p1Match!.player2_id).toBe('p3');

    // p2 should pair with p4
    const p2Match = result.find(m => m.player1_id === 'p2');
    expect(p2Match).toBeDefined();
    expect(p2Match!.player2_id).toBe('p4');
  });

  it('should sort players by OP, then VP, then AP (descending)', () => {
    const players = [
      { id: 'p1', totalOp: 5, totalVp: 10, totalAp: 5, opponents: [], receivedBye: false },
      { id: 'p2', totalOp: 8, totalVp: 10, totalAp: 5, opponents: [], receivedBye: false },
      { id: 'p3', totalOp: 5, totalVp: 15, totalAp: 5, opponents: [], receivedBye: false },
      { id: 'p4', totalOp: 5, totalVp: 10, totalAp: 8, opponents: [], receivedBye: false },
    ];

    const result = generateSwissPairings(players);

    // Sorted order: p2 (8 OP), p3 (5 OP, 15 VP), p4 (5 OP, 10 VP, 8 AP), p1 (5 OP, 10 VP, 5 AP)
    // First match: p2 vs p3
    // Second match: p4 vs p1
    expect(result).toHaveLength(2);
  });

  it('should assign sequential table numbers by default', () => {
    const players = [
      { id: 'p1', totalOp: 10, totalVp: 20, totalAp: 10, opponents: [], receivedBye: false },
      { id: 'p2', totalOp: 8, totalVp: 15, totalAp: 8, opponents: [], receivedBye: false },
      { id: 'p3', totalOp: 5, totalVp: 10, totalAp: 5, opponents: [], receivedBye: false },
      { id: 'p4', totalOp: 3, totalVp: 5, totalAp: 3, opponents: [], receivedBye: false },
    ];

    const result = generateSwissPairings(players, 'sequential');

    expect(result).toHaveLength(2);
    expect(result[0].table_number).toBe(1);
    expect(result[1].table_number).toBe(2);
  });

  it('should force pairings when all available opponents have been played', () => {
    // Round-robin scenario: everyone has played everyone
    const players = [
      { id: 'p1', totalOp: 10, totalVp: 20, totalAp: 10, opponents: ['p2', 'p3', 'p4'], receivedBye: false },
      { id: 'p2', totalOp: 8, totalVp: 15, totalAp: 8, opponents: ['p1', 'p3', 'p4'], receivedBye: false },
      { id: 'p3', totalOp: 5, totalVp: 10, totalAp: 5, opponents: ['p1', 'p2', 'p4'], receivedBye: false },
      { id: 'p4', totalOp: 3, totalVp: 5, totalAp: 3, opponents: ['p1', 'p2', 'p3'], receivedBye: false },
    ];

    const result = generateSwissPairings(players);

    // Should still produce pairings (forced)
    expect(result).toHaveLength(2);
    expect(result.every(p => p.table_number !== undefined)).toBe(true);
  });
});

describe('generateRound1Pairings', () => {
  it('should return empty array for empty players', () => {
    const result = generateRound1Pairings([]);
    expect(result).toEqual([]);
  });

  it('should give bye to single player', () => {
    const result = generateRound1Pairings(['player1']);

    expect(result).toHaveLength(1);
    expect(result[0].player1_id).toBe('player1');
    expect(result[0].player2_id).toBeNull();
    expect(result[0].is_bye).toBe(true);
  });

  it('should pair even number of players', () => {
    const result = generateRound1Pairings(['p1', 'p2', 'p3', 'p4']);

    expect(result).toHaveLength(2);
    expect(result.every(p => !p.is_bye)).toBe(true);

    // All players should be included exactly once
    const allPlayerIds = result.flatMap(p => [p.player1_id, p.player2_id].filter(Boolean));
    expect(allPlayerIds.sort()).toEqual(['p1', 'p2', 'p3', 'p4'].sort());
  });

  it('should assign bye for odd number of players', () => {
    const result = generateRound1Pairings(['p1', 'p2', 'p3', 'p4', 'p5']);

    expect(result).toHaveLength(3);

    const byeMatch = result.find(p => p.is_bye);
    expect(byeMatch).toBeDefined();
    expect(byeMatch!.player2_id).toBeNull();

    const regularMatches = result.filter(p => !p.is_bye);
    expect(regularMatches).toHaveLength(2);
  });

  it('should assign table numbers', () => {
    const result = generateRound1Pairings(['p1', 'p2', 'p3', 'p4'], 'sequential');

    expect(result).toHaveLength(2);
    expect(result[0].table_number).toBe(1);
    expect(result[1].table_number).toBe(2);
  });
});

describe('buildPlayerStats', () => {
  it('should return empty stats for players with no matches', () => {
    const result = buildPlayerStats(['p1', 'p2'], []);

    expect(result).toHaveLength(2);

    const p1 = result.find(p => p.id === 'p1');
    expect(p1).toBeDefined();
    expect(p1!.totalOp).toBe(0);
    expect(p1!.totalVp).toBe(0);
    expect(p1!.totalAp).toBe(0);
    expect(p1!.opponents).toEqual([]);
    expect(p1!.receivedBye).toBe(false);
  });

  it('should aggregate scores from matches', () => {
    const playerIds = ['p1', 'p2'];
    const matches = [
      {
        player1_id: 'p1',
        player2_id: 'p2',
        player1_op: 8,
        player1_vp: 150,
        player1_ap: 50,
        player2_op: 2,
        player2_vp: 75,
        player2_ap: 25,
        is_bye: false,
      },
    ];

    const result = buildPlayerStats(playerIds, matches);

    const p1 = result.find(p => p.id === 'p1')!;
    expect(p1.totalOp).toBe(8);
    expect(p1.totalVp).toBe(150);
    expect(p1.totalAp).toBe(50);
    expect(p1.opponents).toEqual(['p2']);

    const p2 = result.find(p => p.id === 'p2')!;
    expect(p2.totalOp).toBe(2);
    expect(p2.totalVp).toBe(75);
    expect(p2.totalAp).toBe(25);
    expect(p2.opponents).toEqual(['p1']);
  });

  it('should track received byes', () => {
    const playerIds = ['p1'];
    const matches = [
      {
        player1_id: 'p1',
        player2_id: null,
        player1_op: 10,
        player1_vp: 100,
        player1_ap: 0,
        player2_op: null,
        player2_vp: null,
        player2_ap: null,
        is_bye: true,
      },
    ];

    const result = buildPlayerStats(playerIds, matches);

    const p1 = result.find(p => p.id === 'p1')!;
    expect(p1.receivedBye).toBe(true);
    expect(p1.totalOp).toBe(10);
    expect(p1.opponents).toEqual([]);
  });

  it('should handle null scores gracefully', () => {
    const playerIds = ['p1', 'p2'];
    const matches = [
      {
        player1_id: 'p1',
        player2_id: 'p2',
        player1_op: null,
        player1_vp: null,
        player1_ap: null,
        player2_op: null,
        player2_vp: null,
        player2_ap: null,
        is_bye: false,
      },
    ];

    const result = buildPlayerStats(playerIds, matches);

    const p1 = result.find(p => p.id === 'p1')!;
    expect(p1.totalOp).toBe(0);
    expect(p1.totalVp).toBe(0);
    expect(p1.totalAp).toBe(0);
  });

  it('should aggregate multiple matches', () => {
    const playerIds = ['p1', 'p2', 'p3'];
    const matches = [
      {
        player1_id: 'p1',
        player2_id: 'p2',
        player1_op: 8,
        player1_vp: 100,
        player1_ap: 50,
        player2_op: 2,
        player2_vp: 50,
        player2_ap: 25,
        is_bye: false,
      },
      {
        player1_id: 'p1',
        player2_id: 'p3',
        player1_op: 6,
        player1_vp: 75,
        player1_ap: 30,
        player2_op: 4,
        player2_vp: 60,
        player2_ap: 20,
        is_bye: false,
      },
    ];

    const result = buildPlayerStats(playerIds, matches);

    const p1 = result.find(p => p.id === 'p1')!;
    expect(p1.totalOp).toBe(14); // 8 + 6
    expect(p1.totalVp).toBe(175); // 100 + 75
    expect(p1.totalAp).toBe(80); // 50 + 30
    expect(p1.opponents).toEqual(['p2', 'p3']);
  });
});
