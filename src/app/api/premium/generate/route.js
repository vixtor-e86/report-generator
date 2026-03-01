// src/app/api/premium/generate/route.js
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { callAI } from '@/lib/aiProvider';
import mammoth from 'mammoth';

// Polyfills
if (typeof global.DOMMatrix === 'undefined') { global.DOMMatrix = class DOMMatrix { constructor() { this.a = 1; this.d = 1; } }; }
if (typeof global.ImageData === 'undefined') { global.ImageData = class ImageData { constructor(w, h) { this.width = w; this.height = h; this.data = new Uint8ClampedArray(w * h * 4); } }; }

export async function POST(request) {
  try {
    const body = await request.json();
    const { 
      projectId, chapterNumber, userId, 
      selectedContextFiles = [], testOnly = false,
      projectTitle, projectDescription, componentsUsed, researchBooks,
      userPrompt, referenceStyle, targetWordCount = 2000,
      selectedImages = [], selectedPapers = [], skipReferences = false
    } = body;

    // 1. Technical Extraction Logic
    let contextualSourceData = "";
    if (selectedContextFiles.length > 0) {
      const pdf = require('pdf-parse');
      
      for (const file of selectedContextFiles) {
        try {
          const res = await fetch(file.file_url || file.src);
          const buffer = Buffer.from(await res.arrayBuffer());
          
          let extractedText = "";
          const isPdf = (file.file_type === 'application/pdf' || (file.name || "").toLowerCase().endsWith('.pdf'));
          
          if (isPdf) {
            // Use safe options to avoid renderer errors
            const data = await pdf(buffer, { pagerender: () => "" });
            extractedText = data.text || "";
          } else if ((file.name || "").toLowerCase().endsWith('.docx')) {
            const result = await mammoth.extractRawText({ buffer });
            extractedText = result.value;
          } else {
            extractedText = buffer.toString('utf-8');
          }

          // Safety Check: If it's still showing raw PDF headers, extraction failed
          if (extractedText.includes("%PDF-")) {
            throw new Error("Binary PDF data detected. Text extraction failed.");
          }

          const snippet = extractedText.trim().substring(0, 500);
          contextualSourceData += `\n--- SOURCE: ${file.name || "Data File"} ---\n${snippet}\n`;
        } catch (e) {
          contextualSourceData += `\n--- ERROR READING ${file.name}: ${e.message} ---\n`;
        }
      }
    }

    if (testOnly) {
      return NextResponse.json({ success: true, debugExtractions: contextualSourceData || "No data extracted." });
    }

    // --- Proceed with AI Generation ---
    const { data: project } = await supabaseAdmin.from('premium_projects').select('*, custom_templates(*)').eq('id', projectId).single();
    if (!project && projectId !== 'test') return NextResponse.json({ error: 'Project not found' }, { status: 404 });

    const currentChapterData = project?.custom_templates?.structure?.chapters?.find(ch => (ch.number || ch.chapter) === chapterNumber);
    
    const systemPrompt = `You are an academic engineering researcher. 
    Task: Author Chapter ${chapterNumber}: "${currentChapterData?.title}" for "${projectTitle || project?.title}".
    ${contextualSourceData ? `\nANALYSIS DATA:\n${contextualSourceData}\nSTRICT RULE: Analyze and evaluate this data specifically.` : ''}
    Objective: ${projectDescription || project?.description}
    Target: ${targetWordCount} words. Style: ${referenceStyle}. IEEE uses [1], [2].`;

    const aiResponse = await callAI(systemPrompt, { provider: 'deepseek', maxTokens: 8000, temperature: 0.6 });

    // Upsert logic...
    let { data: chapter } = await supabaseAdmin.from('premium_chapters').select('*').eq('project_id', projectId).eq('chapter_number', chapterNumber).single();
    if (!chapter) {
      const { data: nc } = await supabaseAdmin.from('premium_chapters').insert({ project_id: projectId, chapter_number: chapterNumber, title: currentChapterData?.title || `Chapter ${chapterNumber}`, content: aiResponse.content, status: 'draft' }).select().single();
      chapter = nc;
    } else {
      await supabaseAdmin.from('premium_chapters').update({ content: aiResponse.content, status: 'draft', updated_at: new Date().toISOString() }).eq('id', chapter.id);
    }

    return NextResponse.json({ success: true, content: aiResponse.content });

  } catch (error) { console.error(error); return NextResponse.json({ error: error.message }, { status: 500 }); }
}
