/**
 * Push notification utilities for Infinity Tournament Manager.
 *
 * This module provides server-side utilities for:
 * - VAPID key management for Web Push authentication
 * - Sending push notifications to subscribed clients
 * - Managing push subscriptions in the database
 */

// VAPID configuration
export {
  getVapidPublicKey,
  getVapidPrivateKey,
  getVapidSubject,
} from './vapid';

// Push notification sending
export {
  sendPushNotification,
  sendPushNotificationToMany,
  type PushNotificationPayload,
  type NotificationAction,
  type WebPushSubscription,
  type PushSendResult,
} from './push';

// Subscription management
export {
  saveSubscription,
  removeSubscription,
  getUserSubscriptions,
  removeSubscriptionByEndpoint,
  type SubscriptionInput,
} from './subscribe';
