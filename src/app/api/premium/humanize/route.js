// src/app/api/premium/humanize/route.js
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function POST(request) {
  try {
    const { content, projectId, isPartial = false, fullContent = "" } = await request.json();

    if (!content || content.length < 5 || !projectId) {
      return NextResponse.json({ error: 'Selection too short.' }, { status: 400 });
    }

    const wordCount = content.trim().split(/\s+/).length;
    
    const { data: project } = await supabaseAdmin
      .from('premium_projects')
      .select('humanizer_words_used, humanizer_words_limit')
      .eq('id', projectId)
      .single();

    if (!project) return NextResponse.json({ error: 'Project not found.' }, { status: 404 });

    const wordsUsed = project.humanizer_words_used || 0;
    const wordsLimit = project.humanizer_words_limit || 10000;

    if (wordsUsed + wordCount > wordsLimit) {
      return NextResponse.json({ error: `Limit exceeded. Remaining: ${wordsLimit - wordsUsed}.` }, { status: 403 });
    }

    const apiKey = process.env.BYPASSGPT_API_KEY;
    if (!apiKey) throw new Error('API Key missing.');

    // 1. Submit Task to BypassGPT
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
    console.log('Humanizer Initiation:', data);

    if (!response.ok) throw new Error(`BypassGPT Error: ${JSON.stringify(data)}`);

    const taskId = data.task_id || data.id || data.data?.task_id;
    const immediateOutput = data.output || data.text || data.data?.output;

    // 2. Log Word Usage early (since it's in their history)
    await supabaseAdmin.from('premium_projects').update({
      humanizer_words_used: wordsUsed + wordCount,
      last_generated_at: new Date().toISOString()
    }).eq('id', projectId);

    return NextResponse.json({ 
      success: true, 
      taskId, 
      immediateOutput,
      wordCount,
      isPartial,
      fullContent // Pass back for client-side merging
    });

  } catch (error) {
    console.error('Humanizer Start Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
