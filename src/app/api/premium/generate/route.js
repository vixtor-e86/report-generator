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

    const { data: project } = await supabaseAdmin.from('premium_projects').select('*, custom_templates(*)').eq('id', projectId).single();
    if (!project && projectId !== 'test') return NextResponse.json({ error: 'Project not found' }, { status: 404 });

    // --- 2. Technical Extraction (DOCX & TXT ONLY) ---
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
          } else {
            contextualSourceData += `\n--- SOURCE: ${fileName} ---\n[Unsupported type. Use DOCX or TXT for analysis]\n`;
            continue;
          }

          // Enforce 500 WORD limit
          const words = extractedText.trim().split(/\s+/);
          const snippet = words.slice(0, 500).join(" ");
          contextualSourceData += `\n--- SOURCE: ${fileName} ---\n${snippet}\n[Note: Limited to first 500 words]\n`;
        } catch (e) {
          contextualSourceData += `\n--- ERROR IN ${file.name}: ${e.message} ---\n`;
        }
      }
    }

    if (testOnly) return NextResponse.json({ success: true, debugExtractions: contextualSourceData || "No data extracted." });

    // --- AI Generation Logic ---
    const estimatedTokens = Math.ceil(targetWordCount * 4); 
    if (project && (project.tokens_used || 0) + estimatedTokens > (project.tokens_limit || 300000)) {
      return NextResponse.json({ error: `Insufficient tokens.` }, { status: 403 });
    }

    const imageContext = selectedImages.length > 0 ? `\n\nImages:\n${selectedImages.map(img => `- "${img.caption || img.original_name}": ${img.file_url}`).join('\n')}` : '';
    const paperContext = !skipReferences && selectedPapers.length > 0 ? `\n\nReferences:\n${selectedPapers.map((p, idx) => `[SS${idx + 1}] ${p.title}`).join('\n')}` : '';

    const systemPrompt = `You are an elite academic engineer. Task: Author Chapter ${chapterNumber}: "${chapterTitle}" for "${projectTitle || project?.title}".
    Objective: ${projectDescription || project?.description}
    ${contextualSourceData ? `\n--- SOURCE DATA ---\n${contextualSourceData}\nAnalyze and use this data.` : ''}
    ${imageContext} ${paperContext}
    Target: ${targetWordCount} words. Style: ${referenceStyle}. IEEE uses [1], [2].`;

    const aiResponse = await callAI(systemPrompt, { provider: 'deepseek', maxTokens: 8000, temperature: 0.6 });

    // DB logic...
    let { data: chapter } = await supabaseAdmin.from('premium_chapters').select('*').eq('project_id', projectId).eq('chapter_number', chapterNumber).single();
    if (!chapter) {
      const { data: nc } = await supabaseAdmin.from('premium_chapters').insert({ project_id: projectId, chapter_number: chapterNumber, title: chapterTitle || `Chapter ${chapterNumber}`, content: aiResponse.content, status: 'draft' }).select().single();
      chapter = nc;
    } else {
      await supabaseAdmin.from('premium_chapters').update({ content: aiResponse.content, status: 'draft', updated_at: new Date().toISOString() }).eq('id', chapter.id);
    }

    // Save history
    await supabaseAdmin.from('premium_chapter_history').insert({ chapter_id: chapter.id, content: aiResponse.content, prompt_used: userPrompt, model_used: aiResponse.model });

    // References extraction logic...
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
  } catch (error) { console.error(error); return NextResponse.json({ error: error.message }, { status: 500 }); }
}
