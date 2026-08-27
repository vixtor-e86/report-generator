import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export const dynamic = 'force-dynamic';

async function performCleanup(request) {
  try {
    // 1. Calculate the date 30 days ago
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const cutoffDate = thirtyDaysAgo.toISOString();

    console.log(`[Cron Cleanup] Starting cleanup of free projects created before ${cutoffDate}`);

    // 2. Fetch IDs of expired free projects (both locked and unlocked in the 'projects' table)
    const { data: expiredProjects, error: fetchError } = await supabaseAdmin
      .from('projects')
      .select('id, title, is_unlocked, created_at')
      .lt('created_at', cutoffDate)
      .limit(1000); // Process up to 1,000 per invocation to avoid server timeouts

    if (fetchError) {
      console.error('[Cron Cleanup] Error fetching expired projects:', fetchError);
      return NextResponse.json({ error: fetchError.message }, { status: 500 });
    }

    if (!expiredProjects || expiredProjects.length === 0) {
      console.log('[Cron Cleanup] No expired free projects found.');
      return NextResponse.json({ 
        success: true, 
        message: 'No expired projects to clean up', 
        count: 0,
        cutoffDate 
      });
    }

    const projectIds = expiredProjects.map(p => p.id);
    console.log(`[Cron Cleanup] Found ${projectIds.length} expired projects. Processing in chunks...`);

    let totalDeleted = 0;
    const CHUNK_SIZE = 50; // Keep URL query lengths well below PostgREST / HTTP header limits

    for (let i = 0; i < projectIds.length; i += CHUNK_SIZE) {
      const chunk = projectIds.slice(i, i + CHUNK_SIZE);

      // 3. Delete dependent relations (Chapters & Images)
      try {
        await supabaseAdmin.from('chapters').delete().in('project_id', chunk);
        await supabaseAdmin.from('project_images').delete().in('project_id', chunk);
      } catch (relErr) {
        console.warn('[Cron Cleanup] Notice during relations cleanup:', relErr);
      }

      // 4. Delete the projects themselves
      const { error: deleteError } = await supabaseAdmin
        .from('projects')
        .delete()
        .in('id', chunk);

      if (deleteError) {
        console.error('[Cron Cleanup] Error deleting batch of projects:', deleteError);
      } else {
        totalDeleted += chunk.length;
      }
    }

    console.log(`[Cron Cleanup] Cleanup complete. Successfully removed ${totalDeleted} projects.`);

    return NextResponse.json({
      success: true,
      message: `Successfully deleted ${totalDeleted} expired free projects (both locked and unlocked).`,
      deletedCount: totalDeleted,
      totalFound: projectIds.length,
      cutoffDate
    });

  } catch (error) {
    console.error('[Cron Cleanup] Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error during cleanup' }, { status: 500 });
  }
}

export async function GET(request) {
  return performCleanup(request);
}

export async function POST(request) {
  return performCleanup(request);
}
