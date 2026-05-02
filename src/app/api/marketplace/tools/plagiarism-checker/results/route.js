import { NextResponse } from 'next/server';

async function getCopyleaksToken() {
  const loginUrl = 'https://id.copyleaks.com/v3/auth/login/api';
  const response = await fetch(loginUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: process.env.COPYLEAKS_EMAIL,
      key: process.env.COPYLEAKS_API_KEY
    })
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Copyleaks login failed');
  return data.access_token;
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const scanId = searchParams.get('scanId');

    if (!scanId) {
      return NextResponse.json({ error: 'Scan ID is required' }, { status: 400 });
    }

    const token = await getCopyleaksToken();

    // 1. Check Scan Status
    const statusResponse = await fetch(`https://api.copyleaks.com/v3/scans/${scanId}/info`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (!statusResponse.ok) {
        const err = await statusResponse.json();
        return NextResponse.json({ error: err.message || 'Failed to fetch status' }, { status: statusResponse.status });
    }
    
    const info = await statusResponse.json();

    // Status: 0 = Processing, 1 = Completed, 2 = Error
    if (info.status === 0) {
      return NextResponse.json({ success: true, status: 'processing', progress: info.progress });
    }

    if (info.status === 2) {
      return NextResponse.json({ success: false, status: 'error', message: 'Scan failed on server' });
    }

    // 2. Fetch Results if completed
    const resultsResponse = await fetch(`https://api.copyleaks.com/v3/downloads/${scanId}/results`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    const results = await resultsResponse.json();

    return NextResponse.json({ 
      success: true, 
      status: 'completed',
      data: {
        score: info.result?.score?.aggregatedScore || 0,
        total_words: info.result?.statistics?.credits || 0, // Copyleaks uses credits/words
        sources: results.map(r => ({
          title: r.title || 'Matching Source',
          url: r.url,
          score: r.matchedPercentage || 0,
          snippet: r.introduction || ''
        }))
      }
    });

  } catch (error) {
    console.error('Plagiarism Results Error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
