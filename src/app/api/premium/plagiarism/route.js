// src/app/api/premium/plagiarism/route.js
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

function stripReferences(content) {
  if (!content) return '';
  // Strip any markdown header and trailing text for references/bibliography
  return content.split(/\n#{1,4}\s*(?:References|Bibliography|Works Cited|Sources|Literature Cited)\b/i)[0].trim();
}

export async function POST(request) {
  try {
    const { projectId, text } = await request.json();

    if (!projectId) {
      return NextResponse.json({ error: 'Missing projectId' }, { status: 400 });
    }

    // --- AUTHENTICATION & PROJECT VERIFICATION ---
    const authHeader = request.headers.get('Authorization');
    let authenticatedUserId = null;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const { data: { user } } = await supabaseAdmin.auth.getUser(token);
      if (user) authenticatedUserId = user.id;
    }

    const { data: project, error: pError } = await supabaseAdmin
      .from('premium_projects')
      .select('*')
      .eq('id', projectId)
      .single();

    if (pError || !project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    if (authenticatedUserId && project.user_id !== authenticatedUserId) {
      return NextResponse.json({ error: 'Unauthorized: You do not own this project' }, { status: 403 });
    }

    // --- STRIP REFERENCES ---
    const cleanedText = stripReferences(text);
    if (!cleanedText || cleanedText.length < 50) {
      return NextResponse.json({ error: 'Content must contain at least 50 characters excluding references.' }, { status: 400 });
    }

    const wordCount = cleanedText.trim().split(/\s+/).filter(w => w.length > 0).length;

    // --- 10,000 WORDS PROJECT LIMIT ---
    const PROJECT_AUDIT_LIMIT = project.plagiarism_words_limit || 10000;
    const currentUsed = project.plagiarism_words_used || 0;

    if (currentUsed + wordCount > PROJECT_AUDIT_LIMIT) {
      const remaining = Math.max(0, PROJECT_AUDIT_LIMIT - currentUsed);
      return NextResponse.json({ 
        error: `Project originality audit limit reached. You have used ${currentUsed.toLocaleString()} of ${PROJECT_AUDIT_LIMIT.toLocaleString()} words (${remaining.toLocaleString()} words remaining).` 
      }, { status: 403 });
    }

    // --- COPYSCAPE API (NO MARKETPLACE WALLET INVOLVEMENT) ---
    const COPYSCAPE_USERNAME = (process.env.COPYSCAPE_USERNAME || '').trim().replace(/^["'](.+)["']$/, '$1').toLowerCase();
    const COPYSCAPE_API_KEY = (process.env.COPYSCAPE_API_KEY || '').trim().replace(/^["'](.+)["']$/, '$1');

    if (!COPYSCAPE_USERNAME || !COPYSCAPE_API_KEY) {
      console.error('Plagiarism credentials missing in environment variables (COPYSCAPE_USERNAME or COPYSCAPE_API_KEY)');
      return NextResponse.json({ error: 'Originality audit service is temporarily offline for maintenance.' }, { status: 503 });
    }

    const params = new URLSearchParams();
    params.append('u', COPYSCAPE_USERNAME);
    params.append('k', COPYSCAPE_API_KEY);
    params.append('o', 'csearch');
    params.append('f', 'json');
    params.append('t', cleanedText);

    const response = await fetch('https://www.copyscape.com/api/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded; charset=utf-8'
      },
      body: params.toString()
    });

    const responseText = await response.text();
    let data;
    let rawMatches = [];
    let queryWords = wordCount;

    try {
      data = JSON.parse(responseText);
      if (data.error) {
        console.error('[Copyscape API Error Response]:', data.error);
        if (data.error.toLowerCase().includes('credit') || data.error.toLowerCase().includes('balance')) {
          return NextResponse.json({ error: 'Originality audit service is currently undergoing scheduled maintenance. Please try again shortly.' }, { status: 503 });
        }
        return NextResponse.json({ error: 'Originality audit failed. Please try again.' }, { status: 500 });
      }

      queryWords = Number(data.querywords || wordCount);
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
      console.error('[Copyscape Parse Error]:', responseText);
      return NextResponse.json({ error: 'Originality audit service encountered an error. Please try again.' }, { status: 502 });
    }

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
        title: match.title || 'Academic Web Document',
        snippet: match.textsnippet || match.snippet || 'Matching content detected in external academic/web records.'
      };
    });

    const overallScore = sources.length > 0 ? Math.max(...sources.map(s => s.score)) : 0;
    const newUsed = currentUsed + wordCount;

    // --- PERSIST USAGE ---
    try {
      await supabaseAdmin
        .from('premium_projects')
        .update({ plagiarism_words_used: newUsed })
        .eq('id', projectId);
    } catch (dbErr) {
      console.warn('Failed to persist plagiarism_words_used (column may be pending migration):', dbErr);
    }

    return NextResponse.json({
      success: true,
      data: {
        score: overallScore,
        total_words: wordCount,
        sources: sources
      },
      newUsed,
      limit: PROJECT_AUDIT_LIMIT
    });

  } catch (error) {
    console.error('Plagiarism Scan Error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
