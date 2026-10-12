// src/app/api/analytics/tiktok/route.js
import { NextResponse } from 'next/server';
import { sendTikTokServerEvent } from '@/lib/tiktokServer';

export async function POST(request) {
  try {
    const body = await request.json();
    const { event, eventId, user = {}, properties = {}, page = {} } = body;

    if (!event) {
      return NextResponse.json({ error: 'Missing event name' }, { status: 400 });
    }

    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || '127.0.0.1';
    const userAgent = request.headers.get('user-agent') || '';

    const result = await sendTikTokServerEvent({
      event,
      eventId,
      user: {
        ...user,
        ip: user.ip || ip,
        userAgent: user.userAgent || userAgent,
      },
      properties,
      page,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('API /api/analytics/tiktok error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
