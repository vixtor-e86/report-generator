// src/app/api/admin/projects/route.js
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

async function fetchAllRows(tableName, selectStr = '*') {
  let allRows = [];
  let from = 0;
  let to = 999;
  let hasMore = true;

  while (hasMore) {
    const { data, error } = await supabaseAdmin
      .from(tableName)
      .select(selectStr)
      .order('created_at', { ascending: false })
      .range(from, to);
    
    if (error) {
      console.error(`Error fetching ${tableName}:`, error);
      break;
    }

    if (data && data.length > 0) {
      allRows = [...allRows, ...data];
      if (data.length < 1000) {
        hasMore = false;
      } else {
        from += 1000;
        to += 1000;
        // Limit to 5000 total for admin dashboard performance
        if (allRows.length >= 5000) hasMore = false;
      }
    } else {
      hasMore = false;
    }
  }
  return allRows;
}

export async function GET(request) {
  try {
    // 1. Get exact counts for badges
    const { count: freeCount } = await supabaseAdmin.from('projects').select('*', { count: 'exact', head: true });
    const { count: stdCount } = await supabaseAdmin.from('standard_projects').select('*', { count: 'exact', head: true });
    const { count: premCount } = await supabaseAdmin.from('premium_projects').select('*', { count: 'exact', head: true });

    // 2. Fetch data for the list (limited to recent 5000 for performance)
    const standardProjects = await fetchAllRows('standard_projects');
    const premiumProjects = await fetchAllRows('premium_projects');
    const freeProjects = await fetchAllRows('projects');

    // Combine and normalize
    const allProjects = [
      ...(premiumProjects || []).map(p => ({ ...p, type: 'premium', tier: 'premium' })),
      ...(standardProjects || []).map(p => ({ ...p, type: 'standard', tier: p.tier || 'standard' })),
      ...(freeProjects || []).map(p => ({ ...p, type: 'free', tier: 'free' }))
    ].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    // 3. Fetch Users for enrichment
    let enrichedProjects = [];
    if (allProjects.length > 0) {
      const userIds = [...new Set(allProjects.map(p => p.user_id).filter(Boolean))];
      
      let users = [];
      if (userIds.length > 0) {
        const { data: usersData, error: usersError } = await supabaseAdmin
          .from('user_profiles')
          .select('id, username, email')
          .in('id', userIds);
          
        if (!usersError) {
          users = usersData;
        }
      }

      enrichedProjects = allProjects.map(project => ({
        ...project,
        user_profiles: users.find(u => u.id === project.user_id) || { username: 'Unknown', email: 'N/A' }
      }));
    }

    return NextResponse.json({
      projects: enrichedProjects,
      counts: {
        all: (freeCount || 0) + (stdCount || 0) + (premCount || 0),
        free: freeCount || 0,
        standard: stdCount || 0,
        premium: premCount || 0
      }
    });

  } catch (error) {
    console.error('Admin projects error:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch projects' }, { status: 500 });
  }
}
