// src/app/api/premium/humanize/route.js
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function POST(request) {
  try {
    const { content, projectId } = await request.json();

    // 1. Env Validation
    const limit = parseInt(process.env.HUMANIZER_LIMIT);
    const apiKey = process.env.RYNE_API_KEY;
    if (isNaN(limit) || !apiKey) throw new Error('Server configuration error (Limit/API Key).');

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

    // --- 2. SEQUENTIAL STRUCTURAL PARSING ---
    // We split the content into blocks. Headers are preserved, Body blocks are humanized.
    const lines = content.split('\n');
    const blocks = [];
    let currentBody = [];

    lines.forEach((line) => {
      if (line.trim().startsWith('#')) {
        // If we were collecting body text, push it as a block first
        if (currentBody.length > 0) {
          blocks.push({ type: 'body', content: currentBody.join('\n') });
          currentBody = [];
        }
        // Push the header block
        blocks.push({ type: 'header', content: line });
      } else {
        currentBody.push(line);
      }
    });
    // Push final body block if exists
    if (currentBody.length > 0) {
      blocks.push({ type: 'body', content: currentBody.join('\n') });
    }

    // --- 3. PARALLEL HUMANIZATION (BODY BLOCKS ONLY) ---
    const humanizeBlock = async (text) => {
      if (text.trim().length < 10) return text; // Skip tiny fragments

      try {
        const response = await fetch("https://ryne.ai/api/humanizer/models/supernova", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            // Wrap in a technical instruction to ensure tone and currency
            text: `Instruction: Rewrite the following technical text to sound professional and human-written. STRICT RULE: Use Nigerian Naira (₦) for all pricing. 
            
            Content: ${text}`,
            tone: "professional",
            purpose: "academic report",
            user_id: apiKey,
            shouldStream: false,
          }),
        });

        const data = await response.json();
        if (!response.ok) return text; // Fallback to original on error

        let result = data.content || data.text || text;
        
        // Final cleaning: Ryne sometimes adds "Here is the rewrite:"
        result = result.replace(/^(Here is the rewrite:|Rewritten content:|Sure, here is the text:)/i, '').trim();
        
        // Manual currency fail-safe
        return result.replace(/\$/g, '₦');
      } catch (e) {
        return text;
      }
    };

    // Execute all body blocks in parallel
    const processedBlocks = await Promise.all(
      blocks.map(async (block) => {
        if (block.type === 'body') {
          return await humanizeBlock(block.content);
        }
        return block.content; // Return headers exactly as they are
      })
    );

    // --- 4. REASSEMBLE CHAPTER ---
    const finalOutput = processedBlocks.join('\n').trim();

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
