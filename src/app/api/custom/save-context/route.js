import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    const { projectId, tableName, uploadedChapters, existingReferences } = await request.json();

    if (!projectId) {
      return NextResponse.json({ error: 'Project ID is required' }, { status: 400 });
    }

    const targetTable = tableName === 'premium_projects' ? 'premium_projects' : 'standard_projects';

    const updatePayload = {
      uploaded_chapters: uploadedChapters || {},
      existing_references: existingReferences || null,
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabaseAdmin
      .from(targetTable)
      .update(updatePayload)
      .eq('id', projectId)
      .select()
      .single();

    if (error) {
      console.error(`Error saving custom context in ${targetTable}:`, error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Also sync the uploaded content into the chapters table (standard_chapters or premium_chapters)
    if (uploadedChapters && typeof uploadedChapters === 'object') {
      const chapterTable = targetTable === 'premium_projects' ? 'premium_chapters' : 'standard_chapters';
      for (const [key, val] of Object.entries(uploadedChapters)) {
        const match = key.match(/chapter_(\d+)/);
        if (match) {
          const chNum = parseInt(match[1]);
          const content = typeof val === 'string' ? val : val?.content || '';
          if (content) {
            const { data: existingCh } = await supabaseAdmin
              .from(chapterTable)
              .select('id')
              .eq('project_id', projectId)
              .eq('chapter_number', chNum)
              .single();

            if (existingCh) {
              await supabaseAdmin
                .from(chapterTable)
                .update({ content, status: 'draft', updated_at: new Date().toISOString() })
                .eq('id', existingCh.id);
            } else {
              await supabaseAdmin
                .from(chapterTable)
                .insert({
                  project_id: projectId,
                  chapter_number: chNum,
                  title: `Chapter ${chNum}`,
                  content,
                  status: 'draft'
                });
            }
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Chapter context and references saved successfully.',
      project: data
    });
  } catch (error) {
    console.error('Save context error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
