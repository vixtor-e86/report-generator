// src/app/api/premium/generate/route.js
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { callAI } from '@/lib/aiProvider';

export async function POST(request) {
  try {
    const { 
      projectId, 
      chapterNumber, 
      chapterTitle, 
      userId, 
      
      // New Form Data
      projectTitle,
      projectDescription,
      componentsUsed,
      researchBooks,
      userPrompt,
      referenceStyle,
      maxReferences,
      
      // Materials
      selectedImages = [],
      selectedPapers = []
    } = await request.json();

    if (!projectId || chapterNumber === undefined || !userId) {
      return NextResponse.json({ error: 'Missing required fields (Project ID, Chapter Number, or User ID)' }, { status: 400 });
    }

    // 1. Fetch Latest Template Structure (for chapter sections)
    const { data: project, error: projectError } = await supabaseAdmin
      .from('premium_projects')
      .select('*, custom_templates(*)')
      .eq('id', projectId)
      .single();

    if (projectError || !project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Update project context if full details were provided (usually on first chapter)
    if (projectTitle || projectDescription || componentsUsed || researchBooks) {
      await supabaseAdmin
        .from('premium_projects')
        .update({
          title: projectTitle || project.title,
          description: projectDescription || project.description,
          components_used: componentsUsed || project.components_used,
          research_papers_context: researchBooks || project.research_papers_context,
          updated_at: new Date().toISOString()
        })
        .eq('id', projectId);
    }

    const templateStructure = project.custom_templates?.structure;
    const currentChapterData = templateStructure?.chapters?.find(
      ch => (ch.number || ch.chapter) === chapterNumber
    );

    // 2. Check Tokens (Approximate 10k limit for high-quality premium chapters)
    if ((project.tokens_used || 0) + 10000 > (project.tokens_limit || 500000)) {
      return NextResponse.json({ error: 'Insufficient tokens' }, { status: 403 });
    }

    // 3. Prepare Context Strings (Fallback to project record if not passed in request)
    const finalTitle = projectTitle || project.title;
    const finalDescription = projectDescription || project.description;
    const finalComponents = componentsUsed || project.components_used;
    const finalResearch = researchBooks || project.research_papers_context;

    const imageContext = selectedImages.length > 0
      ? `\n\nIncluded Images (Mapping of Caption to URL - use these to insert images):
${selectedImages.map(img => `- Caption: "${img.caption || img.original_name}", URL: ${img.file_url}`).join('\n')}`
      : '';

    const paperContext = selectedPapers.length > 0
      ? `\n\nSpecific References to use:\n${selectedPapers.map(p => `- ${p.title || p.original_name} (Source: ${p.journal || 'Internal'})`).join('\n')}`
      : '';

    const searchInstruction = (selectedPapers.length < maxReferences)
      ? `\n\nIMPORTANT: Use your integrated web search capabilities to find and cite at least ${maxReferences - selectedPapers.length} additional REAL academic sources relevant to this topic. Ensure all citations follow the ${referenceStyle} style.`
      : `\n\nEnsure all citations follow the ${referenceStyle} style.`;

    const sectionContext = currentChapterData?.sections 
      ? `\nFocus on these required sections from the template:\n${currentChapterData.sections.map(s => `- ${s}`).join('\n')}`
      : '';

    // 4. Construct Multi-Part Prompt for Gemini 1.5 Flash
    const systemPrompt = `You are an elite academic researcher and engineer specialized in ${project.faculty} (${project.department}).
    Task: Author Chapter ${chapterNumber}: "${chapterTitle || currentChapterData?.title}" for the project "${finalTitle}".
    
    Overall Project Objective: ${finalDescription}
    
    Contextual Details:
    - Components/Tools: ${finalComponents || 'Standard engineering tools'}
    - Research Focus: ${finalResearch || 'Latest industry standards'}
    
    ${sectionContext}
    ${imageContext}
    ${paperContext}
    ${searchInstruction}
    
    User Specific Instructions: ${userPrompt || 'Deliver a high-quality, technically accurate academic chapter.'}
    
    Writing Requirements:
    - Language: Formal, objective, technical English.
    - Format: Markdown (## Headings, **bold**, bullet points).
    - Length: Detailed and comprehensive (Target ~2000 words).
    - Visuals: Whenever an image from the provided mapping is relevant, insert it using standard markdown: ![Caption](URL). Ensure the URL matches EXACTLY.
    - References: You MUST provide a "References" section at the end of the chapter using ${referenceStyle} style.`;

    // 5. Call AI (Gemini 1.5 Flash)
    const aiResponse = await callAI(systemPrompt, {
      provider: 'gemini',
      maxTokens: 12000, // Large context for detailed chapter
      temperature: 0.6
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

    // 7. Save to History (limit 5)
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
      if (oldest) await supabaseAdmin.from('premium_chapter_history').delete().eq('id', oldest.id);
    }

    await supabaseAdmin
      .from('premium_chapter_history')
      .insert({
        chapter_id: chapter.id,
        content: aiResponse.content,
        prompt_used: userPrompt,
        model_used: aiResponse.model
      });

    // 8. Update Tokens
    await supabaseAdmin
      .from('premium_projects')
      .update({
        tokens_used: (project.tokens_used || 0) + aiResponse.tokensUsed.total,
        updated_at: new Date().toISOString()
      })
      .eq('id', projectId);

    return NextResponse.json({ success: true, content: aiResponse.content });

  } catch (error) {
    console.error('Generation Error:', error);
    return NextResponse.json({ error: error.message || 'Generation failed' }, { status: 500 });
  }
}
