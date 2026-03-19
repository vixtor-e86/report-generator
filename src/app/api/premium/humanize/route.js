// src/app/api/premium/humanize/route.js
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function POST(request) {
  try {
    const { content, projectId } = await request.json();

    // 1. Strict Env Validation
    const limit = parseInt(process.env.HUMANIZER_LIMIT);
    const apiKey = process.env.RYNE_API_KEY;

    if (isNaN(limit)) throw new Error('CRITICAL: HUMANIZER_LIMIT is missing or invalid in .env');
    if (!apiKey) throw new Error('CRITICAL: RYNE_API_KEY is missing in .env');

    if (!content || !projectId) return NextResponse.json({ error: 'Missing content or projectId' }, { status: 400 });

    const wordCount = content.trim().split(/\s+/).filter(w => w.length > 0).length;
    
    // 2. Fetch current usage (We'll also use this to ensure the project exists)
    const { data: project, error: fetchError } = await supabaseAdmin
      .from('premium_projects')
      .select('humanizer_words_used')
      .eq('id', projectId)
      .single();

    if (fetchError || !project) throw new Error('Project not found');

    const currentUsed = project.humanizer_words_used || 0;

    if (currentUsed + wordCount > limit) {
      return NextResponse.json({ error: `Limit reached. ${limit - currentUsed} words left.` }, { status: 403 });
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
      if (!response.ok) throw new Error(`Ryne AI: ${data.message || response.statusText}`);
      humanized = data.content || data.text;
    } else {
      humanized = bodyText;
    }
    
    // Re-stitch headers
    const finalOutput = [...protectedHeaders, "", humanized].join('\n').trim();

    // --- 5. PERSIST USAGE & SYNC LIMIT (CRITICAL) ---
    // We update BOTH used and limit columns so that Sidebar.js always has the fresh Vercel value
    const newUsed = currentUsed + wordCount;
    
    console.log(`METER SYNC: Project ${projectId} -> used: ${newUsed}, limit: ${limit}`);

    await supabaseAdmin
      .from('premium_projects')
      .update({ 
        humanizer_words_used: newUsed,
        humanizer_words_limit: limit // FORCE SYNC VERCEL LIMIT TO DB
      })
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
