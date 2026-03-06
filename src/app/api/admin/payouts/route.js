// src/app/api/admin/payouts/route.js
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function GET(request) {
  try {
    const { data, error } = await supabaseAdmin
      .from('referral_payouts')
      .select('*, user_profiles(username, email)')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(request) {
  try {
    const { payoutId, status } = await request.json();
    
    if (!payoutId || !status) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }

    const updateData = { 
      status, 
      paid_at: status === 'paid' ? new Date().toISOString() : null 
    };

    const { data, error } = await supabaseAdmin
      .from('referral_payouts')
      .update(updateData)
      .eq('id', payoutId)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ success: true, payout: data });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
