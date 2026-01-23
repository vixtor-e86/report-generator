// src/app/api/admin/users/route.js
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function GET(request) {
  try {
    // 1. Fetch User Profiles (Database data)
    const { data: profiles, error: profilesError } = await supabaseAdmin
      .from('user_profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (profilesError) throw profilesError;

    // 2. Fetch Universities
    const { data: universities } = await supabaseAdmin
      .from('universities')
      .select('id, name');

    // 3. Fetch Auth Users (Email, Last Sign In)
    // Supabase Admin API to list users. Note: This handles pagination (default 50).
    // We might need to loop if > 50 users, but for now we'll fetch a larger page.
    const { data: { users: authUsers }, error: authError } = await supabaseAdmin.auth.admin.listUsers({
      perPage: 1000 // Fetch up to 1000 users
    });

    if (authError) throw authError;

    // 4. Merge Data
    const mergedUsers = profiles.map(profile => {
      const authUser = authUsers.find(u => u.id === profile.id);
      const university = universities?.find(u => u.id === profile.university_id);
      
      return {
        ...profile,
        email: authUser?.email || 'N/A',
        last_sign_in_at: authUser?.last_sign_in_at || null,
        created_at: authUser?.created_at || profile.created_at, // Auth creation is often more accurate
        institution_name: university?.name || profile.custom_institution || 'Other'
      };
    });

    return NextResponse.json(mergedUsers);

  } catch (error) {
    console.error('Admin users error:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch users' }, { status: 500 });
  }
}
