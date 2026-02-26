// src/app/api/premium/save-edit/route.js
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function POST(request) {
  try {
    const { chapterId, content, userId, isAiAction, modelUsed, instruction } = await request.json();

    if (!chapterId || !content || !userId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // 1. If it's an AI action (Generate/Humanize/Modify), save previous state to history first
    if (isAiAction) {
      // Fetch current state
      const { data: currentChapter } = await supabaseAdmin
        .from('premium_chapters')
        .select('content')
        .eq('id', chapterId)
        .single();

      if (currentChapter && currentChapter.content) {
        // Add to history
        await supabaseAdmin
          .from('premium_chapter_history')
          .insert({
            chapter_id: chapterId,
            content: currentChapter.content,
            prompt_used: instruction || 'Humanization / AI Modification',
            model_used: modelUsed || 'Claude'
          });

        // Maintain only last 5 versions
        const { data: history } = await supabaseAdmin
          .from('premium_chapter_history')
          .select('id')
          .eq('chapter_id', chapterId)
          .order('created_at', { ascending: false });

        if (history && history.length > 5) {
          const idsToDelete = history.slice(5).map(h => h.id);
          await supabaseAdmin
            .from('premium_chapter_history')
            .delete()
            .in('id', idsToDelete);
        }
      }
    }

    // 2. Update Chapter Content
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
