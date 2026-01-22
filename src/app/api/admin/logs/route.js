// src/app/api/admin/logs/route.js
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function GET(request) {
  try {
    // 1. Fetch Logs (limit 100)
    const { data: logs, error: logsError } = await supabaseAdmin
      .from('admin_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);

    if (logsError) throw logsError;

    // 2. Fetch User Profiles manually
    let enrichedLogs = [];
    if (logs && logs.length > 0) {
      // Extract unique user IDs (filter out nulls if any)
      const userIds = [...new Set(logs.map(log => log.user_id).filter(id => id))];
      
      let users = [];
      if (userIds.length > 0) {
        const { data: usersData, error: usersError } = await supabaseAdmin
          .from('user_profiles')
          .select('id, username, email')
          .in('id', userIds);
          
        if (!usersError) {
          users = usersData;
        }
      }

      // Merge data
      enrichedLogs = logs.map(log => ({
        ...log,
        user_profiles: users.find(u => u.id === log.user_id) || { username: 'Unknown', email: 'N/A' }
      }));
    }

    return NextResponse.json(enrichedLogs);

  } catch (error) {
    console.error('Admin logs error FULL DETAILS:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch logs' }, { status: 500 });
  }
}
