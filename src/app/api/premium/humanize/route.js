// src/app/api/premium/humanize/route.js
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function POST(request) {
  try {
    const { chapterId, content, userId } = await request.json();

    if (!content || !chapterId) {
      return NextResponse.json({ error: 'Missing content or chapter ID' }, { status: 400 });
    }

    const apiKey = process.env.UNDETECTABLE_API_KEY;

    // 1. Submit Document to Undetectable AI
    // Note: We use the 'humanize' endpoint. 
    // Settings: readability='University', purpose='Academic'
    const submitRes = await fetch('https://api.undetectable.ai/submit', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': apiKey,
      },
      body: JSON.stringify({
        content: content,
        readability: 'University',
        purpose: 'Report',
        strength: 'Quality'
      })
    });

    const submitData = await submitRes.json();

    if (!submitRes.ok || !submitData.id) {
      throw new Error(submitData.error || 'Failed to submit to humanizer');
    }

    const taskId = submitData.id;

    // 2. Polling Logic (Undetectable AI takes 10-30 seconds)
    let humanizedText = null;
    let attempts = 0;
    const maxAttempts = 20; // ~40 seconds max

    while (attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 3000)); // Wait 3s between polls
      
      const statusRes = await fetch('https://api.undetectable.ai/status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'api-key': apiKey,
        },
        body: JSON.stringify({ id: taskId })
      });

      const statusData = await statusRes.json();

      if (statusData.status === 'done') {
        humanizedText = statusData.output;
        break;
      }

      if (statusData.status === 'error') {
        throw new Error('Undetectable AI returned an error during processing');
      }

      attempts++;
    }

    if (!humanizedText) {
      throw new Error('Humanization timed out. Please try again.');
    }

    return NextResponse.json({ 
      success: true, 
      humanized: humanizedText,
      original: content
    });

  } catch (error) {
    console.error('Humanizer API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
