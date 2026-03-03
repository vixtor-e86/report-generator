// src/app/api/auth/verify-premium-access/route.js
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { password } = await request.json();
    
    const correctPassword = process.env.PREMIUM_ACCESS_PASSWORD;
    
    if (!correctPassword) {
      return NextResponse.json({ error: 'Premium access is not configured.' }, { status: 500 });
    }
    
    if (password === correctPassword) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json({ success: false, error: 'Incorrect authorization code.' }, { status: 401 });
    }
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
