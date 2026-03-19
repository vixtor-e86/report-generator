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
      .select('id, humanizer_words_used')
      .eq('id', projectId)
      .single();

    if (fetchError || !project) {
      return NextResponse.json({ error: 'Project not found.' }, { status: 404 });
    }

    const currentUsed = project.humanizer_words_used || 0;
    // PRIORITY: Read from .env
    const limit = parseInt(process.env.HUMANIZER_LIMIT || '10000', 10);

    if (currentUsed + wordCount > limit) {
      return NextResponse.json({ 
        error: `Limit reached. You have ${limit - currentUsed} words remaining.` 
      }, { status: 403 });
    }

    // --- 2. HEADER PROTECTION ---
    const protectedLines = [];
    const lines = content.split('\n');
    const bodyLines = lines.filter(line => {
      if (line.trim().startsWith('#')) {
        protectedLines.push(line);
        return false;
      }
      return true;
    });
    const bodyToHumanize = bodyLines.join('\n').trim();

    const apiKey = process.env.RYNE_API_KEY;
    if (!apiKey) throw new Error('Humanizer API Key missing.');

    // --- 3. CALL RYNE AI ---
    let humanizedText = "";
    if (bodyToHumanize.length > 5) {
      const response = await fetch("https://ryne.ai/api/humanizer/models/supernova", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: bodyToHumanize,
          tone: "professional",
          purpose: "academic report",
          language: "english",
          user_id: apiKey,
          shouldStream: false,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(`Ryne AI Error: ${data.message || response.statusText}`);
      humanizedText = data.content || data.text;
    } else {
      humanizedText = bodyToHumanize;
    }

    const finalOutput = [...protectedLines, "", humanizedText].join('\n').trim();

    // --- 4. PERSIST USAGE ---
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

    return NextResponse.json({ 
      success: true, 
      humanized: finalOutput, 
      newUsed: updated?.humanizer_words_used || newUsed,
      wordCount,
      limit // CRITICAL: Return the .env limit so frontend updates its bar
    });

  } catch (error) {
    console.error('Humanizer Logic Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
