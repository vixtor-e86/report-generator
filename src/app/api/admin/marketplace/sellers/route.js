// src/app/api/admin/marketplace/sellers/route.js
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'pending';

    let query = supabaseAdmin
      .from('marketplace_sellers')
      .select('*, universities(name)')
      .order('created_at', { ascending: false });

    if (status !== 'all') {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) throw error;
    return NextResponse.json(data);

  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(request) {
  try {
    const { id, status, notes } = await request.json();

    // 1. Update seller application status
    const { data: seller, error: sellerError } = await supabaseAdmin
      .from('marketplace_sellers')
      .update({ 
        status, 
        admin_notes: notes,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (sellerError) throw sellerError;

    // 2. If approved, mark the user as a seller in their profile
    if (status === 'approved') {
      const { error: profileError } = await supabaseAdmin
        .from('user_profiles')
        .update({ is_seller: true })
        .eq('id', seller.user_id);

      if (profileError) console.error('Profile Update Error:', profileError);

      // Create Success Notification
      await supabaseAdmin.from('marketplace_notifications').insert({
        user_id: seller.user_id,
        title: 'Accreditation Approved!',
        message: 'Congratulations! You are now a verified seller. You can start uploading projects.',
        type: 'success'
      });
    } else if (status === 'rejected') {
      // Create Rejection Notification
      await supabaseAdmin.from('marketplace_notifications').insert({
        user_id: seller.user_id,
        title: 'Application Update',
        message: `Your seller accreditation was not approved. Reason: ${notes || 'Information provided was insufficient.'}`,
        type: 'error'
      });
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
