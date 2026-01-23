// src/app/api/admin/projects/[id]/route.js
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function GET(request, props) {
  try {
    const params = await props.params;
    const { id } = params;
    console.log(`[AdminAPI] Looking up project: ${id}`);

    let project = null;
    let chapters = [];
    let isStandard = false;

    // 1. Attempt Standard Project Lookup
    let { data: stdProject, error: stdError } = await supabaseAdmin
      .from('standard_projects')
      .select('*')
      .eq('id', id)
      .maybeSingle(); // Use maybeSingle() to avoid error on 0 rows

    if (stdError) console.warn('[AdminAPI] Std Lookup Error:', stdError.message);

    if (stdProject) {
      console.log(`[AdminAPI] Found Standard Project: ${stdProject.id}`);
      project = stdProject;
      isStandard = true;

      // Fetch Standard Chapters
      const { data: stdChapters } = await supabaseAdmin
        .from('standard_chapters')
        .select('*')
        .eq('project_id', id)
        .order('chapter_number', { ascending: true });

      if (stdChapters && stdChapters.length > 0) {
        // Fetch Content from Versions
        const chapterIds = stdChapters.map(c => c.id);
        const { data: versions } = await supabaseAdmin
          .from('standard_chapter_versions')
          .select('chapter_id, content, version_number')
          .in('chapter_id', chapterIds)
          .order('version_number', { ascending: false });

        chapters = stdChapters.map(chapter => {
          // Find latest version for this chapter
          const ver = versions?.find(v => v.chapter_id === chapter.id);
          return { ...chapter, content: ver?.content || chapter.content || null };
        });
      }
    } 
    
    // 2. If NOT Standard, Attempt Free Project Lookup
    if (!project) {
      let { data: freeProject, error: freeError } = await supabaseAdmin
        .from('projects')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (freeError) console.warn('[AdminAPI] Free Lookup Error:', freeError.message);

      if (freeProject) {
        console.log(`[AdminAPI] Found Free Project: ${freeProject.id}`);
        project = freeProject;
        
        // Fetch Free Chapters
        const { data: freeChapters } = await supabaseAdmin
          .from('chapters')
          .select('*')
          .eq('project_id', id)
          .order('chapter_number', { ascending: true });
          
        chapters = freeChapters || [];
      }
    }

    if (!project) {
      console.error(`[AdminAPI] Project ${id} not found in any table.`);
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // 3. Fetch User Profile
    let userProfile = { username: 'Unknown', email: 'N/A' };
    if (project.user_id) {
      const { data: user } = await supabaseAdmin
        .from('user_profiles')
        .select('username, email')
        .eq('id', project.user_id)
        .maybeSingle();
      
      if (user) userProfile = user;
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
