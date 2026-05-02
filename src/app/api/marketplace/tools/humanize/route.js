import { NextResponse } from 'next/server';

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

    const { content } = payload;
    const apiKey = process.env.STEALTHGPT_API_KEY;

    if (!apiKey) {
      return NextResponse.json({ error: 'Humanization engine configuration missing on server' }, { status: 500 });
    }

    if (!content) {
      return NextResponse.json({ error: 'No content provided' }, { status: 400 });
    }

    // Word count check
    const words = content.trim().split(/\s+/).filter(w => w.length > 0);
    if (words.length > 1500) {
      return NextResponse.json({ error: 'Maximum 1500 words per request allowed.' }, { status: 400 });
    }

    // Call StealthGPT
    const response = await fetch("https://stealthgpt.ai/api/stealthify", {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "api-token": apiKey
      },
      body: JSON.stringify({
        prompt: content,
        rephrase: true,
        tone: "College",
        mode: "Medium",
        qualityMode: "quality"
      }),
    });

    let data;
    const responseText = await response.text();
    try {
      data = JSON.parse(responseText);
    } catch (e) {
      data = { message: `Engine returned non-JSON response: ${response.statusText}` };
    }

    if (!response.ok) {
      console.error("StealthGPT Tool Error:", data);
      return NextResponse.json({ error: data.message || "Humanization engine error" }, { status: 500 });
    }

    let result = data.result || content;
    
    // Currency fail-safe (Nigerian localization)
    result = result.replace(/\$/g, '₦');

    return NextResponse.json({ 
      success: true, 
      result 
    });

  } catch (error) {
    console.error('Humanizer Tool API Error:', error);
    return NextResponse.json({ error: error.message || "Something went wrong, please try again later" }, { status: 500 });
  }
}
