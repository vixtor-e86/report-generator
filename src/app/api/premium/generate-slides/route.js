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
      `### CHAPTER ${ch.chapter_number}: ${ch.title}\n${ch.content || 'No content provided for this chapter.'}`
    ).join('\n\n');

    const systemPrompt = `You are an academic presentation expert. 
    Summarize the following engineering project content into bullet points for a PowerPoint presentation.
    
    Structure the response as a JSON array of objects, where each object is a slide:
    {
      "slides": [
        { "title": "Slide Title", "bullets": ["Point 1", "Point 2", "Point 3"] }
      ]
    }
    
    Rules:
    - Max 5-6 bullets per slide.
    - Keep text concise and technical.
    - Create a logical flow: Introduction, Objectives, Methodology, Results, Conclusion.
    - Respond ONLY with the JSON.
    
    Project Title: ${project.title}
    Faculty: ${project.faculty}
    Author: ${profile?.full_name || profile?.username || 'Student'}
    
    Content:
    ${contentToSummarize}`;

    // 5. Call Gemini for high-quality summarization
    const aiResponse = await callAI(systemPrompt, {
      provider: 'gemini',
      maxTokens: 4000,
      temperature: 0.3
    });

    let slidesData;
    try {
      // Extract JSON if AI wrapped it in code blocks
      const jsonString = aiResponse.content.replace(/```json/g, '').replace(/```/g, '').trim();
      slidesData = JSON.parse(jsonString);
    } catch (parseError) {
      console.error('JSON Parse Error:', aiResponse.content);
      throw new Error('AI failed to generate structured slide data. Please try again.');
    }

    return NextResponse.json({ 
      success: true, 
      slides: slidesData.slides,
      metadata: {
        title: project.title,
        author: profile?.full_name || profile?.username || 'Student',
        department: project.department,
        university: 'Academic Institution'
      }
    });

  } catch (error) {
    console.error('Slide Generation API Error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
