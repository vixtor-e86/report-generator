// src/app/api/premium/generate/route.js
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { callAI } from '@/lib/aiProvider';
import mammoth from 'mammoth';

// Polyfills for Vercel
if (typeof global.DOMMatrix === 'undefined') { global.DOMMatrix = class DOMMatrix { constructor() { this.a = 1; this.d = 1; } }; }
if (typeof global.ImageData === 'undefined') { global.ImageData = class ImageData { constructor(w, h) { this.width = w; this.height = h; this.data = new Uint8ClampedArray(w * h * 4); } }; }

export async function POST(request) {
  try {
    const body = await request.json();
    const { 
      projectId, chapterNumber, userId, 
      selectedContextFiles = [],
      projectTitle = "", projectDescription = "", componentsUsed = "", researchBooks = "",
      userPrompt = "", referenceStyle = "APA", maxReferences = 10, targetWordCount = 2000,
      selectedImages = [], selectedPapers = [], skipReferences = false,
      objectiveCount = 3, useManualObjectives = false, manualObjectives = [],
      isModification = false, modificationType = "whole_chapter", fullContent = "", targetContent = ""
    } = body;

    if (!projectId || chapterNumber === undefined || !userId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const { data: project } = await supabaseAdmin.from('premium_projects').select('*, custom_templates(*)').eq('id', projectId).single();
    if (!project) return NextResponse.json({ error: 'Project not found' }, { status: 404 });

    const provider = process.env.PREMIUM_AI_PROVIDER || 'deepseek';
    const model = process.env.PREMIUM_AI_MODEL || 'deepseek-chat';

    // Check for surgical modification
    if (isModification && modificationType === 'partial' && targetContent) {
      const surgicalPrompt = `You are a high-end academic system architect.
      TASK: Rewrite ONLY the following section(s) of Chapter ${chapterNumber} for the project "${projectTitle || project.title}".
      
      ## ORIGINAL SECTIONS TO BE REPLACED:
      ${targetContent}

      ## USER INSTRUCTIONS FOR MODIFICATION:
      ${userPrompt}

      ## REQUIREMENTS:
      1. ONLY return the rewritten text for the specified section(s).
      2. Keep the same Markdown formatting (headings, sub-headings).
      3. Ensure the new content integrates perfectly with the rest of the chapter.
      4. Do NOT output anything else (no conversational filler).
      5. Maintain the original tone and technical accuracy.`;

      const aiResponse = await callAI(surgicalPrompt, { provider, model, maxTokens: 4000, temperature: 0.5 });
      
      // Merge back into full content
      const updatedFullContent = fullContent.replace(targetContent, aiResponse.content);

      // Save merged content
      const { data: chapter } = await supabaseAdmin.from('premium_chapters').select('id').eq('project_id', projectId).eq('chapter_number', chapterNumber).single();
      if (chapter) {
        await supabaseAdmin.from('premium_chapters').update({ content: updatedFullContent, updated_at: new Date().toISOString() }).eq('id', chapter.id);
        await supabaseAdmin.from('premium_chapter_history').insert({ chapter_id: chapter.id, content: updatedFullContent, prompt_used: userPrompt, model_used: aiResponse.model });
      }

      return NextResponse.json({ success: true, content: updatedFullContent });
    }

    // 1. Data Extraction (DOCX & TXT ONLY)
    let contextualSourceData = "";
    if (selectedContextFiles.length > 0) {
      for (const file of selectedContextFiles) {
        try {
          const res = await fetch(file.file_url || file.src);
          const buffer = Buffer.from(await res.arrayBuffer());
          let extractedText = "";
          const fileName = file.name || file.original_name || "File";
          
          if (fileName.toLowerCase().endsWith('.docx')) {
            const result = await mammoth.extractRawText({ buffer });
            extractedText = result.value;
          } else if (fileName.toLowerCase().endsWith('.txt')) {
            extractedText = buffer.toString('utf-8');
          } else continue;

          const words = extractedText.trim().split(/\s+/);
          const snippet = words.slice(0, 500).join(" ");
          contextualSourceData += `\n--- EXPERIMENTAL DATA FROM: ${fileName} ---\n${snippet}\n`;
        } catch (e) { console.error(e); }
      }
    }

    // 2. Resource Mapping
    const currentChapterData = project.custom_templates?.structure?.chapters?.find(ch => (ch.number || ch.chapter) === chapterNumber);
    const chapterTitle = currentChapterData?.title || `Chapter ${chapterNumber}`;
    
    const mandatorySections = currentChapterData?.sections?.length > 0 
      ? `## MANDATORY CHAPTER SECTIONS\n` +
        `You MUST include the following specific sections as sub-headings (###) in your response:\n` +
        currentChapterData.sections.map(s => `- ${s}`).join('\n')
      : '';

    const imageMapping = selectedImages.length > 0
      ? `\n\n### MANDATORY IMAGE ATTACHMENTS (STRICT RULES):\n` +
        `You MUST include the following images in your technical explanation. To insert an image, use this EXACT syntax: ![Caption](URL)\n` +
        selectedImages.map(img => `- Caption: "${img.caption || img.original_name}", URL: ${img.file_url}`).join('\n')
      : '';

    // 3. Citation Logic (FORCEFUL)
    const citationStyleInst = referenceStyle.toUpperCase() === 'IEEE'
      ? `### CITATION STYLE: STRICT IEEE\n` +
        `1. IN-TEXT: Use numbers in square brackets like [1], [2]. Sequential order only.\n` +
        `2. BIBLIOGRAPHY: List at end under "## References" in numerical order.`
      : referenceStyle.toUpperCase() === 'HARVARD'
      ? `### CITATION STYLE: STRICT HARVARD\n` +
        `1. IN-TEXT: Use (Author Year) format without comma.\n` +
        `2. BIBLIOGRAPHY: List at end under "## References" in alphabetical order by author. Format: Author, A.A. (Year) Title. City: Publisher.`
      : `### CITATION STYLE: STRICT APA\n` +
        `1. IN-TEXT: Use (Author, Year) format.\n` +
        `2. BIBLIOGRAPHY: List at end under "## References" in alphabetical order. Format: Author, A. A. (Year). Title. Publisher.`;

    // --- ENHANCED REFERENCE SOURCING ---
    let finalReferencesList = [...selectedPapers];
    const totalNeeded = maxReferences || 10;
    
    if (finalReferencesList.length < totalNeeded && !skipReferences) {
      try {
        const query = projectTitle || project.title;
        const currentYear = new Date().getFullYear();
        const yearRange = `2022-${currentYear}`;
        const searchUrl = new URL('https://api.semanticscholar.org/graph/v1/paper/search', 'https://api.semanticscholar.org');
        searchUrl.searchParams.set('query', query);
        searchUrl.searchParams.set('year', yearRange);
        searchUrl.searchParams.set('limit', (totalNeeded - finalReferencesList.length + 5).toString());
        searchUrl.searchParams.set('fields', 'title,authors,year,venue,url');
        const searchRes = await fetch(searchUrl.toString(), { headers: process.env.SEMANTIC_SCHOLAR_API_KEY ? { 'x-api-key': process.env.SEMANTIC_SCHOLAR_API_KEY } : {} });
        if (searchRes.ok) {
          const searchData = await searchRes.json();
          if (searchData.data) {
            const existingTitles = new Set(finalReferencesList.map(p => p.title.toLowerCase()));
            for (const paper of searchData.data) {
              if (!existingTitles.has(paper.title.toLowerCase()) && finalReferencesList.length < totalNeeded) finalReferencesList.push(paper);
            }
          }
        }
      } catch (searchErr) { console.error('Auto-reference search failed:', searchErr); }
    }

    const finalReferencesMapping = !skipReferences && finalReferencesList.length > 0
      ? `\n\n### CORE RESEARCH REFERENCES (MANDATORY):\n` +
        `You MUST use these specific sources for your citations. Use EXACTLY ${Math.min(finalReferencesList.length, totalNeeded)} references from this list.\n` +
        finalReferencesList.slice(0, totalNeeded).map((p, idx) => {
          const auths = Array.isArray(p.authors) ? p.authors.map(a => typeof a === 'object' ? a.name : a).join(', ') : (p.authors || 'Unknown');
          return `SOURCE [${idx + 1}]: ${auths} (${p.year}). "${p.title}". ${p.venue || 'Research Journal'}.`;
        }).join('\n\n')
      : '';

    // 4. Construct Structured System Prompt
    const objectiveInstruction = chapterNumber === 1 
      ? `\n\n### AIMS & OBJECTIVES REQUIREMENT:\n` +
        `You MUST generate EXACTLY ${objectiveCount} specific, technically-focused research objectives under the 'Objectives' sub-heading. Each objective should start with an action verb.`
      : '';

    const systemPrompt = `You are a high-end academic system architect and senior engineering researcher. 
    TASK: Author a comprehensive Chapter ${chapterNumber} titled "${chapterTitle}" for the project "${projectTitle || project.title}".

    ## PROJECT CONTEXT
    - DESCRIPTION: ${projectDescription || project.description}
    - TECHNICAL COMPONENTS: ${componentsUsed || project.components_used}
    - RESEARCH CONTEXT: ${researchBooks || project.research_papers_context}
    ${objectiveInstruction}

    ${mandatorySections}

    ${contextualSourceData ? `## MANDATORY EXPERIMENTAL DATA ANALYSIS\n${contextualSourceData}\nSTRICT REQUIREMENT: Perform detailed technical evaluation and result discussion based ONLY on the data provided above.` : ''}

    ${imageMapping}
    ${finalReferencesMapping}
    
    ## CITATION AND REFERENCE REQUIREMENTS
    ${citationStyleInst}
    - COUNT: You must include EXACTLY ${Math.min(finalReferencesList.length, totalNeeded)} unique references in your bibliography.
    - RECENTCY: Ensure all web-sourced citations are from 2022 to date.

    ## WRITING REQUIREMENTS
    - LANGUAGE: Professional, formal, objective academic English.
    - FORMAT: Markdown (## Headings, ### Sub-headings, **bold**, lists).
    - LENGTH: Highly detailed. TARGET: ${targetWordCount} words.
    - CURRENCY: All costs in Nigerian Naira (₦).
    - USER SPECIFIC INSTRUCTIONS: ${userPrompt || 'Deliver an elite technical chapter.'}

    ${skipReferences ? '--- DO NOT INCLUDE ANY CITATIONS OR REFERENCES.' : '--- MANDATORY: Include a "## References" section at the very end.'}`;

    // 5. Call AI
    const aiResponse = await callAI(systemPrompt, { provider, model, maxTokens: 8000, temperature: 0.6 });

    // 6. DB Persistence
    let { data: chapter } = await supabaseAdmin.from('premium_chapters').select('*').eq('project_id', projectId).eq('chapter_number', chapterNumber).single();
    if (!chapter) {
      const { data: nc } = await supabaseAdmin.from('premium_chapters').insert({ project_id: projectId, chapter_number: chapterNumber, title: chapterTitle, content: aiResponse.content, status: 'draft' }).select().single();
      chapter = nc;
    } else {
      await supabaseAdmin.from('premium_chapters').update({ content: aiResponse.content, status: 'draft', updated_at: new Date().toISOString() }).eq('id', chapter.id);
    }

    await supabaseAdmin.from('premium_chapter_history').insert({ chapter_id: chapter.id, content: aiResponse.content, prompt_used: userPrompt, model_used: aiResponse.model });

    // Extract and Save Project-Wide References
    const refSection = aiResponse.content.split(/## References|# References/i)[1];
    if (refSection) {
      const lines = refSection.split('\n').filter(l => l.trim() && (l.trim().startsWith('[') || l.match(/^\d+\./)));
      if (lines.length > 0) {
        await supabaseAdmin.from('project_references').delete().eq('project_id', projectId).eq('chapter_number', chapterNumber);
        await supabaseAdmin.from('project_references').insert(lines.map((l, i) => ({ project_id: projectId, user_id: userId, reference_text: l.trim(), order_number: i + 1, chapter_number: chapterNumber })));
      }
    }

    await supabaseAdmin.from('premium_projects').update({ tokens_used: (project.tokens_used || 0) + aiResponse.tokensUsed.total, updated_at: new Date().toISOString() }).eq('id', projectId);

    return NextResponse.json({ success: true, content: aiResponse.content });

  } catch (error) { console.error('Gen Error:', error); return NextResponse.json({ error: error.message }, { status: 500 }); }
}
