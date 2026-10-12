// src/lib/tiktok.js
// TikTok Pixel Client Analytics Helper (Web SDK)
// Pixel ID: DB49M9JC77U534NEKFIG

/**
 * Fires a client-side TikTok Pixel event with optional deduplication event_id
 */
export function trackTikTokEvent(event, params = {}, options = {}) {
  if (typeof window !== 'undefined' && window.ttq && typeof window.ttq.track === 'function') {
    try {
      if (options.eventId) {
        window.ttq.track(event, params, { event_id: String(options.eventId) });
      } else {
        window.ttq.track(event, params);
      }
    } catch (e) {
      console.warn('[TikTok Pixel] Tracking error:', e);
    }
  }
}

/**
 * Tracks Purchase event when a payment is verified on the client.
 * Uses exact event name "Purchase" to match TikTok Events Manager standard event.
 * eventId matches the server-side event_id for deduplication.
 */
export function trackTikTokPayment({ contentId, contentName, value, currency = 'NGN', eventId } = {}) {
  const finalEventId = eventId || contentId;
  const numValue = Number(value) || 0;
  const curr = currency || 'NGN';
  const name = contentName || 'Blueprint Plan';

  trackTikTokEvent(
    'Purchase',
    {
      content_id: contentId ? String(contentId) : undefined,
      content_name: name,
      content_type: 'product',
      value: numValue,
      currency: curr,
      contents: [
        {
          content_id: contentId ? String(contentId) : undefined,
          content_name: name,
          content_type: 'product',
          quantity: 1,
          price: numValue,
        }
      ]
    },
    { eventId: finalEventId }
  );
}

/**
 * Tracks CompleteRegistration event when a user signs up.
 * Uses exact event name "CompleteRegistration" matching TikTok Events Manager.
 */
export function trackTikTokRegistration({ eventId } = {}) {
  trackTikTokEvent(
    'CompleteRegistration',
    {
      content_type: 'account',
      content_name: 'Sign Up',
    },
    { eventId }
  );
}
