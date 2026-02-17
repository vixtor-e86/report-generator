// src/app/api/premium/generate/route.js
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { callAI } from '@/lib/aiProvider';

export async function POST(request) {
  try {
    const { projectId, chapterNumber, chapterTitle, userId, files = [], userPrompt } = await request.json();

    if (!projectId || !chapterNumber || !userId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // 1. Fetch Project Details & Latest Template Structure
    const { data: project, error: projectError } = await supabaseAdmin
      .from('premium_projects')
      .select('*, custom_templates(*)')
      .eq('id', projectId)
      .single();

    if (projectError || !project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    const templateStructure = project.custom_templates?.structure;
    const currentChapterData = templateStructure?.chapters?.find(
      ch => (ch.number || ch.chapter) === chapterNumber
    );

    // 2. Check Tokens (Approximate 5k limit per chapter generation)
    if ((project.tokens_used || 0) + 5000 > (project.tokens_limit || 500000)) {
      return NextResponse.json({ error: 'Insufficient tokens' }, { status: 403 });
    }

    // 3. Prepare File Parts for Gemini (Multimodal)
    const fileParts = [];
    
    // For now, we add text descriptions of files. 
    // In a future step, we can use a text extractor API or direct R2 download.
    for (const file of files) {
      fileParts.push(`[Attached Context File: ${file.original_name} - Purpose: ${file.purpose}]`);
    }

    // 4. Construct Prompt using the Latest Template Structure
    const sectionContext = currentChapterData?.sections 
      ? `\nFocus on these required sections:\n${currentChapterData.sections.map(s => `- ${s}`).join('\n')}`
      : '';

    const systemPrompt = `You are an expert academic writer for ${project.faculty} (${project.department}).
    Task: Write Chapter ${chapterNumber}: "${chapterTitle || currentChapterData?.title}" for the project titled "${project.title}".
    
    Project Context: ${project.description}
    Full Document Structure: ${JSON.stringify(templateStructure)}
    ${sectionContext}
    
    User Specific Instructions: ${userPrompt || 'Follow standard academic structure.'}
    
    Requirements:
    - Academic tone, professional, objective.
    - Use Markdown formatting (## Headings, **bold**, lists).
    - Suggest image placements where relevant using [Insert Image: Description].
    - Write approximately 1500-2000 words.`;

    // 5. Call AI (Gemini 1.5 Flash for Multimodal/File support)
    const aiResponse = await callAI(systemPrompt, {
      provider: 'gemini',
      maxTokens: 8000,
      temperature: 0.7,
      fileParts: fileParts.length > 0 ? fileParts : null
    });

    // 6. Upsert Chapter Record
    let { data: chapter } = await supabaseAdmin
      .from('premium_chapters')
      .select('*')
      .eq('project_id', projectId)
      .eq('chapter_number', chapterNumber)
      .single();

    if (!chapter) {
      const { data: newChapter } = await supabaseAdmin
        .from('premium_chapters')
        .insert({
          project_id: projectId,
          chapter_number: chapterNumber,
          title: chapterTitle || currentChapterData?.title || `Chapter ${chapterNumber}`,
          content: aiResponse.content,
          status: 'draft'
        })
        .select()
        .single();
      chapter = newChapter;
    } else {
      await supabaseAdmin
        .from('premium_chapters')
        .update({ 
          content: aiResponse.content,
          status: 'draft',
          updated_at: new Date().toISOString()
        })
        .eq('id', chapter.id);
    }

    // 7. Save to History (Manage limit of 5)
    const { count } = await supabaseAdmin
      .from('premium_chapter_history')
      .select('*', { count: 'exact', head: true })
      .eq('chapter_id', chapter.id);

    if (count >= 5) {
      const { data: oldest } = await supabaseAdmin
        .from('premium_chapter_history')
        .select('id')
        .eq('chapter_id', chapter.id)
        .order('created_at', { ascending: true })
        .limit(1)
        .single();
      
      if (oldest) {
        await supabaseAdmin.from('premium_chapter_history').delete().eq('id', oldest.id);
      }
    }

    await supabaseAdmin
      .from('premium_chapter_history')
      .insert({
        chapter_id: chapter.id,
        content: aiResponse.content,
        prompt_used: userPrompt,
        model_used: aiResponse.model
      });

    // 8. Deduct Tokens & Update Project
    await supabaseAdmin
      .from('premium_projects')
      .update({
        tokens_used: (project.tokens_used || 0) + aiResponse.tokensUsed.total,
        updated_at: new Date().toISOString()
      })
      .eq('id', projectId);

    return NextResponse.json({ success: true, content: aiResponse.content });

  } catch (error) {
    console.error('Premium Generation Error:', error);
    return NextResponse.json({ error: error.message || 'Generation failed' }, { status: 500 });
  }
}
