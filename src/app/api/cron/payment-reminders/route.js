import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const now = new Date();
    // Transactions created between 3 hours ago and 24 hours ago
    const threeHoursAgo = new Date(now.getTime() - 3 * 60 * 60 * 1000).toISOString();
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();

    console.log(`[Cron Reminder] Checking pending premium transactions between ${twentyFourHoursAgo} and ${threeHoursAgo}`);

    const { data: pendingTransactions, error: txError } = await supabaseAdmin
      .from('payment_transactions')
      .select('id, user_id, amount, created_at')
      .eq('tier', 'premium')
      .eq('status', 'pending')
      .lt('created_at', threeHoursAgo)
      .gt('created_at', twentyFourHoursAgo);

    if (txError) {
      console.error('[Cron Reminder] Error fetching transactions:', txError);
      return NextResponse.json({ error: txError.message }, { status: 500 });
    }

    if (!pendingTransactions || pendingTransactions.length === 0) {
      return NextResponse.json({ success: true, message: 'No pending transactions found' });
    }

    // Filter out users who already received a reminder in the last 24 hours
    const { data: recentReminders, error: remError } = await supabaseAdmin
      .from('sent_emails')
      .select('recipients')
      .eq('category', 'premium_reminder')
      .gt('created_at', twentyFourHoursAgo);

    let alreadyRemindedEmails = new Set();
    if (!remError && recentReminders) {
      recentReminders.forEach(r => {
        if (Array.isArray(r.recipients)) {
          r.recipients.forEach(email => alreadyRemindedEmails.add(email));
        }
      });
    }

    // Get unique user IDs from transactions
    const userIds = [...new Set(pendingTransactions.map(t => t.user_id))];

    const emailsToSend = [];
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://w3writelab.com';

    for (const uid of userIds) {
      try {
        const { data: { user } } = await supabaseAdmin.auth.admin.getUserById(uid);
        if (user && user.email && !alreadyRemindedEmails.has(user.email)) {
          // get username from user_profiles
          const { data: profile } = await supabaseAdmin.from('user_profiles').select('username').eq('id', uid).single();
          
          emailsToSend.push({
            email: user.email,
            username: profile?.username || 'Student',
          });
          
          // Add to set to avoid duplicates within this run
          alreadyRemindedEmails.add(user.email);
        }
      } catch (err) {
        console.error(`[Cron Reminder] Could not fetch auth user ${uid}`, err);
      }
    }

    if (emailsToSend.length === 0) {
      return NextResponse.json({ success: true, message: 'Reminders already sent to all eligible users.' });
    }

    const sendEndpoint = `${baseUrl}/api/admin/email/send`;
    let sentCount = 0;

    for (const recipient of emailsToSend) {
      const bodyText = `Hi ${recipient.username},\n\nWe noticed that you started a W3WriteLab Premium upgrade recently, but the payment hasn't been completed yet.\n\nUnlock unlimited access to advanced engineering templates, enhanced AI tools, and faster report generation by completing your upgrade today.\n\nClick here to resume your payment and access all premium features: ${baseUrl}/pricing\n\nIf you have any questions or need help, our support team is always here for you.`;
      
      const emailPayload = {
        from: 'W3 WriteLab Premium <upgrade@w3writelab.com>',
        recipients: [recipient.email],
        subject: 'Complete your W3WriteLab Premium Upgrade',
        body: bodyText,
        category: 'premium_reminder',
        senderUsername: 'System Cron',
        senderRole: 'system'
      };

      try {
        const response = await fetch(sendEndpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(emailPayload)
        });
        
        if (response.ok) {
          sentCount++;
        } else {
          console.error(`[Cron Reminder] Email sending failed with status: ${response.status}`);
        }
      } catch (e) {
        console.error(`[Cron Reminder] Failed to send email to ${recipient.email}`, e);
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: `Sent ${sentCount} reminders.`,
      usersReminded: sentCount
    });

  } catch (error) {
    console.error('[Cron Reminder] Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
