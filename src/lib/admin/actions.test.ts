import { describe, it, expect, vi, beforeEach, Mock } from 'vitest';
import { suspendUser, unsuspendUser, deleteTournament } from './actions';
import { createClient } from '@/lib/supabase/server';
import type { SupabaseClient } from '@supabase/supabase-js';

// Mock the Supabase client
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}));

describe('Admin Actions', () => {
  let mockSupabase: {
    auth: {
      getUser: Mock;
    };
    from: Mock;
  };

  beforeEach(() => {
    // Reset all mocks before each test
    vi.clearAllMocks();

    // Create a mock Supabase client
    mockSupabase = {
      auth: {
        getUser: vi.fn(),
      },
      from: vi.fn(),
    };

    (createClient as Mock).mockResolvedValue(mockSupabase);
  });

  describe('suspendUser', () => {
    it('should successfully suspend a user', async () => {
      const adminId = 'admin-123';
      const targetUserId = 'user-456';

      // Mock auth check - admin is authenticated
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: adminId } },
        error: null,
      });

      // Mock admin check query
      const mockAdminSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: { is_admin: true },
            error: null,
          }),
        }),
      });

      // Mock target user fetch
      const mockTargetUserSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: { id: targetUserId, name: 'Test User', status: 'active' },
            error: null,
          }),
        }),
      });

      // Mock user update
      const mockUpdate = vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({
          error: null,
        }),
      });

      // Mock admin log insert
      const mockInsert = vi.fn().mockResolvedValue({
        error: null,
      });

      // Setup from() mock to return different chains based on table
      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'users') {
          // First call is admin check, second is target user fetch
          const selectCallCount = mockSupabase.from.mock.calls.filter(
            (call) => call[0] === 'users'
          ).length;

          if (selectCallCount === 1) {
            return { select: mockAdminSelect };
          } else {
            return {
              select: mockTargetUserSelect,
              update: mockUpdate,
            };
          }
        } else if (table === 'admin_logs') {
          return { insert: mockInsert };
        }
      });

      const result = await suspendUser(targetUserId);

      expect(result.success).toBe(true);
      expect(result.error).toBeUndefined();
      expect(mockUpdate).toHaveBeenCalledWith({ status: 'suspended' });
      expect(mockInsert).toHaveBeenCalledWith({
        admin_id: adminId,
        action: 'suspend_user',
        target_type: 'user',
        target_id: targetUserId,
        details: { name: 'Test User' },
      });
    });

    it('should fail if user is not authenticated', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: new Error('Not authenticated'),
      });

      const result = await suspendUser('user-456');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Not authenticated');
    });

    it('should fail if user is not an admin', async () => {
      const userId = 'user-123';

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: userId } },
        error: null,
      });

      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { is_admin: false },
              error: null,
            }),
          }),
        }),
      });

      const result = await suspendUser('user-456');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Unauthorized: Admin access required');
    });

    it('should prevent admin from suspending their own account', async () => {
      const adminId = 'admin-123';

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: adminId } },
        error: null,
      });

      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { is_admin: true },
              error: null,
            }),
          }),
        }),
      });

      const result = await suspendUser(adminId);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Cannot suspend your own account');
    });

    it('should fail if target user is not found', async () => {
      const adminId = 'admin-123';

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: adminId } },
        error: null,
      });

      const mockAdminSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: { is_admin: true },
            error: null,
          }),
        }),
      });

      const mockTargetUserSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: null,
            error: new Error('User not found'),
          }),
        }),
      });

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'users') {
          const selectCallCount = mockSupabase.from.mock.calls.filter(
            (call) => call[0] === 'users'
          ).length;

          if (selectCallCount === 1) {
            return { select: mockAdminSelect };
          } else {
            return { select: mockTargetUserSelect };
          }
        }
      });

      const result = await suspendUser('nonexistent-user');

      expect(result.success).toBe(false);
      expect(result.error).toBe('User not found');
    });

    it('should fail if user is already suspended', async () => {
      const adminId = 'admin-123';
      const targetUserId = 'user-456';

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: adminId } },
        error: null,
      });

      const mockAdminSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: { is_admin: true },
            error: null,
          }),
        }),
      });

      const mockTargetUserSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: { id: targetUserId, name: 'Test User', status: 'suspended' },
            error: null,
          }),
        }),
      });

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'users') {
          const selectCallCount = mockSupabase.from.mock.calls.filter(
            (call) => call[0] === 'users'
          ).length;

          if (selectCallCount === 1) {
            return { select: mockAdminSelect };
          } else {
            return { select: mockTargetUserSelect };
          }
        }
      });

      const result = await suspendUser(targetUserId);

      expect(result.success).toBe(false);
      expect(result.error).toBe('User is already suspended');
    });
  });

  describe('unsuspendUser', () => {
    it('should successfully unsuspend a user', async () => {
      const adminId = 'admin-123';
      const targetUserId = 'user-456';

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: adminId } },
        error: null,
      });

      const mockAdminSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: { is_admin: true },
            error: null,
          }),
        }),
      });

      const mockTargetUserSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: { id: targetUserId, name: 'Test User', status: 'suspended' },
            error: null,
          }),
        }),
      });

      const mockUpdate = vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({
          error: null,
        }),
      });

      const mockInsert = vi.fn().mockResolvedValue({
        error: null,
      });

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'users') {
          const selectCallCount = mockSupabase.from.mock.calls.filter(
            (call) => call[0] === 'users'
          ).length;

          if (selectCallCount === 1) {
            return { select: mockAdminSelect };
          } else {
            return {
              select: mockTargetUserSelect,
              update: mockUpdate,
            };
          }
        } else if (table === 'admin_logs') {
          return { insert: mockInsert };
        }
      });

      const result = await unsuspendUser(targetUserId);

      expect(result.success).toBe(true);
      expect(result.error).toBeUndefined();
      expect(mockUpdate).toHaveBeenCalledWith({ status: 'active' });
      expect(mockInsert).toHaveBeenCalledWith({
        admin_id: adminId,
        action: 'unsuspend_user',
        target_type: 'user',
        target_id: targetUserId,
        details: { name: 'Test User' },
      });
    });

    it('should fail if user is not authenticated', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: new Error('Not authenticated'),
      });

      const result = await unsuspendUser('user-456');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Not authenticated');
    });

    it('should fail if user is not an admin', async () => {
      const userId = 'user-123';

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: userId } },
        error: null,
      });

      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { is_admin: false },
              error: null,
            }),
          }),
        }),
      });

      const result = await unsuspendUser('user-456');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Unauthorized: Admin access required');
    });

    it('should fail if target user is not found', async () => {
      const adminId = 'admin-123';

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: adminId } },
        error: null,
      });

      const mockAdminSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: { is_admin: true },
            error: null,
          }),
        }),
      });

      const mockTargetUserSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: null,
            error: new Error('User not found'),
          }),
        }),
      });

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'users') {
          const selectCallCount = mockSupabase.from.mock.calls.filter(
            (call) => call[0] === 'users'
          ).length;

          if (selectCallCount === 1) {
            return { select: mockAdminSelect };
          } else {
            return { select: mockTargetUserSelect };
          }
        }
      });

      const result = await unsuspendUser('nonexistent-user');

      expect(result.success).toBe(false);
      expect(result.error).toBe('User not found');
    });

    it('should fail if user is not suspended', async () => {
      const adminId = 'admin-123';
      const targetUserId = 'user-456';

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: adminId } },
        error: null,
      });

      const mockAdminSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: { is_admin: true },
            error: null,
          }),
        }),
      });

      const mockTargetUserSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: { id: targetUserId, name: 'Test User', status: 'active' },
            error: null,
          }),
        }),
      });

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'users') {
          const selectCallCount = mockSupabase.from.mock.calls.filter(
            (call) => call[0] === 'users'
          ).length;

          if (selectCallCount === 1) {
            return { select: mockAdminSelect };
          } else {
            return { select: mockTargetUserSelect };
          }
        }
      });

      const result = await unsuspendUser(targetUserId);

      expect(result.success).toBe(false);
      expect(result.error).toBe('User is not suspended');
    });
  });

  describe('deleteTournament', () => {
    it('should successfully delete a tournament', async () => {
      const adminId = 'admin-123';
      const tournamentId = 'tournament-789';

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: adminId } },
        error: null,
      });

      const mockAdminSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: { is_admin: true },
            error: null,
          }),
        }),
      });

      const mockTournamentSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: {
              id: tournamentId,
              name: 'Test Tournament',
              organizer_id: 'organizer-123',
            },
            error: null,
          }),
        }),
      });

      const mockDelete = vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({
          error: null,
        }),
      });

      const mockInsert = vi.fn().mockResolvedValue({
        error: null,
      });

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'users') {
          return { select: mockAdminSelect };
        } else if (table === 'tournaments') {
          return {
            select: mockTournamentSelect,
            delete: mockDelete,
          };
        } else if (table === 'admin_logs') {
          return { insert: mockInsert };
        }
      });

      const result = await deleteTournament(tournamentId);

      expect(result.success).toBe(true);
      expect(result.error).toBeUndefined();
      expect(mockDelete).toHaveBeenCalled();
      expect(mockInsert).toHaveBeenCalledWith({
        admin_id: adminId,
        action: 'delete_tournament',
        target_type: 'tournament',
        target_id: tournamentId,
        details: {
          name: 'Test Tournament',
          organizer_id: 'organizer-123',
        },
      });
    });

    it('should fail if user is not authenticated', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: new Error('Not authenticated'),
      });

      const result = await deleteTournament('tournament-789');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Not authenticated');
    });

    it('should fail if user is not an admin', async () => {
      const userId = 'user-123';

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: userId } },
        error: null,
      });

      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { is_admin: false },
              error: null,
            }),
          }),
        }),
      });

      const result = await deleteTournament('tournament-789');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Unauthorized: Admin access required');
    });

    it('should fail if tournament is not found', async () => {
      const adminId = 'admin-123';

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: adminId } },
        error: null,
      });

      const mockAdminSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: { is_admin: true },
            error: null,
          }),
        }),
      });

      const mockTournamentSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: null,
            error: new Error('Tournament not found'),
          }),
        }),
      });

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'users') {
          return { select: mockAdminSelect };
        } else if (table === 'tournaments') {
          return { select: mockTournamentSelect };
        }
      });

      const result = await deleteTournament('nonexistent-tournament');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Tournament not found');
    });

    it('should fail if delete operation fails', async () => {
      const adminId = 'admin-123';
      const tournamentId = 'tournament-789';

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: adminId } },
        error: null,
      });

      const mockAdminSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: { is_admin: true },
            error: null,
          }),
        }),
      });

      const mockTournamentSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: {
              id: tournamentId,
              name: 'Test Tournament',
              organizer_id: 'organizer-123',
            },
            error: null,
          }),
        }),
      });

      const mockDelete = vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({
          error: new Error('Database error'),
        }),
      });

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'users') {
          return { select: mockAdminSelect };
        } else if (table === 'tournaments') {
          return {
            select: mockTournamentSelect,
            delete: mockDelete,
          };
        }
      });

      const result = await deleteTournament(tournamentId);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Failed to delete tournament');
    });
  });
});
