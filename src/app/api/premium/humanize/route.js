// src/app/api/premium/humanize/route.js
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function POST(request) {
  try {
    const { content, projectId } = await request.json();

    if (!content || content.length < 5 || !projectId) {
      return NextResponse.json({ error: 'Missing content or project ID.' }, { status: 400 });
    }

    // --- 1. WORD COUNT ---
    const wordCount = content.trim().split(/\s+/).length;
    
    // Fetch current state
    const { data: project, error: projectError } = await supabaseAdmin
      .from('premium_projects')
      .select('humanizer_words_used, humanizer_words_limit')
      .eq('id', projectId)
      .single();

    if (projectError || !project) {
      console.error('Humanizer: DB Fetch Error:', projectError);
      return NextResponse.json({ error: 'Project not found.' }, { status: 404 });
    }

    const currentUsed = project.humanizer_words_used || 0;
    const limit = project.humanizer_words_limit || 10000;

    if (currentUsed + wordCount > limit) {
      return NextResponse.json({ 
        error: `Word limit exceeded. You have ${limit - currentUsed} words remaining.` 
      }, { status: 403 });
    }

    // --- 2. IMAGE PROTECTION LOGIC ---
    const protectedImages = [];
    const imageRegex = /!\[.*?\]\(.*?\)/g;
    const processedContent = content.replace(imageRegex, (match) => {
      const tag = ` ###W3_IMG_${protectedImages.length}### `;
      protectedImages.push(match);
      return tag;
    });

    // --- 3. CALL BYPASSGPT.AI ---
    const apiKey = process.env.BYPASSGPT_API_KEY;
    if (!apiKey) throw new Error('BYPASSGPT_API_KEY not found.');

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
    if (!response.ok) throw new Error(`BypassGPT Error: ${JSON.stringify(data)}`);

    const taskId = data.task_id || data.id || data.data?.task_id;
    const immediateOutput = data.output || data.text || data.data?.output;

    // --- 4. PERSIST USAGE IMMEDIATELY ---
    const newUsedValue = currentUsed + wordCount;
    
    console.log(`Humanizer: Updating projectId ${projectId} to ${newUsedValue} words...`);
    
    const { data: updatedData, error: updateError } = await supabaseAdmin
      .from('premium_projects')
      .update({
        humanizer_words_used: newUsedValue,
        last_generated_at: new Date().toISOString()
      })
      .eq('id', projectId)
      .select();

    if (updateError) {
      console.error('CRITICAL: Database Update Failed:', updateError);
    } else {
      console.log('Humanizer: DB Updated Successfully. New Value:', updatedData?.[0]?.humanizer_words_used);
    }

    // Restore images if output was immediate
    let finalImmediateOutput = immediateOutput;
    if (immediateOutput && protectedImages.length > 0) {
      protectedImages.forEach((tag, i) => {
        const placeholder = `###W3_IMG_${i}###`;
        // Using split/join for global replacement regardless of AI formatting
        finalImmediateOutput = finalImmediateOutput.split(placeholder).join(tag);
      });
    }

    return NextResponse.json({ 
      success: true, 
      taskId, 
      immediateOutput: finalImmediateOutput,
      newUsed: newUsedValue, // Send back to frontend for the bar
      protectedImages // For the polling restoration
    });

  } catch (error) {
    console.error('Humanizer Route Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
