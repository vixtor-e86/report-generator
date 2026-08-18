import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { text } = await request.json();

    if (!text || text.trim().length < 50) {
      return NextResponse.json({ error: 'Content must be at least 50 characters long.' }, { status: 400 });
    }

    const COPYSCAPE_USERNAME = (process.env.COPYSCAPE_USERNAME || '').trim().replace(/^["'](.+)["']$/, '$1').toLowerCase();
    const COPYSCAPE_API_KEY = (process.env.COPYSCAPE_API_KEY || '').trim().replace(/^["'](.+)["']$/, '$1');

    if (!COPYSCAPE_USERNAME || !COPYSCAPE_API_KEY) {
      console.error('Plagiarism credentials missing in environment variables (COPYSCAPE_USERNAME or COPYSCAPE_API_KEY)');
      return NextResponse.json({ error: 'Plagiarism scan service is currently offline for maintenance.' }, { status: 503 });
    }

    // Calculate word count
    const totalWords = text.trim().split(/\s+/).length;

    // Call Copyscape API via standard csearch operation
    const params = new URLSearchParams();
    params.append('u', COPYSCAPE_USERNAME);
    params.append('k', COPYSCAPE_API_KEY);
    params.append('o', 'csearch');
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
    console.log('[Plagiarism API Status]:', response.status, 'Response:', responseText.slice(0, 300));
    
    let data;
    let rawMatches = [];
    let queryWords = totalWords;

    try {
      data = JSON.parse(responseText);
      if (data.error) {
        console.error('[Plagiarism API Error Response]:', data.error);
        if (data.error.toLowerCase().includes('credit') || data.error.toLowerCase().includes('balance')) {
          return NextResponse.json({ error: 'Plagiarism scan service is currently undergoing scheduled maintenance. Please try again shortly.' }, { status: 503 });
        }
        return NextResponse.json({ error: 'Plagiarism scan failed. Please try again.' }, { status: 500 });
      }

      queryWords = Number(data.querywords || totalWords);
      if (Array.isArray(data.result)) {
        rawMatches = data.result;
      } else if (Array.isArray(data.results)) {
        rawMatches = data.results;
      } else if (data.result && typeof data.result === 'object') {
        rawMatches = [data.result];
      } else if (data.results && typeof data.results === 'object') {
        rawMatches = [data.results];
      }
    } catch (e) {
      console.error('[Plagiarism Parse Error (Raw Output)]:', responseText);
      const xmlErrorMatch = responseText.match(/<error>([\s\S]*?)<\/error>/i);
      if (xmlErrorMatch) {
        console.error('[Plagiarism XML Error]:', xmlErrorMatch[1]);
        return NextResponse.json({ error: 'Plagiarism scan failed. Please try again.' }, { status: 500 });
      }
      return NextResponse.json({ error: 'Plagiarism scan service encountered an error. Please try again.' }, { status: 502 });
    }

    // Map matches to format expected by the frontend
    const sources = rawMatches.map(match => {
      const matchWords = Number(match.minwordsmatched || match.min_match_words || match.wordsmatched || 0);
      const percent = Number(match.percentmatched || 0);
      const score = percent > 0 
        ? Math.min(100, Math.round(percent))
        : queryWords > 0 
        ? Math.min(100, Math.round((matchWords / queryWords) * 100)) 
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
        query_words: queryWords,
        sources: sources,
        credits_used: 1,
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
