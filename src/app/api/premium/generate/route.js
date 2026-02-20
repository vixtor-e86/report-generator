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
      targetWordCount = 2000,
      
      // Materials
      selectedImages = [],
      selectedPapers = [],
      skipReferences = false
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

    // 2. Check Tokens (Dynamic check based on target words)
    // DeepSeek V3/R1 tokens ≈ 1.5 - 2x word count for technical content + formatting
    const estimatedTokens = Math.ceil(targetWordCount * 4); 
    if ((project.tokens_used || 0) + estimatedTokens > (project.tokens_limit || 300000)) {
      return NextResponse.json({ error: `Insufficient tokens for a ${targetWordCount} word chapter. Please upgrade your limit.` }, { status: 403 });
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

    // Build full bibliographic entries for semantic scholar papers (skipped if user opted out)
    const paperContext = !skipReferences && selectedPapers.length > 0
      ? `\n\nPRE-SELECTED SEMANTIC SCHOLAR REFERENCES — MANDATORY CITATION RULES:\nYou MUST cite each of the following papers in the body of this chapter where relevant, AND you MUST list ALL of them verbatim in the References section at the end, formatted in ${referenceStyle} style. Do NOT omit any of them from the References section, even if you did not cite them in text.\n\n${selectedPapers.map((p, idx) => {
        const authors = Array.isArray(p.authors)
          ? p.authors.map(a => (typeof a === 'object' ? a.name : a)).filter(Boolean).join(', ')
          : (p.authors || 'Unknown Author');
        const year = p.year || 'n.d.';
        const venue = p.venue || p.journal || 'Unknown Journal';
        const url = p.url || p.external_url || '';
        const snippet = p.abstract ? ` Key findings: ${p.abstract.substring(0, 250)}...` : '';
        return `[SS${idx + 1}] ${authors} (${year}). "${p.title || p.original_name}". ${venue}.${url ? ` Available: ${url}` : ''}${snippet}`;
      }).join('\n\n')}`
      : '';

    const additionalNeeded = maxReferences - selectedPapers.length;
    const searchInstruction = skipReferences
      ? ''
      : additionalNeeded > 0
        ? `\n\nWEB SEARCH FOR ADDITIONAL REFERENCES: Find and cite ${additionalNeeded} additional REAL academic sources to supplement the pre-selected papers above. STRICT YEAR RESTRICTION: Only use sources published from 2018 to the present (${new Date().getFullYear()}). Do NOT cite any source published before 2018. Verify that each source actually contains content relevant to the specific claim or topic you are citing it for — do not cite a source merely because its title sounds relevant. All citations must follow ${referenceStyle} style.`
        : `\n\nEnsure all citations follow ${referenceStyle} style.`;

    const sectionContext = currentChapterData?.sections 
      ? `\nFocus on these required sections from the template:\n${currentChapterData.sections.map(s => `- ${s}`).join('\n')}`
      : '';

    // 4. Construct the generation prompt
    const systemPrompt = `You are an elite academic researcher and engineer specialized in ${project.faculty} (${project.department}).
    Task: Author Chapter ${chapterNumber}: "${chapterTitle || currentChapterData?.title}" for the project "${finalTitle}".

    Overall Project Objective: ${finalDescription}

    Contextual Details:
    - Components/Tools: ${finalComponents || 'Standard engineering tools'}
    - Research Focus: ${finalResearch || 'Latest industry standards'}

    ${sectionContext}

    ---
    IMAGE MAPPING (STRICT RULES):
    ${imageContext || 'No images provided for this chapter.'}

    1. ONLY use images listed in the "IMAGE MAPPING" above.
    2. NEVER use external URLs, GitHub links, or placeholder websites.
    3. If no images are mapped, DO NOT include any image tags.
    4. To insert an image, use this EXACT syntax: ![Caption](URL)
    ---

    ${paperContext}
    ${searchInstruction}

    User Specific Instructions: ${userPrompt || 'Deliver a high-quality, technically accurate academic chapter.'}

    Writing Requirements:
    - Language: Formal, objective, technical English.
    - Format: Markdown (## Headings, **bold**, bullet points).
    - Length: Detailed and comprehensive. **TARGET WORD COUNT: ${targetWordCount} words.** Ensure the content is substantive, in-depth, and meets this length requirement.
    - Visuals: Integrate relevant images from the mapping naturally within the technical explanation.
    - Citation quality: When citing a source, reference its actual findings, data, or arguments — not merely its title or topic. Each in-text citation must correspond to a specific claim supported by that source.
    - Currency: If this chapter contains a Bill of Materials, cost estimates, or any pricing — ALL monetary values MUST be expressed in Nigerian Naira (₦). Do not use USD, GBP, or any other currency.

    ${skipReferences
      ? `---\nNO REFERENCES REQUIRED: Do NOT include any in-text citations, footnotes, or a References/Bibliography section in this chapter. Write as plain technical prose without any citation markers.`
      : `---\n    REFERENCES SECTION (MANDATORY):\n    At the very end of this chapter, you MUST include a "## References" section.\n    - List EVERY pre-selected Semantic Scholar paper provided above (all [SS#] entries) in ${referenceStyle} format.\n    - Also list any additional sources you cited from your web search.\n    - Do NOT omit any pre-selected paper, even if it was not explicitly cited in the chapter body.\n    - Use only ${referenceStyle} formatting throughout. Do not mix styles.`
    }`;

    // 5. Call AI (DeepSeek)
    const aiResponse = await callAI(systemPrompt, {
      provider: 'deepseek',
      maxTokens: 8000,
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
