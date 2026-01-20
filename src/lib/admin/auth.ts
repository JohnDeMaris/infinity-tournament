import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Check if the current authenticated user has admin access
 * @param supabase - Supabase client instance
 * @returns boolean - true if user is an admin, false otherwise
 */
export async function checkAdminAccess(supabase: SupabaseClient): Promise<boolean> {
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) {
    return false;
  }

  const { data: user } = await supabase
    .from('users')
    .select('is_admin')
    .eq('id', authUser.id)
    .single();

  return user?.is_admin === true;
}
