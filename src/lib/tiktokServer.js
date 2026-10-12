// src/lib/tiktokServer.js
// TikTok Events API (Server-Side Tracking)
// Pixel ID: DB49M9JC77U534NEKFIG

import crypto from 'crypto';

const TIKTOK_PIXEL_ID = process.env.NEXT_PUBLIC_TIKTOK_PIXEL_ID || process.env.TIKTOK_PIXEL_ID || 'DB49M9JC77U534NEKFIG';
const TIKTOK_ACCESS_TOKEN = process.env.TIKTOK_ACCESS_TOKEN || 'b41d73fc99fe94bfe05ca195d662c0768bd9a81b';
const TIKTOK_TRACK_URL = 'https://business-api.tiktok.com/open_api/v1.3/event/track/';

/**
 * SHA-256 hash helper for TikTok PII formatting
 */
function hashSha256(value) {
  if (!value) return undefined;
  return crypto.createHash('sha256').update(String(value).trim().toLowerCase()).digest('hex');
}

/**
 * Send a server-side event to TikTok Events API v1.3
 */
export async function sendTikTokServerEvent({
  event,
  eventId,
  user = {},
  properties = {},
  page = {}
}) {
  const pixelId = process.env.NEXT_PUBLIC_TIKTOK_PIXEL_ID || process.env.TIKTOK_PIXEL_ID || TIKTOK_PIXEL_ID;
  const accessToken = process.env.TIKTOK_ACCESS_TOKEN || TIKTOK_ACCESS_TOKEN;

  if (!pixelId || !accessToken) {
    console.warn('[TikTok Events API] Missing Pixel ID or Access Token');
    return { success: false, error: 'Missing configuration' };
  }

  // Format user parameters
  const userPayload = {};
  if (user.email) userPayload.email = hashSha256(user.email);
  if (user.phone) userPayload.phone = hashSha256(user.phone);
  if (user.userId) userPayload.external_id = hashSha256(user.userId);
  if (user.ip) userPayload.client_ip_address = String(user.ip);
  if (user.userAgent) userPayload.user_agent = String(user.userAgent);
  if (user.ttp) userPayload.ttp = String(user.ttp);
  if (user.ttclid) userPayload.ttclid = String(user.ttclid);

  // Format properties parameters
  const propertiesPayload = {
    currency: properties.currency || 'NGN',
    value: properties.value !== undefined ? Number(properties.value) : undefined,
    content_type: properties.contentType || 'product',
    content_name: properties.contentName || undefined,
    content_id: properties.contentId ? String(properties.contentId) : undefined,
  };

  // Remove undefined properties
  Object.keys(propertiesPayload).forEach(k => {
    if (propertiesPayload[k] === undefined) delete propertiesPayload[k];
  });

  const eventData = {
    event,
    event_time: Math.floor(Date.now() / 1000),
    user: userPayload,
    properties: propertiesPayload,
  };

  if (eventId) {
    eventData.event_id = String(eventId);
  }

  if (page.url) {
    eventData.page = {
      url: page.url,
      ...(page.referrer ? { referrer: page.referrer } : {})
    };
  }

  const payload = {
    event_source: 'web',
    event_source_id: pixelId,
    data: [eventData]
  };

  try {
    const response = await fetch(TIKTOK_TRACK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Access-Token': accessToken,
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    if (data.code !== 0) {
      console.warn('[TikTok Events API] Warning from TikTok:', data);
    } else {
      console.log(`[TikTok Events API] Event "${event}" sent successfully. (Event ID: ${eventId || 'none'})`);
    }

    return { success: true, data };
  } catch (error) {
    console.error('[TikTok Events API] Failed to send event:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Convenience helper to track CompletePayment on server
 */
export async function sendTikTokServerPayment({
  eventId,
  userId,
  email,
  phone,
  amount,
  currency = 'NGN',
  tier = 'Blueprint Plan',
  ip,
  userAgent,
  pageUrl,
}) {
  return sendTikTokServerEvent({
    event: 'CompletePayment',
    eventId,
    user: {
      userId,
      email,
      phone,
      ip,
      userAgent,
    },
    properties: {
      value: amount,
      currency,
      contentType: 'product',
      contentName: tier,
      contentId: eventId,
    },
    page: {
      url: pageUrl,
    }
  });
}

/**
 * Convenience helper to track CompleteRegistration on server
 */
export async function sendTikTokServerRegistration({
  eventId,
  userId,
  email,
  phone,
  ip,
  userAgent,
  pageUrl,
}) {
  return sendTikTokServerEvent({
    event: 'CompleteRegistration',
    eventId,
    user: {
      userId,
      email,
      phone,
      ip,
      userAgent,
    },
    properties: {
      contentType: 'account',
      contentName: 'User Registration',
    },
    page: {
      url: pageUrl,
    }
  });
}
