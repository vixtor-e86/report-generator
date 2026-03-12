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

    // Use a consistent BASE URL
    const BASE_URL = "https://www.bypassgpt.ai/api/bypassgpt/v1";
    
    console.log(`Humanizer: Sending ${wordCount} words to BypassGPT...`);
    
    // Step A: Initiate Task
    const genResponse = await fetch(`${BASE_URL}/generate`, {
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
      console.error('Humanizer Fetch Error (Gen):', err);
      throw new Error(`Connection failed: ${err.message}`);
    });

    const genRawText = await genResponse.text();
    console.log('Humanizer Gen Raw Response:', genRawText);

    if (!genResponse.ok) {
      if (genResponse.status === 403) {
        throw new Error('BypassGPT 403: Unauthorized. Please check if your API key is correct and your plan has API access enabled.');
      }
      throw new Error(`BypassGPT Gen Error (${genResponse.status}): ${genRawText}`);
    }

    let genData;
    try {
      genData = JSON.parse(genRawText);
    } catch (e) {
      throw new Error(`BypassGPT sent invalid JSON: ${genRawText.substring(0, 100)}`);
    }

    // Identify Task ID or immediate output
    const taskId = genData.task_id || genData.id || genData.data?.task_id || (genData.data && genData.data.id);
    let humanizedText = genData.data?.output || genData.output || genData.text || (genData.data && genData.data.text);

    if (!taskId && !humanizedText) {
      throw new Error(`No task identifier or result found. Response: ${genRawText}`);
    }

    // Step B: Polling for results
    if (taskId && !humanizedText) {
      console.log('Humanizer: Polling task', taskId);
      let attempts = 0;
      const maxAttempts = 40; // Total 80 seconds

      while (attempts < maxAttempts) {
        attempts++;
        await new Promise(resolve => setTimeout(resolve, 2000));

        const pollResponse = await fetch(`${BASE_URL}/retrieval?task_id=${taskId}`, {
          headers: { "x-api-key": apiKey }
        }).catch(err => {
          console.error('Humanizer Polling Fetch Error:', err);
          return null; // Continue loop if one fetch fails
        });

        if (pollResponse && pollResponse.ok) {
          const pollData = await pollResponse.json();
          console.log(`Poll ${attempts} Status:`, pollData.status);
          
          const output = pollData.data?.output || pollData.output || pollData.text || (pollData.data && pollData.data.text);
          
          if ((pollData.status === 'success' || pollData.status === 'completed' || pollData.code === 200) && output) {
            humanizedText = output;
            break;
          } else if (pollData.status === 'failed' || pollData.status === 'error') {
            throw new Error(`Humanizer server error: ${pollData.message || 'Unknown failure'}`);
          }
        }
      }
    }

    if (!humanizedText) {
      throw new Error('Humanizer processing taking too long. Please check your history in the BypassGPT dashboard.');
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
    return NextResponse.json({ error: error.message || 'Internal server error during humanization' }, { status: 500 });
  }
}
