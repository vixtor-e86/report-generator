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
    const { text, fileBase64, filename, scanId } = await request.json();

    if (!text && !fileBase64) {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 });
    }

    const token = await getCopyleaksToken();
    
    // Determine submission type
    let endpoint = `https://api.copyleaks.com/v3/scans/submit/file/${scanId}`;
    let body = {
      base64: fileBase64 || Buffer.from(text).toString('base64'),
      filename: filename || 'document.txt',
      properties: {
        webhooks: {
          status: `${process.env.NEXT_PUBLIC_APP_URL || 'https://example.com'}/api/marketplace/tools/plagiarism-checker/webhook/${scanId}`
        },
        scanning: {
            internet: true
        }
      }
    };

    const response = await fetch(endpoint, {
      method: 'PUT', // Copyleaks uses PUT for submission
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Copyleaks Submit Error:', errorData);
      return NextResponse.json({ error: errorData.message || 'Submission failed' }, { status: response.status });
    }

    return NextResponse.json({ success: true, scanId });

  } catch (error) {
    console.error('Plagiarism Submit Error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
