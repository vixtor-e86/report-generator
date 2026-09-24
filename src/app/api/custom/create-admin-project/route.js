import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    const { userId, workspaceType, selectedChapters } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Verify user is admin or support
    const { data: userProfile, error: profileErr } = await supabaseAdmin
      .from('user_profiles')
      .select('role, department, faculty')
      .eq('id', userId)
      .single();

    if (profileErr) {
      console.error('Profile fetch error:', profileErr);
    }

    const isAdmin = userProfile?.role === 'admin' || userProfile?.role === 'support';
    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized: Admin or Support access required for free custom project creation' },
        { status: 403 }
      );
    }

    const chapters = Array.isArray(selectedChapters) && selectedChapters.length > 0 ? selectedChapters : [4, 5];
    const wsType = (workspaceType || 'standard').toLowerCase();

    let createdProjectId = null;
    let redirectUrl = null;

    if (wsType === 'premium') {
      const { data: newProject, error: projErr } = await supabaseAdmin
        .from('premium_projects')
        .insert({
          user_id: userId,
          title: `Custom Research Suite (${chapters.map(c => `Ch ${c}`).join(', ')})`,
          department: userProfile?.department || 'General Academic',
          faculty: userProfile?.faculty || 'General',
          description: `Custom continuation project generating chapters: ${chapters.join(', ')}`,
          tier: 'custom',
          payment_status: 'admin_bypass',
          amount_paid: 0,
          payment_verified_at: new Date().toISOString(),
          tokens_used: 0,
          tokens_limit: chapters.length * 80000,
          humanizer_words_used: 0,
          humanizer_words_limit: chapters.length * 2500,
          plagiarism_words_used: 0,
          plagiarism_words_limit: chapters.length * 2500,
          status: 'in_progress',
          current_chapter: chapters[0] || 1,
          is_custom: true,
          selected_chapters: chapters,
          uploaded_chapters: {},
          existing_references: null,
          custom_rate_per_chapter: 5000
        })
        .select()
        .single();

      if (projErr) throw projErr;
      createdProjectId = newProject.id;
      redirectUrl = `/premium/workspace?id=${newProject.id}`;

      const premiumChapterTitles = [
        'Introduction & Background',
        'Literature Review',
        'Research Methodology',
        'Implementation & Results',
        'Conclusion & Recommendations'
      ];
      const chaptersToInsert = premiumChapterTitles.map((title, idx) => ({
        project_id: newProject.id,
        chapter_number: idx + 1,
        title,
        content: '',
        status: 'draft'
      }));
      await supabaseAdmin.from('premium_chapters').insert(chaptersToInsert);
    } else {
      // Standard workspace
      const { data: newProject, error: projErr } = await supabaseAdmin
        .from('standard_projects')
        .insert({
          user_id: userId,
          title: `Custom Blueprint (${chapters.map(c => `Ch ${c}`).join(', ')})`,
          department: userProfile?.department || 'General Academic',
          components: ['Custom Blueprint'],
          description: `Custom continuation project generating chapters: ${chapters.join(', ')}`,
          tier: 'custom',
          payment_status: 'admin_bypass',
          amount_paid: 0,
          payment_verified_at: new Date().toISOString(),
          tokens_used: 0,
          tokens_limit: chapters.length * 24000,
          status: 'in_progress',
          current_chapter: chapters[0] || 1,
          is_custom: true,
          selected_chapters: chapters,
          uploaded_chapters: {},
          existing_references: null,
          custom_rate_per_chapter: 1500,
          access_expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        })
        .select()
        .single();

      if (projErr) throw projErr;
      createdProjectId = newProject.id;
      redirectUrl = `/standard/${newProject.id}`;

      const standardChapterTitles = [
        'Introduction & Background',
        'Literature Review',
        'Research Methodology',
        'System Implementation & Results',
        'Conclusion & Recommendations'
      ];
      const chaptersToInsert = standardChapterTitles.map((title, idx) => ({
        project_id: newProject.id,
        chapter_number: idx + 1,
        title,
        status: 'not_generated'
      }));
      await supabaseAdmin.from('standard_chapters').insert(chaptersToInsert);
    }

    return NextResponse.json({
      success: true,
      projectId: createdProjectId,
      redirectUrl
    });
  } catch (error) {
    console.error('Admin custom project creation error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create admin custom project' },
      { status: 500 }
    );
  }
}
