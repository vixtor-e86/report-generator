import { NextResponse } from 'next/server';
import { callAI } from '@/lib/aiProvider';

export async function POST(request) {
  try {
    const { topic, objectives, targetAudience, scaleType, industry } = await request.json();

    if (!topic) {
      return NextResponse.json({ error: 'Project topic is required' }, { status: 400 });
    }

    const systemPrompt = `You are an expert research methodologist and survey designer. 
    Your task is to generate a professional, high-quality research questionnaire or survey instrument.
    
    Research Topic: "${topic}"
    ${objectives ? `Research Objectives: ${objectives}` : ''}
    ${targetAudience ? `Target Audience: ${targetAudience}` : ''}
    ${industry ? `Industry/Field: ${industry}` : ''}
    ${scaleType ? `Measurement Scale: ${scaleType}` : 'Likert 5-point scale'}
    
    Instructions:
    1. Start with a professional "Introduction and Informed Consent" section.
    2. Include a "Section A: Demographic Information" with relevant questions (Age, Gender, Experience, etc.).
    3. Include "Section B: Research Variables/Themes" with 15-20 well-structured questions designed to answer the research topic.
    4. Group questions logically by themes or variables.
    5. Use clear, unambiguous, and professional academic language.
    6. Ensure the questions are relevant to the requested industry/field if provided.
    
    Output Format:
    - Return the result in a clean Markdown-like format that is easy to read.
    - Use headers (e.g., # SECTION A) and bullet points or numbered lists.
    - Do not include any JSON or technical code in the final result.
    - Return ONLY the questionnaire text.
    
    Rules:
    - Avoid leading or biased questions.
    - Ensure a mix of positively and negatively worded statements if appropriate.
    - Tailor the language to the specified target audience.`;

    const aiResponse = await callAI(systemPrompt, {
      provider: 'claude',
      maxTokens: 4000,
      temperature: 0.7
    });

    return NextResponse.json({ 
      success: true, 
      questionnaire: aiResponse.content 
    });

  } catch (error) {
    console.error('Questionnaire Generator Error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
