'use server';

import { createClient } from '@/lib/supabase/server';
import type { SupabaseClient } from '@supabase/supabase-js';
import { validateCsrfOrThrow } from '@/lib/csrf';

/**
 * Helper to log admin actions to the admin_logs table
 */
async function logAdminAction(
  supabase: SupabaseClient,
  adminId: string,
  action: string,
  targetType: 'user' | 'tournament' | 'match' | 'registration',
  targetId: string,
  details?: Record<string, unknown>
): Promise<void> {
  const { error } = await supabase.from('admin_logs').insert({
    admin_id: adminId,
    action,
    target_type: targetType,
    target_id: targetId,
    details: details ?? null,
  });

  if (error) {
    console.error('Failed to log admin action:', error);
  }
}

/**
 * Verify the current user is an admin
 */
async function verifyAdmin(
  supabase: SupabaseClient
): Promise<{ isAdmin: boolean; userId: string | null; error?: string }> {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { isAdmin: false, userId: null, error: 'Not authenticated' };
  }

  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('is_admin')
    .eq('id', user.id)
    .single();

  if (userError || !userData) {
    return { isAdmin: false, userId: user.id, error: 'User not found' };
  }

  if (!userData.is_admin) {
    return { isAdmin: false, userId: user.id, error: 'Unauthorized: Admin access required' };
  }

  return { isAdmin: true, userId: user.id };
}

/**
 * Suspend a user account
 */
export async function suspendUser(
  userId: string,
  csrfToken: string | null | undefined
): Promise<{ success: boolean; error?: string }> {
  try {
    // Validate CSRF token
    await validateCsrfOrThrow(csrfToken);
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'CSRF validation failed' };
  }

  const supabase = await createClient();

  // Verify admin access
  const adminCheck = await verifyAdmin(supabase);
  if (!adminCheck.isAdmin || !adminCheck.userId) {
    return { success: false, error: adminCheck.error };
  }

  // Prevent self-suspension
  if (userId === adminCheck.userId) {
    return { success: false, error: 'Cannot suspend your own account' };
  }

  // Suspend the user
  const { data: targetUser, error: fetchError } = await supabase
    .from('users')
    .select('id, name, status')
    .eq('id', userId)
    .single();

  if (fetchError || !targetUser) {
    return { success: false, error: 'User not found' };
  }

  if (targetUser.status === 'suspended') {
    return { success: false, error: 'User is already suspended' };
  }

  const { error: updateError } = await supabase
    .from('users')
    .update({ status: 'suspended' })
    .eq('id', userId);

  if (updateError) {
    return { success: false, error: 'Failed to suspend user' };
  }

  // Log the action
  await logAdminAction(supabase, adminCheck.userId, 'suspend_user', 'user', userId, {
    name: targetUser.name,
  });

  return { success: true };
}

/**
 * Unsuspend a user account
 */
export async function unsuspendUser(
  userId: string,
  csrfToken: string | null | undefined
): Promise<{ success: boolean; error?: string }> {
  try {
    // Validate CSRF token
    await validateCsrfOrThrow(csrfToken);
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'CSRF validation failed' };
  }

  const supabase = await createClient();

  // Verify admin access
  const adminCheck = await verifyAdmin(supabase);
  if (!adminCheck.isAdmin || !adminCheck.userId) {
    return { success: false, error: adminCheck.error };
  }

  // Get user info
  const { data: targetUser, error: fetchError } = await supabase
    .from('users')
    .select('id, name, status')
    .eq('id', userId)
    .single();

  if (fetchError || !targetUser) {
    return { success: false, error: 'User not found' };
  }

  if (targetUser.status !== 'suspended') {
    return { success: false, error: 'User is not suspended' };
  }

  const { error: updateError } = await supabase
    .from('users')
    .update({ status: 'active' })
    .eq('id', userId);

  if (updateError) {
    return { success: false, error: 'Failed to unsuspend user' };
  }

  // Log the action
  await logAdminAction(supabase, adminCheck.userId, 'unsuspend_user', 'user', userId, {
    name: targetUser.name,
  });

  return { success: true };
}

/**
 * Delete a tournament (for spam cleanup)
 */
export async function deleteTournament(
  tournamentId: string,
  csrfToken: string | null | undefined
): Promise<{ success: boolean; error?: string }> {
  try {
    // Validate CSRF token
    await validateCsrfOrThrow(csrfToken);
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'CSRF validation failed' };
  }

  const supabase = await createClient();

  // Verify admin access
  const adminCheck = await verifyAdmin(supabase);
  if (!adminCheck.isAdmin || !adminCheck.userId) {
    return { success: false, error: adminCheck.error };
  }

  // Get tournament info before deletion
  const { data: tournament, error: fetchError } = await supabase
    .from('tournaments')
    .select('id, name, organizer_id')
    .eq('id', tournamentId)
    .single();

  if (fetchError || !tournament) {
    return { success: false, error: 'Tournament not found' };
  }

  // Delete the tournament (cascades should handle related records)
  const { error: deleteError } = await supabase
    .from('tournaments')
    .delete()
    .eq('id', tournamentId);

  if (deleteError) {
    return { success: false, error: 'Failed to delete tournament' };
  }

  // Log the action
  await logAdminAction(supabase, adminCheck.userId, 'delete_tournament', 'tournament', tournamentId, {
    name: tournament.name,
    organizer_id: tournament.organizer_id,
  });

  return { success: true };
}
