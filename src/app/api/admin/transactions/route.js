// src/app/api/admin/transactions/route.js
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function GET(request) {
  // Add authentication/authorization checks here if needed, similar to stats route

  try {
    const { data, error } = await supabaseAdmin
      .from('payment_transactions')
      .select(`
        *,
        user_profiles(username, email)
      `)
      .eq('status', 'paid')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json(data || []);

  } catch (error) {
    console.error('Admin transactions error FULL DETAILS:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch transactions' }, { status: 500 });
  }
}
