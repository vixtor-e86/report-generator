// TikTok Pixel Analytics Helper
// Pixel ID: DB49M9JC77U534NEKFIG

export function trackTikTokEvent(event, params = {}) {
  if (typeof window !== 'undefined' && window.ttq && typeof window.ttq.track === 'function') {
    try {
      window.ttq.track(event, params);
    } catch (e) {
      console.warn('[TikTok Pixel] Tracking error:', e);
    }
  }
}

/**
 * Tracks CompletePayment event when a payment is successfully verified/completed.
 */
export function trackTikTokPayment({ contentId, contentName, value, currency = 'NGN' } = {}) {
  trackTikTokEvent('CompletePayment', {
    content_id: contentId ? String(contentId) : undefined,
    content_name: contentName || 'Payment',
    content_type: 'product',
    value: Number(value) || 0,
    currency: currency || 'NGN',
  });
}

/**
 * Tracks InitiateCheckout event when a user starts checkout.
 */
export function trackTikTokInitiateCheckout({ contentId, contentName, value, currency = 'NGN' } = {}) {
  trackTikTokEvent('InitiateCheckout', {
    content_id: contentId ? String(contentId) : undefined,
    content_name: contentName || 'Checkout',
    content_type: 'product',
    value: Number(value) || 0,
    currency: currency || 'NGN',
  });
}
