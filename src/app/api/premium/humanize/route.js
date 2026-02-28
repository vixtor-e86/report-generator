// src/app/api/premium/humanize/route.js
import { NextResponse } from 'next/server';
import { callAI } from '@/lib/aiProvider';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

const HUMANIZER_SYSTEM_PROMPT = `You are an expert academic writing humanizer. Your sole job is to rewrite AI-generated academic text so it reads as if written by a real university student or researcher — natural, slightly imperfect, and genuinely human.

STRICT RULE ON PLACEHOLDERS:
You will see tags like {{IMAGE_PLACEHOLDER_0}}, {{IMAGE_PLACEHOLDER_1}}, etc. 
MANDATORY: You MUST keep these tags in the text. Do not remove them, do not change them, and do not translate them. Place them in the natural flow of your rewritten paragraphs where they make sense.

Follow these rules STRICTLY:
1. SENTENCE VARIETY: Mix short punchy sentences with longer, more complex ones.
2. IMPERFECT TRANSITIONS: Use natural connectors like "That said,", "Interestingly,", "It's worth noting that".
3. NATURAL HEDGING: Add realistic uncertainty where appropriate. 
4. VARIED VOCABULARY: Avoid repeating the same high-level academic words.
5. HUMAN QUIRKS: Occasionally start a sentence with "And" or "But".
6. PARAGRAPH FLOW: Make paragraph lengths uneven.
7. AVOID AI PATTERNS: Never use "It is important to note that", "In conclusion, it is evident that".
8. PRESERVE MEANING: Do NOT change facts or citations.
9. ACADEMIC TONE: Keep it appropriate for university-level writing.
10. OUTPUT ONLY the rewritten text. No preamble.`;

export async function POST(request) {
  try {
    const { content, projectId } = await request.json();

    if (!content || content.length < 50 || !projectId) {
      return NextResponse.json({ error: 'Missing content or project ID.' }, { status: 400 });
    }

    // --- 1. IMAGE PROTECTION LOGIC ---
    const images = [];
    const imageRegex = /!\[.*?\]\(.*?\)/g;
    
    // Replace all image tags with placeholders so Claude doesn't "eat" the URLs
    const processedContent = content.replace(imageRegex, (match) => {
      const placeholder = `{{IMAGE_PLACEHOLDER_${images.length}}}`;
      images.push(match);
      return placeholder;
    });

    const model = process.env.HUMANIZER_MODEL || 'claude-3-5-sonnet-20240620';

    // --- 2. CALL CLAUDE ---
    const aiResponse = await callAI(
      `Please humanize the following academic text:\n\n${processedContent}`, 
      {
        provider: 'claude',
        model: model,
        system: HUMANIZER_SYSTEM_PROMPT,
        maxTokens: 4000,
        temperature: 0.7 
      }
    );

    // --- 3. IMMEDIATE TOKEN INCREMENT ---
    const tokensUsed = aiResponse.tokensUsed?.total || 0;
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

    // --- 4. RESTORE IMAGES ---
    let humanizedText = aiResponse.content;
    images.forEach((originalTag, index) => {
      const placeholder = `{{IMAGE_PLACEHOLDER_${index}}}`;
      humanizedText = humanizedText.replace(placeholder, originalTag);
    });

    // Final safety: if AI lost placeholders, append images at end (rare but safe)
    if (images.length > 0 && !humanizedText.includes('![')) {
        humanizedText += "\n\n" + images.join('\n\n');
    }

    return NextResponse.json({ 
      success: true, 
      humanized: humanizedText,
      original: content,
      tokensUsed
    });

  } catch (error) {
    console.error('Claude Humanizer Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
