// /src/app/api/standard/generate/route.js
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getStandardPrompt } from '@/lib/standardPrompts';
import { callAI, checkTokenLimit } from '@/lib/aiProvider';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(request) {
  try {
    const { projectId, chapterNumber, userId } = await request.json();

    if (!projectId || chapterNumber === undefined || !userId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const { data: project, error: projectError } = await supabase
      .from('standard_projects')
      .select('*')
      .eq('id', projectId)
      .single();

    if (projectError || !project) return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    if (project.user_id !== userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

    const tokenCheck = checkTokenLimit(project.tokens_used, project.tokens_limit, 10000);
    if (!tokenCheck.allowed) {
      return NextResponse.json({ error: 'Token limit exceeded. You can still edit manually or upgrade to Premium.' }, { status: 429 });
    }

    const { data: chapter } = await supabase
      .from('standard_chapters')
      .select('*')
      .eq('project_id', projectId)
      .eq('chapter_number', chapterNumber)
      .single();

    if (!chapter) return NextResponse.json({ error: 'Chapter not found' }, { status: 404 });

    await supabase.from('standard_chapters').update({ status: 'generating' }).eq('id', chapter.id);

    const { data: previousChapters } = await supabase
      .from('standard_chapters')
      .select('chapter_number, title, content')
      .eq('project_id', projectId)
      .lt('chapter_number', chapterNumber)
      .in('status', ['draft', 'edited', 'approved'])
      .order('chapter_number', { ascending: true });

    let context = '';
    if (previousChapters && previousChapters.length > 0) {
      context = previousChapters.map(ch => {
        const cleaned = ch.content?.replace(/\{\{figure\d+\.\d+\}\}/g, '[figure]')?.substring(0, 500);
        return `Chapter ${ch.chapter_number}: ${ch.title}\n${cleaned}...`;
      }).join('\n\n');
    }

    const { data: allImages } = await supabase
      .from('standard_images')
      .select('*')
      .eq('project_id', projectId)
      .or(`chapter_number.is.null,chapter_number.eq.${chapterNumber}`)
      .order('order_number', { ascending: true });

    const images = (allImages || []).map((img, index) => ({
      ...img,
      chapterNumber: chapterNumber,
      figureNumber: index + 1,
      placeholder: `{{figure${chapterNumber}.${index + 1}}}`
    }));

    const { data: template } = await supabase.from('templates').select('structure, faculty').eq('id', project.template_id).single();
    
    // --- ENHANCED REFERENCE SEARCH (2022 - DATE) ---
    const { data: existingReferences } = await supabase
      .from('project_references')
      .select('*')
      .eq('project_id', projectId)
      .order('order_number', { ascending: true });

    let finalReferencesList = [...(existingReferences || [])];
    const totalMaxProjectRefs = 40;
    const refsNeededThisChapter = 8;

    if (finalReferencesList.length < totalMaxProjectRefs && project.reference_style !== 'none') {
      try {
        const query = (project.title + " " + project.description).substring(0, 200);
        const searchUrl = new URL('https://api.semanticscholar.org/graph/v1/paper/search', 'https://api.semanticscholar.org');
        searchUrl.searchParams.set('query', query);
        searchUrl.searchParams.set('year', '2022-2026');
        searchUrl.searchParams.set('limit', '10');
        searchUrl.searchParams.set('fields', 'title,authors,year,venue,url');
        const searchRes = await fetch(searchUrl.toString());
        if (searchRes.ok) {
          const searchData = await searchRes.json();
          if (searchData.data) {
            const existingTitles = new Set(finalReferencesList.map(p => p.title?.toLowerCase() || p.reference_text?.toLowerCase()));
            for (const paper of searchData.data) {
              if (!existingTitles.has(paper.title.toLowerCase()) && finalReferencesList.length < totalMaxProjectRefs) {
                finalReferencesList.push(paper);
              }
            }
          }
        }
      } catch (err) { console.error('Web search error:', err); }
    }

    const prompt = getStandardPrompt(chapterNumber, {
      projectTitle: project.title,
      department: project.department,
      components: project.components,
      description: project.description,
      images: images || [],
      context,
      templateStructure: template.structure,
      faculty: template.faculty || 'Engineering',
      referenceStyle: project.reference_style || 'apa',
      existingReferences: finalReferencesList,
      useManualObjectives: project.use_manual_objectives,
      manualObjectives: project.manual_objectives || []
    });

    const startTime = Date.now();
    const aiResult = await callAI(prompt, { maxTokens: 8000, temperature: 0.7 });
    const durationSeconds = Math.round((Date.now() - startTime) / 1000);

    await supabase.from('standard_chapters').update({
      content: aiResult.content,
      status: 'draft',
      version: (chapter.version || 0) + 1,
      ai_model_used: aiResult.model,
      tokens_input: aiResult.tokensUsed.input,
      tokens_output: aiResult.tokensUsed.output,
      generation_time_seconds: durationSeconds,
      generated_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }).eq('id', chapter.id);

    // Process and store extracted references
    if (project.reference_style && project.reference_style !== 'none') {
      try {
        const { extractFullReferences, storeReferences } = await import('@/lib/referenceExtractor');
        const extractedRefs = extractFullReferences(aiResult.content, project.reference_style, chapterNumber);
        if (extractedRefs.length > 0) {
          await storeReferences(supabase, projectId, extractedRefs, chapterNumber);
        }
      } catch (e) { console.error('Ref processing error:', e); }
    }

    await supabase.from('standard_projects').update({
      tokens_used: project.tokens_used + aiResult.tokensUsed.total,
      last_generated_at: new Date().toISOString()
    }).eq('id', projectId);

    return NextResponse.json({ success: true, content: aiResult.content, model: aiResult.model });

  } catch (error) {
    console.error('Gen Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to generate' }, { status: 500 });
  }
}
