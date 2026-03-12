// src/app/api/premium/humanize/route.js
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function POST(request) {
  try {
    const { content, projectId, isPartial = false, fullContent = "" } = await request.json();

    if (!content || content.length < 10 || !projectId) {
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
      const placeholder = `{{IMAGE_PLACEHOLDER_${images.length}}}`;
      images.push(match);
      return placeholder;
    });

    // --- 3. CALL BYPASSGPT.AI (ASYNC WORKFLOW) ---
    const apiKey = process.env.BYPASSGPT_API_KEY;
    if (!apiKey) {
      throw new Error('BYPASSGPT_API_KEY not found in environment variables.');
    }

    // Step A: Initiate Generation
    const genResponse = await fetch("https://www.bypassgpt.ai/api/bypassgpt/v1/generate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-key": apiKey
      },
      body: JSON.stringify({
        input: processedContent,
        model_type: "Enhanced" 
      })
    });

    if (!genResponse.ok) {
      const errorText = await genResponse.text();
      console.error('BypassGPT Gen Error:', errorText);
      throw new Error(`BypassGPT API error (${genResponse.status}): ${errorText}`);
    }

    const genData = await genResponse.json();
    const taskId = genData.task_id;

    if (!taskId) {
      throw new Error('No task_id returned from BypassGPT.');
    }

    // Step B: Polling for Results
    let humanizedText = "";
    let attempts = 0;
    const maxAttempts = 30; // 30 * 2s = 60s max wait

    while (attempts < maxAttempts) {
      attempts++;
      // Wait 2 seconds between polls
      await new Promise(resolve => setTimeout(resolve, 2000));

      const pollResponse = await fetch(`https://www.bypassgpt.ai/api/bypassgpt/v1/retrieval?task_id=${taskId}`, {
        headers: { "api-key": apiKey }
      });

      if (pollResponse.ok) {
        const pollData = await pollResponse.json();
        console.log('BypassGPT Poll Status:', pollData.status, pollData);
        
        // Try to find the output in common locations
        const output = pollData.data?.output || pollData.output || pollData.text;
        
        if (pollData.status === 'success' && output) {
          humanizedText = output;
          break;
        } else if (pollData.status === 'failed') {
          throw new Error('BypassGPT task failed.');
        }
      }
    }

    if (!humanizedText) {
      throw new Error('BypassGPT task timed out or failed to return text.');
    }

    // --- 4. RESTORE IMAGES ---
    images.forEach((originalTag, index) => {
      const placeholder = `{{IMAGE_PLACEHOLDER_${index}}}`;
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

    // --- 6. MERGE LOGIC (IF PARTIAL) ---
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
    console.error('Humanizer Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
