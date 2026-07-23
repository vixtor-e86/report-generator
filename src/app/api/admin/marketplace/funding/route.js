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

    // Fetch all auth users to search and enrich (fully paginated to retrieve all 10,000+ users)
    let allAuthUsers = [];
    try {
      let page = 1;
      let keepFetching = true;
      while (keepFetching) {
        const { data, error: authError } = await supabaseAdmin.auth.admin.listUsers({
          page,
          perPage: 1000
        });
        if (authError || !data || !data.users || data.users.length === 0) {
          keepFetching = false;
        } else {
          allAuthUsers = allAuthUsers.concat(data.users);
          if (data.users.length < 1000) {
            keepFetching = false;
          } else {
            page++;
          }
        }
      }
    } catch (authErr) {
      console.error('Auth user list failed in marketplace funding:', authErr);
    }

    if (query) {
      if (query.includes('@')) {
        // Search by user email
        const user = allAuthUsers.find(u => u.email?.toLowerCase() === query.trim().toLowerCase());
        if (user) {
          baseQuery = baseQuery.eq('user_id', user.id);
        } else {
          // Check profile as fallback
          const { data: profile } = await supabaseAdmin
            .from('user_profiles')
            .select('id')
            .eq('email', query.trim())
            .single();
          if (profile) baseQuery = baseQuery.eq('user_id', profile.id);
          else return NextResponse.json([]);
        }
      } else {
        // Search by reference
        baseQuery = baseQuery.eq('reference', query);
      }
    } else {
      baseQuery = baseQuery.limit(50);
    }

    const { data: transactions, error } = await baseQuery;
    if (error) throw error;

    // Enrich with profiles and emails
    const userIds = [...new Set(transactions.map(t => t.user_id))];
    const { data: profiles } = await supabaseAdmin
      .from('user_profiles')
      .select('id, username, email')
      .in('id', userIds);

    const enriched = transactions.map(tx => {
      const profile = profiles?.find(p => p.id === tx.user_id);
      let email = profile?.email;
      let username = profile?.username || 'Student';

      if (!email) {
        const authUser = allAuthUsers.find(u => u.id === tx.user_id);
        if (authUser?.email) {
          email = authUser.email;
        }
      }

      return {
        ...tx,
        user_profiles: {
          username,
          email: email || 'Unknown Email'
        }
      };
    });

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
