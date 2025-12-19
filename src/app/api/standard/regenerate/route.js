// /src/app/api/standard/regenerate/route.js
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getStandardPrompt } from '@/lib/standardPrompts';
import { callAI, checkTokenLimit } from '@/lib/aiProvider'; // ✅ NEW

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(request) {
  try {
    const { projectId, chapterNumber, customInstruction, userId } = await request.json();

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

    // 3. ✅ NEW: Smart token limit check
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

    // 4. Fetch the chapter to regenerate
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

    // 5. Save current version to history
    if (chapter.content) {
      await supabase
        .from('standard_chapter_versions')
        .insert({
          chapter_id: chapter.id,
          version_number: chapter.version || 1,
          content: chapter.content,
          change_type: customInstruction ? 'modified_prompt' : 'regenerated',
          change_description: customInstruction 
            ? `User instruction: ${customInstruction}` 
            : 'Simple regeneration',
          created_by: 'ai'
        });
    }

    // 6. Update chapter status to generating
    await supabase
      .from('standard_chapters')
      .update({ status: 'generating' })
      .eq('id', chapter.id);

    // 7. Fetch previous chapters for context
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
        .map(ch => `Chapter ${ch.chapter_number}: ${ch.title}\n${ch.content?.substring(0, 500)}...`)
        .join('\n\n');
    }

    // 8. Fetch images
    const { data: images } = await supabase
      .from('standard_images')
      .select('*')
      .eq('project_id', projectId)
      .order('order_number', { ascending: true });

    // 9. Fetch template structure
    const { data: template } = await supabase
      .from('templates')
      .select('structure')
      .eq('id', project.template_id)
      .single();

    if (!template) {
      throw new Error('Template not found');
    }

    // 10. Build AI prompt with custom instruction
    const prompt = getStandardPrompt(chapterNumber, {
      projectTitle: project.title,
      department: project.department,
      components: project.components,
      description: project.description,
      images: images || [],
      context,
      customInstruction: customInstruction || '',
      templateStructure: template.structure
    });

    // 11. Store custom instruction if provided
    let userModifications = chapter.user_modifications || [];
    if (customInstruction) {
      userModifications.push({
        type: 'custom_prompt',
        instruction: customInstruction,
        timestamp: new Date().toISOString()
      });
    }

    // 12. ✅ NEW: Call AI using unified provider
    const startTime = Date.now();
    
    const aiResult = await callAI(prompt, {
      maxTokens: 4000,
      temperature: 0.7
    });
    
    const endTime = Date.now();
    const durationSeconds = Math.round((endTime - startTime) / 1000);

    console.log(`✅ Regeneration complete: ${aiResult.model} - ${aiResult.tokensUsed.total} tokens`);

    // 13. Increment version number
    const newVersion = (chapter.version || 1) + 1;

    // 14. Update chapter with regenerated content
    const { error: updateError } = await supabase
      .from('standard_chapters')
      .update({
        content: aiResult.content,
        status: 'draft',
        version: newVersion,
        regeneration_count: (chapter.regeneration_count || 0) + 1,
        user_modifications: userModifications,
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
        { error: 'Failed to save regenerated content' },
        { status: 500 }
      );
    }

    // 15. Update project tokens_used
    const newTokensUsed = project.tokens_used + aiResult.tokensUsed.total;
    await supabase
      .from('standard_projects')
      .update({
        tokens_used: newTokensUsed,
        last_generated_at: new Date().toISOString()
      })
      .eq('id', projectId);

    // 16. Log to generation history
    await supabase
      .from('standard_generation_history')
      .insert({
        user_id: userId,
        project_id: projectId,
        chapter_id: chapter.id,
        chapter_number: chapterNumber,
        action_type: customInstruction ? 'modify' : 'regenerate',
        ai_provider: aiResult.provider,
        ai_model: aiResult.model,
        tokens_input: aiResult.tokensUsed.input,
        tokens_output: aiResult.tokensUsed.output,
        tokens_total: aiResult.tokensUsed.total,
        duration_seconds: durationSeconds,
        user_instruction: customInstruction || null,
        success: true
      });

    // 17. Return success response
    return NextResponse.json({
      success: true,
      content: aiResult.content,
      tokensUsed: aiResult.tokensUsed.total,
      tokensRemaining: project.tokens_limit - newTokensUsed,
      version: newVersion,
      durationSeconds,
      model: aiResult.model,
      provider: aiResult.provider
    });

  } catch (error) {
    console.error('Regeneration error:', error);

    // Update chapter status back
    try {
      const { projectId, chapterNumber } = await request.json();
      await supabase
        .from('standard_chapters')
        .update({ status: 'draft' })
        .eq('project_id', projectId)
        .eq('chapter_number', chapterNumber);
    } catch {}

    // Log failed attempt
    try {
      const { userId, projectId, chapterNumber, customInstruction } = await request.json();
      await supabase
        .from('standard_generation_history')
        .insert({
          user_id: userId,
          project_id: projectId,
          chapter_number: chapterNumber,
          action_type: customInstruction ? 'modify' : 'regenerate',
          ai_provider: process.env.AI_PROVIDER || 'gemini',
          success: false,
          error_message: error.message
        });
    } catch (logError) {
      console.error('Error logging failed regeneration:', logError);
    }

    return NextResponse.json(
      { error: error.message || 'Failed to regenerate chapter' },
      { status: 500 }
    );
  }
}