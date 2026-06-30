import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function POST(request) {
  try {
    const { itemId, itemType, price, title } = await request.json();

    if (!itemId || !itemType || price === undefined || !title) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Determine target table and commission
    const tableName = itemType === 'blueprint' ? 'marketplace_projects' : 'marketplace_ebooks';
    const commission = itemType === 'blueprint' ? 0.7 : 0.9;
    const sellerEarnings = Math.floor(price * commission);

    // 1. Fetch item to get the seller_id
    const { data: itemData, error: itemError } = await supabaseAdmin
      .from(tableName)
      .select('seller_id')
      .eq('id', itemId)
      .single();

    if (itemError || !itemData) {
      console.error(`Item not found in ${tableName}:`, itemError);
      return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    }

    const sellerId = itemData.seller_id;
    if (!sellerId) {
      return NextResponse.json({ success: true, message: 'Item has no seller (Admin item)' });
    }

    // 2. Fetch the seller's wallet
    const { data: sellerWallet, error: walletError } = await supabaseAdmin
      .from('marketplace_seller_wallets')
      .select('balance, total_earned, user_id')
      .eq('seller_id', sellerId)
      .maybeSingle();

    if (walletError) {
      console.error('Failed to fetch seller wallet:', walletError);
      return NextResponse.json({ error: 'Seller wallet fetch failed' }, { status: 500 });
    }

    let sellerUserId = sellerWallet?.user_id;

    // If wallet doesn't exist, we must create one. 
    // First find the seller's user_id from marketplace_sellers
    if (!sellerUserId) {
      const { data: sellerInfo, error: sellerInfoError } = await supabaseAdmin
        .from('marketplace_sellers')
        .select('user_id')
        .eq('id', sellerId)
        .single();
        
      if (sellerInfoError || !sellerInfo) {
        console.error('Seller info not found:', sellerInfoError);
        return NextResponse.json({ error: 'Seller not found' }, { status: 404 });
      }
      sellerUserId = sellerInfo.user_id;
    }

    if (sellerWallet) {
      // Update existing wallet
      const { error: updateError } = await supabaseAdmin
        .from('marketplace_seller_wallets')
        .update({
          balance: sellerWallet.balance + sellerEarnings,
          total_earned: (sellerWallet.total_earned || 0) + sellerEarnings,
          updated_at: new Date().toISOString()
        })
        .eq('seller_id', sellerId);

      if (updateError) {
        console.error('Failed to update seller wallet:', updateError);
        return NextResponse.json({ error: 'Wallet update failed' }, { status: 500 });
      }
    } else {
      // Create new wallet with initial balance
      const { error: insertError } = await supabaseAdmin
        .from('marketplace_seller_wallets')
        .insert({
          seller_id: sellerId,
          user_id: sellerUserId,
          balance: sellerEarnings,
          total_earned: sellerEarnings,
          updated_at: new Date().toISOString(),
          created_at: new Date().toISOString()
        });

      if (insertError) {
        console.error('Failed to create seller wallet:', insertError);
        return NextResponse.json({ error: 'Wallet creation failed' }, { status: 500 });
      }
    }

    // 3. Send notification to the seller
    await supabaseAdmin.from('marketplace_notifications').insert({
      user_id: sellerUserId,
      title: 'New Sale!',
      message: `You earned ₦${sellerEarnings.toLocaleString()} from a sale of "${title}".`,
      type: 'success',
      created_at: new Date().toISOString()
    });

    return NextResponse.json({ success: true, sellerEarnings });

  } catch (error) {
    console.error('Complete purchase error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
