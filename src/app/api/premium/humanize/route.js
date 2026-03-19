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
        error: `Word limit exceeded. You have ${limit - currentUsed} words remaining.` 
      }, { status: 403 });
    }

    // --- 2. STRUCTURAL PROTECTION LOGIC (Headers & Images) ---
    const protectedElements = [];
    
    // Step A: Protect Markdown Headers (e.g., ## 1.1 Introduction)
    // We use a specific regex to catch headers and store them word-for-word
    const headerRegex = /^#+ .*/gm;
    let processedContent = content.replace(headerRegex, (match) => {
      const tag = ` ###W3_HEADER_${protectedElements.length}### `;
      protectedElements.push({ tag, content: match });
      return tag;
    });

    // Step B: Protect Markdown Images
    const imageRegex = /!\[.*?\]\(.*?\)/g;
    processedContent = processedContent.replace(imageRegex, (match) => {
      const tag = ` ###W3_IMG_${protectedElements.length}### `;
      protectedElements.push({ tag, content: match });
      return tag;
    });

    const apiKey = process.env.RYNE_API_KEY;
    if (!apiKey) throw new Error('Humanizer API Key (RYNE_API_KEY) missing.');

    // --- 3. CALL RYNE AI (Supernova Model) ---
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

    // --- 4. RESTORE PROTECTED ELEMENTS (Headers & Images) ---
    protectedElements.forEach((el) => {
      // Split and join is more robust than string.replace for technical tags
      humanizedText = humanizedText.split(el.tag.trim()).join(el.content);
      // Also try with spaces just in case AI added them
      humanizedText = humanizedText.split(el.tag).join(el.content);
    });

    // --- 5. PERSIST USAGE ---
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
