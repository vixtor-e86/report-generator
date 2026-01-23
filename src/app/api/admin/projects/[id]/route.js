// src/app/api/admin/projects/[id]/route.js
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function GET(request, { params }) {
  try {
    const { id } = params;

    let project = null;
    let chapters = [];
    let isStandard = false;

    // 1. Try finding in Standard Projects
    const { data: stdProject } = await supabaseAdmin
      .from('standard_projects')
      .select('*')
      .eq('id', id)
      .single();

    if (stdProject) {
      project = stdProject;
      isStandard = true;
      // Fetch Standard Chapters
      const { data: stdChapters } = await supabaseAdmin
        .from('standard_chapters')
        .select('*')
        .eq('project_id', id)
        .order('chapter_number', { ascending: true });
      chapters = stdChapters || [];
    } else {
      // 2. If not found, try Free Projects
      const { data: freeProject, error: freeError } = await supabaseAdmin
        .from('projects')
        .select('*')
        .eq('id', id)
        .single();
      
      if (freeProject) {
        project = freeProject;
        // Fetch Free Chapters
        const { data: freeChapters } = await supabaseAdmin
          .from('chapters')
          .select('*')
          .eq('project_id', id)
          .order('chapter_number', { ascending: true });
        chapters = freeChapters || [];
      } else {
        return NextResponse.json({ error: 'Project not found' }, { status: 404 });
      }
    }

    // 3. Fetch User Profile
    let userProfile = { username: 'Unknown', email: 'N/A' };
    if (project.user_id) {
      const { data: user, error: userError } = await supabaseAdmin
        .from('user_profiles')
        .select('username, email')
        .eq('id', project.user_id)
        .single();
      
      if (!userError && user) {
        userProfile = user;
      }
    }

    return NextResponse.json({
      ...project,
      tier: project.tier || (isStandard ? 'standard' : 'free'),
      user_profiles: userProfile,
      chapters: chapters
    });

  } catch (error) {
    console.error('Admin project detail error:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch project details' }, { status: 500 });
  }
}
