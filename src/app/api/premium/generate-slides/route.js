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

    const lengthInstruction = `SLIDE COUNT REQUIREMENT: The user requested a total presentation length of ${slideCountRange} slides. Ensure the total number of content slides strictly respects this range (target roughly ${slideCountRange.split('-')[0] || 10} to ${slideCountRange.split('-')[1] || 15} total slides including title and conclusion).`;

    const qaInstruction = includeQA
      ? `CRITICAL REQUIREMENT: The user requested Defense Q&A. You MUST include a "defenseQA" array at the root of the JSON object containing 3 to 5 anticipated defense/examiner questions with thorough model answers derived from the project.`
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
          "title": "Section Title (e.g. Methodology, System Design, Results)", 
          "slides": [
            {
              "title": "Slide Title",
              "bullets": [
                "Detailed technical explanation of the first major point...",
                "Comprehensive breakdown of the second major point with specifics...",
                "Elaborate analysis of results or methodology...",
                "Substantial technical detail about the systems used..."
              ],
              "imageDbId": "Image ID if one of the user images belongs on this slide, else null"
            }
          ]
        }
      ],
      "conclusion": {
        "title": "Synthesis & Future Direction",
        "bullets": [
          "Detailed summary of research achievements...",
          "Comprehensive overview of technical conclusions...",
          "Specific recommendations for future work..."
        ]
      }${includeQA ? `,\n      "defenseQA": [\n        { "question": "Anticipated Question 1?", "answer": "Model Answer 1" },\n        { "question": "Anticipated Question 2?", "answer": "Model Answer 2" }\n      ]` : ''}
    }
    
    CRITICAL RULES:
    - DO NOT use short fragmented keypoints. Use full, informative, technical sentences (approx 15-25 words per bullet).
    - Ensure EACH bullet point contains substantial technical data or logical explanation.
    - Each content slide MUST have 3-5 detailed bullet points.
    - Match the requested slide count (${slideCountRange} slides total).
    - Return ONLY the JSON object. No markdown formatting or explanation.
    
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

    return NextResponse.json({ 
      success: true, 
      data: slidesData
    });

  } catch (error) {
    console.error('Slide Generation API Error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
