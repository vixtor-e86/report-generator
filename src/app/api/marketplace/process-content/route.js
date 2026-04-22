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
      2. Use clean Markdown for subsections if necessary.
      3. The abstract should be restructured to be concise yet informative.
      4. Chapter 1 should be cleaned up for better readability, fixing any formatting issues.
      5. DO NOT add your own commentary. Return ONLY the restructured content.
      6. Return a JSON object with two fields: "processedAbstract" and "processedChapter1".

      Abstract to process:
      ${abstract}

      Chapter 1 to process:
      ${chapter1}
      
      Respond only with a valid JSON object.
    `;

    const response = await callAI(prompt, {
      provider: 'deepseek',
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
