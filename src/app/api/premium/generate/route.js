// src/app/api/premium/generate/route.js
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { callAI } from '@/lib/aiProvider';
import mammoth from 'mammoth';

// Polyfill for pdf-parse to prevent ReferenceError: DOMMatrix is not defined on Vercel
if (typeof global.DOMMatrix === 'undefined') {
  global.DOMMatrix = class DOMMatrix {
    constructor() { this.a = 1; this.b = 0; this.c = 0; this.d = 1; this.e = 0; this.f = 0; }
  };
}
if (typeof global.ImageData === 'undefined') {
  global.ImageData = class ImageData { constructor(width, height) { this.width = width; this.height = height; this.data = new Uint8ClampedArray(width * height * 4); } };
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { 
      projectId, chapterNumber, chapterTitle, userId, 
      projectTitle, projectDescription, componentsUsed, researchBooks,
      userPrompt, referenceStyle, maxReferences, targetWordCount = 2000,
      selectedImages = [], selectedPapers = [], selectedContextFiles = [], 
      skipReferences = false, testOnly = false 
    } = body;

    if (!projectId || chapterNumber === undefined || !userId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // 1. Fetch Project (Skip if testing)
    let project = null;
    if (projectId !== 'test') {
      const { data, error: projectError } = await supabaseAdmin
        .from('premium_projects')
        .select('*, custom_templates(*)')
        .eq('id', projectId)
        .single();
      
      if (projectError || !data) return NextResponse.json({ error: 'Project not found' }, { status: 404 });
      project = data;
    }

    // 2. Technical Extraction
    let contextualSourceData = "";
    if (selectedContextFiles.length > 0) {
      // Lazy Load pdf-parse inside handler
      const pdf = require('pdf-parse');
      
      for (const file of selectedContextFiles) {
        try {
          const fileUrl = file.file_url || file.src;
          if (!fileUrl) continue;

          const res = await fetch(fileUrl);
          if (!res.ok) throw new Error(`HTTP Error ${res.status}`);
          
          const arrayBuffer = await res.arrayBuffer();
          const buffer = Buffer.from(arrayBuffer);
          
          let extractedText = "";
          const fileName = file.name || file.original_name || "Unknown File";
          const fileType = file.file_type || "";
          
          if (fileType === 'application/pdf' || fileName.toLowerCase().endsWith('.pdf')) {
            const data = await pdf(buffer);
            extractedText = data.text;
          } else if (fileType.includes('word') || fileName.toLowerCase().endsWith('.docx')) {
            const result = await mammoth.extractRawText({ buffer });
            extractedText = result.value;
          } else {
            extractedText = buffer.toString('utf-8');
          }
          
          contextualSourceData += `\n--- SOURCE FILE: ${fileName} ---\n${extractedText.substring(0, 15000)}\n`;
        } catch (e) {
          console.error("Extraction error:", e);
          contextualSourceData += `\n--- ERROR READING: ${file.name || "File"} ---\n${e.message}\n`;
        }
      }
    }

    // 3. Test/Debug Response
    if (testOnly) {
      return NextResponse.json({ 
        success: true, 
        debugExtractions: contextualSourceData || "No data extracted. Verify file type." 
      });
    }

    // --- Proceed with Generation if not testOnly ---
    if (!project) return NextResponse.json({ error: 'Project context missing for generation.' }, { status: 400 });

    if (projectTitle || projectDescription || componentsUsed || researchBooks) {
      await supabaseAdmin.from('premium_projects').update({
        title: projectTitle || project.title,
        description: projectDescription || project.description,
        components_used: componentsUsed || project.components_used,
        research_papers_context: researchBooks || project.research_papers_context,
        updated_at: new Date().toISOString()
      }).eq('id', projectId);
    }

    const templateStructure = project.custom_templates?.structure;
    const currentChapterData = templateStructure?.chapters?.find(ch => (ch.number || ch.chapter) === chapterNumber);
    
    const estimatedTokens = Math.ceil(targetWordCount * 4); 
    if ((project.tokens_used || 0) + estimatedTokens > (project.tokens_limit || 300000)) {
      return NextResponse.json({ error: `Insufficient tokens.` }, { status: 403 });
    }

    const imageContext = selectedImages.length > 0
      ? `\n\nIncluded Images:\n${selectedImages.map(img => `- Caption: "${img.caption || img.original_name}", URL: ${img.file_url}`).join('\n')}`
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

    const systemPrompt = `You are an elite academic researcher and engineer specialized in ${project.faculty} (${project.department}).
    Task: Author Chapter ${chapterNumber}: "${chapterTitle || currentChapterData?.title}" for "${projectTitle || project.title}".

    Objective: ${projectDescription || project.description}
    Context: ${componentsUsed || project.components_used} | ${researchBooks || project.research_papers_context}

    ${contextualSourceData ? `\n--- MANDATORY SOURCE DATA FOR ANALYSIS ---\n${contextualSourceData}\nAnalyze the data provided above and incorporate it specifically into this chapter results/evaluation.` : ''}

    IMAGE MAPPING: ${imageContext}
    
    ${paperContext}
    ${citationStyleRules}

    Target: ${targetWordCount} words. Currency: Nigerian Naira (₦).
    ${skipReferences ? `--- NO REFERENCES SECTION.` : `--- Include a "## References" section at the end.`}`;

    const aiResponse = await callAI(systemPrompt, { provider: 'deepseek', maxTokens: 8000, temperature: 0.6 });

    let { data: chapter } = await supabaseAdmin.from('premium_chapters').select('*').eq('project_id', projectId).eq('chapter_number', chapterNumber).single();
    if (!chapter) {
      const { data: newChapter } = await supabaseAdmin.from('premium_chapters').insert({ project_id: projectId, chapter_number: chapterNumber, title: chapterTitle || currentChapterData?.title || `Chapter ${chapterNumber}`, content: aiResponse.content, status: 'draft' }).select().single();
      chapter = newChapter;
    } else {
      await supabaseAdmin.from('premium_chapters').update({ content: aiResponse.content, status: 'draft', updated_at: new Date().toISOString() }).eq('id', chapter.id);
    }

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
