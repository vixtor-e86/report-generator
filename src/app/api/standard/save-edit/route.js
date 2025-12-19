// /src/app/api/standard/save-edit/route.js
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(request) {
  try {
    const { chapterId, content, userId } = await request.json();

    // Validate inputs
    if (!chapterId || !content || !userId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // 1. Fetch chapter
    const { data: chapter, error: chapterError } = await supabase
      .from('standard_chapters')
      .select('*, standard_projects(user_id)')
      .eq('id', chapterId)
      .single();

    if (chapterError || !chapter) {
      return NextResponse.json(
        { error: 'Chapter not found' },
        { status: 404 }
      );
    }

    // 2. Verify ownership
    if (chapter.standard_projects.user_id !== userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // 3. Save current version to history (before overwriting)
    if (chapter.content) {
      const currentVersion = chapter.version || 1;
      
      await supabase
        .from('standard_chapter_versions')
        .insert({
          chapter_id: chapterId,
          version_number: currentVersion,
          content: chapter.content,
          change_type: 'edited',
          change_description: 'User made manual edits',
          created_by: 'user'
        });
    }

    // 4. Update chapter with new content
    const { error: updateError } = await supabase
      .from('standard_chapters')
      .update({
        content: content,
        status: 'edited',
        edit_count: (chapter.edit_count || 0) + 1,
        last_edited_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', chapterId);

    if (updateError) {
      console.error('Error updating chapter:', updateError);
      return NextResponse.json(
        { error: 'Failed to save changes' },
        { status: 500 }
      );
    }

    // 5. Return success response
    return NextResponse.json({
      success: true,
      message: 'Changes saved successfully',
      editCount: (chapter.edit_count || 0) + 1
    });

  } catch (error) {
    console.error('Save edit error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to save changes' },
      { status: 500 }
    );
  }
}