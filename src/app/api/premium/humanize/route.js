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
      console.error('Humanizer: DB Fetch Error:', fetchError);
      return NextResponse.json({ error: 'Project data not found.' }, { status: 404 });
    }

    const currentUsed = project.humanizer_words_used || 0;
    const limit = project.humanizer_words_limit || 10000;

    if (currentUsed + wordCount > limit) {
      return NextResponse.json({
        error: `Word limit exceeded. You have ${limit - currentUsed} words remaining, but this request is ${wordCount} words.`
      }, { status: 403 });
    }

    // 2. Protect markdown images
    const protectedImages = [];
    const imageRegex = /!\[.*?\]\(.*?\)/g;
    const processedContent = content.replace(imageRegex, (match) => {
      const tag = ` ###W3_IMG_${protectedImages.length}### `;
      protectedImages.push(match);
      return tag;
    });

    const apiKey = process.env.RYNE_API_KEY;
    if (!apiKey) throw new Error('RYNE_API_KEY not found in environment.');

    // 3. Call Ryne API
    const ryneResponse = await fetch('https://ryne.ai/api/humanizer/models/supernova', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: processedContent,
        tone: 'professional',
        purpose: 'academic writing',
        language: 'english',
        user_id: apiKey,
        shouldStream: false,
      }),
    });

    const ryneData = await ryneResponse.json();
    if (!ryneResponse.ok) throw new Error(`Ryne API error: ${JSON.stringify(ryneData)}`);

    const output = ryneData.content;
    if (!output) throw new Error('Ryne API returned no content.');

    // 4. Restore protected images
    let finalOutput = output;
    if (protectedImages.length > 0) {
      protectedImages.forEach((tag, i) => {
        finalOutput = finalOutput.split(`###W3_IMG_${i}###`).join(tag);
      });
    }

    // 5. Persist usage
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
      console.error('Humanizer: DB Update Error:', updateError);
    }

    return NextResponse.json({
      success: true,
      immediateOutput: finalOutput,
      newUsed: updatedProject?.humanizer_words_used || newUsedValue,
      wordCount,
    });

  } catch (error) {
    console.error('Humanizer Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
