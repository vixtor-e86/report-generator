import { NextResponse } from 'next/server';
import { callAI } from '@/lib/aiProvider';

export async function POST(request) {
  try {
    const { content, prompt, images, currentSlides, customOutline, slideCountRange, includeQA } = await request.json();

    if (!content && !currentSlides) {
      return NextResponse.json({ error: 'Content or existing slides are required' }, { status: 400 });
    }

    // Prepare image context
    const imageContext = images && images.length > 0 
      ? `The user has provided the following images with captions: ${images.map(img => `"${img.caption}"`).join(', ')}. Use these exact captions as placeholders in the "imageCaption" field where appropriate.`
      : '';

    // Prepare structure context
    const structureContext = customOutline && customOutline.length > 0
      ? `The user requires the presentation to follow this specific structure/outline: ${customOutline.join(' -> ')}. Ensure every point in this outline is represented as a section or slide.`
      : '';

    const targetTotalSlides = parseInt(String(slideCountRange).split('-')[1] || String(slideCountRange).split('-')[0] || slideCountRange, 10) || 15;
    const contentSlideBudget = Math.max(3, targetTotalSlides - 2 - (includeQA ? 1 : 0));

    const lengthContext = `STRICT SLIDE COUNT SPECIFICATION:
    - Total Target: EXACTLY ${targetTotalSlides} slides for the entire deck.
    - Title Slide: 1 slide (root).
    - Conclusion Slide: 1 slide (root).
    ${includeQA ? '- Defense Q&A: 1 slide (root).' : ''}
    - Content Slides: You MUST produce EXACTLY ${contentSlideBudget} content slides across the sections in the "sections" array.
    - MANDATORY: The sum of all slides across all sections in the "sections" array MUST BE EXACTLY ${contentSlideBudget}. Do NOT generate extra slides.`;

    const qaContext = includeQA 
      ? `CRITICAL REQUIREMENT: The user requested Defense Q&A. You MUST include a "defenseQA" array at the root of the JSON object containing 3 to 4 anticipated defense/examiner questions with concise model answers derived from the content.`
      : '';

    const isRefinement = !!currentSlides;

    const systemPrompt = isRefinement 
      ? `You are an academic presentation expert. I will provide you with an existing slide JSON structure and a specific instruction for modification.
      Your task is to RESTRUCTURE and REFINE the slides based on the instructions while maintaining technical depth.
      
      Instructions: ${prompt}
      
      Current Slides JSON:
      ${JSON.stringify(currentSlides)}
      
      Return the MODIFIED valid JSON object with the same structure.`
      : `You are an academic presentation expert. 
      Transform the provided content into DETAILED technical slides for a professional PowerPoint presentation.
      ${structureContext}
      ${lengthContext}
      ${imageContext}
      ${qaContext}
      
      Structure the response as a valid JSON object with this EXACT structure:
      {
        "title": "Full Project Title",
        "subtitle": "A Comprehensive Technical Subtitle",
        "author": "Student Name",
        "institution": "University / Department",
        "sections": [
          { 
            "title": "Section Title", 
            "slides": [
              {
                "title": "Slide Heading",
                "bullets": ["Concise technical point 1", "Concise technical point 2", "Concise technical point 3"],
                "imageCaption": "Exact caption of provided image if it fits here, else null"
              }
            ]
          }
        ],
        "conclusion": {
          "title": "Synthesis & Future Direction",
          "bullets": ["Final synthesis point 1", "Final synthesis point 2", "Final synthesis point 3"]
        }${includeQA ? `,\n        "defenseQA": [\n          { "question": "Anticipated Question 1?", "answer": "Model Answer 1" },\n          { "question": "Anticipated Question 2?", "answer": "Model Answer 2" }\n        ]` : ''}
      }
      
      Specific Instructions: ${prompt || 'Make it professional and technically detailed.'}
      
      CRITICAL SLIDE DESIGN & BULLET RULES (PREVENT BOTTOM OVERFLOW):
      - STRICT LIMIT: Each content slide MUST have at most 3 to 4 concise bullet points (NEVER 5 or more).
      - BULLET LENGTH: Keep each bullet point punchy, technical, and between 10 to 18 words maximum. DO NOT write full paragraphs or long rambling sentences that spill past the bottom edge.
      - Conclusion Slide: Exactly 3 concise bullets.
      - Match the exact requested content slide count (${contentSlideBudget} content slides total across all sections).
      - Return ONLY the JSON object. No markdown.
      
      Content:
      ${content}`;

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
      throw new Error('AI failed to generate structured slide data. Please try again.');
    }

    // Programmatically enforce content slide budget to prevent AI generating extra slides
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
    console.error('Slide Tool Error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
