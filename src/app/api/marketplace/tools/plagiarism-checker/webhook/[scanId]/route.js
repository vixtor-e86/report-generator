import { NextResponse } from 'next/server';

export async function POST(request, { params }) {
  try {
    const { scanId } = params;
    const body = await request.json();
    
    console.log(`Webhook received for scan ${scanId}:`, body);
    
    // In a real app, you'd store this in a database or notify the client via WebSockets/SSE
    // For now, we just acknowledge receipt
    
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook Error:', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}
