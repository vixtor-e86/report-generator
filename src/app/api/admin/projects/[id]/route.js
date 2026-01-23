// src/app/api/admin/projects/[id]/route.js
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function GET(request, { params }) {
  try {
    const { id } = params;
    console.log(`[AdminAPI] Fetching project detail for ID: ${id}`);

    let project = null;
    let chapters = [];
    let isStandard = false;

    // 1. Try finding in Standard Projects
    const { data: stdProject, error: stdError } = await supabaseAdmin
      .from('standard_projects')
      .select('*')
      .eq('id', id)
      .single();

    if (stdProject) {
      console.log(`[AdminAPI] Found in standard_projects: ${stdProject.title}`);
      project = stdProject;
      isStandard = true;
      // Fetch Standard Chapters
      const { data: stdChapters, error: stdChapError } = await supabaseAdmin
        .from('standard_chapters')
        .select('*')
        .eq('project_id', id)
        .order('chapter_number', { ascending: true });
      
      if (stdChapError) console.error('[AdminAPI] Error fetching standard chapters:', stdChapError);
      
      // Fetch Content from Versions for Standard Chapters
      if (stdChapters && stdChapters.length > 0) {
        const chapterIds = stdChapters.map(c => c.id);
        const { data: versions, error: verError } = await supabaseAdmin
          .from('standard_chapter_versions')
          .select('chapter_id, content, version_number')
          .in('chapter_id', chapterIds)
          .order('version_number', { ascending: false }); // Get latest first

        if (!verError && versions) {
          // Attach content to chapters (taking the latest version for each)
          chapters = stdChapters.map(chapter => {
            const latestVersion = versions.find(v => v.chapter_id === chapter.id);
            return {
              ...chapter,
              content: latestVersion?.content || chapter.content || null // Fallback to chapter.content if version missing
            };
          });
        } else {
          chapters = stdChapters;
        }
      } else {
        chapters = [];
      }
      
      console.log(`[AdminAPI] Found ${chapters.length} standard chapters.`);
    } else {
      console.log(`[AdminAPI] Not found in standard_projects. Checking 'projects'...`);
      // 2. If not found, try Free Projects
      const { data: freeProject, error: freeError } = await supabaseAdmin
        .from('projects')
        .select('*')
        .eq('id', id)
        .single();
      
      if (freeProject) {
        console.log(`[AdminAPI] Found in projects (Free): ${freeProject.title}`);
        project = freeProject;
        // Fetch Free Chapters
        const { data: freeChapters, error: freeChapError } = await supabaseAdmin
          .from('chapters')
          .select('*')
          .eq('project_id', id)
          .order('chapter_number', { ascending: true });

        if (freeChapError) console.error('[AdminAPI] Error fetching free chapters:', freeChapError);

        chapters = freeChapters || [];
        console.log(`[AdminAPI] Found ${chapters.length} free chapters.`);
      } else {
        console.log(`[AdminAPI] Project not found in either table.`);
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
