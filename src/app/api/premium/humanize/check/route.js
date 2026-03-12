// src/app/api/premium/humanize/check/route.js
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { taskId } = await request.json();
    const apiKey = process.env.BYPASSGPT_API_KEY;

    if (!taskId || !apiKey) {
      return NextResponse.json({ error: 'Missing task ID or API key' }, { status: 400 });
    }

    console.log('Humanizer Check: Checking taskId', taskId);

    // If POST returned 405, it likely wants GET with a query parameter.
    // We'll try the GET method which is standard for many "retrieval" operations.
    const pollUrl = `https://www.bypassgpt.ai/api/bypassgpt/v1/retrieval?task_id=${taskId}`;
    
    const response = await fetch(pollUrl, {
      method: "GET",
      headers: { 
        "api-key": apiKey,
        "x-api-key": apiKey
      }
    });

    const rawText = await response.text();
    console.log('Humanizer Check: Raw Response:', rawText);

    if (!response.ok) {
      // If GET also fails, we'll report the specific error
      throw new Error(`Retrieval Error (${response.status}): ${rawText.substring(0, 100)}`);
    }

    let data;
    try {
      data = JSON.parse(rawText);
    } catch (e) {
      throw new Error('Invalid JSON from BypassGPT during retrieval.');
    }

    // Capture output and status from multiple possible response structures
    const output = data.data?.output || data.output || data.text || data.data?.text || (data.data && data.data.text);
    const status = data.data?.status || data.status || data.msg || (data.code === 200 ? 'success' : '');
    
    // Check for success/completed signals
    const isCompleted = (status === 'success' || status === 'completed' || data.code === 200) && !!output;

    return NextResponse.json({ 
      success: true, 
      isCompleted, 
      output,
      rawStatus: status
    });

  } catch (error) {
    console.error('Humanizer Check Route Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
