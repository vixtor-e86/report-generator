// src/app/api/premium/save-edit/route.js
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function POST(request) {
  try {
    const { chapterId, content, projectId, userId } = await request.json();

    if (!chapterId || !content || !userId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // 1. Update Chapter Content (No History)
    const { error: updateError } = await supabaseAdmin
      .from('premium_chapters')
      .update({
        content: content,
        updated_at: new Date().toISOString()
      })
      .eq('id', chapterId);

    if (updateError) throw updateError;

    return NextResponse.json({ success: true, message: 'Changes saved' });

  } catch (error) {
    console.error('Save Edit Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to save' }, { status: 500 });
  }
}
