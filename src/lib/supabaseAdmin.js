// src/lib/supabaseAdmin.js
// Admin client for server-side operations (bypasses RLS)

import { createClient } from '@supabase/supabase-js';

// This uses the service_role key which bypasses RLS
// ONLY use this in API routes, NEVER expose to client
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY, // You need to add this to .env.local
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

let cachedUsers = null;
let lastCacheTime = 0;
const CACHE_TTL = 3 * 60 * 1000;

export async function getAuthUsersMap() {
  const now = Date.now();
  if (cachedUsers && (now - lastCacheTime) < CACHE_TTL) {
    return cachedUsers;
  }
  const pageNumbers = Array.from({ length: 15 }, (_, i) => i + 1);
  const chunkSize = 4;
  let allUsers = [];
  for (let i = 0; i < pageNumbers.length; i += chunkSize) {
    const chunk = pageNumbers.slice(i, i + chunkSize);
    const chunkResults = await Promise.all(
      chunk.map(page => supabaseAdmin.auth.admin.listUsers({ page, perPage: 1000 }))
    );
    for (const res of chunkResults) {
      if (res.data?.users?.length) {
        allUsers.push(...res.data.users);
      }
    }
  }
  const map = new Map();
  for (const u of allUsers) {
    if (u.email) {
      map.set(u.email.toLowerCase(), { id: u.id, email: u.email });
    }
  }
  cachedUsers = map;
  lastCacheTime = now;
  return map;
}

export async function getAuthUserByEmail(email) {
  if (!email) return null;
  const cleanEmail = email.toLowerCase().trim();
  const map = await getAuthUsersMap();
  let user = map.get(cleanEmail);
  if (!user) {
    try {
      const { data } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 100 });
      const match = data?.users?.find(u => u.email?.toLowerCase() === cleanEmail);
      if (match) {
        user = { id: match.id, email: match.email };
        map.set(cleanEmail, user);
      }
    } catch (err) {
      console.warn('Error checking page 1 for email:', err.message);
    }
  }
  return user || null;
}