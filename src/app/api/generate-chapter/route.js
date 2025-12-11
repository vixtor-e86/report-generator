// src/app/api/generate-chapter/route.js
import { createClient } from '@supabase/supabase-js';
import { generateChapter } from '@/lib/gemini';

export async function POST(request) {
  try {
    const { projectId, chapterNumber, userId } = await request.json();

    console.log('Generate chapter request:', { projectId, chapterNumber, userId });
    console.log('ENV check:', {
      hasUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      url: process.env.NEXT_PUBLIC_SUPABASE_URL
    });

    // Initialize Supabase with service role (for server-side)
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    console.log('Supabase client created');

    // 1. Get the project (removed user verification for now)
    console.log('Fetching project...');
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .single();

    console.log('Project query result:', { 
      hasProject: !!project, 
      errorMessage: projectError?.message,
      errorCode: projectError?.code 
    });

    if (projectError || !project) {
      return Response.json({ 
        error: 'Project not found',
        details: projectError?.message 
      }, { status: 404 });
    }

    // 2. Get the chapter to generate
    const { data: chapter, error: chapterError } = await supabase
      .from('chapters')
      .select('*')
      .eq('project_id', projectId)
      .eq('chapter_number', chapterNumber)
      .single();

    if (chapterError || !chapter) {
      return Response.json({ error: 'Chapter not found' }, { status: 404 });
    }

    // 3. Check if already generated (free tier restriction)
    if (project.tier === 'free' && chapter.status !== 'not_generated') {
      return Response.json({ 
        error: 'Free tier does not allow regeneration. Upgrade to Standard or Premium.' 
      }, { status: 403 });
    }

    // 4. Update chapter status to 'generating'
    await supabase
      .from('chapters')
      .update({ status: 'generating' })
      .eq('id', chapter.id);

    // 5. Get previous approved chapters (for context)
    const { data: previousChapters } = await supabase
      .from('chapters')
      .select('*')
      .eq('project_id', projectId)
      .eq('status', 'approved')
      .lt('chapter_number', chapterNumber)
      .order('chapter_number', { ascending: true });

    // 6. Get image captions
    const { data: images } = await supabase
      .from('project_images')
      .select('caption')
      .eq('project_id', projectId)
      .order('order_number', { ascending: true });

    const imagesCaptions = images?.map(img => img.caption) || [];

    // 7. Generate chapter using Gemini
    const result = await generateChapter({
      chapterNumber,
      projectTitle: project.title,
      department: project.department,
      components: project.components,
      description: project.description,
      tier: project.tier,
      previousChapters: previousChapters || [],
      imagesCaptions
    });

    if (!result.success) {
      // Update status back to not_generated on error
      await supabase
        .from('chapters')
        .update({ status: 'not_generated' })
        .eq('id', chapter.id);

      return Response.json({ error: result.error }, { status: 500 });
    }

    // 8. Save generated content
    const { error: updateError } = await supabase
      .from('chapters')
      .update({
        content: result.content,
        status: 'draft',
        version: chapter.version + 1,
        generated_at: new Date().toISOString()
      })
      .eq('id', chapter.id);

    if (updateError) {
      return Response.json({ error: 'Failed to save chapter' }, { status: 500 });
    }

    // 9. Log generation history
    await supabase.from('generation_history').insert({
      user_id: userId,
      project_id: projectId,
      chapter_number: chapterNumber,
      action: 'generate',
      ai_provider: project.tier === 'free' ? 'gemini' : 'gemini-pro',
      tokens_used: result.tokensUsed,
      duration_seconds: 0 // Can add timing if needed
    });

    return Response.json({ 
      success: true, 
      content: result.content,
      tokensUsed: result.tokensUsed
    });

  } catch (error) {
    console.error('Generate chapter error:', error);
    return Response.json({ 
      error: 'Internal server error', 
      details: error.message 
    }, { status: 500 });
  }
}