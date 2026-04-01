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

    // --- 1. Surgical Modification Logic (ROBUST) ---
    if (isModification && targetContent) {
      const isPartial = modificationType === 'partial';
      
      // CRITICAL: Normalize newlines for reliable string replacement
      const normalizedFull = fullContent.replace(/\r\n/g, '\n');
      const normalizedTarget = targetContent.replace(/\r\n/g, '\n');

      const surgicalPrompt = `You are a high-end academic system architect and expert editor.
      TASK: ${isPartial ? 'Rewrite ONLY the specific section(s) provided.' : 'Rewrite the entire chapter based on user instructions.'}
      PROJECT: "${project.title}"
      CHAPTER: ${chapterNumber}

      ## ORIGINAL CONTENT TO BE FIXED:
      ${normalizedTarget}

      ${isPartial ? `## CONTEXT: 
      This section is part of a larger report. Ensure your new content flows perfectly into the existing text.` : ''}

      ## USER INSTRUCTIONS FOR MODIFICATION:
      ${userPrompt}

      ## STRICT REQUIREMENTS (FAILURE TO FOLLOW WILL BREAK THE DOCUMENT):
      1. ONLY return the rewritten text. No conversational filler.
      2. Keep the exact same Markdown formatting.
      3. MANDATORY: You MUST include the same Section Headers (## or ###) that were in the original content. Do not omit them.
      4. Maintain technical accuracy and respect the ${referenceStyle.toUpperCase()} citation style.`;

      const aiResponse = await callAI(surgicalPrompt, { provider, model, maxTokens: 4000, temperature: 0.4 });
      
      let finalAiContent = aiResponse.content.trim();
      
      // Merge logic with normalization safety
      let updatedFullContent;
      if (isPartial) {
        if (normalizedFull.includes(normalizedTarget)) {
          updatedFullContent = normalizedFull.replace(normalizedTarget, finalAiContent);
        } else {
          // Fallback if exact match fails due to hidden whitespace
          console.warn("Exact match failed, attempting trimmed match");
          const trimmedTarget = normalizedTarget.trim();
          if (normalizedFull.includes(trimmedTarget)) {
            updatedFullContent = normalizedFull.replace(trimmedTarget, finalAiContent);
          } else {
            throw new Error("Could not locate the selected section in the document. Try selecting a different part.");
          }
        }
      } else {
        updatedFullContent = finalAiContent;
      }

      // Save version
      const { data: chapter } = await supabaseAdmin.from('premium_chapters').select('id').eq('project_id', projectId).eq('chapter_number', chapterNumber).single();
      if (chapter) {
        await supabaseAdmin.from('premium_chapters').update({ content: updatedFullContent, updated_at: new Date().toISOString() }).eq('id', chapter.id);
        await supabaseAdmin.from('premium_chapter_history').insert({ chapter_id: chapter.id, content: updatedFullContent, prompt_used: `MODIFICATION: ${userPrompt.substring(0, 50)}...`, model_used: aiResponse.model });
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
      ? `### CITATION STYLE: STRICT IEEE\n1. IN-TEXT: [1], [2].\n2. BIBLIOGRAPHY: Numerical order.`
      : referenceStyle.toUpperCase() === 'HARVARD'
      ? `### CITATION STYLE: STRICT HARVARD\n1. IN-TEXT: (Author Year).\n2. BIBLIOGRAPHY: Alphabetical order. Format: Author, A.A. (Year) Title. City: Publisher.`
      : `### CITATION STYLE: STRICT APA\n1. IN-TEXT: (Author, Year).\n2. BIBLIOGRAPHY: Alphabetical order. Format: Author, A. A. (Year). Title. Publisher.`;

    // --- 4. Enhanced Reference Sourcing ---
    const { data: existingPapers } = await supabaseAdmin.from('premium_research_papers').select('*').eq('project_id', projectId);
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
        searchUrl.searchParams.set('year', '2020-2026');
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
        `STRICT RULE: Prioritize reusing these specific references. Consistency is required.\n\n` +
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
      ? `\n\n### MANDATORY IMAGE ATTACHMENTS:\n` +
        `Insert using: ![Caption](URL). Reference them in text (e.g. "see Fig X").\n` +
        selectedImages.map(img => `- Caption: "${img.caption || img.original_name}", URL: ${img.file_url}`).join('\n')
      : '';

    const referenceRequirements = !skipReferences ? `
    ## CITATION AND REFERENCE REQUIREMENTS
    ${citationStyleInst}
    - COUNT: Exactly ${totalNeeded} references. 
    - SOURCING: Combine the technical papers provided above with other elite sources:
      1. Technical Journals and Research Papers (Provided).
      2. High-authority Online Articles (e.g., IEEE Spectrum, NASA, MIT Tech Review).
      3. Official Documentation and Datasheets (e.g., Arduino, STMicroelectronics).
      4. Citations from reputable academic repositories.
    - RECENCY: Focus on 2020-2026.
    - NO FORGING: Do NOT hallucinate or "make up" references. If you supplement the provided list, ensure they are real, verifiable sources. 
    - CONSISTENCY: Ensure in-text citations match the final reference list perfectly.` : '';

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
    - NO REPETITION: Do NOT include the project title at the start of your response.
    - USER INSTRUCTIONS: ${userPrompt || 'Deliver elite technical content.'}

    ${skipReferences ? '--- STRICT: NO REFERENCES OR CITATIONS. ---' : '--- MANDATORY: Include "## References" at the end. ---'}`;

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
    
    // Update Project Stats & Persistence
    const projectUpdateData = { 
      tokens_used: (project.tokens_used || 0) + (aiResponse.tokensUsed?.total || 0), 
      updated_at: new Date().toISOString() 
    };

    // PERSISTENCE: Store components and research context so they remain editable/pre-filled
    if (componentsUsed) projectUpdateData.components_used = componentsUsed;
    if (researchBooks) projectUpdateData.research_papers_context = researchBooks;

    await supabaseAdmin.from('premium_projects').update(projectUpdateData).eq('id', projectId);

    return NextResponse.json({ success: true, content: aiResponse.content });

  } catch (error) { 
    console.error('Gen Error:', error); 
    return NextResponse.json({ error: error.message }, { status: 500 }); 
  }
}