// /src/app/api/standard/generate/route.js
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getStandardPrompt } from '@/lib/standardPrompts';
import { callAI, checkTokenLimit } from '@/lib/aiProvider';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(request) {
  try {
    const { projectId, chapterNumber, userId } = await request.json();

    // Validate inputs
    if (!projectId || !chapterNumber || !userId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // 1. Fetch project
    const { data: project, error: projectError } = await supabase
      .from('standard_projects')
      .select('*')
      .eq('id', projectId)
      .single();

    if (projectError || !project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    // 2. Verify ownership
    if (project.user_id !== userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // 3. Smart token limit check
    const tokenCheck = checkTokenLimit(project.tokens_used, project.tokens_limit, 10000);
    
    if (!tokenCheck.allowed) {
      return NextResponse.json(
        { 
          error: 'Token limit exceeded. You can still edit manually or upgrade to Premium.',
          details: {
            tokensUsed: project.tokens_used,
            tokensLimit: project.tokens_limit,
            tokensRemaining: tokenCheck.remaining
          }
        },
        { status: 429 }
      );
    }

    // 4. Fetch the chapter to generate
    const { data: chapter, error: chapterError } = await supabase
      .from('standard_chapters')
      .select('*')
      .eq('project_id', projectId)
      .eq('chapter_number', chapterNumber)
      .single();

    if (chapterError || !chapter) {
      return NextResponse.json(
        { error: 'Chapter not found' },
        { status: 404 }
      );
    }

    // 5. Update chapter status to generating
    await supabase
      .from('standard_chapters')
      .update({ status: 'generating' })
      .eq('id', chapter.id);

        // 6. Fetch previous chapters for context
    const { data: previousChapters } = await supabase
      .from('standard_chapters')
      .select('chapter_number, title, content')
      .eq('project_id', projectId)
      .lt('chapter_number', chapterNumber)
      .in('status', ['draft', 'edited', 'approved'])
      .order('chapter_number', { ascending: true });

    let context = '';
    if (previousChapters && previousChapters.length > 0) {
      context = previousChapters
        .map(ch => {
          // ✅ Strip figure references from context to avoid confusion
          const cleanedContent = ch.content
            ?.replace(/\{\{figure\d+\.\d+\}\}/g, '[figure]') // Replace {{figureX.Y}} with [figure]
            ?.substring(0, 500);
          
          return `Chapter ${ch.chapter_number}: ${ch.title}\n${cleanedContent}...`;
        })
        .join('\n\n');
    }

    // 7. ✅ IMPROVED: Fetch ONLY images for THIS chapter (global + chapter-specific)
    const { data: allImages } = await supabase
      .from('standard_images')
      .select('*')
      .eq('project_id', projectId)
      .or(`chapter_number.is.null,chapter_number.eq.${chapterNumber}`)
      .order('order_number', { ascending: true });

    // Filter and assign proper figure numbers for THIS chapter only
    const images = (allImages || []).map((img, index) => ({
      ...img,
      chapterNumber: chapterNumber, // Force current chapter number
      figureNumber: index + 1, // Sequential numbering for this chapter
      placeholder: `{{figure${chapterNumber}.${index + 1}}}`
    }));

    console.log(`Chapter ${chapterNumber}: ${images.length} images available`);
    // 8. ✅ NEW: Fetch template with faculty information
    const { data: template } = await supabase
      .from('templates')
      .select('structure, faculty, template_type')
      .eq('id', project.template_id)
      .single();

    if (!template) {
      throw new Error('Template not found');
    }

    // 8.5 ✅ NEW: Fetch existing references for this project
    const { data: existingReferences } = await supabase
      .from('project_references')
      .select('reference_key, reference_text, author, year')
      .eq('project_id', projectId)
      .order('order_number', { ascending: true });

    // 9. ✅ NEW: Build AI prompt with faculty information
    const prompt = getStandardPrompt(chapterNumber, {
      projectTitle: project.title,
      department: project.department,
      components: project.components,
      description: project.description,
      images: images || [],
      context,
      templateStructure: template.structure,
      faculty: template.faculty || 'Engineering',
      referenceStyle: project.reference_style || 'apa',
      existingReferences: existingReferences || [] // ✅ Pass existing references
    });

    // 10. Call AI using unified provider
    const startTime = Date.now();
    
    const aiResult = await callAI(prompt, {
      maxTokens: 4000,
      temperature: 0.7
    });
    
    const endTime = Date.now();
    const durationSeconds = Math.round((endTime - startTime) / 1000);

    console.log(`✅ Generation complete: ${aiResult.model} - ${aiResult.tokensUsed.total} tokens`);

    // 11. Update chapter with generated content
    const { error: updateError } = await supabase
      .from('standard_chapters')
      .update({
        content: aiResult.content,
        status: 'draft',
        version: chapter.version || 1,
        ai_model_used: aiResult.model,
        tokens_input: aiResult.tokensUsed.input,
        tokens_output: aiResult.tokensUsed.output,
        generation_time_seconds: durationSeconds,
        generated_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', chapter.id);

    if (updateError) {
      console.error('Error updating chapter:', updateError);
      return NextResponse.json(
        { error: 'Failed to save generated content' },
        { status: 500 }
      );
    }

    // 12. Update project tokens_used
    const newTokensUsed = project.tokens_used + aiResult.tokensUsed.total;
    await supabase
      .from('standard_projects')
      .update({
        tokens_used: newTokensUsed,
        last_generated_at: new Date().toISOString()
      })
      .eq('id', projectId);

    // 13. Log to generation history
    await supabase
      .from('standard_generation_history')
      .insert({
        user_id: userId,
        project_id: projectId,
        chapter_id: chapter.id,
        chapter_number: chapterNumber,
        action_type: 'generate',
        ai_provider: aiResult.provider,
        ai_model: aiResult.model,
        tokens_input: aiResult.tokensUsed.input,
        tokens_output: aiResult.tokensUsed.output,
        tokens_total: aiResult.tokensUsed.total,
        duration_seconds: durationSeconds,
        success: true
      });

    // 14. Return success response
    return NextResponse.json({
      success: true,
      content: aiResult.content,
      tokensUsed: aiResult.tokensUsed.total,
      tokensRemaining: project.tokens_limit - newTokensUsed,
      durationSeconds,
      model: aiResult.model,
      provider: aiResult.provider
    });

  } catch (error) {
    console.error('Generation error:', error);

    // Update chapter status to failed
    try {
      const { projectId, chapterNumber } = await request.json();
      await supabase
        .from('standard_chapters')
        .update({ status: 'not_generated' })
        .eq('project_id', projectId)
        .eq('chapter_number', chapterNumber);
    } catch {}

    // Log failed attempt
    try {
      const { userId, projectId, chapterNumber } = await request.json();
      await supabase
        .from('standard_generation_history')
        .insert({
          user_id: userId,
          project_id: projectId,
          chapter_number: chapterNumber,
          action_type: 'generate',
          ai_provider: process.env.AI_PROVIDER || 'gemini',
          success: false,
          error_message: error.message
        });
    } catch (logError) {
      console.error('Error logging failed generation:', logError);
    }

    return NextResponse.json(
      { error: error.message || 'Failed to generate chapter' },
      { status: 500 }
    );
  }
}