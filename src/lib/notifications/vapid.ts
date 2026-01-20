/**
 * VAPID (Voluntary Application Server Identification) configuration utilities
 * for Web Push notifications.
 */

/**
 * Get the public VAPID key for client-side subscription.
 * This key is safe to expose to the browser.
 */
export function getVapidPublicKey(): string {
  const key = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  if (!key) {
    throw new Error('NEXT_PUBLIC_VAPID_PUBLIC_KEY environment variable is not set');
  }
  return key;
}

/**
 * Get the private VAPID key for server-side push sending.
 * This key must NEVER be exposed to the client.
 * @server-only
 */
export function getVapidPrivateKey(): string {
  const key = process.env.VAPID_PRIVATE_KEY;
  if (!key) {
    throw new Error('VAPID_PRIVATE_KEY environment variable is not set');
  }
  return key;
}

/**
 * Get the VAPID subject (contact email or URL).
 * Used to identify the application server to push services.
 */
export function getVapidSubject(): string {
  const subject = process.env.VAPID_SUBJECT;
  if (!subject) {
    throw new Error('VAPID_SUBJECT environment variable is not set');
  }
  return subject;
}
