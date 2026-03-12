// src/app/api/premium/humanize/check/route.js
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { taskId } = await request.json();
    const apiKey = process.env.BYPASSGPT_API_KEY;

    if (!taskId || !apiKey) {
      return NextResponse.json({ error: 'Missing task ID or API key' }, { status: 400 });
    }

    // BypassGPT Retrieval Endpoint
    const pollUrl = `https://www.bypassgpt.ai/api/bypassgpt/v1/retrieval?task_id=${taskId}`;
    
    const response = await fetch(pollUrl, {
      method: "GET",
      headers: { 
        "api-key": apiKey,
        "x-api-key": apiKey
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Retrieval Error (${response.status}): ${errorText.substring(0, 100)}`);
    }

    const data = await response.json();
    
    // EXTRACT OUTPUT
    // The console logs show that output is being found, but isCompleted remains false.
    const output = data.data?.output || data.output || data.text || data.data?.text || (data.data && data.data.text);
    
    // EXTRACT STATUS
    const status = data.data?.status || data.status || data.msg || "";
    
    // FLEXIBLE COMPLETION LOGIC
    // If the 'output' field has content, the task is effectively done regardless of the 'status' field.
    const hasOutput = typeof output === 'string' && output.trim().length > 10;
    const statusSuccess = status === 'success' || status === 'completed' || data.code === 200;

    const isCompleted = hasOutput || statusSuccess;

    return NextResponse.json({ 
      success: true, 
      isCompleted: !!isCompleted, 
      output: output || null,
      rawStatus: status,
      fullResponse: data // For debugging if needed
    });

  } catch (error) {
    console.error('Humanizer Check Route Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
