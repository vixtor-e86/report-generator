// src/app/api/premium/generate-slides/route.js
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { callAI } from '@/lib/aiProvider';

export async function POST(request) {
  try {
    const { projectId, selectedChapterNumbers, userId } = await request.json();

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

    const systemPrompt = `You are an academic presentation expert. 
    Transform the following engineering project content into DETAILED technical slides for a professional PowerPoint presentation.
    
    Structure the response as a valid JSON object with this EXACT structure:
    {
      "title": "Full Project Title",
      "subtitle": "A Comprehensive Technical Subtitle",
      "author": "${profile?.full_name || profile?.username || 'Student'}",
      "institution": "Department of ${project.department}",
      "sections": [
        { 
          "title": "Section Title (e.g. Methodology, Design Logic)", 
          "bullets": [
            "Detailed technical explanation of the first major point...",
            "Comprehensive breakdown of the second major point with specifics...",
            "Elaborate analysis of results or methodology...",
            "Substantial technical detail about the systems used...",
            "Critical academic insight or data finding..."
          ] 
        }
      ],
      "conclusion": {
        "title": "Synthesis & Future Direction",
        "bullets": [
          "Detailed summary of research achievements...",
          "Comprehensive overview of technical conclusions...",
          "Specific recommendations for future engineering work..."
        ]
      }
    }
    
    CRITICAL RULES:
    - DO NOT use short keypoints. Use full, informative, technical sentences (approx 15-25 words per bullet).
    - Ensure EACH bullet point contains substantial technical data or logical explanation.
    - Each section MUST have 4-6 detailed bullet points.
    - Return ONLY the JSON object. No markdown formatting.
    
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
