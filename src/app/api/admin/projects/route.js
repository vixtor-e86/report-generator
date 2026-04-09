// src/app/api/admin/projects/route.js
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '1000');

    // 1. Fetch counts and raw data in parallel
    const [
      { count: freeCount },
      { count: stdCount },
      { count: premCount },
      { data: premiumProjects, error: premError },
      { data: standardProjects, error: stdError },
      { data: freeProjects, error: freeError }
    ] = await Promise.all([
      supabaseAdmin.from('projects').select('*', { count: 'exact', head: true }),
      supabaseAdmin.from('standard_projects').select('*', { count: 'exact', head: true }),
      supabaseAdmin.from('premium_projects').select('*', { count: 'exact', head: true }),
      
      supabaseAdmin.from('premium_projects').select('*').order('created_at', { ascending: false }).limit(limit),
      supabaseAdmin.from('standard_projects').select('*').order('created_at', { ascending: false }).limit(limit),
      supabaseAdmin.from('projects').select('*').order('created_at', { ascending: false }).limit(limit)
    ]);

    if (premError) console.error('Premium fetch error:', premError);
    if (stdError) console.error('Standard fetch error:', stdError);
    if (freeError) console.error('Free fetch error:', freeError);

    // Combine and normalize raw data
    const allProjects = [
      ...(premiumProjects || []).map(p => ({ ...p, type: 'premium', tier: 'premium' })),
      ...(standardProjects || []).map(p => ({ ...p, type: 'standard', tier: p.tier || 'standard' })),
      ...(freeProjects || []).map(p => ({ ...p, type: 'free', tier: 'free' }))
    ].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    // 2. Fetch Users for enrichment (Separate call for better reliability)
    let enrichedProjects = allProjects.slice(0, limit);
    if (enrichedProjects.length > 0) {
      const userIds = [...new Set(enrichedProjects.map(p => p.user_id).filter(Boolean))];
      
      if (userIds.length > 0) {
        const { data: usersData } = await supabaseAdmin
          .from('user_profiles')
          .select('id, username, email')
          .in('id', userIds);
          
        if (usersData) {
          enrichedProjects = enrichedProjects.map(project => ({
            ...project,
            user_profiles: usersData.find(u => u.id === project.user_id) || { username: 'Unknown', email: 'N/A' }
          }));
        }
      }
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
