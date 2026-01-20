/**
 * Server-side push notification utilities using the web-push library.
 */

import webpush from 'web-push';
import { getVapidPublicKey, getVapidPrivateKey, getVapidSubject } from './vapid';

/**
 * Notification action for interactive push notifications.
 */
export interface NotificationAction {
  action: string;
  title: string;
  icon?: string;
}

/**
 * Payload for push notifications.
 */
export interface PushNotificationPayload {
  title: string;
  body: string;
  url?: string;
  actions?: NotificationAction[];
  icon?: string;
  badge?: string;
  tag?: string;
  data?: Record<string, unknown>;
}

/**
 * Web Push subscription format expected by the web-push library.
 */
export interface WebPushSubscription {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

/**
 * Result of a push notification send attempt.
 */
export interface PushSendResult {
  success: boolean;
  statusCode?: number;
  error?: string;
}

/**
 * Configure web-push with VAPID credentials.
 * Call this before sending notifications.
 */
function configureWebPush(): void {
  webpush.setVapidDetails(
    getVapidSubject(),
    getVapidPublicKey(),
    getVapidPrivateKey()
  );
}

/**
 * Send a push notification to a subscription.
 *
 * @param subscription - The push subscription to send to
 * @param payload - The notification payload
 * @returns Result indicating success or failure
 */
export async function sendPushNotification(
  subscription: WebPushSubscription,
  payload: PushNotificationPayload
): Promise<PushSendResult> {
  try {
    // Configure VAPID credentials
    configureWebPush();

    // Convert payload to JSON string for transmission
    const payloadString = JSON.stringify(payload);

    // Send the push notification
    const response = await webpush.sendNotification(subscription, payloadString);

    return {
      success: true,
      statusCode: response.statusCode,
    };
  } catch (error) {
    // Handle specific web-push errors
    if (error instanceof webpush.WebPushError) {
      // Status 410 (Gone) or 404 means subscription is no longer valid
      if (error.statusCode === 410 || error.statusCode === 404) {
        return {
          success: false,
          statusCode: error.statusCode,
          error: 'Subscription has expired or is no longer valid',
        };
      }

      return {
        success: false,
        statusCode: error.statusCode,
        error: error.message,
      };
    }

    // Handle generic errors
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Send push notifications to multiple subscriptions.
 * Continues sending even if some fail.
 *
 * @param subscriptions - Array of subscriptions to send to
 * @param payload - The notification payload
 * @returns Array of results for each subscription
 */
export async function sendPushNotificationToMany(
  subscriptions: WebPushSubscription[],
  payload: PushNotificationPayload
): Promise<PushSendResult[]> {
  const results = await Promise.all(
    subscriptions.map((subscription) => sendPushNotification(subscription, payload))
  );
  return results;
}
