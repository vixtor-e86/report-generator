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
    // Use raw DB counts for accuracy where possible
    const counts = {
      all: (freeCount || 0) + (stdCount || 0) + (premCount || 0),
      free: (freeCount || 0),
      unlocked: (freeProjects || []).filter(p => p.tier === 'unlocked').length, // This is an estimate based on current page if not indexed
      standard: (stdCount || 0),
      premium: (premCount || 0)
    };

    // 2. Fetch Users for enrichment (Separate call for better reliability)
    let enrichedProjects = allProjects.slice(0, limit);
    if (enrichedProjects.length > 0) {
      const userIds = [...new Set(enrichedProjects.map(p => p.user_id).filter(Boolean))];
      
      if (userIds.length > 0) {
        try {
          // Fetch Profiles
          const { data: usersData, error: profileError } = await supabaseAdmin
            .from('user_profiles')
            .select('id, username, email')
            .in('id', userIds);
            
          if (profileError) console.error('Profile enrichment error:', profileError);

          // Fetch Auth Users for emails (safety) - Handle potential failure/rate limit
          let authUsers = [];
          try {
            const { data: authData } = await supabaseAdmin.auth.admin.listUsers({
              perPage: 1000
            });
            authUsers = authData?.users || [];
          } catch (authErr) {
            console.error('Auth users list error (skipping email safety):', authErr);
          }

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
        } catch (enrichError) {
          console.error('General enrichment error:', enrichError);
          // Return non-enriched projects if enrichment fails completely
        }
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
