// src/app/api/admin/projects/route.js
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function GET(request) {
  try {
    // 1. Fetch Standard Projects
    const { data: standardProjects, error: stdError } = await supabaseAdmin
      .from('standard_projects')
      .select('*')
      .order('created_at', { ascending: false });

    if (stdError) throw stdError;

    // 2. Fetch Free Projects
    const { data: freeProjects, error: freeError } = await supabaseAdmin
      .from('projects')
      .select('*')
      .order('created_at', { ascending: false });

    if (freeError) throw freeError;

    // Combine and normalize
    const allProjects = [
      ...(standardProjects || []).map(p => ({ ...p, type: 'standard', tier: p.tier || 'standard' })),
      ...(freeProjects || []).map(p => ({ ...p, type: 'free', tier: 'free' }))
    ].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    // 3. Fetch Users manually
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

    return NextResponse.json(enrichedProjects);

  } catch (error) {
    console.error('Admin projects error:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch projects' }, { status: 500 });
  }
}
