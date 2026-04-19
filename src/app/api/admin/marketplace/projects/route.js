// src/app/api/admin/marketplace/projects/route.js
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'pending';

    const { data, error } = await supabaseAdmin
      .from('marketplace_projects')
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

    // 1. Update Project Status
    const { data: project, error: updateError } = await supabaseAdmin
      .from('marketplace_projects')
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
    const title = status === 'active' ? 'Project Approved!' : 'Project Rejected';
    const message = status === 'active' 
      ? `Your blueprint "${project.title}" has been approved and is now live on the marketplace.`
      : `Your blueprint "${project.title}" was not approved. Reason: ${reason}`;
    
    await supabaseAdmin.from('marketplace_notifications').insert({
        user_id: project.user_id,
        title,
        message,
        type: status === 'active' ? 'success' : 'error'
    });

    return NextResponse.json({ success: true });

  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
