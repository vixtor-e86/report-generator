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

    if (!process.env.COPYLEAKS_EMAIL || !process.env.COPYLEAKS_API_KEY) {
      return NextResponse.json({ error: 'Copyleaks configuration is missing on server' }, { status: 500 });
    }

    const token = await getCopyleaksToken();
    
    // Determine submission type
    let endpoint = `https://api.copyleaks.com/v3/scans/submit/file/${scanId}`;
    let submitBody = {
      base64: fileBase64 || Buffer.from(text).toString('base64'),
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
      let errorData;
      try {
        errorData = await response.json();
      } catch (e) {
        errorData = { message: `Upstream error: ${response.statusText}` };
      }
      console.error('Copyleaks Submit Error:', errorData);
      return NextResponse.json({ error: errorData.message || 'Submission failed' }, { status: response.status });
    }

    return NextResponse.json({ success: true, scanId });

  } catch (error) {
    console.error('Plagiarism Submit Error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
