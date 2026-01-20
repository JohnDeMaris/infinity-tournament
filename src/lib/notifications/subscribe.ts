/**
 * Subscription management utilities for push notifications.
 * Handles saving, removing, and retrieving push subscriptions from Supabase.
 */

import { createClient } from '@/lib/supabase/server';
import type { PushSubscription } from '@/types/database';

/**
 * Input for saving a new subscription.
 */
export interface SubscriptionInput {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

/**
 * Save a push subscription for a user.
 * If a subscription with the same endpoint already exists, it will be updated.
 *
 * @param userId - The user's ID
 * @param subscription - The push subscription data
 * @returns The saved subscription or null on error
 */
export async function saveSubscription(
  userId: string,
  subscription: SubscriptionInput
): Promise<PushSubscription | null> {
  try {
    const supabase = await createClient();

    // Upsert subscription (update if endpoint exists, insert otherwise)
    const { data, error } = await supabase
      .from('push_subscriptions')
      .upsert(
        {
          user_id: userId,
          endpoint: subscription.endpoint,
          keys: subscription.keys,
        },
        {
          onConflict: 'endpoint',
        }
      )
      .select()
      .single();

    if (error) {
      console.error('Failed to save push subscription:', error);
      return null;
    }

    return data as PushSubscription;
  } catch (error) {
    console.error('Error saving push subscription:', error);
    return null;
  }
}

/**
 * Remove a push subscription by user ID and endpoint.
 *
 * @param userId - The user's ID
 * @param endpoint - The subscription endpoint URL
 * @returns True if removed successfully, false otherwise
 */
export async function removeSubscription(
  userId: string,
  endpoint: string
): Promise<boolean> {
  try {
    const supabase = await createClient();

    const { error } = await supabase
      .from('push_subscriptions')
      .delete()
      .eq('user_id', userId)
      .eq('endpoint', endpoint);

    if (error) {
      console.error('Failed to remove push subscription:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error removing push subscription:', error);
    return false;
  }
}

/**
 * Get all push subscriptions for a user.
 *
 * @param userId - The user's ID
 * @returns Array of push subscriptions (empty array on error)
 */
export async function getUserSubscriptions(
  userId: string
): Promise<PushSubscription[]> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('push_subscriptions')
      .select('*')
      .eq('user_id', userId);

    if (error) {
      console.error('Failed to get user push subscriptions:', error);
      return [];
    }

    return (data as PushSubscription[]) || [];
  } catch (error) {
    console.error('Error getting user push subscriptions:', error);
    return [];
  }
}

/**
 * Remove a subscription by endpoint only (useful for cleanup when subscription becomes invalid).
 *
 * @param endpoint - The subscription endpoint URL
 * @returns True if removed successfully, false otherwise
 */
export async function removeSubscriptionByEndpoint(
  endpoint: string
): Promise<boolean> {
  try {
    const supabase = await createClient();

    const { error } = await supabase
      .from('push_subscriptions')
      .delete()
      .eq('endpoint', endpoint);

    if (error) {
      console.error('Failed to remove push subscription by endpoint:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error removing push subscription by endpoint:', error);
    return false;
  }
}
