import { NextResponse } from 'next/server';
import { callAI } from '@/lib/aiProvider';

export async function POST(request) {
  try {
    const { code, language } = await request.json();

    if (!code) {
      return NextResponse.json({ error: 'Code snippet is required' }, { status: 400 });
    }

    // Limit check (roughly 500 lines)
    const lineCount = code.split('\n').length;
    if (lineCount > 600) { // Slight buffer
      return NextResponse.json({ error: 'Code exceeds the 500-line limit.' }, { status: 400 });
    }

    const systemPrompt = `You are an elite software architect and technical educator. 
    Your task is to provide a comprehensive, clear, and engaging explanation of the provided code snippet.
    
    Code Language: ${language || 'Auto-detect'}
    
    Instructions:
    1. Analyze the logic, data flow, and architectural patterns in the code.
    2. Provide a high-level summary of what the code does.
    3. Break down the code into logical sections or functions and explain each line or block.
    4. Highlight any potential bugs, optimization opportunities, or best practices.
    5. Use creative emojis and icons to make the explanation visually appealing and easy to read.
    6. Ensure the tone is professional yet accessible for a student.
    
    Structure the response in professional Markdown format with:
    - 📌 **Overview**: A brief summary.
    - 📂 **Architecture & Logic**: High-level structure.
    - 🔍 **Line-by-Line Breakdown**: Detailed explanation with emojis.
    - ⚡ **Optimization & Tips**: Suggestions for improvement.
    - 🛠️ **Technologies Used**: Brief list of libraries/frameworks identified.
    
    Rules:
    - Be detailed but concise.
    - Use emojis at the start of key bullet points.
    - Do not just repeat the code; explain the *why* and *how*.`;

    const aiResponse = await callAI(systemPrompt + `\n\nCODE TO EXPLAIN:\n\`\`\`${language}\n${code}\n\`\`\``, {
      provider: 'claude',
      maxTokens: 4000,
      temperature: 0.3 // Lower temperature for technical accuracy
    });

    return NextResponse.json({ 
      success: true, 
      explanation: aiResponse.content 
    });

  } catch (error) {
    console.error('Code Explainer Error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
