// src/app/api/premium/humanize/route.js
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function POST(request) {
  try {
    const { content, projectId } = await request.json();

    // 1. Strict Env Validation
    const limit = parseInt(process.env.HUMANIZER_LIMIT);
    const apiKey = process.env.RYNE_API_KEY;

    if (isNaN(limit)) throw new Error('HUMANIZER_LIMIT missing in .env');
    if (!apiKey) throw new Error('RYNE_API_KEY missing in .env');

    if (!content || !projectId) return NextResponse.json({ error: 'Missing content or projectId' }, { status: 400 });

    const wordCount = content.trim().split(/\s+/).filter(w => w.length > 0).length;
    
    // Fetch Usage
    const { data: project, error: fetchError } = await supabaseAdmin
      .from('premium_projects')
      .select('humanizer_words_used')
      .eq('id', projectId)
      .single();

    if (fetchError || !project) throw new Error('Project not found');

    const currentUsed = project.humanizer_words_used || 0;
    if (currentUsed + wordCount > limit) {
      return NextResponse.json({ error: `Limit reached. ${limit - currentUsed} words remaining.` }, { status: 403 });
    }

    // --- 2. SURGICAL HEADER PROTECTION (IN-PLACE) ---
    const headersMap = [];
    const lines = content.split('\n');
    
    const processedLines = lines.map(line => {
      if (line.trim().startsWith('#')) {
        const placeholder = `[[[W3_HEADER_${headersMap.length}]]]`;
        headersMap.push({ placeholder, original: line });
        return placeholder;
      }
      return line;
    });

    const bodyWithPlaceholders = processedLines.join('\n');

    // --- 3. CALL RYNE AI ---
    const response = await fetch("https://ryne.ai/api/humanizer/models/supernova", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text: bodyWithPlaceholders,
        tone: "professional",
        purpose: "academic report",
        user_id: apiKey,
        shouldStream: false,
      }),
    });

    const data = await response.json();
    if (!response.ok) throw new Error(`Ryne AI: ${data.message || response.statusText}`);

    let humanizedText = data.content || data.text;
    if (!humanizedText) throw new Error('AI returned empty content');

    // --- 4. SURGICAL RESTORATION ---
    // Swap placeholders back for original headers in their EXACT positions
    headersMap.forEach(h => {
      humanizedText = humanizedText.split(h.placeholder).join(h.original);
    });

    // Final cleanup: Ensure no stray placeholders or clumping
    const finalOutput = humanizedText.trim();

    // --- 5. PERSIST USAGE ---
    const newUsed = currentUsed + wordCount;
    await supabaseAdmin
      .from('premium_projects')
      .update({ humanizer_words_used: newUsed })
      .eq('id', projectId);

    return NextResponse.json({ 
      success: true, 
      humanized: finalOutput, 
      newUsed, 
      limit 
    });

  } catch (error) {
    console.error('Humanizer Error:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
