import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { text, language = 'auto' } = await request.json();

    if (!text || text.length < 100) {
      return NextResponse.json({ error: 'Content must be at least 100 characters long.' }, { status: 400 });
    }

    const WINSTON_API_KEY = (process.env.WINSTON_API_KEY || '').trim().replace(/^["'](.+)["']$/, '$1');

    if (!WINSTON_API_KEY) {
      console.error('WINSTON_API_KEY is missing or empty in environment variables');
      return NextResponse.json({ error: 'Plagiarism service not configured on server.' }, { status: 500 });
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

    const responseText = await response.text();
    let data;
    try {
        data = JSON.parse(responseText);
    } catch (e) {
        console.error('Winston AI Parse Error (Status ' + response.status + '):', responseText);
        return NextResponse.json({ error: `Upstream service error (${response.status})` }, { status: response.status });
    }

    if (!response.ok) {
      console.error('Winston AI Error Response:', data);
      
      // Generic maintenance message for upstream errors (403 usually means quota/auth, but user wants it hidden)
      return NextResponse.json({ 
        error: 'Plagiarism engine is currently under maintenance. Please try again later.' 
      }, { status: response.status });
    }

    return NextResponse.json({ 
      success: true, 
      data: {
        score: data.score || 0,
        total_words: data.total_words || 0,
        sources: Array.isArray(data.sources) ? data.sources : [],
        credits_used: data.credits_used || 0
      }
    });

  } catch (error) {
    console.error('Plagiarism Checker Route Exception:', error);
    return NextResponse.json({ 
      error: 'System under maintenance. Our engineers are working on it, please try again later.' 
    }, { status: 500 });
  }
}
