// /src/app/api/standard/preview-outline/route.js
// Lightweight preview of what a chapter will contain (uses ~500 tokens only)

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { callAI } from '@/lib/aiProvider';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(request) {
  try {
    const { projectId, chapterNumber, userId } = await request.json();

    // Validate inputs
    if (!projectId || !chapterNumber || !userId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // 1. Fetch project
    const { data: project, error: projectError } = await supabase
      .from('standard_projects')
      .select('*')
      .eq('id', projectId)
      .single();

    if (projectError || !project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    // 2. Verify ownership
    if (project.user_id !== userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // 3. Fetch template structure
    const { data: template } = await supabase
      .from('templates')
      .select('structure')
      .eq('id', project.template_id)
      .single();

    if (!template) {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      );
    }

    // 4. Get chapter info from template
    const chapterInfo = template.structure?.chapters?.find(
      ch => ch.number === chapterNumber
    );

    if (!chapterInfo) {
      return NextResponse.json(
        { error: `Chapter ${chapterNumber} not found in template` },
        { status: 404 }
      );
    }

    // 5. Fetch images (to mention in preview)
    const { data: images } = await supabase
      .from('standard_images')
      .select('caption')
      .eq('project_id', projectId);

    // 6. Build lightweight preview prompt
    const prompt = buildPreviewPrompt({
      projectTitle: project.title,
      department: project.department,
      components: project.components,
      chapterNumber,
      chapterTitle: chapterInfo.title,
      sections: chapterInfo.sections,
      hasImages: images && images.length > 0,
      imageCount: images?.length || 0
    });

    // 7. Call AI with low token limit (just for outline)
    const startTime = Date.now();
    
    const aiResult = await callAI(prompt, {
      maxTokens: 300, // ✅ Very low - just outline
      temperature: 0.5 // Lower temperature for concise output
    });
    
    const endTime = Date.now();
    const durationSeconds = Math.round((endTime - startTime) / 1000);

    console.log(`📋 Preview generated: ${aiResult.tokensUsed.total} tokens (saved ~9,500 tokens)`);

    // 8. Return preview outline
    return NextResponse.json({
      success: true,
      outline: aiResult.content,
      chapterTitle: chapterInfo.title,
      chapterNumber,
      tokensUsed: aiResult.tokensUsed.total,
      estimatedFullGeneration: 10000, // Estimate for full chapter
      savings: 10000 - aiResult.tokensUsed.total,
      durationSeconds,
      model: aiResult.model
    });

  } catch (error) {
    console.error('Preview generation error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate preview' },
      { status: 500 }
    );
  }
}

/**
 * Build a lightweight prompt for chapter preview
 */
function buildPreviewPrompt(data) {
  const {
    projectTitle,
    department,
    components,
    chapterNumber,
    chapterTitle,
    sections,
    hasImages,
    imageCount
  } = data;

  return `Generate a brief 5-8 point outline for this engineering project chapter.

PROJECT:
- Title: ${projectTitle}
- Department: ${department}
- Components: ${components.join(', ')}

CHAPTER: ${chapterNumber}. ${chapterTitle}

REQUIRED SECTIONS:
${sections.map(s => `- ${s}`).join('\n')}

${hasImages ? `\nIMAGES AVAILABLE: ${imageCount} image${imageCount > 1 ? 's' : ''} will be referenced in this chapter\n` : ''}

OUTPUT FORMAT:
Return ONLY a numbered list (5-8 points) showing what will be covered:

1. [First main topic/section]
2. [Second main topic/section]
3. [Third main topic/section]
...

Be specific to the components: ${components.join(', ')}
Each point should be ONE clear sentence.
Total: Under 150 words.

Start your response with the numbered list - no introduction or explanation.`;
}