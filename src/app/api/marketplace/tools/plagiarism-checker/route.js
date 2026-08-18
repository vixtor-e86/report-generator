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
      console.error('Plagiarism credentials missing in environment variables (COPYSCAPE_USERNAME or COPYSCAPE_API_KEY)');
      return NextResponse.json({ error: 'Plagiarism scan service is currently offline for maintenance.' }, { status: 503 });
    }

    // Calculate word count
    const totalWords = text.trim().split(/\s+/).length;

    // Call Plagiarism API via URLSearchParams POST (Copyscape standard integration)
    const params = new URLSearchParams();
    params.append('u', COPYSCAPE_USERNAME);
    params.append('k', COPYSCAPE_API_KEY);
    params.append('o', 'tsearch');
    params.append('f', 'json');
    params.append('t', text);

    const response = await fetch('https://www.copyscape.com/api/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded; charset=utf-8'
      },
      body: params.toString()
    });

    const responseText = await response.text();
    console.log('[Plagiarism API Response Status]:', response.status, 'Body:', responseText.slice(0, 300));
    
    let data;
    try {
      data = JSON.parse(responseText);
    } catch (e) {
      console.error('Plagiarism API Parse Error (Status ' + response.status + '):', responseText);
      return NextResponse.json({ error: 'Plagiarism scan service encountered an error. Please try again.' }, { status: 502 });
    }

    if (!response.ok || data.error) {
      console.error('Plagiarism API Error:', data.error || responseText);
      
      // Account for credit issue or key issues on server without exposing provider name to client
      if (data.error && data.error.toLowerCase().includes('credit')) {
        return NextResponse.json({ error: 'Plagiarism scan service is currently undergoing scheduled maintenance. Please try again shortly.' }, { status: 503 });
      }
      return NextResponse.json({ error: 'Plagiarism scan failed. Please try again.' }, { status: response.status || 500 });
    }

    // Process matches (handles data.result array, data.results array, single object, or count === 0)
    let rawMatches = [];
    if (Array.isArray(data.result)) {
      rawMatches = data.result;
    } else if (Array.isArray(data.results)) {
      rawMatches = data.results;
    } else if (data.result && typeof data.result === 'object') {
      rawMatches = [data.result];
    } else if (data.results && typeof data.results === 'object') {
      rawMatches = [data.results];
    }
    
    // Map matches to format expected by the frontend:
    // source.score, source.url, source.title, source.snippet
    const sources = rawMatches.map(match => {
      const matchWords = Number(match.minwordsmatched || match.min_match_words || match.wordsmatched || 0);
      const percent = match.percentmatched ? Number(match.percentmatched) : 0;
      const score = percent > 0 
        ? Math.min(100, Math.round(percent))
        : totalWords > 0 
        ? Math.min(100, Math.round((matchWords / totalWords) * 100)) 
        : 0;
      
      return {
        score: score,
        url: match.url || '',
        title: match.title || 'Web Source',
        snippet: match.textsnippet || match.snippet || 'Matching content detected in external academic/web records.'
      };
    });

    // Calculate overall plagiarism score
    const overallScore = sources.length > 0 ? Math.max(...sources.map(s => s.score)) : 0;

    return NextResponse.json({
      success: true,
      data: {
        score: overallScore,
        total_words: totalWords,
        sources: sources,
        credits_used: 1,
        query_words: data.querywords || totalWords,
        scanned_at: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Plagiarism Checker Route Exception:', error);
    return NextResponse.json({
      error: 'System error. Plagiarism check failed, please try again later.'
    }, { status: 500 });
  }
}
