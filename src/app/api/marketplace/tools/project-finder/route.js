import { NextResponse } from 'next/server';
import { callAI } from '@/lib/aiProvider';

export async function POST(request) {
  try {
    const { query, department, level, researchType, industry, existingTopics = [] } = await request.json();

    if (!query) {
      return NextResponse.json({ error: 'Search query or topic interest is required' }, { status: 400 });
    }

    const systemPrompt = `You are an expert academic advisor and research consultant. 
    Your task is to help a student find unique, trending, and highly relevant academic project topics.
    
    The student is interested in: "${query}"
    ${department ? `Department: ${department}` : ''}
    ${level ? `Academic Level: ${level}` : ''}
    ${researchType && researchType !== 'any' ? `Research Methodology: ${researchType}` : ''}
    ${industry ? `Industry/Sector Focus: ${industry}` : ''}
    
    ${existingTopics.length > 0 ? `IMPORTANT: The student has already seen these topics:
    ${existingTopics.join('\n')}
    Please generate 10 NEW and COMPLETELY DIFFERENT topics that provide fresh perspectives and avoid repeating the ones listed above.` : ''}

    Instructions:
    1. Search your knowledge base for the latest trends and "low-hanging fruit" research gaps in this field.
    2. Provide 10 distinct, well-defined project topics.
    3. If a specific Research Methodology is requested (Quantitative, Qualitative, or Mixed), ensure the titles and problem statements reflect that approach.
       - Quantitative: Focus on measurable variables, statistical correlations, and numerical data.
       - Qualitative: Focus on lived experiences, case studies, thematic analysis, and deep interviews.
       - Mixed: Focus on a combination of both for comprehensive understanding.
    4. For EACH topic, include:
       - A catchy and professional Title.
       - A brief "Problem Statement" or "Gap" it addresses.
       - A "Feasibility" score (1-10).
       - Recommended "Key Tools/Technologies" to use.
    5. Use emojis and icons creatively to make the results visually appealing and easy to scan.
    6. Categorize the topics if possible (e.g., AI in Healthcare, Sustainable Energy, etc.).
    7. Ensure the topics are suitable for the student's department, level, and industry if provided.
    
    Structure the response as a valid JSON object with this structure:
    {
      "results": [
        {
          "title": "...",
          "category": "...",
          "problem_gap": "...",
          "feasibility": "...",
          "tools": ["...", "..."],
          "emoji": "..."
        }
      ]
    }
    
    Rules:
    - Be creative and modern. Avoid cliché topics like "Library Management System" unless specifically asked.
    - Focus on current trends like AI integration, sustainability, or niche industry problems.
    - Return ONLY the JSON object. No markdown preamble or postamble.`;

    const aiResponse = await callAI(systemPrompt, {
      provider: 'claude',
      maxTokens: 4000,
      temperature: 0.8
    });

    let data;
    try {
      const jsonString = aiResponse.content.replace(/```json/g, '').replace(/```/g, '').trim();
      data = JSON.parse(jsonString);
    } catch (parseError) {
      console.error('Project Finder Parse Error:', aiResponse.content);
      throw new Error('AI failed to structure the project topics. Please try again.');
    }

    return NextResponse.json({ 
      success: true, 
      data: data.results 
    });

  } catch (error) {
    console.error('Project Finder Error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
