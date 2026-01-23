// src/app/api/admin/projects/route.js
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function GET(request) {
  try {
    // 1. Fetch Projects
    const { data: projects, error: projectsError } = await supabaseAdmin
      .from('standard_projects')
      .select('*')
      .order('created_at', { ascending: false });

    if (projectsError) throw projectsError;

    // 2. Fetch Users manually to avoid foreign key issues
    let enrichedProjects = [];
    if (projects && projects.length > 0) {
      const userIds = [...new Set(projects.map(p => p.user_id).filter(Boolean))];
      
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

      enrichedProjects = projects.map(project => ({
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
