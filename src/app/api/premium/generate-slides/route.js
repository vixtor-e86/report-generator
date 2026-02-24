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

    // 1. Fetch Project & Selected Chapters
    const { data: project } = await supabaseAdmin
      .from('premium_projects')
      .select('*, user_profiles(full_name, username, universities(name))')
      .eq('id', projectId)
      .single();

    const { data: chapters } = await supabaseAdmin
      .from('premium_chapters')
      .select('*')
      .eq('project_id', projectId)
      .in('chapter_number', selectedChapterNumbers)
      .order('chapter_number', { ascending: true });

    if (!chapters || chapters.length === 0) {
      return NextResponse.json({ error: 'No content found for selected chapters' }, { status: 404 });
    }

    // 2. Prepare content for AI summarization
    const contentToSummarize = chapters.map(ch => 
      `### CHAPTER ${ch.chapter_number}: ${ch.title}
${ch.content}`
    ).join('

');

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
    - Create a logical flow: Intro, Objectives, Methodology (if Ch 3 selected), Results, Conclusion.
    - Respond ONLY with the JSON.
    
    Project Title: ${project.title}
    Faculty: ${project.faculty}
    Author: ${project.user_profiles?.full_name || project.user_profiles?.username}
    University: ${project.user_profiles?.universities?.name || 'Academic Institution'}
    
    Content:
    ${contentToSummarize}`;

    // 3. Call Gemini for high-quality summarization
    const aiResponse = await callAI(systemPrompt, {
      provider: 'gemini',
      maxTokens: 4000,
      temperature: 0.3 // Low temperature for factual consistency
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
        author: project.user_profiles?.full_name || project.user_profiles?.username,
        department: project.department,
        university: project.user_profiles?.universities?.name || 'Academic Institution'
      }
    });

  } catch (error) {
    console.error('Slide Generation API Error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
