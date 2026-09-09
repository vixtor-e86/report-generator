import { NextResponse } from 'next/server';
import { callAI } from '@/lib/aiProvider';

export async function POST(request) {
  try {
    const { abstract, chapter1 } = await request.json();

    if (!abstract && !chapter1) {
      return NextResponse.json({ error: "Abstract or Chapter 1 is required" }, { status: 400 });
    }

    // Helper to clean markdown fences if model outputs ```markdown ... ```
    const cleanOutput = (text) => {
      if (!text) return '';
      return text
        .replace(/^```(?:markdown)?\s*/i, '')
        .replace(/\s*```$/i, '')
        .trim();
    };

    // Parallel processing tasks
    const refineAbstractTask = async () => {
      if (!abstract || abstract.trim().length < 10) return abstract;
      try {
        const prompt = `
You are an expert technical and academic editor.
Your task is to refine and restructure the following academic project ABSTRACT into clean, professional Markdown.

RULES:
1. Remove any title or header like "Abstract", "Project Abstract", or "Abstract Preview".
2. Present the abstract in 1 to 2 well-structured, cohesive paragraphs with proper academic flow.
3. Clean up any weird line breaks, hyphenations, or double-spaces from PDF/Word extraction.
4. Ensure double newlines between paragraphs.
5. Do NOT include markdown code fences (\`\`\`).
6. Do NOT add notes, explanations, or commentary. Output ONLY the refined abstract text.

Abstract:
${abstract}
`;
        const res = await callAI(prompt, {
          provider: process.env.AI_PROVIDER || 'deepseek',
          temperature: 0.3,
          maxTokens: 2048,
          fallback: true
        });
        return cleanOutput(res?.content) || abstract;
      } catch (err) {
        console.warn('AI abstract refining warning (using fallback):', err.message);
        return abstract;
      }
    };

    const refineChapter1Task = async () => {
      if (!chapter1 || chapter1.trim().length < 10) return chapter1;
      try {
        const prompt = `
You are an expert technical and academic editor.
Your task is to refine and format the following CHAPTER 1 text into clean, structured academic Markdown.

RULES:
1. Remove main title headers like "CHAPTER ONE", "CHAPTER 1", or "CHAPTER 1: INTRODUCTION".
2. Format subsections cleanly with proper Markdown headings (e.g., ## 1.1 Background of the Study, ## 1.2 Statement of the Problem, ## 1.3 Objectives, etc.).
3. Group sentences into well-structured, readable paragraphs. Break any large walls of text into readable paragraphs separated by double newlines (\\n\\n).
4. Use clean bullet points (- ) or numbered lists for research questions, hypotheses, or objectives where appropriate.
5. Fix broken hyphenations or irregular line breaks caused by copy-pasting from PDF/DOCX.
6. Preserve all technical substance, references, and core ideas.
7. Do NOT include markdown code fences (\`\`\`).
8. Do NOT add introductory remarks or conversational commentary. Output ONLY the refined chapter 1 markdown content.

Chapter 1:
${chapter1}
`;
        const res = await callAI(prompt, {
          provider: process.env.AI_PROVIDER || 'deepseek',
          temperature: 0.3,
          maxTokens: 8192,
          fallback: true
        });
        return cleanOutput(res?.content) || chapter1;
      } catch (err) {
        console.warn('AI chapter 1 refining warning (using fallback):', err.message);
        return chapter1;
      }
    };

    const [refinedAbstract, refinedChapter1] = await Promise.all([
      refineAbstractTask(),
      refineChapter1Task()
    ]);

    return NextResponse.json({
      success: true,
      abstract: refinedAbstract,
      chapter1: refinedChapter1
    });

  } catch (error) {
    console.error('Content processing error:', error);
    return NextResponse.json({ 
      error: error.message || "Failed to process content" 
    }, { status: 500 });
  }
}
