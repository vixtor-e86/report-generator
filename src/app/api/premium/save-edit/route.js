// src/app/api/premium/save-edit/route.js
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function POST(request) {
  try {
    const { chapterId, chapterNumber, projectId, content, userId, isAiAction, modelUsed, instruction } = await request.json();

    if ((!chapterId && (!projectId || !chapterNumber)) || !content) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const isUUID = typeof chapterId === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(chapterId);
    let targetChapterId = isUUID ? chapterId : null;

    // If no valid UUID was passed directly, try finding the chapter by projectId and chapterNumber
    if (!targetChapterId && projectId && (chapterNumber || !isNaN(Number(chapterId)))) {
      const chNum = Number(chapterNumber || chapterId);
      const { data: existing } = await supabaseAdmin
        .from('premium_chapters')
        .select('id')
        .eq('project_id', projectId)
        .eq('chapter_number', chNum)
        .maybeSingle();

      if (existing) {
        targetChapterId = existing.id;
      }
    }

    // 1. If it's an AI action (Generate/Humanize/Modify) and we have a chapter ID, save previous state to history first
    if (isAiAction && targetChapterId) {
      // Fetch current state
      const { data: currentChapter } = await supabaseAdmin
        .from('premium_chapters')
        .select('content')
        .eq('id', targetChapterId)
        .single();

      if (currentChapter && currentChapter.content) {
        // Add to history
        await supabaseAdmin
          .from('premium_chapter_history')
          .insert({
            chapter_id: targetChapterId,
            content: currentChapter.content,
            prompt_used: instruction || 'Humanization / AI Modification',
            model_used: modelUsed || 'Claude'
          });

        // Maintain only last 5 versions
        const { data: history } = await supabaseAdmin
          .from('premium_chapter_history')
          .select('id')
          .eq('chapter_id', targetChapterId)
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

    // 2. Update Chapter Content or Insert if chapter row doesn't exist yet
    if (targetChapterId) {
      const { error: updateError } = await supabaseAdmin
        .from('premium_chapters')
        .update({
          content: content,
          status: 'draft',
          updated_at: new Date().toISOString()
        })
        .eq('id', targetChapterId);

      if (updateError) throw updateError;
    } else if (projectId) {
      const chNum = Number(chapterNumber || chapterId || 1);
      const { data: newCh, error: insertError } = await supabaseAdmin
        .from('premium_chapters')
        .insert({
          project_id: projectId,
          chapter_number: chNum,
          title: `Chapter ${chNum}`,
          content: content,
          status: 'draft',
          updated_at: new Date().toISOString()
        })
        .select('id')
        .single();

      if (insertError) throw insertError;
      targetChapterId = newCh?.id;
    } else {
      throw new Error('Unable to identify or create chapter row.');
    }

    return NextResponse.json({ success: true, message: 'Changes saved', chapterId: targetChapterId });

  } catch (error) {
    console.error('Save Edit Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to save' }, { status: 500 });
  }
}
