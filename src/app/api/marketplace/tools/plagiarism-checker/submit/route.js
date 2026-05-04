import { NextResponse } from 'next/server';

export const runtime = 'nodejs'; // Ensure we have access to Node.js APIs like Buffer

async function getCopyleaksToken() {
  const email = (process.env.COPYLEAKS_EMAIL || '').trim().replace(/^["'](.+)["']$/, '$1');
  const key = (process.env.COPYLEAKS_API_KEY || '').trim().replace(/^["'](.+)["']$/, '$1');

  if (!email || !key) {
    throw new Error('Copyleaks credentials (email or API key) are missing or incorrectly formatted in .env');
  }

  const loginUrl = 'https://id.copyleaks.com/v3/auth/login';
  
  try {
    const response = await fetch(loginUrl, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'User-Agent': 'W3WriteLab-PlagiarismChecker/1.0'
      },
      body: JSON.stringify({ email: email.toLowerCase(), key })
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

    const data = JSON.parse(responseText);
    if (!data.access_token) {
      throw new Error('No access token returned from Copyleaks identity server');
    }
    return data.access_token;
  } catch (err) {
    console.error('Copyleaks Auth Exception:', err.message);
    throw err;
  }
}

export async function POST(request) {
  try {
    const bodyText = await request.text();
    if (!bodyText) {
      return NextResponse.json({ error: 'Request body is empty' }, { status: 400 });
    }

    let payload;
    try {
      payload = JSON.parse(bodyText);
    } catch (e) {
      return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 });
    }

    const { text, fileBase64, filename, scanId } = payload;

    if (!text && !fileBase64) {
      return NextResponse.json({ error: 'No content provided for scan' }, { status: 400 });
    }

    if (!scanId) {
      return NextResponse.json({ error: 'Internal Error: Scan ID was not generated' }, { status: 400 });
    }

    const token = await getCopyleaksToken();
    
    const endpoint = `https://api.copyleaks.com/v3/scans/submit/file/${scanId}`;
    
    let finalBase64 = fileBase64;
    if (!finalBase64 && text) {
        // Fallback for base64 encoding if Buffer is somehow restricted
        try {
            finalBase64 = Buffer.from(text).toString('base64');
        } catch (e) {
            finalBase64 = btoa(unescape(encodeURIComponent(text)));
        }
    }

    const submitBody = {
      base64: finalBase64,
      filename: filename || 'document.txt',
      properties: {
        webhooks: {
          status: `${(process.env.NEXT_PUBLIC_APP_URL || 'https://w3writelab.com').replace(/\/$/, '')}/api/marketplace/tools/plagiarism-checker/webhook/${scanId}`
        },
        scanning: {
            internet: true
        }
      }
    };

    const response = await fetch(endpoint, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'User-Agent': 'W3WriteLab-PlagiarismChecker/1.0'
      },
      body: JSON.stringify(submitBody)
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch (e) {
        errorData = { message: `Copyleaks Submission Error (${response.status}): ${errorText || response.statusText}` };
      }
      return NextResponse.json({ error: errorData.message || 'Scan submission failed' }, { status: response.status });
    }

    return NextResponse.json({ success: true, scanId });

  } catch (error) {
    console.error('Critical Plagiarism API Error:', error);
    return NextResponse.json({ 
        error: error.message || 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined 
    }, { status: 500 });
  }
}
