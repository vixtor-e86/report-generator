// src/app/api/marketplace/delete/route.js
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const type = searchParams.get('type'); // 'blueprint' or 'ebook'
    const userId = searchParams.get('userId');

    if (!id || !type || !userId) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    const table = type === 'blueprint' ? 'marketplace_projects' : 'marketplace_ebooks';

    // Verify ownership before deleting
    const { data: item, error: fetchError } = await supabaseAdmin
      .from(table)
      .select('user_id')
      .eq('id', id)
      .single();

    if (fetchError || !item) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    }

    if (item.user_id !== userId) {
      return NextResponse.json({ error: 'Unauthorized deletion attempt' }, { status: 403 });
    }

    const { error: deleteError } = await supabaseAdmin
      .from(table)
      .delete()
      .eq('id', id);

    if (deleteError) throw deleteError;

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Delete API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
