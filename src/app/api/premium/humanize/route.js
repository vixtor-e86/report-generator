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
      const placeholder = `{{IMAGE_PLACEHOLDER_${images.length}}}`;
      images.push(match);
      return placeholder;
    });

    // --- 3. CALL BYPASSGPT.AI ---
    const apiKey = process.env.BYPASSGPT_API_KEY;
    if (!apiKey) {
      throw new Error('BYPASSGPT_API_KEY not found in environment variables.');
    }

    // Step A: Initiate Task
    // We'll use the most common API endpoint documented
    const genUrl = "https://www.bypassgpt.ai/api/bypassgpt/v1/generate";
    
    console.log('Humanizer: Initiating request to', genUrl);
    
    const genResponse = await fetch(genUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey
      },
      body: JSON.stringify({
        input: processedContent,
        model_type: "Enhanced" 
      })
    }).catch(err => {
      console.error('Fetch Crash:', err);
      throw new Error('Failed to connect to humanizer service. Check server network.');
    });

    const genRawText = await genResponse.text();
    console.log('Humanizer: Raw Response:', genRawText);

    if (!genResponse.ok) {
      throw new Error(`BypassGPT Error (${genResponse.status}): ${genRawText}`);
    }

    let genData;
    try {
      genData = JSON.parse(genRawText);
    } catch (e) {
      throw new Error(`Invalid JSON response from humanizer: ${genRawText.substring(0, 100)}`);
    }

    // Capture task ID from any possible location
    const taskId = genData.task_id || genData.id || genData.data?.task_id || (genData.data && genData.data.id);
    let humanizedText = genData.data?.output || genData.output || genData.text || (genData.data && genData.data.text);

    if (!taskId && !humanizedText) {
      throw new Error(`No task identifier found in response. Contact support or check API logs.`);
    }

    // Step B: Polling if needed
    if (taskId && !humanizedText) {
      console.log('Humanizer: Polling for task', taskId);
      let attempts = 0;
      const maxAttempts = 25; 

      while (attempts < maxAttempts) {
        attempts++;
        await new Promise(resolve => setTimeout(resolve, 3000)); // Wait 3s

        const pollUrl = `https://www.bypassgpt.ai/api/bypassgpt/v1/retrieval?task_id=${taskId}`;
        const pollResponse = await fetch(pollUrl, {
          headers: { "x-api-key": apiKey }
        });

        if (pollResponse.ok) {
          const pollData = await pollResponse.json();
          console.log(`Humanizer: Poll ${attempts} Status:`, pollData.status);
          
          const output = pollData.data?.output || pollData.output || pollData.text || (pollData.data && pollData.data.text);
          
          if ((pollData.status === 'success' || pollData.status === 'completed' || pollData.code === 200) && output) {
            humanizedText = output;
            break;
          } else if (pollData.status === 'failed' || pollData.status === 'error') {
            throw new Error(`Humanization task failed on server: ${pollData.message || 'Unknown error'}`);
          }
        }
      }
    }

    if (!humanizedText) {
      throw new Error('Humanizer timed out. Please try a shorter section or try again in a few minutes.');
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
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
