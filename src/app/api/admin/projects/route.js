// src/app/api/admin/projects/route.js
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '1000');

    // 1. Fetch counts and raw data in parallel
    const [
      { count: freeCount },
      { count: stdCount },
      { count: premCount },
      { data: premiumProjects, error: premError },
      { data: standardProjects, error: stdError },
      { data: freeProjects, error: freeError }
    ] = await Promise.all([
      supabaseAdmin.from('projects').select('*', { count: 'exact', head: true }),
      supabaseAdmin.from('standard_projects').select('*', { count: 'exact', head: true }),
      supabaseAdmin.from('premium_projects').select('*', { count: 'exact', head: true }),
      
      supabaseAdmin.from('premium_projects').select('*').order('created_at', { ascending: false }).limit(limit),
      supabaseAdmin.from('standard_projects').select('*').order('created_at', { ascending: false }).limit(limit),
      supabaseAdmin.from('projects').select('*').order('created_at', { ascending: false }).limit(limit)
    ]);

    if (premError) console.error('Premium fetch error:', premError);
    if (stdError) console.error('Standard fetch error:', stdError);
    if (freeError) console.error('Free fetch error:', freeError);

    // Combine and normalize raw data
    const allProjects = [
      ...(premiumProjects || []).map(p => ({ ...p, type: 'premium', tier: 'premium' })),
      ...(standardProjects || []).map(p => ({ ...p, type: 'standard', tier: p.tier || 'standard' })),
      ...(freeProjects || []).map(p => ({ ...p, type: 'free', tier: p.tier || 'free' }))
    ].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    // Calculate detailed counts for each tier
    const tiers = allProjects.map(p => p.tier || 'free');
    const counts = {
      all: allProjects.length,
      free: tiers.filter(t => t === 'free').length,
      unlocked: tiers.filter(t => t === 'unlocked').length,
      standard: (stdCount || 0), // Use raw DB count for accuracy
      premium: (premCount || 0)
    };

    // 2. Fetch Users for enrichment (Separate call for better reliability)
    let enrichedProjects = allProjects.slice(0, limit);
    if (enrichedProjects.length > 0) {
      const userIds = [...new Set(enrichedProjects.map(p => p.user_id).filter(Boolean))];
      
      if (userIds.length > 0) {
        // Fetch Profiles
        const { data: usersData } = await supabaseAdmin
          .from('user_profiles')
          .select('id, username, email')
          .in('id', userIds);
          
        // Fetch Auth Users for emails (safety)
        const { data: { users: authUsers } } = await supabaseAdmin.auth.admin.listUsers({
          perPage: 1000
        });

        enrichedProjects = enrichedProjects.map(project => {
          const profile = usersData?.find(u => u.id === project.user_id);
          const authUser = authUsers?.find(u => u.id === project.user_id);

          return {
            ...project,
            user_profiles: {
              username: profile?.username || 'Student',
              email: authUser?.email || profile?.email || 'N/A'
            },
            // Ensure numeric values
            tokens_used: project.tokens_used || 0,
            humanizer_words_used: project.humanizer_words_used || 0
          };
        });
      }
    }

    return NextResponse.json({
      projects: enrichedProjects,
      counts: counts
    });

  } catch (error) {
    console.error('Admin projects error:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch projects' }, { status: 500 });
  }
}
