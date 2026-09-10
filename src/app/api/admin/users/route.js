// src/app/api/admin/users/route.js
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export const maxDuration = 60; // 60 seconds

export async function GET(request) {
  try {
    // 1. Fetch User Profiles (Database data)
    const { data: profiles, error: profilesError } = await supabaseAdmin
      .from('user_profiles')
      .select('id, full_name, username, role, university_id, custom_institution, department, created_at')
      .order('created_at', { ascending: false });

    if (profilesError) throw profilesError;

    // 2. Fetch Universities
    const { data: universities } = await supabaseAdmin
      .from('universities')
      .select('id, name');

    // 3. Fetch ALL Auth Users in chunks across pages (up to 15,000+ users)
    const pageNumbers = Array.from({ length: 15 }, (_, i) => i + 1);
    const authPages = [];
    
    // Chunk array into sizes of 3 to avoid Supabase rate limits on listUsers
    const chunkSize = 3;
    for (let i = 0; i < pageNumbers.length; i += chunkSize) {
      const chunk = pageNumbers.slice(i, i + chunkSize);
      const chunkRes = await Promise.all(
        chunk.map(page => supabaseAdmin.auth.admin.listUsers({ page, perPage: 1000 }))
      );
      authPages.push(...chunkRes);
    }

    const emailMap = new Map();
    for (const pageRes of authPages) {
      if (pageRes.data?.users) {
        for (const u of pageRes.data.users) {
          emailMap.set(u.id, {
            email: u.email,
            last_sign_in_at: u.last_sign_in_at,
            created_at: u.created_at
          });
        }
      }
    }

    // 4. Merge Data
    const mergedUsers = profiles.map(profile => {
      const authUser = emailMap.get(profile.id);
      const university = universities?.find(u => u.id === profile.university_id);
      
      return {
        ...profile,
        email: authUser?.email || 'N/A',
        last_sign_in_at: authUser?.last_sign_in_at || null,
        created_at: authUser?.created_at || profile.created_at,
        institution_name: university?.name || profile.custom_institution || 'Other'
      };
    });

    return NextResponse.json(mergedUsers);

  } catch (error) {
    console.error('Admin users error:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch users' }, { status: 500 });
  }
}
