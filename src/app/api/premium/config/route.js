// src/app/api/premium/config/route.js
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const limit = parseInt(process.env.HUMANIZER_LIMIT);
    
    if (isNaN(limit)) {
      return NextResponse.json({ error: 'HUMANIZER_LIMIT is not defined in server environment' }, { status: 500 });
    }

    return NextResponse.json({ 
      humanizerLimit: limit 
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
