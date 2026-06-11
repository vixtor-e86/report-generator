// src/app/api/admin/marketplace/funding/route.js
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('query');

    let baseQuery = supabaseAdmin
      .from('wallet_transactions')
      .select('*')
      .eq('type', 'deposit')
      .order('created_at', { ascending: false });

    if (query) {
      if (query.includes('@')) {
        // Search by user email (Requires finding user ID first)
        const { data: users } = await supabaseAdmin.auth.admin.listUsers();
        const user = users.users.find(u => u.email?.toLowerCase() === query.toLowerCase());
        if (user) baseQuery = baseQuery.eq('user_id', user.id);
        else return NextResponse.json([]);
      } else {
        // Search by reference
        baseQuery = baseQuery.eq('reference', query);
      }
    } else {
      baseQuery = baseQuery.limit(50);
    }

    const { data: transactions, error } = await baseQuery;
    if (error) throw error;

    // Enrich with user profiles
    const userIds = [...new Set(transactions.map(t => t.user_id))];
    const { data: profiles } = await supabaseAdmin
      .from('user_profiles')
      .select('id, username, email')
      .in('id', userIds);

    const enriched = transactions.map(tx => ({
      ...tx,
      user_profiles: profiles?.find(p => p.id === tx.user_id) || { username: 'Unknown', email: 'N/A' }
    }));

    return NextResponse.json(enriched);

  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(request) {
  try {
    const { transactionId } = await request.json();
    const now = new Date().toISOString();

    // 1. Get the transaction
    const { data: tx, error: fetchError } = await supabaseAdmin
      .from('wallet_transactions')
      .select('*')
      .eq('id', transactionId)
      .single();

    if (fetchError || !tx) throw new Error('Transaction not found');
    if (tx.status === 'completed') throw new Error('Already funded');

    // 2. Mark transaction as completed
    const { error: updateTxError } = await supabaseAdmin
      .from('wallet_transactions')
      .update({ status: 'completed' })
      .eq('id', transactionId);

    if (updateTxError) throw updateTxError;

    // 3. Update wallet balance
    const { data: wallet, error: walletFetchError } = await supabaseAdmin
      .from('marketplace_wallets')
      .select('balance')
      .eq('user_id', tx.user_id)
      .single();

    // If wallet doesn't exist (PGRST116), we'll create it during upsert
    if (walletFetchError && walletFetchError.code !== 'PGRST116') {
      throw walletFetchError;
    }

    const currentBalance = wallet ? Number(wallet.balance) : 0;
    const addAmount = Number(tx.amount);
    const newBalance = currentBalance + addAmount;

    console.log(`Updating wallet for ${tx.user_id}: ${currentBalance} + ${addAmount} = ${newBalance}`);

    const { error: walletUpdateError } = await supabaseAdmin
      .from('marketplace_wallets')
      .upsert({ 
        user_id: tx.user_id,
        balance: newBalance,
        updated_at: now
      }, { onConflict: 'user_id' });

    if (walletUpdateError) {
      console.error('Wallet Update Error:', walletUpdateError);
      throw new Error(`Failed to update wallet: ${walletUpdateError.message}`);
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Admin Funding PATCH Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
