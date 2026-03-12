// src/app/api/premium/humanize/route.js
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export const maxDuration = 60; // Increase Vercel execution time to 60s (Pro limit)

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

    // Protection logic
    const images = [];
    const processedContent = content.replace(/!\[.*?\]\(.*?\)/g, (match) => {
      const placeholder = ` {{IMG_${images.length}}} `;
      images.push(match);
      return placeholder;
    });

    const apiKey = process.env.BYPASSGPT_API_KEY;
    if (!apiKey) throw new Error('API Key missing.');

    const API_BASE = "https://www.bypassgpt.ai/api/bypassgpt/v1";
    
    // STEP A: SUBMIT
    console.log('Humanizer: Submitting to BypassGPT...');
    const submitRes = await fetch(`${API_BASE}/generate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-key": apiKey,
        "x-api-key": apiKey
      },
      body: JSON.stringify({
        input: processedContent,
        model_type: "Enhanced"
      })
    });

    const submitText = await submitRes.text();
    console.log('Humanizer: Submit Response:', submitText);

    if (!submitRes.ok) throw new Error(`BypassGPT Submit Error: ${submitText}`);

    const submitData = JSON.parse(submitText);
    const taskId = submitData.task_id || submitData.id || submitData.data?.task_id || submitData.data?.id;
    let humanizedText = submitData.output || submitData.text || submitData.data?.output || submitData.data?.text;

    if (!taskId && !humanizedText) throw new Error('No task ID or result returned from server.');

    // STEP B: POLL (Max 45 seconds to avoid Vercel timeout)
    if (taskId && !humanizedText) {
      console.log('Humanizer: Polling for results...', taskId);
      let attempts = 0;
      const startTime = Date.now();

      while (Date.now() - startTime < 45000) { // 45s cap
        attempts++;
        await new Promise(r => setTimeout(r, 3000));

        // Try retrieval with task_id
        const pollRes = await fetch(`${API_BASE}/retrieval?task_id=${taskId}`, {
          headers: { "api-key": apiKey, "x-api-key": apiKey }
        });

        if (pollRes.ok) {
          const pollData = await pollRes.json();
          console.log(`Poll ${attempts} Status:`, pollData.status || pollData.code);
          
          const output = pollData.output || pollData.text || pollData.data?.output || pollData.data?.text;
          
          // Check for various success signals
          if (output && (pollData.status === 'success' || pollData.status === 'completed' || pollData.code === 200)) {
            humanizedText = output;
            break;
          }
        }
      }
    }

    if (!humanizedText) throw new Error('Processing timed out. The content is saved in your BypassGPT history but took too long to return to the app.');

    // Restore Images
    images.forEach((tag, i) => {
      humanizedText = humanizedText.replace(`{{IMG_${i}}}`, tag);
    });

    // Update DB
    await supabaseAdmin.from('premium_projects').update({
      humanizer_words_used: wordsUsed + wordCount,
      last_generated_at: new Date().toISOString()
    }).eq('id', projectId);

    // Merge if partial
    let finalOutput = humanizedText;
    if (isPartial && fullContent) {
      const normalizedFull = fullContent.replace(/\r\n/g, '\n');
      const normalizedTarget = content.replace(/\r\n/g, '\n');
      if (normalizedFull.includes(normalizedTarget)) {
        finalOutput = normalizedFull.replace(normalizedTarget, humanizedText);
      }
    }

    return NextResponse.json({ 
      success: true, 
      humanized: humanizedText, 
      fullHumanized: finalOutput,
      wordsUsed: wordsUsed + wordCount,
      wordsLimit
    });

  } catch (error) {
    console.error('Humanizer Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
