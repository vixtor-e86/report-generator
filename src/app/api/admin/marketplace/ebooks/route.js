// src/app/api/admin/marketplace/ebooks/route.js
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'pending';

    const { data, error } = await supabaseAdmin
      .from('marketplace_ebooks')
      .select('*')
      .eq('status', status)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return NextResponse.json(data);

  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(request) {
  try {
    const { id, status, reason } = await request.json();

    // 1. Update Ebook Status
    const { data: ebook, error: updateError } = await supabaseAdmin
      .from('marketplace_ebooks')
      .update({ 
        status, 
        admin_notes: reason,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (updateError) throw updateError;

    // 2. Create Notification for Seller
    const title = status === 'active' ? 'Ebook Approved!' : 'Ebook Rejected';
    const message = status === 'active' 
      ? `Your ebook "${ebook.title}" has been approved and is now live on the marketplace.`
      : `Your ebook "${ebook.title}" was not approved. Reason: ${reason}`;
    
    await supabaseAdmin.from('marketplace_notifications').insert({
        user_id: ebook.user_id,
        title,
        message,
        type: status === 'active' ? 'success' : 'error'
    });

    return NextResponse.json({ success: true });

  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
