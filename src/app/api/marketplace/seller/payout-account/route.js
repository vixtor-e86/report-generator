// src/app/api/marketplace/seller/payout-account/route.js
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) return NextResponse.json({ error: 'Missing userId' }, { status: 400 });

    const { data, error } = await supabaseAdmin
      .from('marketplace_sellers')
      .select('bank_name, account_number, account_name')
      .eq('user_id', userId)
      .single();

    if (error) throw error;
    return NextResponse.json(data);

  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const { userId, bank_name, account_number, account_name } = await request.json();

    if (!userId || !bank_name || !account_number || !account_name) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from('marketplace_sellers')
      .update({
        bank_name,
        account_number,
        account_name,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId);

    if (error) throw error;
    return NextResponse.json({ success: true });

  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
