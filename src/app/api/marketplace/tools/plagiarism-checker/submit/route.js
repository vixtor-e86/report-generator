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
    if (!data.access_token) {
      throw new Error('No access token returned from Copyleaks');
    }
    return data.access_token;
  } catch (e) {
    throw new Error(`Failed to parse Copyleaks login response: ${e.message}`);
  }
}

export async function POST(request) {
  try {
    const bodyText = await request.text();
    if (!bodyText) {
      return NextResponse.json({ error: 'Empty request body' }, { status: 400 });
    }

    let payload;
    try {
      payload = JSON.parse(bodyText);
    } catch (e) {
      return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 });
    }

    const { text, fileBase64, filename, scanId } = payload;

    if (!text && !fileBase64) {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 });
    }

    if (!scanId) {
        return NextResponse.json({ error: 'Scan ID is required' }, { status: 400 });
    }

    const token = await getCopyleaksToken();
    
    // Determine submission type
    const endpoint = `https://api.copyleaks.com/v3/scans/submit/file/${scanId}`;
    
    // Construct base64 safely
    let finalBase64 = fileBase64;
    if (!finalBase64 && text) {
        finalBase64 = Buffer.from(text).toString('base64');
    }

    let submitBody = {
      base64: finalBase64,
      filename: filename || 'document.txt',
      properties: {
        webhooks: {
          status: `${process.env.NEXT_PUBLIC_APP_URL || 'https://w3writelab.com'}/api/marketplace/tools/plagiarism-checker/webhook/${scanId}`
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
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(submitBody)
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch (e) {
        errorData = { message: `Upstream error (${response.status}): ${errorText || response.statusText}` };
      }
      console.error('Copyleaks Submit Error:', errorData);
      return NextResponse.json({ error: errorData.message || 'Submission failed' }, { status: response.status });
    }

    // Success response for PUT /submit/file is usually empty or 201
    return NextResponse.json({ success: true, scanId });

  } catch (error) {
    console.error('Plagiarism Submit Error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
