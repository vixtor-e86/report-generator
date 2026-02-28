// src/app/api/premium/generate/route.js
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { callAI } from '@/lib/aiProvider';
import pdf from 'pdf-parse';
import mammoth from 'mammoth';

export async function POST(request) {
  try {
    const { 
      projectId, 
      chapterNumber, 
      chapterTitle, 
      userId, 
      
      projectTitle,
      projectDescription,
      componentsUsed,
      researchBooks,
      userPrompt,
      referenceStyle,
      maxReferences,
      targetWordCount = 2000,
      
      selectedImages = [],
      selectedPapers = [],
      selectedContextFiles = [], // NEW: Files for analysis
      skipReferences = false
    } = await request.json();

    if (!projectId || chapterNumber === undefined || !userId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const { data: project, error: projectError } = await supabaseAdmin
      .from('premium_projects')
      .select('*, custom_templates(*)')
      .eq('id', projectId)
      .single();

    if (projectError || !project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // --- NEW: Contextual File Text Extraction ---
    let contextualSourceData = "";
    if (selectedContextFiles.length > 0) {
      for (const file of selectedContextFiles) {
        try {
          const res = await fetch(file.file_url || file.src);
          const arrayBuffer = await res.arrayBuffer();
          const buffer = Buffer.from(arrayBuffer);
          
          let extractedText = "";
          if (file.file_type === 'application/pdf' || (file.name || "").endsWith('.pdf')) {
            const data = await pdf(buffer);
            extractedText = data.text;
          } else if (file.file_type?.includes('word') || (file.name || "").endsWith('.docx')) {
            const result = await mammoth.extractRawText({ buffer });
            extractedText = result.value;
          } else {
            // Text files or unknown
            extractedText = buffer.toString('utf-8');
          }
          
          contextualSourceData += `\n--- SOURCE FILE: ${file.name || "Data File"} ---\n${extractedText.substring(0, 15000)}\n`;
        } catch (e) {
          console.error("Extraction error:", e);
        }
      }
    }

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
    const currentChapterData = templateStructure?.chapters?.find(ch => (ch.number || ch.chapter) === chapterNumber);

    const estimatedTokens = Math.ceil(targetWordCount * 4); 
    if ((project.tokens_used || 0) + estimatedTokens > (project.tokens_limit || 300000)) {
      return NextResponse.json({ error: `Insufficient tokens.` }, { status: 403 });
    }

    const finalTitle = projectTitle || project.title;
    const finalDescription = projectDescription || project.description;
    const finalComponents = componentsUsed || project.components_used;
    const finalResearch = researchBooks || project.research_papers_context;

    const imageContext = selectedImages.length > 0
      ? `\n\nIncluded Images (Mapping of Caption to URL):
${selectedImages.map(img => `- Caption: "${img.caption || img.original_name}", URL: ${img.file_url}`).join('\n')}`
      : '';

    const paperContext = !skipReferences && selectedPapers.length > 0
      ? `\n\nPRE-SELECTED REFERENCES:\n${selectedPapers.map((p, idx) => {
        const authors = Array.isArray(p.authors) ? p.authors.map(a => (typeof a === 'object' ? a.name : a)).join(', ') : (p.authors || 'Unknown');
        return `[SS${idx + 1}] ${authors} (${p.year}). "${p.title}". ${p.venue}.`;
      }).join('\n\n')}`
      : '';

    const citationStyleRules = referenceStyle === 'IEEE' 
      ? `STRICT IEEE RULES: Use [1], [2] sequential in-text citations. Order References list by appearance.`
      : `Follow ${referenceStyle} style rules.`;

    const sectionContext = currentChapterData?.sections 
      ? `\nFocus on these required sections:\n${currentChapterData.sections.map(s => `- ${s}`).join('\n')}`
      : '';

    const systemPrompt = `You are an elite academic researcher and engineer specialized in ${project.faculty} (${project.department}).
    Task: Author Chapter ${chapterNumber}: "${chapterTitle || currentChapterData?.title}" for "${finalTitle}".

    Overall Objective: ${finalDescription}
    Context: ${finalComponents} | ${finalResearch}
    ${sectionContext}

    ${contextualSourceData ? `\n--- MANDATORY SOURCE DATA FOR ANALYSIS ---\n${contextualSourceData}\nAnalyze the data provided above (readings, tests, experimental results) and incorporate it specifically into this chapter. If this is Chapter 4, perform detailed technical analysis, comparisons, and evaluation based on this provided data.` : ''}

    IMAGE MAPPING:
    ${imageContext}
    Rule: Use exactly ![Caption](URL) syntax.

    ${paperContext}
    ${citationStyleRules}

    Instructions: ${userPrompt || 'Deliver high-quality academic content.'}

    Requirements:
    - Formal, technical English.
    - Markdown format.
    - Target: ${targetWordCount} words.
    - Currency: Nigerian Naira (₦).

    ${skipReferences ? `--- NO REFERENCES SECTION.` : `--- Include a "## References" section at the end using ${referenceStyle} style.`}`;

    const aiResponse = await callAI(systemPrompt, { provider: 'deepseek', maxTokens: 8000, temperature: 0.6 });

    let { data: chapter } = await supabaseAdmin.from('premium_chapters').select('*').eq('project_id', projectId).eq('chapter_number', chapterNumber).single();
    if (!chapter) {
      const { data: newChapter } = await supabaseAdmin.from('premium_chapters').insert({ project_id: projectId, chapter_number: chapterNumber, title: chapterTitle || currentChapterData?.title || `Chapter ${chapterNumber}`, content: aiResponse.content, status: 'draft' }).select().single();
      chapter = newChapter;
    } else {
      await supabaseAdmin.from('premium_chapters').update({ content: aiResponse.content, status: 'draft', updated_at: new Date().toISOString() }).eq('id', chapter.id);
    }

    // History extraction logic...
    await supabaseAdmin.from('premium_chapter_history').insert({ chapter_id: chapter.id, content: aiResponse.content, prompt_used: userPrompt, model_used: aiResponse.model });

    const refSection = aiResponse.content.split(/## References|# References/i)[1];
    if (refSection) {
      const refLines = refSection.split('\n').filter(line => line.trim() && (line.trim().startsWith('[') || line.match(/^\d+\./)));
      if (refLines.length > 0) {
        const refEntries = refLines.map((line, idx) => ({ project_id: projectId, user_id: userId, reference_text: line.trim(), order_number: idx + 1, chapter_number: chapterNumber }));
        await supabaseAdmin.from('project_references').delete().eq('project_id', projectId).eq('chapter_number', chapterNumber);
        await supabaseAdmin.from('project_references').insert(refEntries);
      }
    }

    await supabaseAdmin.from('premium_projects').update({ tokens_used: (project.tokens_used || 0) + aiResponse.tokensUsed.total, updated_at: new Date().toISOString() }).eq('id', projectId);

    return NextResponse.json({ success: true, content: aiResponse.content });
  } catch (error) { console.error('Gen Error:', error); return NextResponse.json({ error: error.message }, { status: 500 }); }
}
