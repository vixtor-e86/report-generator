// src/app/api/admin/users/route.js
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export const maxDuration = 60; // 60 seconds
export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    // 1. Fetch ALL User Profiles across paginated ranges (Supabase defaults to 1000 rows per single request)
    const fetchAllProfiles = async () => {
      const { count } = await supabaseAdmin
        .from('user_profiles')
        .select('*', { count: 'exact', head: true });

      const totalProfiles = count || 15000;
      const step = 1000;
      const ranges = [];
      for (let i = 0; i < Math.ceil(totalProfiles / step); i++) {
        ranges.push([i * step, (i + 1) * step - 1]);
      }

      const allProfiles = [];
      const chunkSize = 5;
      for (let i = 0; i < ranges.length; i += chunkSize) {
        const chunk = ranges.slice(i, i + chunkSize);
        const batchResults = await Promise.all(
          chunk.map(([start, end]) =>
            supabaseAdmin
              .from('user_profiles')
              .select('*')
              .order('created_at', { ascending: false })
              .range(start, end)
          )
        );
        for (const res of batchResults) {
          if (res.data) allProfiles.push(...res.data);
        }
      }
      return allProfiles;
    };

    // 2. Fetch Universities
    const fetchUniversities = async () => {
      const { data } = await supabaseAdmin.from('universities').select('id, name');
      return data || [];
    };

    // 3. Fetch ALL Auth Users reliably with retry on transient rate limits
    const fetchAllAuthUsers = async () => {
      const allUsers = [];
      let page = 1;
      const maxPages = 30;
      const chunkSize = 2;

      const fetchPageWithRetry = async (p) => {
        for (let attempt = 0; attempt < 2; attempt++) {
          const res = await supabaseAdmin.auth.admin.listUsers({ page: p, perPage: 1000 });
          if (!res.error && res.data?.users) return res;
        }
        return { data: { users: [] }, error: true };
      };

      while (page <= maxPages) {
        const pagesToFetch = [];
        for (let i = 0; i < chunkSize && (page + i) <= maxPages; i++) {
          pagesToFetch.push(page + i);
        }

        const chunkResults = await Promise.all(pagesToFetch.map(fetchPageWithRetry));
        let reachedEnd = false;

        for (const res of chunkResults) {
          const users = res.data?.users || [];
          allUsers.push(...users);
          if (!res.error && users.length < 1000) {
            reachedEnd = true;
          }
        }

        if (reachedEnd) break;
        page += chunkSize;
      }
      return allUsers;
    };

    const [profiles, universities, authUsers] = await Promise.all([
      fetchAllProfiles(),
      fetchUniversities(),
      fetchAllAuthUsers()
    ]);

    const uniMap = new Map();
    universities.forEach(u => uniMap.set(u.id, u.name));

    const emailMap = new Map();
    for (const u of authUsers) {
      emailMap.set(u.id, {
        email: u.email,
        last_sign_in_at: u.last_sign_in_at,
        created_at: u.created_at,
        metadata: u.user_metadata || {}
      });
    }

    // 4. Merge Data (Profiles + any Auth user not yet in user_profiles)
    const processedIds = new Set();
    const mergedUsers = profiles.map(profile => {
      processedIds.add(profile.id);
      const authUser = emailMap.get(profile.id);
      const uniName = uniMap.get(profile.university_id);

      return {
        ...profile,
        email: authUser?.email || profile.email || 'N/A',
        last_sign_in_at: authUser?.last_sign_in_at || null,
        created_at: authUser?.created_at || profile.created_at,
        institution_name: uniName || profile.custom_institution || 'Other'
      };
    });

    for (const u of authUsers) {
      if (!processedIds.has(u.id)) {
        processedIds.add(u.id);
        mergedUsers.push({
          id: u.id,
          full_name: u.user_metadata?.full_name || u.user_metadata?.name || u.user_metadata?.username || (u.email ? u.email.split('@')[0] : 'User'),
          username: u.user_metadata?.username || (u.email ? u.email.split('@')[0] : 'User'),
          role: 'student',
          email: u.email || 'N/A',
          last_sign_in_at: u.last_sign_in_at || null,
          created_at: u.created_at,
          department: 'N/A',
          institution_name: 'Other'
        });
      }
    }

    mergedUsers.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));

    return NextResponse.json(mergedUsers);

  } catch (error) {
    console.error('Admin users error:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch users' }, { status: 500 });
  }
}
