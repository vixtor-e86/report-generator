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
      isModification = false, modificationType = "whole_chapter", fullContent = "", targetContent = ""
    } = body;

    if (!projectId || chapterNumber === undefined || !userId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const { data: project } = await supabaseAdmin.from('premium_projects').select('*, custom_templates(*)').eq('id', projectId).single();
    if (!project) return NextResponse.json({ error: 'Project not found' }, { status: 404 });

    const provider = process.env.PREMIUM_AI_PROVIDER || 'deepseek';
    const model = process.env.PREMIUM_AI_MODEL || 'deepseek-chat';

    // --- 1. Surgical Modification Logic (ENHANCED) ---
    if (isModification && targetContent) {
      const isPartial = modificationType === 'partial';
      
      const surgicalPrompt = `You are a high-end academic system architect and expert editor.
      TASK: ${isPartial ? 'Rewrite ONLY the specific section(s) provided.' : 'Rewrite the entire chapter based on user instructions.'}
      PROJECT: "${project.title}"
      CHAPTER: ${chapterNumber}

      ## ORIGINAL CONTENT TO BE FIXED:
      ${targetContent}

      ${isPartial ? `## CONTEXT (DO NOT REWRITE THIS PART): 
      Note: This section exists within a larger chapter. Ensure your tone and technical depth match the existing report flow.` : ''}

      ## USER INSTRUCTIONS FOR MODIFICATION:
      ${userPrompt}

      ## STRICT REQUIREMENTS:
      1. ONLY return the rewritten text. No introductory or closing remarks.
      2. Keep the same Markdown formatting (headings, sub-headings).
      3. ${isPartial ? 'Your output will be surgically pasted back into the document. It must integrate perfectly.' : 'Return the full rewritten chapter.'}
      4. Maintain high technical accuracy and formal academic tone.
      5. Respect the ${referenceStyle.toUpperCase()} citation style if any references are present in the target content.`;

      const aiResponse = await callAI(surgicalPrompt, { provider, model, maxTokens: 4000, temperature: 0.4 });
      
      // Merge logic: If partial, replace the segment. If whole, use the new content entirely.
      const updatedFullContent = isPartial ? fullContent.replace(targetContent, aiResponse.content) : aiResponse.content;

      // Save version
      const { data: chapter } = await supabaseAdmin.from('premium_chapters').select('id').eq('project_id', projectId).eq('chapter_number', chapterNumber).single();
      if (chapter) {
        await supabaseAdmin.from('premium_chapters').update({ content: updatedFullContent, updated_at: new Date().toISOString() }).eq('id', chapter.id);
        await supabaseAdmin.from('premium_chapter_history').insert({ chapter_id: chapter.id, content: updatedFullContent, prompt_used: `MODIFICATION [${modificationType}]: ${userPrompt}`, model_used: aiResponse.model });
      }

      return NextResponse.json({ success: true, content: updatedFullContent });
    }

    // --- 2. Data Extraction ---
    let contextualSourceData = "";
    if (selectedContextFiles.length > 0) {
      for (const file of selectedContextFiles) {
        try {
          const res = await fetch(file.file_url || file.src);
          const buffer = Buffer.from(await res.arrayBuffer());
          let extractedText = "";
          if ((file.name || file.original_name || "").toLowerCase().endsWith('.docx')) {
            const result = await mammoth.extractRawText({ buffer });
            extractedText = result.value;
          } else {
            extractedText = buffer.toString('utf-8');
          }
          contextualSourceData += `\n--- DATA FROM: ${file.name || "File"} ---\n${extractedText.split(/\s+/).slice(0, 500).join(" ")}\n`;
        } catch (e) {}
      }
    }

    // --- 3. Citation & Reference Logic ---
    const citationStyleInst = referenceStyle.toUpperCase() === 'IEEE'
      ? `### CITATION STYLE: STRICT IEEE\n1. IN-TEXT: Use numbers in square brackets like [1], [2]. Sequential order.\n2. BIBLIOGRAPHY: List at end under "## References" in numerical order.`
      : referenceStyle.toUpperCase() === 'HARVARD'
      ? `### CITATION STYLE: STRICT HARVARD\n1. IN-TEXT: Use (Author Year) format without comma.\n2. BIBLIOGRAPHY: List at end under "## References" in alphabetical order by author. Format: Author, A.A. (Year) Title. City: Publisher.`
      : `### CITATION STYLE: STRICT APA\n1. IN-TEXT: Use (Author, Year) format.\n2. BIBLIOGRAPHY: List at end under "## References" in alphabetical order. Format: Author, A. A. (Year). Title. Publisher.`;

    // --- 4. Enhanced Reference Sourcing (Web Search Integration) ---
    const { data: existingPapers } = await supabaseAdmin
      .from('premium_research_papers')
      .select('*')
      .eq('project_id', projectId);

    let finalReferencesList = [...selectedPapers];
    const totalNeeded = maxReferences || 10;
    
    if (existingPapers && !skipReferences) {
      for (const ep of existingPapers) {
        if (finalReferencesList.length >= totalNeeded) break;
        if (!finalReferencesList.some(p => (p.external_id && p.external_id === ep.external_id) || p.title.toLowerCase() === ep.title.toLowerCase())) {
          finalReferencesList.push(ep);
        }
      }
    }

    if (finalReferencesList.length < totalNeeded && !skipReferences) {
      try {
        const query = (project.title + " " + project.description).substring(0, 200);
        const searchUrl = new URL('https://api.semanticscholar.org/graph/v1/paper/search', 'https://api.semanticscholar.org');
        searchUrl.searchParams.set('query', query);
        searchUrl.searchParams.set('year', '2022-2026');
        searchUrl.searchParams.set('limit', '15');
        searchUrl.searchParams.set('fields', 'title,authors,year,venue,url');
        const searchRes = await fetch(searchUrl.toString());
        if (searchRes.ok) {
          const searchData = await searchRes.json();
          if (searchData.data) {
            const existingTitles = new Set(finalReferencesList.map(p => p.title.toLowerCase()));
            for (const paper of searchData.data) {
              if (!existingTitles.has(paper.title.toLowerCase()) && finalReferencesList.length < totalNeeded) finalReferencesList.push(paper);
            }
          }
        }
      } catch (err) {}
    }

    const referencesMapping = !skipReferences && finalReferencesList.length > 0
      ? `\n\n### CORE RESEARCH REFERENCES (MANDATORY):\n` +
        finalReferencesList.slice(0, totalNeeded).map((p, idx) => {
          const auths = Array.isArray(p.authors) ? p.authors.map(a => typeof a === 'object' ? a.name : a).join(', ') : (p.authors || 'Unknown');
          return `SOURCE [${idx + 1}]: ${auths} (${p.year}). "${p.title}". ${p.venue || 'Research Journal'}.`;
        }).join('\n\n')
      : '';

    // --- 5. Aims & Objectives Logic ---
    let objectiveInstruction = "";
    if (chapterNumber === 1) {
      if (project.use_manual_objectives && project.manual_objectives?.length > 0) {
        const list = project.manual_objectives.map((o, i) => `${i + 1}. ${o}`).join('\n');
        objectiveInstruction = `\n\n### MANDATORY RESEARCH OBJECTIVES:\nInclude these EXACT objectives:\n${list}`;
      } else {
        objectiveInstruction = `\n\n### AIMS & OBJECTIVES REQUIREMENT:\nGenerate technically-focused research objectives using action verbs.`;
      }
    }

    // --- 6. Construct Structured System Prompt ---
    const currentChapterData = project.custom_templates?.structure?.chapters?.find(ch => (ch.number || ch.chapter) === chapterNumber);
    const chapterTitle = currentChapterData?.title || `Chapter ${chapterNumber}`;
    const mandatorySections = currentChapterData?.sections?.length > 0 ? `## MANDATORY SECTIONS\n` + currentChapterData.sections.map(s => `- ${s}`).join('\n') : '';

    const imageInstruction = selectedImages.length > 0
      ? `\n\n### MANDATORY IMAGE ATTACHMENTS (STRICT RULES):\n` +
        `You MUST include the following images in your technical explanation. To insert an image, use this EXACT syntax: ![Caption](URL)\n` +
        `STRICT REQUIREMENT: You MUST refer to these images in your technical text (e.g., "as shown in Figure [X]...").\n` +
        selectedImages.map(img => `- Caption: "${img.caption || img.original_name}", URL: ${img.file_url}`).join('\n')
      : '';

    const referenceRequirements = !skipReferences ? `
    ## CITATION AND REFERENCE REQUIREMENTS
    ${citationStyleInst}
    - COUNT: You MUST include EXACTLY ${totalNeeded} references in your bibliography. 
    - SOURCING: If the 'CORE RESEARCH REFERENCES' list above is shorter than ${totalNeeded}, you MUST use your internal search/knowledge to find additional REAL academic papers from 2022-2026 to reach the exact count.
    - RECENTCY: Every citation must be from 2022 to 2026. No older sources allowed.` : '';

    const systemPrompt = `You are a high-end academic system architect and senior engineering researcher. 
    TASK: Author a detailed Chapter ${chapterNumber} titled "${chapterTitle}" for the project "${project.title}".

    ## PROJECT CONTEXT
    - DESCRIPTION: ${project.description}
    - COMPONENTS: ${componentsUsed || project.components_used}
    - RESEARCH CONTEXT: ${researchBooks || project.research_papers_context}
    ${objectiveInstruction}

    ${mandatorySections}
    ${contextualSourceData ? `## MANDATORY EXPERIMENTAL DATA ANALYSIS\n${contextualSourceData}` : ''}
    ${imageInstruction}
    ${referencesMapping}
    ${referenceRequirements}

    ## WRITING REQUIREMENTS
    - FORMAT: Markdown.
    - TARGET: ${targetWordCount} words.
    - USER INSTRUCTIONS: ${userPrompt || 'Deliver elite technical content.'}

    ${skipReferences ? '--- STRICT REQUIREMENT: DO NOT include a References section and DO NOT include any citations in the text. ---' : '--- MANDATORY: Include a "## References" section at the end. ---'}`;

    // --- 7. Call AI & Save ---
    const aiResponse = await callAI(systemPrompt, { provider, model, maxTokens: 8000, temperature: 0.6 });

    let { data: chapter } = await supabaseAdmin.from('premium_chapters').select('*').eq('project_id', projectId).eq('chapter_number', chapterNumber).single();
    if (!chapter) {
      const { data: nc } = await supabaseAdmin.from('premium_chapters').insert({ project_id: projectId, chapter_number: chapterNumber, title: chapterTitle, content: aiResponse.content, status: 'draft' }).select().single();
      chapter = nc;
    } else {
      await supabaseAdmin.from('premium_chapters').update({ content: aiResponse.content, status: 'draft', updated_at: new Date().toISOString() }).eq('id', chapter.id);
    }

    await supabaseAdmin.from('premium_chapter_history').insert({ chapter_id: chapter.id, content: aiResponse.content, prompt_used: userPrompt, model_used: aiResponse.model });
    await supabaseAdmin.from('premium_projects').update({ tokens_used: (project.tokens_used || 0) + (aiResponse.tokensUsed?.total || 0), updated_at: new Date().toISOString() }).eq('id', projectId);

    return NextResponse.json({ success: true, content: aiResponse.content });

  } catch (error) { 
    console.error('Gen Error:', error); 
    return NextResponse.json({ error: error.message }, { status: 500 }); 
  }
}
