import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { text, language = 'en' } = await request.json();

    if (!text) {
      return NextResponse.json({ error: 'Text content is required' }, { status: 400 });
    }

    const WINSTON_API_KEY = process.env.WINSTON_API_KEY;

    if (!WINSTON_API_KEY) {
      console.error('WINSTON_API_KEY is missing in environment variables');
      return NextResponse.json({ error: 'System configuration error. Please contact support.' }, { status: 500 });
    }

    // Winston AI Plagiarism Endpoint
    const response = await fetch('https://api.gowinston.ai/v2/plagiarism', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${WINSTON_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        text,
        language
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Winston AI Error:', data);
      return NextResponse.json({ error: data.message || 'Plagiarism scan failed' }, { status: response.status });
    }

    return NextResponse.json({ 
      success: true, 
      data: {
        score: data.score, // Similarity score percentage
        total_words: data.total_words,
        sources: data.sources || [], // Array of matching sources
        credits_used: data.credits_used
      }
    });

  } catch (error) {
    console.error('Plagiarism Checker Error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
