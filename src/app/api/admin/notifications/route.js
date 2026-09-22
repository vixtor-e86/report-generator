import { NextResponse } from 'next/server';
import { supabaseAdmin, getAuthUsersMap, getAuthUserByEmail } from '@/lib/supabaseAdmin';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    // Fetch notifications
    const { data: notifications, count, error } = await supabaseAdmin
      .from('marketplace_notifications')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    // Fetch user emails for non-null user_id rows
    const userIds = Array.from(new Set(notifications.filter(n => n.user_id).map(n => n.user_id)));
    let userEmailMap = {};

    if (userIds.length > 0) {
      try {
        const authMap = await getAuthUsersMap();
        for (const [email, user] of authMap.entries()) {
          userEmailMap[user.id] = user.email || email;
        }
      } catch (err) {
        console.warn('Error loading auth user emails for notification history:', err.message);
      }
    }

    const formattedNotifications = (notifications || []).map(n => ({
      ...n,
      recipientName: n.user_id ? (userEmailMap[n.user_id] || 'Specific User') : 'All Users (Global Broadcast)',
      isGlobal: !n.user_id
    }));

    // Calculate quick stats
    const globalCount = formattedNotifications.filter(n => !n.user_id).length;
    const targetedCount = formattedNotifications.filter(n => !!n.user_id).length;

    return NextResponse.json({
      notifications: formattedNotifications,
      totalCount: count || 0,
      stats: {
        total: count || 0,
        globalCount,
        targetedCount
      }
    });
  } catch (error) {
    console.error('Error fetching admin notifications:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { 
      title, 
      message, 
      type = 'info', 
      targetType = 'all', 
      targetUserIds = [],
      targetEmails = []
    } = body;

    if (!title?.trim()) {
      return NextResponse.json({ error: 'Notification title is required.' }, { status: 400 });
    }

    if (!message?.trim()) {
      return NextResponse.json({ error: 'Notification message is required.' }, { status: 400 });
    }

    let insertedCount = 0;

    if (targetType === 'all') {
      // 1. GLOBAL BROADCAST: Single record with null user_id reachable by all platform users
      const { data, error } = await supabaseAdmin
        .from('marketplace_notifications')
        .insert({
          user_id: null,
          title: title.trim(),
          message: message.trim(),
          type: type || 'info',
          is_read: false
        })
        .select();

      if (error) throw error;
      insertedCount = 1;

    } else if (targetType === 'sellers') {
      // 2. ALL VERIFIED SELLERS
      const { data: sellers, error: sellerErr } = await supabaseAdmin
        .from('marketplace_sellers')
        .select('user_id')
        .eq('status', 'approved');

      if (sellerErr) throw sellerErr;

      const sellerIds = Array.from(new Set((sellers || []).map(s => s.user_id).filter(Boolean)));

      if (sellerIds.length === 0) {
        return NextResponse.json({ error: 'No approved sellers found to send notifications to.' }, { status: 400 });
      }

      // Batch insert in chunks of 50
      const chunkSize = 50;
      for (let i = 0; i < sellerIds.length; i += chunkSize) {
        const chunk = sellerIds.slice(i, i + chunkSize);
        const rows = chunk.map(uid => ({
          user_id: uid,
          title: title.trim(),
          message: message.trim(),
          type: type || 'info',
          is_read: false
        }));

        const { error: insErr } = await supabaseAdmin
          .from('marketplace_notifications')
          .insert(rows);

        if (insErr) throw insErr;
        insertedCount += rows.length;
      }

    } else if (targetType === 'specific') {
      // 3. SPECIFIC USERS (Added by Email)
      let finalUserIds = Array.isArray(targetUserIds) ? [...targetUserIds] : [];

      if (Array.isArray(targetEmails) && targetEmails.length > 0) {
        const authMap = await getAuthUsersMap();
        for (const email of targetEmails) {
          if (!email) continue;
          const cleanEmail = email.toLowerCase().trim();
          let user = authMap.get(cleanEmail);
          if (!user) {
            user = await getAuthUserByEmail(cleanEmail);
          }
          if (user?.id && !finalUserIds.includes(user.id)) {
            finalUserIds.push(user.id);
          }
        }
      }

      if (finalUserIds.length === 0) {
        return NextResponse.json({ error: 'Please enter at least one valid recipient user email.' }, { status: 400 });
      }

      const uniqueIds = Array.from(new Set(finalUserIds.filter(Boolean)));
      const chunkSize = 50;
      for (let i = 0; i < uniqueIds.length; i += chunkSize) {
        const chunk = uniqueIds.slice(i, i + chunkSize);
        const rows = chunk.map(uid => ({
          user_id: uid,
          title: title.trim(),
          message: message.trim(),
          type: type || 'info',
          is_read: false
        }));

        const { error: insErr } = await supabaseAdmin
          .from('marketplace_notifications')
          .insert(rows);

        if (insErr) throw insErr;
        insertedCount += rows.length;
      }

    } else {
      return NextResponse.json({ error: `Invalid target type "${targetType}".` }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      insertedCount,
      targetType,
      message: targetType === 'all' 
        ? 'Global notification broadcasted to all users successfully.' 
        : `Notification sent to ${insertedCount} recipient(s) successfully.`
    });

  } catch (error) {
    console.error('Error dispatching notification:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Notification ID is required.' }, { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from('marketplace_notifications')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return NextResponse.json({ success: true, message: 'Notification deleted successfully.' });
  } catch (error) {
    console.error('Error deleting notification:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
