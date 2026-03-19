// src/app/api/premium/humanize/route.js
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function POST(request) {
  try {
    const { content, projectId } = await request.json();

    if (!content || content.length < 5 || !projectId) {
      return NextResponse.json({ error: 'Missing content or project ID.' }, { status: 400 });
    }

    const wordCount = content.trim().split(/\s+/).filter(w => w.length > 0).length;
    
    // 1. Fetch current usage
    const { data: project, error: fetchError } = await supabaseAdmin
      .from('premium_projects')
      .select('id, humanizer_words_used, humanizer_words_limit')
      .eq('id', projectId)
      .single();

    if (fetchError || !project) {
      return NextResponse.json({ error: 'Project data not found.' }, { status: 404 });
    }

    const currentUsed = project.humanizer_words_used || 0;
    const limit = project.humanizer_words_limit || 10000;

    if (currentUsed + wordCount > limit) {
      return NextResponse.json({ 
        error: `Word limit exceeded. You have ${limit - currentUsed} words remaining.` 
      }, { status: 403 });
    }

    const apiKey = process.env.RYNE_API_KEY;
    if (!apiKey) throw new Error('Humanizer API Key (RYNE_API_KEY) missing.');

    // 2. Protect Images
    const protectedImages = [];
    const processedContent = content.replace(/!\[.*?\]\(.*?\)/g, (match) => {
      const tag = ` ###W3_IMG_${protectedImages.length}### `;
      protectedImages.push(match);
      return tag;
    });

    // 3. Call Ryne AI
    const response = await fetch("https://ryne.ai/api/humanizer/models/supernova", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text: processedContent,
        tone: "professional",
        purpose: "academic report",
        language: "english",
        user_id: apiKey,
        shouldStream: false,
      }),
    });

    const data = await response.json();
    if (!response.ok) throw new Error(`Ryne AI Error: ${data.message || response.statusText}`);

    let humanizedText = data.content || data.text;
    if (!humanizedText) throw new Error('Ryne AI returned empty content.');

    // 4. Restore Images
    protectedImages.forEach((tag, i) => {
      humanizedText = humanizedText.split(`###W3_IMG_${i}###`).join(tag);
    });

    // 5. Update Database (Atomic Increment)
    const newUsed = currentUsed + wordCount;
    const { data: updated, error: updateError } = await supabaseAdmin
      .from('premium_projects')
      .update({
        humanizer_words_used: newUsed,
        last_generated_at: new Date().toISOString()
      })
      .eq('id', projectId)
      .select('humanizer_words_used')
      .single();

    if (updateError) console.error('Usage Update Error:', updateError);

    return NextResponse.json({ 
      success: true, 
      humanized: humanizedText, 
      newUsed: updated?.humanizer_words_used || newUsed,
      wordCount
    });

  } catch (error) {
    console.error('Humanizer Logic Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
