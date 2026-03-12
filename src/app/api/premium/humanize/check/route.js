// src/app/api/premium/humanize/check/route.js
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { taskId } = await request.json();
    const apiKey = process.env.BYPASSGPT_API_KEY;

    if (!taskId || !apiKey) {
      return NextResponse.json({ error: 'Missing task ID or API key' }, { status: 400 });
    }

    const response = await fetch(`https://www.bypassgpt.ai/api/bypassgpt/v1/retrieval?task_id=${taskId}`, {
      headers: { "api-key": apiKey }
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Retrieval Error: ${errorText}`);
    }

    const data = await response.json();
    const output = data.output || data.text || data.data?.output || data.data?.text;
    const isCompleted = data.status === 'success' || data.status === 'completed' || data.code === 200;

    return NextResponse.json({ 
      success: true, 
      isCompleted, 
      output,
      rawStatus: data.status 
    });

  } catch (error) {
    console.error('Check Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
