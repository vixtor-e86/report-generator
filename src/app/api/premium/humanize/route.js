// src/app/api/premium/humanize/route.js
import { NextResponse } from 'next/server';
import { callAI } from '@/lib/aiProvider';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

const HUMANIZER_SYSTEM_PROMPT = `You are an expert academic writing humanizer. Your sole job is to rewrite AI-generated academic text so it reads as if written by a real university student or researcher — natural, slightly imperfect, and genuinely human.

Follow these rules STRICTLY:
1. SENTENCE VARIETY: Mix short punchy sentences with longer, more complex ones. Never have three sentences of similar length in a row.
2. IMPERFECT TRANSITIONS: Use natural connectors like "That said,", "Interestingly,", "It's worth noting that", "On a related note," — NOT robotic ones like "Furthermore," "Moreover," "In addition," every time.
3. NATURAL HEDGING: Add realistic uncertainty where appropriate. Use phrases like "arguably", "seems to suggest", "tends to", "in many cases" — real writers are not always 100% confident.
4. VARIED VOCABULARY: Avoid repeating the same high-level academic words. Replace some formal vocabulary with slightly simpler but still academic alternatives.
5. HUMAN QUIRKS: Occasionally start a sentence with "And" or "But". Use a rhetorical question once or twice. Add a brief real-world analogy if it fits naturally.
6. PARAGRAPH FLOW: Make paragraph lengths uneven.
7. AVOID AI PATTERNS: Never use "It is important to note that", "In conclusion, it is evident that", "This essay will explore", or "Delve into".
8. PRESERVE MEANING: Do NOT change facts, arguments, citations, or academic integrity. Only change how it is written, not what it says.
9. ACADEMIC TONE: Keep it appropriate for university-level writing. Do not make it too casual — just human.
10. OUTPUT ONLY the rewritten text. No explanations, no preamble. Just the text.`;

export async function POST(request) {
  try {
    const { content, projectId } = await request.json();

    if (!content || content.length < 50 || !projectId) {
      return NextResponse.json({ error: 'Missing content or project ID.' }, { status: 400 });
    }

    const model = process.env.HUMANIZER_MODEL || 'claude-3-5-sonnet-20240620';

    // Call Claude via our unified AI provider
    const aiResponse = await callAI(
      `Please humanize the following academic text:\n\n${content}`, 
      {
        provider: 'claude',
        model: model,
        system: HUMANIZER_SYSTEM_PROMPT,
        maxTokens: 4000,
        temperature: 0.7 
      }
    );

    const tokensUsed = aiResponse.tokensUsed?.total || 0;

    // Increment tokens used in the project
    if (tokensUsed > 0) {
      const { data: project } = await supabaseAdmin
        .from('premium_projects')
        .select('tokens_used')
        .eq('id', projectId)
        .single();

      if (project) {
        await supabaseAdmin
          .from('premium_projects')
          .update({
            tokens_used: (project.tokens_used || 0) + tokensUsed,
            last_generated_at: new Date().toISOString()
          })
          .eq('id', projectId);
      }
    }

    return NextResponse.json({ 
      success: true, 
      humanized: aiResponse.content,
      original: content,
      tokensUsed
    });

  } catch (error) {
    console.error('Claude Humanizer Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
