// src/app/api/premium/generate-slides/route.js
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { callAI } from '@/lib/aiProvider';

export async function POST(request) {
  try {
    const { 
      projectId, 
      selectedChapterNumbers, 
      userId,
      slideCountRange = '10-15',
      includeQA = false,
      customPrompt = '',
      images = []
    } = await request.json();

    if (!projectId || !selectedChapterNumbers || selectedChapterNumbers.length === 0) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // 1. Fetch Project Details
    const { data: project, error: pError } = await supabaseAdmin
      .from('premium_projects')
      .select('*')
      .eq('id', projectId)
      .single();

    if (pError || !project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // 2. Fetch User Profile
    const { data: profile } = await supabaseAdmin
      .from('user_profiles')
      .select('full_name, username')
      .eq('id', project.user_id)
      .single();

    // 3. Fetch Selected Chapters
    const { data: chapters, error: cError } = await supabaseAdmin
      .from('premium_chapters')
      .select('*')
      .eq('project_id', projectId)
      .in('chapter_number', selectedChapterNumbers)
      .order('chapter_number', { ascending: true });

    if (cError || !chapters || chapters.length === 0) {
      return NextResponse.json({ error: 'No content found for the selected chapters. Please generate them first.' }, { status: 404 });
    }

    // 4. Prepare content for AI summarization
    const contentToSummarize = chapters.map(ch => 
      `### CHAPTER ${ch.chapter_number}: ${ch.title}\n${ch.content || ''}`
    ).join('\n\n');

    const imageInstruction = images && images.length > 0
      ? `The user selected the following images from their project assets: ${images.map(img => `"${img.caption || img.name || 'Diagram'}" (ID: ${img.id})`).join(', ')}. In the slides where a diagram or visual is helpful, set "imageDbId" to the exact matching image ID.`
      : '';

    const targetTotalSlides = parseInt(String(slideCountRange).split('-')[1] || String(slideCountRange).split('-')[0] || slideCountRange, 10) || 15;
    const contentSlideBudget = Math.max(3, targetTotalSlides - 2 - (includeQA ? 1 : 0));

    const lengthInstruction = `STRICT SLIDE COUNT SPECIFICATION:
    - The user requested a presentation of EXACTLY ${targetTotalSlides} slides total.
    - Title Slide: 1 slide (included in root).
    - Conclusion Slide: 1 slide (included in root).
    ${includeQA ? '- Defense Q&A: 1 slide (included in root).' : ''}
    - Content Slides: You MUST produce EXACTLY ${contentSlideBudget} content slides across the sections in the "sections" array.
    - MANDATORY: The sum of all slides across all sections in the "sections" array MUST BE EXACTLY ${contentSlideBudget}. Do NOT generate extra slides.`;

    const qaInstruction = includeQA
      ? `CRITICAL REQUIREMENT: The user requested Defense Q&A. You MUST include a "defenseQA" array at the root of the JSON object containing 3 to 4 anticipated defense/examiner questions with concise model answers derived from the project.`
      : '';

    const systemPrompt = `You are an academic presentation expert. 
    Transform the following engineering/academic project content into DETAILED technical slides for a professional PowerPoint presentation.
    
    ${lengthInstruction}
    ${imageInstruction}
    ${qaInstruction}
    ${customPrompt ? `User Specific Request: ${customPrompt}` : ''}
    
    Structure the response as a valid JSON object with this EXACT structure:
    {
      "title": "Full Project Title",
      "subtitle": "A Comprehensive Technical Subtitle",
      "author": "${profile?.full_name || profile?.username || 'Student'}",
      "institution": "Faculty of ${project.faculty || 'Engineering'}, Department of ${project.department || 'General Studies'}",
      "sections": [
        { 
          "title": "Section Title", 
          "slides": [
            {
              "title": "Slide Title",
              "bullets": [
                "Concise technical point explaining methodology or concept...",
                "Key quantitative or engineering finding with specific metrics...",
                "Impact or deduction derived from the analysis..."
              ],
              "imageDbId": "Image ID if one of the user images belongs on this slide, else null"
            }
          ]
        }
      ],
      "conclusion": {
        "title": "Synthesis & Future Direction",
        "bullets": [
          "Core technical breakthrough and practical implications...",
          "Validation metrics demonstrating system efficiency...",
          "Targeted roadmap for deployment and future engineering..."
        ]
      }${includeQA ? `,\n      "defenseQA": [\n        { "question": "Anticipated Question 1?", "answer": "Model Answer 1" },\n        { "question": "Anticipated Question 2?", "answer": "Model Answer 2" }\n      ]` : ''}
    }
    
    CRITICAL SLIDE DESIGN & BULLET RULES (PREVENT BOTTOM OVERFLOW):
    - STRICT LIMIT: Each content slide MUST have at most 3 to 4 concise bullet points (NEVER 5 or more).
    - BULLET LENGTH: Keep each bullet point punchy, technical, and between 10 to 18 words maximum. DO NOT write full paragraphs or long rambling sentences that spill past the bottom edge.
    - Conclusion Slide: Exactly 3 concise bullets.
    - Match the exact requested content slide count (${contentSlideBudget} content slides total across all sections).
    - Return ONLY the JSON object. No markdown formatting or conversational filler.
    
    Content:
    ${contentToSummarize}`;

    // 5. Call DeepSeek for high-quality summarization
    const aiResponse = await callAI(systemPrompt, {
      provider: 'deepseek',
      maxTokens: 4000,
      temperature: 0.3
    });

    let slidesData;
    try {
      const jsonString = aiResponse.content.replace(/```json/g, '').replace(/```/g, '').trim();
      slidesData = JSON.parse(jsonString);
    } catch (parseError) {
      console.error('JSON Parse Error:', aiResponse.content);
      throw new Error('AI failed to generate detailed structured slide data. Please try again.');
    }

    // Programmatically clamp content slides and bullets to prevent overflow & enforce slide budget
    if (slidesData.sections && Array.isArray(slidesData.sections)) {
      let currentContentCount = 0;
      const prunedSections = [];
      for (const section of slidesData.sections) {
        const sectionSlides = [];
        for (const slide of (section.slides || [])) {
          if (currentContentCount < contentSlideBudget) {
            if (slide.bullets && Array.isArray(slide.bullets)) {
              slide.bullets = slide.bullets.slice(0, 4);
            }
            sectionSlides.push(slide);
            currentContentCount++;
          }
        }
        if (sectionSlides.length > 0) {
          prunedSections.push({ ...section, slides: sectionSlides });
        }
      }
      slidesData.sections = prunedSections;
    }

    if (slidesData.conclusion?.bullets && Array.isArray(slidesData.conclusion.bullets)) {
      slidesData.conclusion.bullets = slidesData.conclusion.bullets.slice(0, 3);
    }

    return NextResponse.json({ 
      success: true, 
      data: slidesData,
      targetTotalSlides
    });

  } catch (error) {
    console.error('Slide Generation API Error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
