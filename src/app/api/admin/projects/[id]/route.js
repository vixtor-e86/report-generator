// src/app/api/admin/projects/[id]/route.js
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function GET(request, { params }) {
  try {
    const { id } = params;

    // 1. Fetch Project Details
    const { data: project, error: projectError } = await supabaseAdmin
      .from('standard_projects')
      .select('*')
      .eq('id', id)
      .single();

    if (projectError) throw projectError;

    // 2. Fetch User Profile
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

    // 3. Fetch Chapters
    const { data: chapters, error: chaptersError } = await supabaseAdmin
      .from('chapters')
      .select('*')
      .eq('project_id', id)
      .order('chapter_number', { ascending: true });

    if (chaptersError) throw chaptersError;

    return NextResponse.json({
      ...project,
      user_profiles: userProfile,
      chapters: chapters || []
    });

  } catch (error) {
    console.error('Admin project detail error:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch project details' }, { status: 500 });
  }
}
