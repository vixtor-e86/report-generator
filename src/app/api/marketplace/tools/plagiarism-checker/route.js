import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { text } = await request.json();

    if (!text || text.trim().length < 100) {
      return NextResponse.json({ error: 'Content must be at least 100 characters long.' }, { status: 400 });
    }

    const COPYSCAPE_USERNAME = (process.env.COPYSCAPE_USERNAME || '').trim().replace(/^["'](.+)["']$/, '$1');
    const COPYSCAPE_API_KEY = (process.env.COPYSCAPE_API_KEY || '').trim().replace(/^["'](.+)["']$/, '$1');

    if (!COPYSCAPE_USERNAME || !COPYSCAPE_API_KEY) {
      console.error('Copyscape credentials missing in environment variables');
      return NextResponse.json({ error: 'Plagiarism service not configured on server.' }, { status: 500 });
    }

    // Calculate word count
    const totalWords = text.trim().split(/\s+/).length;

    // Call Copyscape API
    // We send a POST request with u, k, o=tsearch, f=json in query string
    // and raw text as request body (Raw POST)
    const url = `https://www.copyscape.com/api/?u=${encodeURIComponent(COPYSCAPE_USERNAME)}&k=${encodeURIComponent(COPYSCAPE_API_KEY)}&o=tsearch&f=json`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain; charset=utf-8'
      },
      body: text
    });

    const responseText = await response.text();
    let data;
    try {
      data = JSON.parse(responseText);
    } catch (e) {
      console.error('Copyscape API Parse Error (Status ' + response.status + '):', responseText);
      return NextResponse.json({ error: 'Failed to parse Copyscape response.' }, { status: 502 });
    }

    if (!response.ok || data.error) {
      console.error('Copyscape API Error:', data.error || responseText);
      // Account for credit issue, invalid key, etc.
      if (data.error && data.error.toLowerCase().includes('credit')) {
        return NextResponse.json({ error: 'Insufficient Copyscape API credits.' }, { status: 402 });
      }
      return NextResponse.json({ error: data.error || 'Copyscape scan failed.' }, { status: response.status || 500 });
    }

    // Process Copyscape matches
    const rawMatches = Array.isArray(data.results) ? data.results : [];
    
    // Map matches to format expected by the frontend:
    // source.score, source.url, source.title, source.snippet
    const sources = rawMatches.map(match => {
      const matchWords = match.min_match_words || 0;
      // Calculate match percentage for this source
      const score = totalWords > 0 ? Math.min(100, Math.round((matchWords / totalWords) * 100)) : 0;
      
      return {
        score: score,
        url: match.url || '',
        title: match.title || 'Web Source',
        snippet: match.textsnippet || 'Matching content detected.'
      };
    });

    // Calculate overall plagiarism score (max score among all matches to prevent exceeding 100%)
    const overallScore = sources.length > 0 ? Math.max(...sources.map(s => s.score)) : 0;

    return NextResponse.json({
      success: true,
      data: {
        score: overallScore,
        total_words: totalWords,
        sources: sources,
        credits_used: 1 // Standard query credit cost
      }
    });

  } catch (error) {
    console.error('Plagiarism Checker Route Exception:', error);
    return NextResponse.json({
      error: 'System error. Plagiarism check failed, please try again later.'
    }, { status: 500 });
  }
}
