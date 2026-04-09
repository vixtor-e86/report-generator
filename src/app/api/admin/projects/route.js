// src/app/api/admin/projects/route.js
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '1000');

    // 1. Fetch everything in parallel for maximum speed
    const [
      { count: freeCount },
      { count: stdCount },
      { count: premCount },
      { data: premiumProjects, error: premError },
      { data: standardProjects, error: stdError },
      { data: freeProjects, error: freeError }
    ] = await Promise.all([
      // Exact counts for badges
      supabaseAdmin.from('projects').select('*', { count: 'exact', head: true }),
      supabaseAdmin.from('standard_projects').select('*', { count: 'exact', head: true }),
      supabaseAdmin.from('premium_projects').select('*', { count: 'exact', head: true }),
      
      // Actual data (limited to 1000 each for performance)
      // Note: We include user_profiles in the query to avoid a second loop
      supabaseAdmin.from('premium_projects')
        .select('*, user_profiles(username, email)')
        .order('created_at', { ascending: false })
        .limit(limit),
      
      supabaseAdmin.from('standard_projects')
        .select('*, user_profiles(username, email)')
        .order('created_at', { ascending: false })
        .limit(limit),
      
      supabaseAdmin.from('projects')
        .select('*, user_profiles(username, email)')
        .order('created_at', { ascending: false })
        .limit(limit)
    ]);

    if (premError) console.error('Premium fetch error:', premError);
    if (stdError) console.error('Standard fetch error:', stdError);
    if (freeError) console.error('Free fetch error:', freeError);

    // Combine and normalize
    // We handle the case where user_profiles might be missing or the join fails
    const allProjects = [
      ...(premiumProjects || []).map(p => ({ ...p, type: 'premium', tier: 'premium' })),
      ...(standardProjects || []).map(p => ({ ...p, type: 'standard', tier: p.tier || 'standard' })),
      ...(freeProjects || []).map(p => ({ ...p, type: 'free', tier: 'free' }))
    ].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    // Slice to the overall limit if needed (e.g. top 1000 recent across all tiers)
    const resultProjects = allProjects.slice(0, limit);

    return NextResponse.json({
      projects: resultProjects,
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
