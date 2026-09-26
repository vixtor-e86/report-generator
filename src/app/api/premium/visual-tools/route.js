// src/app/api/premium/visual-tools/route.js
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { callAI } from '@/lib/aiProvider';

export async function POST(request) {
  try {
    const { type, prompt, projectId, userId, isMarketplace } = await request.json();

    if (!type || !prompt || (!isMarketplace && (!projectId || !userId))) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // 1. Token Check (Skip if Marketplace, as it pays via wallet)
    let project = null;
    if (!isMarketplace) {
      const { data: proj, error: projectError } = await supabaseAdmin
        .from('premium_projects')
        .select('tokens_used, tokens_limit')
        .eq('id', projectId)
        .single();

      if (projectError || !proj) {
        return NextResponse.json({ error: 'Project not found' }, { status: 404 });
      }

      if (proj.tokens_used + 1000 > (proj.tokens_limit || 300000)) {
        return NextResponse.json({ 
          error: 'Insufficient tokens. Generating a visual requires 1,000 tokens. Please upgrade your limit.' 
        }, { status: 403 });
      }
      project = proj;
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
        provider: 'claude' // Switched from gemini as requested
      });

      // Clean up response if AI included markdown blocks anyway
      let code = aiResponse.content.trim();
      if (code.startsWith('```')) {
        code = code.replace(/```mermaid/g, '').replace(/```/g, '').trim();
      }

      resultData = { success: true, code };

    } else if (type === 'image') {
      // 3. Generate Image using Together AI with model fallback
      if (!process.env.TOGETHER_API_KEY) {
        return NextResponse.json({ error: 'TOGETHER_API_KEY is not configured' }, { status: 500 });
      }

      const candidateModels = [
        process.env.TOGETHER_IMAGE_MODEL,
        'black-forest-labs/FLUX.1-schnell-Free',
        'black-forest-labs/FLUX.1-schnell',
        'stabilityai/stable-diffusion-xl-base-1.0'
      ].filter(Boolean);

      // Remove duplicates
      const uniqueModels = [...new Set(candidateModels)];
      let lastError = null;
      let base64Image = null;

      for (const model of uniqueModels) {
        try {
          const isSdxl = model.includes('stable-diffusion');
          const payload = {
            model,
            prompt: `High-quality technical illustration for an engineering report: ${prompt}. Professional, clear, 8k resolution, white background, detailed.`,
            width: 1024,
            height: 768,
            steps: isSdxl ? 25 : 4,
            n: 1,
            response_format: 'b64_json'
          };

          const response = await fetch('https://api.together.xyz/v1/images/generations', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${process.env.TOGETHER_API_KEY}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload)
          });

          const data = await response.json();
          if (response.ok && data?.data?.[0]?.b64_json) {
            base64Image = data.data[0].b64_json;
            break;
          } else {
            lastError = data.error?.message || (typeof data.error === 'string' ? data.error : JSON.stringify(data));
            console.warn(`Together AI image model ${model} failed:`, lastError);
          }
        } catch (fetchErr) {
          lastError = fetchErr.message;
        }
      }

      if (!base64Image) {
        return NextResponse.json({ 
          error: lastError || 'Image generation failed. Please verify your Together AI account credits or dedicated endpoint status.' 
        }, { status: 500 });
      }

      resultData = { 
        success: true, 
        imageUrl: `data:image/png;base64,${base64Image}` 
      };

    } else {
      return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
    }

    // 4. Deduct Tokens (Skip if Marketplace)
    if (!isMarketplace && project) {
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
    }

    return NextResponse.json(resultData);

  } catch (error) {
    console.error('Visual Tools Error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
