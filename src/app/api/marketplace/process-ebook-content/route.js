import { NextResponse } from 'next/server';
import { callAI } from '@/lib/aiProvider';

export async function POST(request) {
  try {
    const { content } = await request.json();

    if (!content || content.length < 500) {
      return NextResponse.json({ error: "Preview content must be at least 500 words (or approx 2000 characters)" }, { status: 400 });
    }

    const prompt = `
      You are an expert technical editor. I will provide you with a preview excerpt from an Ebook.
      Your task is to restructure this content into a clean, professional, and engaging Markdown format for a marketplace listing.
      
      RULES:
      1. Use clean Markdown headers (# ## ###) to organize the content.
      2. Fix any formatting, spelling, or grammatical issues.
      3. Make the content flow logically and professionally.
      4. DO NOT add your own commentary. Return ONLY the restructured Markdown content.
      5. Ensure the tone is academic yet accessible to potential buyers.

      Content to process:
      ${content}
    `;

    const response = await callAI(prompt, {
      provider: 'deepseek',
      temperature: 0.3,
      maxTokens: 3000
    });

    return NextResponse.json({
      processedContent: response.content
    });

  } catch (error) {
    console.error('Ebook content processing error:', error);
    return NextResponse.json({ error: "Something went wrong, please try again later" }, { status: 500 });
  }
}
