import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    // 1. Calculate the date 30 days ago
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const cutoffDate = thirtyDaysAgo.toISOString();

    console.log(`[Cron] Starting cleanup of free projects created before ${cutoffDate}`);

    // 2. Fetch IDs of expired free projects
    // CRITICAL FIX: We must exclude projects that have been unlocked/paid for.
    // Standard projects that were upgraded from free stay in this table but have is_unlocked = true.
    const { data: expiredProjects, error: fetchError } = await supabaseAdmin
      .from('projects')
      .select('id, title')
      .eq('tier', 'free')
      .or('is_unlocked.is.null,is_unlocked.eq.false') // Protect paid/unlocked projects
      .lt('created_at', cutoffDate);

    if (fetchError) {
      console.error('[Cron] Error fetching expired projects:', fetchError);
      return NextResponse.json({ error: fetchError.message }, { status: 500 });
    }

    if (!expiredProjects || expiredProjects.length === 0) {
      console.log('[Cron] No expired free projects found.');
      return NextResponse.json({ message: 'No projects to clean up', count: 0 });
    }

    const projectIds = expiredProjects.map(p => p.id);
    console.log(`[Cron] Found ${projectIds.length} expired projects:`, projectIds);

    // 3. Delete related data (Chapters & Images)
    // Note: If you have ON DELETE CASCADE set up in Supabase, deleting the project is enough.
    // We'll attempt to delete relations explicitly just in case to ensure cleanliness.
    
    await supabaseAdmin.from('chapters').delete().in('project_id', projectIds);
    await supabaseAdmin.from('project_images').delete().in('project_id', projectIds);

    // 4. Delete the projects themselves
    const { error: deleteError } = await supabaseAdmin
      .from('projects')
      .delete()
      .in('id', projectIds);

    if (deleteError) {
      console.error('[Cron] Error deleting projects:', deleteError);
      return NextResponse.json({ error: deleteError.message }, { status: 500 });
    }

    console.log('[Cron] Cleanup successful.');

    return NextResponse.json({
      success: true,
      message: `Deleted ${projectIds.length} expired free projects`,
      deletedIds: projectIds
    });

  } catch (error) {
    console.error('[Cron] Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
