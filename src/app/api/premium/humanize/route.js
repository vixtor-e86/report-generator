// src/app/api/premium/humanize/route.js
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { content } = await request.json();

    if (!content || content.length < 50) {
      return NextResponse.json({ error: 'Content must be at least 50 characters long.' }, { status: 400 });
    }

    const apiKey = process.env.UNDETECTABLE_API_KEY;
    if (!apiKey) {
      throw new Error('UNDETECTABLE_API_KEY is not configured in .env');
    }

    // 1. Submit Document
    const submitRes = await fetch('https://humanize.undetectable.ai/submit', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': apiKey,
      },
      body: JSON.stringify({
        content: content,
        readability: 'University',
        purpose: 'Report',
        strength: 'Quality',
        model: 'v11' // High humanization for English
      })
    });

    const submitData = await submitRes.json();

    if (!submitRes.ok || !submitData.id) {
      console.error('Undetectable Submit Error:', submitData);
      throw new Error(submitData.error || 'Failed to submit document');
    }

    const documentId = submitData.id;

    // 2. Polling for Completion
    let humanizedText = null;
    let attempts = 0;
    const maxAttempts = 30; // Up to 2.5 minutes for long chapters

    while (attempts < maxAttempts) {
      // Wait 5 seconds between checks as per documentation recommendation
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      const statusRes = await fetch('https://humanize.undetectable.ai/document', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': apiKey,
        },
        body: JSON.stringify({ id: documentId })
      });

      const statusData = await statusRes.json();

      // According to docs, 'output' field is present when done
      if (statusData.output) {
        humanizedText = statusData.output;
        break;
      }

      if (statusData.status === 'error') {
        throw new Error('API returned an error status during processing');
      }

      attempts++;
    }

    if (!humanizedText) {
      throw new Error('Humanization processing is taking longer than expected. Please check history later.');
    }

    return NextResponse.json({ 
      success: true, 
      humanized: humanizedText,
      original: content
    });

  } catch (error) {
    console.error('Humanizer Route Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
