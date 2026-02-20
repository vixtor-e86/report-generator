// src/app/api/premium/visual-tools/route.js
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { callAI } from '@/lib/aiProvider';

export async function POST(request) {
  try {
    const { type, prompt, projectId, userId } = await request.json();

    if (!type || !prompt || !projectId || !userId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // 1. Token Check (1,000 tokens per visual)
    const { data: project, error: projectError } = await supabaseAdmin
      .from('premium_projects')
      .select('tokens_used, tokens_limit')
      .eq('id', projectId)
      .single();

    if (projectError || !project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    if (project.tokens_used + 1000 > (project.tokens_limit || 300000)) {
      return NextResponse.json({ 
        error: 'Insufficient tokens. Generating a visual requires 1,000 tokens. Please upgrade your limit.' 
      }, { status: 403 });
    }

    let resultData = null;

    if (type === 'diagram') {
      // 2. Generate Mermaid code using AI
      const systemPrompt = `You are a technical diagram expert. Generate ONLY the Mermaid.js code for a flowchart or diagram based on the user's request. 
      Do NOT include markdown code blocks (like \`\`\`mermaid). Start directly with the mermaid syntax (e.g., graph TD...).
      Ensure the diagram is logical, professional, and technical.
      User Request: ${prompt}`;

      const aiResponse = await callAI(systemPrompt, {
        temperature: 0.2, // Lower temperature for more consistent code
        provider: 'gemini' // Gemini is good at this
      });

      // Clean up response if AI included markdown blocks anyway
      let code = aiResponse.content.trim();
      if (code.startsWith('```')) {
        code = code.replace(/```mermaid/g, '').replace(/```/g, '').trim();
      }

      resultData = { success: true, code };

    } else if (type === 'image') {
      // 3. Generate Image using Flux.1 (via Together AI)
      if (!process.env.TOGETHER_API_KEY) {
        return NextResponse.json({ error: 'TOGETHER_API_KEY is not configured' }, { status: 500 });
      }

      const response = await fetch('https://api.together.xyz/v1/images/generations', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.TOGETHER_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'black-forest-labs/FLUX.1-schnell',
          prompt: `High-quality technical illustration for an engineering report: ${prompt}. Professional, clear, 8k resolution, white background, detailed.`,
          width: 1024,
          height: 768,
          steps: 4,
          n: 1,
          response_format: 'b64_json'
        })
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('Together AI Error:', data);
        return NextResponse.json({ error: data.error?.message || 'Image generation failed' }, { status: 500 });
      }

      const base64Image = data.data[0].b64_json;
      resultData = { 
        success: true, 
        imageUrl: `data:image/png;base64,${base64Image}` 
      };

    } else {
      return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
    }

    // 4. Deduct Tokens (1,000 tokens)
    const { error: updateError } = await supabaseAdmin
      .from('premium_projects')
      .update({
        tokens_used: (project.tokens_used || 0) + 1000,
        updated_at: new Date().toISOString()
      })
      .eq('id', projectId);

    if (updateError) {
      console.error('Failed to update tokens:', updateError);
    }

    return NextResponse.json(resultData);

  } catch (error) {
    console.error('Visual Tools Error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
