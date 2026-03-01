// src/app/api/premium/generate/route.js
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { callAI } from '@/lib/aiProvider';
import mammoth from 'mammoth';

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

    // 1. Fetch Project
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

    // 2. Technical Extraction (Using pdf-parse but with safe require)
    let contextualSourceData = "";
    if (selectedContextFiles.length > 0) {
      let pdfParser;
      try {
        pdfParser = require('pdf-parse');
      } catch (e) {
        console.error("Failed to load pdf-parse:", e);
      }
      
      for (const file of selectedContextFiles) {
        try {
          const fileUrl = file.file_url || file.src;
          if (!fileUrl) continue;

          const res = await fetch(fileUrl);
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          
          const arrayBuffer = await res.arrayBuffer();
          const buffer = Buffer.from(arrayBuffer);
          
          let extractedText = "";
          const fileName = file.name || file.original_name || "File";
          const isPdf = file.file_type === 'application/pdf' || fileName.toLowerCase().endsWith('.pdf');
          const isDocx = file.file_type?.includes('word') || fileName.toLowerCase().endsWith('.docx');
          
          if (isPdf && pdfParser) {
            // Options to prevent n is not a function (some versions of pdf-parse have issues with default renderers)
            const data = await pdfParser(buffer);
            extractedText = data.text;
          } else if (isDocx) {
            const result = await mammoth.extractRawText({ buffer });
            extractedText = result.value;
          } else {
            extractedText = buffer.toString('utf-8');
          }
          
          contextualSourceData += `\n--- SOURCE: ${fileName} ---\n${extractedText.substring(0, 15000)}\n`;
        } catch (e) {
          console.error("File extraction error:", e);
          contextualSourceData += `\n--- ERROR IN ${file.name || "File"}: ${e.message} ---\n`;
        }
      }
    }

    if (testOnly) {
      return NextResponse.json({ success: true, debugExtractions: contextualSourceData || "No data extracted." });
    }

    // --- AI Generation Logic ---
    if (projectTitle || projectDescription || componentsUsed || researchBooks) {
      await supabaseAdmin.from('premium_projects').update({
        title: projectTitle || project.title,
        description: projectDescription || project.description,
        components_used: componentsUsed || project.components_used,
        research_papers_context: researchBooks || project.research_papers_context,
        updated_at: new Date().toISOString()
      }).eq('id', projectId);
    }

    const currentChapterData = project?.custom_templates?.structure?.chapters?.find(ch => (ch.number || ch.chapter) === chapterNumber);
    const estimatedTokens = Math.ceil(targetWordCount * 4); 
    if (project && (project.tokens_used || 0) + estimatedTokens > (project.tokens_limit || 300000)) {
      return NextResponse.json({ error: `Insufficient tokens.` }, { status: 403 });
    }

    const imageContext = selectedImages.length > 0 ? `\n\nImages:\n${selectedImages.map(img => `- "${img.caption || img.original_name}": ${img.file_url}`).join('\n')}` : '';
    const paperContext = !skipReferences && selectedPapers.length > 0 ? `\n\nReferences:\n${selectedPapers.map((p, idx) => `[SS${idx + 1}] ${p.title}`).join('\n')}` : '';

    const systemPrompt = `You are an elite academic engineer. Task: Author Chapter ${chapterNumber}: "${chapterTitle || currentChapterData?.title}" for "${projectTitle || project?.title}".
    Objective: ${projectDescription || project?.description}
    ${contextualSourceData ? `\n--- SOURCE DATA ---\n${contextualSourceData}\nAnalyze and use this data.` : ''}
    Target: ${targetWordCount} words. Style: ${referenceStyle}. IEEE uses [1], [2].`;

    const aiResponse = await callAI(systemPrompt, { provider: 'deepseek', maxTokens: 8000, temperature: 0.6 });

    let { data: chapter } = await supabaseAdmin.from('premium_chapters').select('*').eq('project_id', projectId).eq('chapter_number', chapterNumber).single();
    if (!chapter) {
      const { data: newChapter } = await supabaseAdmin.from('premium_chapters').insert({ project_id: projectId, chapter_number: chapterNumber, title: chapterTitle || currentChapterData?.title || `Chapter ${chapterNumber}`, content: aiResponse.content, status: 'draft' }).select().single();
      chapter = newChapter;
    } else {
      await supabaseAdmin.from('premium_chapters').update({ content: aiResponse.content, status: 'draft', updated_at: new Date().toISOString() }).eq('id', chapter.id);
    }

    await supabaseAdmin.from('premium_chapter_history').insert({ chapter_id: chapter.id, content: aiResponse.content, prompt_used: userPrompt, model_used: aiResponse.model });

    // Extraction of references...
    const refSection = aiResponse.content.split(/## References|# References/i)[1];
    if (refSection) {
      const refLines = refSection.split('\n').filter(line => line.trim() && (line.trim().startsWith('[') || line.match(/^\d+\./)));
      if (refLines.length > 0) {
        await supabaseAdmin.from('project_references').delete().eq('project_id', projectId).eq('chapter_number', chapterNumber);
        await supabaseAdmin.from('project_references').insert(refLines.map((l, i) => ({ project_id: projectId, user_id: userId, reference_text: l.trim(), order_number: i + 1, chapter_number: chapterNumber })));
      }
    }

    if (project) await supabaseAdmin.from('premium_projects').update({ tokens_used: (project.tokens_used || 0) + aiResponse.tokensUsed.total, updated_at: new Date().toISOString() }).eq('id', projectId);

    return NextResponse.json({ success: true, content: aiResponse.content });
  } catch (error) { console.error('Gen Error:', error); return NextResponse.json({ error: error.message }, { status: 500 }); }
}
