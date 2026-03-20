// src/app/api/premium/humanize/route.js
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function POST(request) {
  try {
    const { content, projectId } = await request.json();

    // 1. STRICT ENV VALIDATION (NO DEFAULTS)
    const limit = parseInt(process.env.HUMANIZER_LIMIT);
    const apiKey = process.env.RYNE_API_KEY;

    if (isNaN(limit)) {
      throw new Error('CRITICAL CONFIG ERROR: HUMANIZER_LIMIT is missing or invalid in server environment.');
    }
    if (!apiKey) {
      throw new Error('CRITICAL CONFIG ERROR: RYNE_API_KEY is missing in server environment.');
    }

    if (!content || !projectId) {
      return NextResponse.json({ error: 'Missing required parameters: content or projectId' }, { status: 400 });
    }

    const wordCount = content.trim().split(/\s+/).filter(w => w.length > 0).length;
    
    // 2. Fetch Words Used from Database
    const { data: project, error: fetchError } = await supabaseAdmin
      .from('premium_projects')
      .select('humanizer_words_used')
      .eq('id', projectId)
      .single();

    if (fetchError || !project) throw new Error('Could not find project usage records.');

    const currentUsed = project.humanizer_words_used || 0;

    if (currentUsed + wordCount > limit) {
      return NextResponse.json({ 
        error: `Account Limit reached. You have ${limit - currentUsed} words remaining in this project.` 
      }, { status: 403 });
    }

    // --- 3. HEADER PROTECTION ---
    const protectedHeaders = [];
    const bodyLines = content.split('\n').filter(line => {
      if (line.trim().startsWith('#')) {
        protectedHeaders.push(line);
        return false;
      }
      return true;
    });
    const bodyText = bodyLines.join('\n').trim();

    // --- 4. CALL RYNE AI ---
    let humanized = "";
    if (bodyText.length > 5) {
      const response = await fetch("https://ryne.ai/api/humanizer/models/supernova", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: bodyText,
          tone: "professional",
          purpose: "academic report",
          user_id: apiKey,
          shouldStream: false,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(`Ryne AI Response: ${data.message || response.statusText}`);
      humanized = data.content || data.text;
    } else {
      humanized = bodyText;
    }
    
    // Stitch headers back
    const finalOutput = [...protectedHeaders, "", humanized].join('\n').trim();

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
    console.error('Humanizer API Route Error:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
