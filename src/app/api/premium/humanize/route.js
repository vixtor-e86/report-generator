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

    // --- 2. SEQUENTIAL STRUCTURAL PARSING ---
    const lines = content.split('\n');
    const blocks = [];
    let currentBody = [];
    let isReferenceSection = false;

    lines.forEach((line) => {
      const trimmedLine = line.trim();
      if (trimmedLine.startsWith('#')) {
        if (currentBody.length > 0) {
          blocks.push({ 
            type: isReferenceSection ? 'reference' : 'body', 
            content: currentBody.join('\n') 
          });
          currentBody = [];
        }
        
        // Detect references section header (skip humanization for everything under it)
        const headerText = trimmedLine.replace(/^#+\s*/, '').trim().toLowerCase();
        const headerLevel = (trimmedLine.match(/^#+/) || ['#'])[0].length;
        
        // Expanded list of reference indicators
        const refIndicators = [
          'references', 'bibliography', 'works cited', 'reference list', 
          'list of references', 'selected bibliography', 'sources',
          'academic references', 'technical references', 'reference'
        ];
        
        if (refIndicators.some(indicator => headerText.includes(indicator))) {
          isReferenceSection = true;
        } else if (headerLevel <= 2) {
          // Reset reference flag for new major chapters/sections
          isReferenceSection = false;
        }
        
        blocks.push({ type: 'header', content: line });
      } else {
        currentBody.push(line);
      }
    });
    
    if (currentBody.length > 0) {
      blocks.push({ 
        type: isReferenceSection ? 'reference' : 'body', 
        content: currentBody.join('\n') 
      });
    }

    // Calculate word count for limit check (only humanizable blocks)
    let wordCount = 0;
    blocks.forEach(block => {
      if (block.type === 'body') {
        const count = block.content.trim().split(/\s+/).filter(w => w.length > 0).length;
        wordCount += count;
      }
    });
    
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

    // --- 3. PARALLEL HUMANIZATION ---
    const humanizeBlock = async (text) => {
      if (text.trim().length < 5) return text;

      try {
        const response = await fetch("https://ryne.ai/api/humanizer/models/supernova", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            // Send text CLEANLY without "Instruction:" prefix to prevent the AI from repeating it
            text: text,
            tone: "professional",
            // Move structural instructions here
            purpose: "academic technical report. IMPORTANT: Use Nigerian Naira (₦) for all currency mentioned.",
            user_id: apiKey,
            shouldStream: false,
          }),
        });

        const data = await response.json();
        if (!response.ok) return text;

        let result = data.content || data.text || text;
        
        // CLEANUP: Aggressively remove any AI conversational filler or repeated prompts
        // This removes phrases like "Here is the rewrite:", "Sure, here is the text:", etc.
        result = result.replace(/^(Here is the rewrite:|Rewritten content:|Sure, here is the text:|Rewritten text:|Output:|Analysis:)/i, '').trim();
        
        // Remove common intro sentences if AI repeats the instruction
        result = result.replace(/^.*?(sound professional and human-written|Nigerian Naira|academic report).*?(\n|$)/si, '').trim();
        
        // Manual currency fail-safe (Mandatory for Nigerian localization)
        return result.replace(/\$/g, '₦');
      } catch (e) {
        return text;
      }
    };

    const processedBlocks = await Promise.all(
      blocks.map(async (block) => {
        if (block.type === 'body') {
          return await humanizeBlock(block.content);
        }
        return block.content;
      })
    );

    // --- 4. REASSEMBLE ---
    const finalOutput = processedBlocks.join('\n').trim();

    // --- 5. PERSIST ---
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
    console.error('System API Error:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
