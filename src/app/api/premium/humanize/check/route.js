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

    // FIX: retrieval endpoint usually requires a POST with task_id in body
    const response = await fetch(`https://www.bypassgpt.ai/api/bypassgpt/v1/retrieval`, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "api-key": apiKey 
      },
      body: JSON.stringify({ task_id: taskId })
    });

    const rawText = await response.text();
    console.log('Humanizer Check: Raw Response:', rawText);

    if (!response.ok) {
      throw new Error(`Retrieval Error (${response.status}): ${rawText}`);
    }

    let data;
    try {
      data = JSON.parse(rawText);
    } catch (e) {
      throw new Error('Invalid JSON from BypassGPT during retrieval.');
    }

    // According to docs, data.output contains the result and data.status is 'completed'
    // But we check multiple locations for robustness
    const output = data.data?.output || data.output || data.text || data.data?.text;
    const status = data.data?.status || data.status || data.msg;
    
    // Some versions use 'success' or 'completed' or '200' code
    const isCompleted = status === 'success' || status === 'completed' || data.code === 200;

    return NextResponse.json({ 
      success: true, 
      isCompleted: isCompleted && !!output, 
      output,
      rawStatus: status
    });

  } catch (error) {
    console.error('Humanizer Check Route Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
