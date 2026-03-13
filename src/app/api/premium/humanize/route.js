// src/app/api/premium/humanize/route.js
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function POST(request) {
  try {
    const { content, projectId } = await request.json();

    if (!content || content.length < 5 || !projectId) {
      return NextResponse.json({ error: 'Missing content or project ID.' }, { status: 400 });
    }

    // Clean word count
    const wordCount = content.trim().split(/\s+/).filter(w => w.length > 0).length;
    
    // 1. Fetch current usage using Admin client
    const { data: project, error: fetchError } = await supabaseAdmin
      .from('premium_projects')
      .select('id, humanizer_words_used, humanizer_words_limit')
      .eq('id', projectId)
      .single();

    if (fetchError || !project) {
      console.error('Humanizer: DB Fetch Error:', fetchError);
      return NextResponse.json({ error: 'Project data not found.' }, { status: 404 });
    }

    const currentUsed = project.humanizer_words_used || 0;
    const limit = project.humanizer_words_limit || 10000;

    // Check limit
    if (currentUsed + wordCount > limit) {
      return NextResponse.json({ 
        error: `Word limit exceeded. You have ${limit - currentUsed} words remaining, but this request is ${wordCount} words.` 
      }, { status: 403 });
    }

    // 2. IMAGE PROTECTION LOGIC (Robust)
    const protectedImages = [];
    const imageRegex = /!\[.*?\]\(.*?\)/g;
    const processedContent = content.replace(imageRegex, (match) => {
      const tag = ` ###W3_IMG_${protectedImages.length}### `;
      protectedImages.push(match);
      return tag;
    });

    const apiKey = process.env.BYPASSGPT_API_KEY;
    if (!apiKey) throw new Error('BYPASSGPT_API_KEY not found in environment.');

    // 3. START BYPASSGPT TASK
    const response = await fetch("https://www.bypassgpt.ai/api/bypassgpt/v1/generate", {
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

    const data = await response.json();
    if (!response.ok) throw new Error(`BypassGPT API error: ${JSON.stringify(data)}`);

    const taskId = data.task_id || data.id || data.data?.task_id;
    const immediateOutput = data.output || data.text || data.data?.output;

    // 4. PERSIST USAGE IMMEDIATELY (VITAL)
    // We increment early because BypassGPT records the history immediately
    const newUsedValue = currentUsed + wordCount;
    
    const { data: updatedProject, error: updateError } = await supabaseAdmin
      .from('premium_projects')
      .update({
        humanizer_words_used: newUsedValue,
        last_generated_at: new Date().toISOString()
      })
      .eq('id', projectId)
      .select('humanizer_words_used')
      .single();

    if (updateError) {
      console.error('Humanizer: Database Update Error:', updateError);
    } else {
      console.log('Humanizer: DB Updated Successfully to', updatedProject.humanizer_words_used);
    }

    // Restore images if output was immediate
    let finalImmediateOutput = immediateOutput;
    if (immediateOutput && protectedImages.length > 0) {
      protectedImages.forEach((tag, i) => {
        const placeholder = `###W3_IMG_${i}###`;
        finalImmediateOutput = finalImmediateOutput.split(placeholder).join(tag);
      });
    }

    return NextResponse.json({ 
      success: true, 
      taskId, 
      immediateOutput: finalImmediateOutput,
      newUsed: updatedProject?.humanizer_words_used || newUsedValue,
      wordCount,
      protectedImages 
    });

  } catch (error) {
    console.error('Humanizer Initiation Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
