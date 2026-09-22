import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q')?.trim() || '';

    let dbQuery = supabaseAdmin
      .from('user_profiles')
      .select('id, username, full_name, department, role, is_seller, created_at')
      .order('created_at', { ascending: false })
      .limit(30);

    if (query) {
      dbQuery = dbQuery.or(`username.ilike.%${query}%,full_name.ilike.%${query}%,department.ilike.%${query}%`);
    }

    const { data: profiles, error } = await dbQuery;
    if (error) throw error;

    // Fetch auth emails for these profiles in batch
    const userIds = profiles.map(p => p.id);
    let emailMap = {};

    try {
      // Fetch users in chunks
      const { data: authData } = await supabaseAdmin.auth.admin.listUsers({ perPage: 100 });
      if (authData?.users) {
        authData.users.forEach(u => {
          emailMap[u.id] = u.email;
        });
      }
    } catch (err) {
      console.warn('Could not batch list auth emails:', err.message);
    }

    const users = profiles.map(p => ({
      id: p.id,
      name: p.full_name || p.username || 'Student',
      username: p.username || 'user',
      department: p.department || 'General',
      role: p.role || 'user',
      isSeller: !!p.is_seller,
      email: emailMap[p.id] || 'N/A'
    }));

    return NextResponse.json({ users });
  } catch (error) {
    console.error('Error searching users for notifications:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
