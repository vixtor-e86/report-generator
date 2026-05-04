import { NextResponse } from 'next/server';

async function getCopyleaksToken() {
  const email = (process.env.COPYLEAKS_EMAIL || '').trim();
  const key = (process.env.COPYLEAKS_API_KEY || '').trim();

  if (!email || !key) {
    throw new Error('Copyleaks credentials (email or API key) are missing in environment variables.');
  }

  const loginUrl = 'https://id.copyleaks.com/v3/auth/login/api';
  const response = await fetch(loginUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, key })
  });
  
  const responseText = await response.text();
  
  if (!response.ok) {
    let message = 'Copyleaks login failed';
    try {
      const errorData = JSON.parse(responseText);
      message = errorData.message || message;
    } catch (e) {
      message = `${message} (Status ${response.status}): ${responseText || 'No response body'}`;
    }
    throw new Error(message);
  }

  try {
    const data = JSON.parse(responseText);
    return data.access_token;
  } catch (e) {
    throw new Error('Failed to parse Copyleaks login response');
  }
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
    
    const statusText = await statusResponse.text();
    
    if (!statusResponse.ok) {
        let errorMsg = 'Failed to fetch status';
        try {
            const err = JSON.parse(statusText);
            errorMsg = err.message || errorMsg;
        } catch (e) {
            errorMsg = `${errorMsg} (${statusResponse.status}): ${statusText || 'No response body'}`;
        }
        return NextResponse.json({ error: errorMsg }, { status: statusResponse.status });
    }
    
    let info;
    try {
        info = JSON.parse(statusText);
    } catch (e) {
        return NextResponse.json({ error: 'Invalid status response from Copyleaks' }, { status: 500 });
    }

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

    const resultsText = await resultsResponse.text();
    let results = [];
    try {
        results = JSON.parse(resultsText);
    } catch (e) {
        console.error('Failed to parse results:', resultsText);
        // If results can't be parsed, we might still have info
    }

    return NextResponse.json({ 
      success: true, 
      status: 'completed',
      data: {
        score: info.result?.score?.aggregatedScore || 0,
        total_words: info.result?.statistics?.credits || 0,
        sources: Array.isArray(results) ? results.map(r => ({
          title: r.title || 'Matching Source',
          url: r.url,
          score: r.matchedPercentage || 0,
          snippet: r.introduction || ''
        })) : []
      }
    });

  } catch (error) {
    console.error('Plagiarism Results Error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
