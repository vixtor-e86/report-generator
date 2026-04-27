import { NextResponse } from 'next/server';
import { callAI } from '@/lib/aiProvider';

export async function POST(request) {
  try {
    const { content, prompt, images, currentSlides } = await request.json();

    if (!content && !currentSlides) {
      return NextResponse.json({ error: 'Content or existing slides are required' }, { status: 400 });
    }

    // Prepare image context if provided
    const imageContext = images && images.length > 0 
      ? `The user has provided the following images with captions: ${images.map(img => `"${img.caption}"`).join(', ')}. Use these captions as placeholders in the "imageCaption" field where appropriate.`
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
      ${imageContext}
      
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
                "bullets": ["Point 1", "Point 2", "Point 3", "Point 4"],
                "imageCaption": "Exact caption of provided image if it fits here, else null"
              }
            ]
          }
        ],
        "conclusion": {
          "title": "Synthesis & Future Direction",
          "bullets": ["Final point 1", "Final point 2"]
        }
      }
      
      Specific Instructions: ${prompt || 'Make it professional and technically detailed.'}
      
      CRITICAL RULES:
      - Use full, informative, technical sentences (approx 15-25 words per bullet).
      - Each section should have 2-4 slides.
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

    return NextResponse.json({ 
      success: true, 
      data: slidesData
    });

  } catch (error) {
    console.error('Slide Tool Error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
