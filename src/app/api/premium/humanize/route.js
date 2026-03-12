// src/app/api/premium/humanize/route.js
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function POST(request) {
  try {
    const { content, projectId, isPartial = false, fullContent = "" } = await request.json();

    if (!content || content.length < 10 || !projectId) {
      return NextResponse.json({ error: 'Selection is too short. Please select at least 50 words for better humanization.' }, { status: 400 });
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
        error: `Word limit exceeded. Remaining: ${wordsLimit - wordsUsed}. Requested: ${wordCount}.` 
      }, { status: 403 });
    }

    // --- 2. IMAGE PROTECTION ---
    const images = [];
    const imageRegex = /!\[.*?\]\(.*?\)/g;
    const processedContent = content.replace(imageRegex, (match) => {
      const placeholder = ` {{IMAGE_${images.length}}} `;
      images.push(match);
      return placeholder;
    });

    // --- 3. CALL BYPASSGPT.AI ---
    const apiKey = process.env.BYPASSGPT_API_KEY;
    if (!apiKey) throw new Error('BYPASSGPT_API_KEY not found.');

    // We revert to the /generate endpoint as /submit was a landing page
    const API_URL = "https://www.bypassgpt.ai/api/bypassgpt/v1/generate";
    
    console.log(`Humanizer: Sending request to ${API_URL}`);

    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-key": apiKey,
        "x-api-key": apiKey // Send both to be safe
      },
      body: JSON.stringify({
        input: processedContent,
        model_type: "Enhanced"
      })
    });

    const rawText = await response.text();
    console.log('Humanizer: Raw Response From Server:', rawText);

    if (!response.ok) {
      if (response.status === 403) {
        throw new Error('API Access Denied (403). Your BypassGPT plan might not have "Developer API" enabled, or your key is incorrect.');
      }
      throw new Error(`BypassGPT Error (${response.status}): ${rawText.substring(0, 200)}`);
    }

    let data;
    try {
      data = JSON.parse(rawText);
    } catch (e) {
      throw new Error('Server returned an invalid response format. Please try again.');
    }

    // DISCOVERY LOGIC: Find the ID or Output in any possible field
    // Some versions return { task_id: "..." }
    // Some return { data: { task_id: "..." } }
    // Some return { id: "..." }
    const taskId = data.task_id || data.id || data.data?.task_id || data.data?.id;
    let humanizedText = data.output || data.text || data.data?.output || data.data?.text;

    if (!taskId && !humanizedText) {
      console.error('Humanizer Error: No ID or Text found in JSON:', data);
      throw new Error(`The API accepted your request but didn't return a tracking ID. This usually means your account balance is low or the API format changed.`);
    }

    // Step 4: Polling (If result wasn't immediate)
    if (taskId && !humanizedText) {
      console.log('Humanizer: Polling for results...', taskId);
      let attempts = 0;
      while (attempts < 30) {
        attempts++;
        await new Promise(r => setTimeout(resolve => r(), 3000));

        const pollRes = await fetch(`https://www.bypassgpt.ai/api/bypassgpt/v1/retrieval?task_id=${taskId}`, {
          headers: { "api-key": apiKey, "x-api-key": apiKey }
        });

        if (pollRes.ok) {
          const pollData = await pollRes.json();
          console.log(`Humanizer: Poll ${attempts} Status:`, pollData.status);
          
          const output = pollData.output || pollData.text || pollData.data?.output || pollData.data?.text;
          if (output && (pollData.status === 'success' || pollData.status === 'completed')) {
            humanizedText = output;
            break;
          }
        }
      }
    }

    if (!humanizedText) throw new Error('Humanization timed out. Please try a smaller section.');

    // --- 5. RESTORE IMAGES & CLEANUP ---
    images.forEach((tag, i) => {
      humanizedText = humanizedText.replace(`{{IMAGE_${i}}}`, tag);
    });

    // Update word count in DB
    await supabaseAdmin.from('premium_projects').update({
      humanizer_words_used: wordsUsed + wordCount,
      last_generated_at: new Date().toISOString()
    }).eq('id', projectId);

    // Merge if partial
    let finalChapterContent = humanizedText;
    if (isPartial && fullContent) {
      const normalizedFull = fullContent.replace(/\r\n/g, '\n');
      const normalizedTarget = content.replace(/\r\n/g, '\n');
      if (normalizedFull.includes(normalizedTarget)) {
        finalChapterContent = normalizedFull.replace(normalizedTarget, humanizedText);
      }
    }

    return NextResponse.json({ 
      success: true, 
      humanized: humanizedText, 
      fullHumanized: finalChapterContent,
      wordsUsed: wordsUsed + wordCount,
      wordsLimit
    });

  } catch (error) {
    console.error('Humanizer Final Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
