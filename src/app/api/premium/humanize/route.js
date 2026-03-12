// src/app/api/premium/humanize/route.js
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function POST(request) {
  try {
    const { content, projectId } = await request.json();

    if (!content || content.length < 5 || !projectId) {
      return NextResponse.json({ error: 'Missing content or project ID.' }, { status: 400 });
    }

    const wordCount = content.trim().split(/\s+/).length;
    
    // 1. Fetch current usage
    const { data: project, error: projectError } = await supabaseAdmin
      .from('premium_projects')
      .select('humanizer_words_used, humanizer_words_limit')
      .eq('id', projectId)
      .single();

    if (projectError || !project) return NextResponse.json({ error: 'Project not found.' }, { status: 404 });

    const currentUsed = project.humanizer_words_used || 0;
    const limit = project.humanizer_words_limit || 10000;

    if (currentUsed + wordCount > limit) {
      return NextResponse.json({ 
        error: `Word limit exceeded. You have ${limit - currentUsed} words remaining, but this selection is ${wordCount} words.` 
      }, { status: 403 });
    }

    const apiKey = process.env.BYPASSGPT_API_KEY;
    if (!apiKey) throw new Error('BYPASSGPT_API_KEY not found.');

    // 2. Submit Task to BypassGPT
    const response = await fetch("https://www.bypassgpt.ai/api/bypassgpt/v1/generate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-key": apiKey
      },
      body: JSON.stringify({
        input: content,
        model_type: "Enhanced"
      })
    });

    const data = await response.json();
    if (!response.ok) throw new Error(`BypassGPT Error: ${JSON.stringify(data)}`);

    const taskId = data.task_id || data.id || data.data?.task_id;
    const immediateOutput = data.output || data.text || data.data?.output;

    // 3. Increment usage immediately (Charge for the attempt as requested)
    const newUsed = currentUsed + wordCount;
    await supabaseAdmin.from('premium_projects').update({
      humanizer_words_used: newUsed,
      last_generated_at: new Date().toISOString()
    }).eq('id', projectId);

    return NextResponse.json({ 
      success: true, 
      taskId, 
      immediateOutput,
      newUsed, 
      wordCount
    });

  } catch (error) {
    console.error('Humanizer Initiation Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
