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
 * Tracks CompletePayment event when a payment is verified on the client
 * eventId matches the server-side event_id for deduplication
 */
export function trackTikTokPayment({ contentId, contentName, value, currency = 'NGN', eventId } = {}) {
  const finalEventId = eventId || contentId;
  trackTikTokEvent(
    'CompletePayment',
    {
      content_id: contentId ? String(contentId) : undefined,
      content_name: contentName || 'Payment',
      content_type: 'product',
      value: Number(value) || 0,
      currency: currency || 'NGN',
    },
    { eventId: finalEventId }
  );
}

/**
 * Tracks InitiateCheckout event when a user starts checkout
 */
export function trackTikTokInitiateCheckout({ contentId, contentName, value, currency = 'NGN', eventId } = {}) {
  trackTikTokEvent(
    'InitiateCheckout',
    {
      content_id: contentId ? String(contentId) : undefined,
      content_name: contentName || 'Checkout',
      content_type: 'product',
      value: Number(value) || 0,
      currency: currency || 'NGN',
    },
    { eventId }
  );
}

/**
 * Tracks CompleteRegistration event when a user signs up
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
