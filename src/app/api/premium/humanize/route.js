// src/app/api/premium/humanize/route.js
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function POST(request) {
  try {
    const { content, projectId } = await request.json();

    // 1. Env Validation
    const limit = parseInt(process.env.HUMANIZER_LIMIT);
    const apiKey = process.env.STEALTHGPT_API_KEY; 
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
        
        const headerText = trimmedLine.replace(/^#+\s*/, '').trim().toLowerCase();
        const headerLevel = (trimmedLine.match(/^#+/) || ['#'])[0].length;
        
        const refIndicators = [
          'references', 'bibliography', 'works cited', 'reference list', 
          'list of references', 'selected bibliography', 'sources',
          'academic references', 'technical references', 'reference'
        ];
        
        if (refIndicators.some(indicator => headerText.includes(indicator))) {
          isReferenceSection = true;
        } else if (headerLevel <= 2) {
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

    // Calculate word count
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

    // --- 3. PARALLEL HUMANIZATION WITH STEALTHGPT (CORRECTED) ---
    const humanizeBlock = async (text) => {
      if (text.trim().length < 5) return text;

      try {
        const response = await fetch("https://stealthgpt.ai/api/stealthify", {
          method: "POST",
          headers: { 
            "Content-Type": "application/json",
            "api-token": apiKey // Documentation says api-token
          },
          body: JSON.stringify({
            prompt: text,
            rephrase: true,
            tone: "College", // Standard, HighSchool, College, PhD
            mode: "quality"
          }),
        });

        const data = await response.json();
        if (!response.ok) {
            console.error("StealthGPT Error response:", data);
            return text;
        }

        // StealthGPT returns { result: "..." }
        let result = data.result || text;
        
        // Manual currency fail-safe
        return result.replace(/\$/g, '₦');
      } catch (e) {
        console.error("StealthGPT Fetch Error:", e);
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
