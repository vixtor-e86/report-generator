import { NextResponse } from 'next/server';
import { callAI } from '@/lib/aiProvider';

export async function POST(request) {
  try {
    const { text, targetLanguage, mode } = await request.json();

    if (!text) {
      return NextResponse.json({ error: 'Text input is required' }, { status: 400 });
    }

    if (!targetLanguage) {
      return NextResponse.json({ error: 'Target language is required' }, { status: 400 });
    }

    // Limit check (roughly 2000 words)
    const wordCount = text.trim().split(/\s+/).length;
    if (wordCount > 2200) { // Slight buffer
      return NextResponse.json({ error: 'Text exceeds the 2000-word limit.' }, { status: 400 });
    }

    const systemPrompt = `You are a professional polyglot translator and cultural communication expert. 
    Your task is to convert the provided text into the target language while maintaining the original tone, context, and nuance.
    
    Target Language: ${targetLanguage}
    Conversion Mode: ${mode || 'Standard Translation'}
    
    Instructions:
    1. If the target language is a Nigerian language (Yoruba, Igbo, Hausa) or Nigerian Pidgin, ensure the cultural nuances and local idioms are handled perfectly.
    2. Maintain the formatting (paragraphs, lists, etc.) of the original text.
    3. If the mode is "Creative/Casual", feel free to use more expressive language. If "Professional/Academic", use formal vocabulary.
    4. Provide the result in a clear, easy-to-read format.
    
    Rules:
    - Return ONLY the converted text. 
    - No preamble (e.g., "Sure, here is your translation...") or postamble.
    - If the source and target languages are the same, refine the grammar and style instead.`;

    const aiResponse = await callAI(systemPrompt + `\n\nTEXT TO CONVERT:\n${text}`, {
      provider: 'claude',
      maxTokens: 4000,
      temperature: 0.5
    });

    return NextResponse.json({ 
      success: true, 
      convertedText: aiResponse.content 
    });

  } catch (error) {
    console.error('Language Converter Error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
