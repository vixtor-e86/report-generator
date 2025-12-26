// /src/app/api/standard/suggest-improvements/route.js
// Analyze existing chapter and suggest improvements (uses ~1,000 tokens only)

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

    // 3. Fetch the chapter
    const { data: chapter, error: chapterError } = await supabase
      .from('standard_chapters')
      .select('*')
      .eq('project_id', projectId)
      .eq('chapter_number', chapterNumber)
      .single();

    if (chapterError || !chapter) {
      return NextResponse.json(
        { error: 'Chapter not found' },
        { status: 404 }
      );
    }

    // 4. Check if chapter is generated
    if (!chapter.content || chapter.status === 'not_generated') {
      return NextResponse.json(
        { error: 'Chapter must be generated first before getting suggestions' },
        { status: 400 }
      );
    }

    // 5. Fetch images to check if referenced
    const { data: images } = await supabase
      .from('standard_images')
      .select('placeholder_id, caption')
      .eq('project_id', projectId)
      .eq('chapter_number', chapterNumber);

    // 6. Build analysis prompt
    const prompt = buildAnalysisPrompt({
      chapterNumber,
      chapterTitle: chapter.title,
      content: chapter.content,
      projectTitle: project.title,
      department: project.department,
      components: project.components,
      images: images || []
    });

    // 7. Call AI for analysis
    const startTime = Date.now();
    
    const aiResult = await callAI(prompt, {
      maxTokens: 1000, // ✅ Just for suggestions
      temperature: 0.6
    });
    
    const endTime = Date.now();
    const durationSeconds = Math.round((endTime - startTime) / 1000);

    console.log(`💡 Suggestions generated: ${aiResult.tokensUsed.total} tokens (saved ~9,000 tokens)`);

    // 8. Return suggestions
    return NextResponse.json({
      success: true,
      suggestions: aiResult.content,
      chapterNumber,
      chapterTitle: chapter.title,
      tokensUsed: aiResult.tokensUsed.total,
      estimatedRegenerationCost: 10000,
      savings: 10000 - aiResult.tokensUsed.total,
      durationSeconds,
      model: aiResult.model,
      canManuallyFix: true // User can edit manually for 0 tokens
    });

  } catch (error) {
    console.error('Suggestions generation error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate suggestions' },
      { status: 500 }
    );
  }
}

/**
 * Build prompt for analyzing and suggesting improvements
 */
function buildAnalysisPrompt(data) {
  const {
    chapterNumber,
    chapterTitle,
    content,
    projectTitle,
    department,
    components,
    images
  } = data;

  // Check for missing image references
  let imageAnalysis = '';
  if (images.length > 0) {
    const referencedImages = images.filter(img => 
      content.includes(`{{${img.placeholder_id}}}`)
    );
    const unreferencedImages = images.filter(img => 
      !content.includes(`{{${img.placeholder_id}}}`)
    );
    
    if (unreferencedImages.length > 0) {
      imageAnalysis = `\n\nNOTE: ${unreferencedImages.length} uploaded image${unreferencedImages.length > 1 ? 's are' : ' is'} not referenced in the chapter:\n` +
        unreferencedImages.map(img => `- ${img.placeholder_id}: ${img.caption}`).join('\n');
    }
  }

  return `Analyze this engineering project chapter and provide 3-5 specific, actionable improvement suggestions.

PROJECT CONTEXT:
- Title: ${projectTitle}
- Department: ${department}
- Components: ${components.join(', ')}

CHAPTER: ${chapterNumber}. ${chapterTitle}

CURRENT CONTENT (first 1000 chars):
${content.substring(0, 1000)}...
${imageAnalysis}

ANALYZE FOR:
1. Missing technical details (specifications, measurements, values)
2. Sections that need more depth or explanation
3. Missing or incorrect figure references
4. Areas lacking component-specific information
5. Weak methodology or unclear procedures (if applicable)
6. Missing tables, diagrams, or data that should be present

OUTPUT FORMAT:
Provide ONLY a numbered list of 3-5 specific suggestions:

1. [Specific suggestion with location]
2. [Specific suggestion with location]
3. [Specific suggestion with location]
...

Each suggestion should:
- Be specific (mention section numbers if possible)
- Be actionable (user can fix manually)
- Focus on content gaps, not style

Keep it under 200 words total. No introduction or conclusion.
Start immediately with "1."`;
}