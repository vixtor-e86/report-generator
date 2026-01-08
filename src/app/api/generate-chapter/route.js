// src/app/api/generate-chapter/route.js - UPDATED VERSION
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { GoogleGenerativeAI } from '@google/generative-ai';

export async function POST(request) {
  try {
    const { projectId, chapterNumber, userId } = await request.json();

    if (!projectId || !chapterNumber || !userId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Fetch project with template
    const { data: project, error: projectError } = await supabaseAdmin
      .from('projects')
      .select(`
        *,
        templates (*)
      `)
      .eq('id', projectId)
      .single();

    if (projectError || !project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    // Verify ownership
    if (project.user_id !== userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Get chapter info from template structure
    const template = project.templates;
    const structure = template?.structure || { chapters: [] };
    const chapterInfo = structure.chapters.find(ch => ch.number === chapterNumber);

    if (!chapterInfo) {
      return NextResponse.json(
        { error: 'Chapter not found in template structure' },
        { status: 404 }
      );
    }

    // Fetch previous chapters for context
    const { data: previousChapters } = await supabaseAdmin
      .from('chapters')
      .select('*')
      .eq('project_id', projectId)
      .lt('chapter_number', chapterNumber)
      .eq('status', 'draft')
      .order('chapter_number', { ascending: true });

    // Build context from previous chapters
    let context = '';
    if (previousChapters && previousChapters.length > 0) {
      context = '\n\n=== CONTEXT FROM PREVIOUS CHAPTERS ===\n\n';
      previousChapters.forEach(ch => {
        context += `## Chapter ${ch.chapter_number}: ${ch.title}\n\n${ch.content.substring(0, 500)}...\n\n`;
      });
      context += '=== END OF PREVIOUS CHAPTERS ===\n\n';
    }

    // Build sections text from template
    const sectionsText = chapterInfo.sections.map(section => `${section}`).join('\n');

    // Create prompt
    const prompt = createFreePrompt({
      chapterNumber,
      chapterTitle: chapterInfo.title,
      sections: sectionsText,
      projectTitle: project.title,
      faculty: project.faculty || 'Engineering',
      department: project.department,
      components: project.components.join(', '),
      description: project.description,
      context,
      referenceStyle: project.reference_style || 'apa'
    });

    // Generate using Gemini (use env variable for model)
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const modelName = process.env.GEMINI_MODEL || 'gemini-1.5-flash-latest';
    
    const model = genAI.getGenerativeModel({
      model: modelName,
      generationConfig: {
        maxOutputTokens: 6000,
        temperature: 0.7,
      }
    });

    const result = await model.generateContent(prompt);
    const response = result.response;
    const content = response.text();

    // Update chapter in database
    const { error: updateError } = await supabaseAdmin
      .from('chapters')
      .update({
        content: content,
        status: 'draft',
        generated_at: new Date().toISOString()
      })
      .eq('project_id', projectId)
      .eq('chapter_number', chapterNumber);

    if (updateError) {
      console.error('Database update error:', updateError);
      return NextResponse.json(
        { error: 'Failed to save chapter' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      content,
      tokensUsed: response.usageMetadata?.totalTokenCount || 0
    });

  } catch (error) {
    console.error('Generation error:', error);
    return NextResponse.json(
      { error: error.message || 'Generation failed' },
      { status: 500 }
    );
  }
}

function createFreePrompt(data) {
  const {
    chapterNumber,
    chapterTitle,
    sections,
    projectTitle,
    faculty,
    department,
    components,
    description,
    context,
    referenceStyle
  } = data;

  return `You are an expert academic writer for Nigerian universities. Write a complete chapter for a ${faculty} student project report.

**PROJECT DETAILS:**
- Title: ${projectTitle}
- Faculty: ${faculty}
- Department: ${department}
- Components/Materials: ${components}
- Description: ${description}

${context}

**CHAPTER TO WRITE:**
Chapter ${chapterNumber}: ${chapterTitle}

**REQUIRED SECTIONS:**
${sections}

**FORMATTING REQUIREMENTS:**
1. Use Markdown format ONLY
2. Start with: ## CHAPTER ${chapterNumber.toString().toUpperCase()}: ${chapterTitle.toUpperCase()}
3. For main sections use: ### ${chapterNumber}.1 Section Name
4. For subsections use: #### ${chapterNumber}.1.1 Subsection Name
5. Use **bold** for emphasis
6. Use bullet points with - for lists
7. Use numbered lists for procedures
8. Keep paragraphs well-spaced

**CONTENT REQUIREMENTS:**
1. Write 2000-2500 words for this chapter
2. Use professional Nigerian academic tone
3. Be SPECIFIC to the project components: ${components}
4. Include ${faculty}-appropriate technical details
5. Each section should have 2-4 substantial paragraphs
6. Use correct terminology for ${faculty}
7. Use Nigerian English spelling

**REFERENCES (${referenceStyle.toUpperCase()} Style):**
${chapterNumber === 5 || chapterNumber === 6 ? 
  `- Include 10-15 in-text citations throughout
   - Add a ## REFERENCES section at the END with 10-15 realistic Nigerian academic sources
   - Use proper ${referenceStyle.toUpperCase()} format` :
  `- Include 10-15 in-text citations throughout
   - Do NOT include a References section (only in final chapter)`
}

**CRITICAL RULES:**
1. NO meta-commentary
2. NO placeholders - use realistic Nigerian values
3. ONLY output the chapter content starting with ##
4. Be specific and technical
5. Write like a real ${faculty} student would

Now write the complete Chapter ${chapterNumber} following ALL requirements above.`;
}