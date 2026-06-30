import { NextResponse } from 'next/server';
import { callAI } from '@/lib/aiProvider';

export async function POST(request) {
  try {
    const { abstract, chapter1 } = await request.json();

    if (!abstract || !chapter1) {
      return NextResponse.json({ error: "Abstract and Chapter 1 are required" }, { status: 400 });
    }

    const prompt = `
      You are an expert technical editor. I will provide you with an academic project's Abstract and Chapter 1 preview.
      Your task is to restructure them into a clean, professional Markdown format.
      
      RULES:
      1. Remove any main headings like "Abstract", "Abstract Preview", "Chapter One", "Chapter 1: Introduction", etc.
      2. Group sentences into well-structured, logical paragraphs. Break any large walls of text into smaller, readable paragraphs.
      3. Clean up any weird line breaks, hyphenations, or double-spaces caused by PDF or Word document text extraction.
      4. Ensure paragraphs are separated by exactly two newlines (\\n\\n) so they render beautifully in markdown.
      5. Use clean Markdown for subsections or bullet points where appropriate (e.g. for objectives or scope).
      6. The abstract should be restructured to be concise yet informative, presented in 1-2 clean paragraphs.
      7. Chapter 1 should be restructured for maximum readability with proper logical paragraph flow.
      8. DO NOT add your own commentary or wrap the fields in markdown code blocks inside the JSON.
      9. Return a JSON object with two fields: "processedAbstract" and "processedChapter1".

      Abstract to process:
      ${abstract}

      Chapter 1 to process:
      ${chapter1}
      
      Respond only with a valid JSON object.
    `;

    const response = await callAI(prompt, {
      provider: process.env.AI_PROVIDER || 'gemini',
      temperature: 0.3,
      maxTokens: 3000
    });

    let processedData;
    try {
      // Find JSON if AI wraps it in code blocks
      const jsonMatch = response.content.match(/\{[\s\S]*\}/);
      const jsonString = jsonMatch ? jsonMatch[0] : response.content;
      processedData = JSON.parse(jsonString);
    } catch (parseError) {
      console.error("Failed to parse AI response as JSON:", response.content);
      // Fallback: If JSON parsing fails, we try to split by a delimiter or just return original
      // but the user wants restructuring, so we should try to be strict.
      throw new Error("AI returned an invalid format");
    }

    return NextResponse.json({
      abstract: processedData.processedAbstract || abstract,
      chapter1: processedData.processedChapter1 || chapter1
    });

  } catch (error) {
    console.error('Content processing error:', error);
    return NextResponse.json({ error: "Something went wrong, please try again later" }, { status: 500 });
  }
}
