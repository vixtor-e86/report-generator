// src/app/api/premium/humanize/route.js
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function POST(request) {
  try {
    const { content, projectId, isPartial = false, fullContent = "" } = await request.json();

    if (!content || content.length < 5 || !projectId) {
      return NextResponse.json({ error: 'Missing content or project ID.' }, { status: 400 });
    }

    // --- 1. WORD COUNT & LIMIT CHECK ---
    const wordCount = content.trim().split(/\s+/).length;
    
    const { data: project, error: projectError } = await supabaseAdmin
      .from('premium_projects')
      .select('humanizer_words_used, humanizer_words_limit')
      .eq('id', projectId)
      .single();

    if (projectError || !project) {
      return NextResponse.json({ error: 'Project not found.' }, { status: 404 });
    }

    const wordsUsed = project.humanizer_words_used || 0;
    const wordsLimit = project.humanizer_words_limit || 10000;

    if (wordsUsed + wordCount > wordsLimit) {
      return NextResponse.json({ 
        error: `Word limit exceeded. You have ${wordsLimit - wordsUsed} words remaining, but this selection is ${wordCount} words.` 
      }, { status: 403 });
    }

    // --- 2. IMAGE PROTECTION LOGIC ---
    const images = [];
    const imageRegex = /!\[.*?\]\(.*?\)/g;
    const processedContent = content.replace(imageRegex, (match) => {
      const placeholder = `{{IMG_${images.length}}}`;
      images.push(match);
      return placeholder;
    });

    // --- 3. CALL BYPASSGPT.AI (OFFICIAL SPEC) ---
    const apiKey = process.env.BYPASSGPT_API_KEY;
    if (!apiKey) {
      throw new Error('BYPASSGPT_API_KEY not found in environment variables.');
    }

    const API_BASE = "https://www.bypassgpt.ai/api/bypassgpt/v1";
    
    console.log(`Humanizer: Submitting task (${wordCount} words)`);
    
    // STEP A: SUBMIT TASK
    const submitResponse = await fetch(`${API_BASE}/submit`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-key": apiKey,
        "User-Agent": "W3-WriteLab-Researcher/1.0"
      },
      body: JSON.stringify({
        input: processedContent,
        mode: "Latest" // Official modes: Fast, Balanced, Aggressive, Latest
      })
    });

    const submitRaw = await submitResponse.text();
    console.log('Humanizer: Submit Response:', submitRaw);

    if (!submitResponse.ok) {
      throw new Error(`BypassGPT Submit Error (${submitResponse.status}): ${submitRaw}`);
    }

    let submitData = JSON.parse(submitRaw);
    const taskId = submitData.data?.task_id || submitData.task_id;

    if (!taskId) {
      throw new Error(`Failed to initialize task. Response: ${submitRaw}`);
    }

    // STEP B: RETRIEVAL (POST with POLLING)
    let humanizedText = "";
    let attempts = 0;
    const maxAttempts = 30; 

    console.log(`Humanizer: Polling task ${taskId}...`);

    while (attempts < maxAttempts) {
      attempts++;
      await new Promise(resolve => setTimeout(resolve, 3000)); // official recommendation is polling every few seconds

      const pollResponse = await fetch(`${API_BASE}/retrieval`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "api-key": apiKey
        },
        body: JSON.stringify({ task_id: taskId })
      });

      if (pollResponse.ok) {
        const pollData = await pollResponse.json();
        console.log(`Humanizer: Poll ${attempts} Status:`, pollData.data?.status || pollData.msg);
        
        // Based on spec, it's inside data.output and status is 'completed'
        if (pollData.data?.status === 'completed' && pollData.data?.output) {
          humanizedText = pollData.data.output;
          break;
        } else if (pollData.data?.status === 'failed') {
          throw new Error('BypassGPT server reported task failure.');
        }
      }
    }

    if (!humanizedText) {
      throw new Error('Humanization timed out. The server is still processing your request. Please check your history on bypassgpt.ai.');
    }

    // --- 4. RESTORE IMAGES ---
    images.forEach((originalTag, index) => {
      const placeholder = `{{IMG_${index}}}`;
      humanizedText = humanizedText.replace(placeholder, originalTag);
    });

    // --- 5. UPDATE WORD USAGE ---
    await supabaseAdmin
      .from('premium_projects')
      .update({
        humanizer_words_used: wordsUsed + wordCount,
        last_generated_at: new Date().toISOString()
      })
      .eq('id', projectId);

    // --- 6. MERGE LOGIC ---
    let fullMergedOutput = humanizedText;
    if (isPartial && fullContent) {
      const normalizedFull = fullContent.replace(/\r\n/g, '\n');
      const normalizedTarget = content.replace(/\r\n/g, '\n');
      
      if (normalizedFull.includes(normalizedTarget)) {
        fullMergedOutput = normalizedFull.replace(normalizedTarget, humanizedText);
      } else {
        const trimmedTarget = normalizedTarget.trim();
        if (normalizedFull.includes(trimmedTarget)) {
          fullMergedOutput = normalizedFull.replace(trimmedTarget, humanizedText);
        }
      }
    }

    return NextResponse.json({ 
      success: true, 
      humanized: humanizedText, 
      fullHumanized: fullMergedOutput, 
      original: content,
      wordsUsed: wordsUsed + wordCount,
      wordsLimit
    });

  } catch (error) {
    console.error('Humanizer Logic Error:', error);
    return NextResponse.json({ error: error.message || 'Critical error during humanization' }, { status: 500 });
  }
}
