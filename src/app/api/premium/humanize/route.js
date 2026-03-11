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

    // --- 3. CALL BYPASSGPT.AI ---
    const apiKey = process.env.BYPASSGPT_API_KEY;
    if (!apiKey) {
      throw new Error('BYPASSGPT_API_KEY not found in environment variables.');
    }

    const response = await fetch("https://www.bypassgpt.ai/api/bypassgpt/v1/generate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        text: processedContent,
        mode: "enhanced" 
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`BypassGPT API error: ${errorData.message || response.statusText}`);
    }

    const data = await response.json();
    let humanizedText = data.data?.text || data.text || "";

    if (!humanizedText) {
      throw new Error('Failed to retrieve humanized text from BypassGPT.');
    }

    // RESTORE IMAGES
    images.forEach((originalTag, index) => {
      const placeholder = `{{IMAGE_PLACEHOLDER_${index}}}`;
      humanizedText = humanizedText.replace(placeholder, originalTag);
    });

    // --- 4. UPDATE WORD USAGE ---
    await supabaseAdmin
      .from('premium_projects')
      .update({
        humanizer_words_used: wordsUsed + wordCount,
        last_generated_at: new Date().toISOString()
      })
      .eq('id', projectId);

    // --- 5. MERGE LOGIC ---
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
      humanized: humanizedText, // Just the section
      fullHumanized: fullMergedOutput, // The full merged chapter
      original: content,
      wordsUsed: wordsUsed + wordCount,
      wordsLimit
    });

  } catch (error) {
    console.error('Humanizer Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
