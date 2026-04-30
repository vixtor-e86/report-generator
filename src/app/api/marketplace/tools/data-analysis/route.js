import { NextResponse } from 'next/server';
import { callAI } from '@/lib/aiProvider';

export async function POST(request) {
  try {
    const { data, filename, query } = await request.json();

    if (!data || !Array.isArray(data)) {
      return NextResponse.json({ error: 'Valid dataset data is required' }, { status: 400 });
    }

    const systemPrompt = `You are a senior data scientist and research analyst.
    Your task is to perform a comprehensive statistical and qualitative analysis of the provided dataset.
    
    File Name: ${filename || 'Unknown Dataset'}
    Student's Specific Focus (if any): ${query || 'General Analysis'}
    
    Dataset Preview (First 50 rows or headers):
    ${JSON.stringify(data.slice(0, 50), null, 2)}
    
    Instructions:
    1. Perform a Statistical Summary: Calculate Mean, Median, Mode (where applicable), and Range for numerical columns.
    2. Identify Trends & Patterns: Look for correlations, growth, or declines over time or across categories.
    3. Spot Anomalies: Identify outliers or inconsistencies that might need investigation.
    4. Qualitative Interpretation: Explain what these numbers actually mean for a research project.
    5. Actionable Insights: Suggest what the student should focus on in their project discussion.
    
    Structure the response in professional Markdown format with:
    - 📊 **Executive Summary**: A high-level overview of the data.
    - 🔢 **Statistical Snapshot**: Mean, Median, etc. (use tables).
    - 📈 **Key Trends & Correlations**: Detailed analysis of patterns.
    - ⚠️ **Anomalies & Outliers**: Observations on unusual data.
    - 📝 **Report-Ready Conclusion**: A formal paragraph the student can use in their paper.
    
    Rules:
    - Use professional, academic language.
    - Use emojis creatively but maintain a serious research tone.
    - Do not mention any AI provider or specific model names.
    - Focus on being helpful for an academic project.`;

    const aiResponse = await callAI(systemPrompt, {
      provider: 'claude',
      maxTokens: 4000,
      temperature: 0.2 // Low temperature for factual consistency
    });

    return NextResponse.json({ 
      success: true, 
      analysis: aiResponse.content 
    });

  } catch (error) {
    console.error('Data Analysis Error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
