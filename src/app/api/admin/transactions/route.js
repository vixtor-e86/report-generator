// src/app/api/admin/transactions/route.js
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

// Paginated helper to fetch all users from auth
async function getAllAuthUsers() {
  let authUsers = [];
  let page = 1;
  let keepFetching = true;
  while (keepFetching) {
    const { data, error } = await supabaseAdmin.auth.admin.listUsers({
      page,
      perPage: 1000
    });
    if (error || !data || !data.users || data.users.length === 0) {
      keepFetching = false;
    } else {
      authUsers = authUsers.concat(data.users);
      if (data.users.length < 1000) {
        keepFetching = false;
      } else {
        page++;
      }
    }
  }
  return authUsers;
}

// GET — all transactions (paid + pending), newest first
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');
    const reference = searchParams.get('reference');

    let baseQuery = supabaseAdmin
      .from('payment_transactions')
      .select('*')
      .order('created_at', { ascending: false });

    let targetUserId = null;
    const allAuthUsers = await getAllAuthUsers();

    if (email) {
      const user = allAuthUsers.find(u => u.email?.toLowerCase() === email.trim().toLowerCase());
      
      if (user) {
        targetUserId = user.id;
      } else {
        const { data: profile } = await supabaseAdmin
          .from('user_profiles')
          .select('id, email')
          .eq('email', email.trim())
          .single();
        if (profile) targetUserId = profile.id;
      }

      if (!targetUserId) return NextResponse.json([]);
      baseQuery = baseQuery.eq('user_id', targetUserId);
    } else if (reference) {
      // Searching by ID (W3WL_...) which is stored in paystack_reference
      baseQuery = baseQuery.eq('paystack_reference', reference);
    } else {
      baseQuery = baseQuery.limit(50);
    }

    const { data: transactions, error: txError } = await baseQuery;
    if (txError) throw txError;

    if (!transactions || transactions.length === 0) return NextResponse.json([]);

    const uniqueUserIds = [...new Set(transactions.map(tx => tx.user_id))];
    const { data: profiles } = await supabaseAdmin
      .from('user_profiles')
      .select('id, username, email')
      .in('id', uniqueUserIds);

    const enriched = await Promise.all(transactions.map(async tx => {
      const profile = profiles?.find(p => p.id === tx.user_id);
      let email = profile?.email;
      let username = profile?.username || 'Student';

      // If profile email is missing, find in pre-fetched auth list
      if (!email) {
        const authUser = allAuthUsers.find(u => u.id === tx.user_id);
        if (authUser?.email) {
          email = authUser.email;
        } else {
          // Final fallback: fetch specific user directly from Auth if not in the pre-fetched list
          try {
            const { data: { user: directUser } } = await supabaseAdmin.auth.admin.getUserById(tx.user_id);
            if (directUser?.email) email = directUser.email;
          } catch (e) {
            console.error(`Error fetching auth user ${tx.user_id}:`, e);
          }
        }
      }
      
      return {
        ...tx,
        user_profiles: {
          username,
          email: email || 'Unknown Email'
        }
      };
    }));

    return NextResponse.json(enriched);

  } catch (error) {
    console.error('Admin Transactions Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PATCH — verify payment
export async function PATCH(request) {
  try {
    const { transactionId } = await request.json();
    const now = new Date().toISOString();

    const { data: updated, error } = await supabaseAdmin
      .from('payment_transactions')
      .update({
        status: 'paid',
        paid_at: now,
        updated_at: now,
        verified_at: now
      })
      .eq('id', transactionId)
      .select()
      .single();

    if (error) throw error;

    // ✅ NEW: Handle Project Unlock for Manual Verification
    if (updated.paystack_reference && (updated.paystack_reference.startsWith('W3WL_UNLOCK_') || updated.paystack_reference.startsWith('W3WL_MANUAL_UNLOCK_'))) {
      const parts = updated.paystack_reference.split('_');
      
      let projectIdToUnlock = null;
      if (updated.paystack_reference.startsWith('W3WL_MANUAL_UNLOCK_')) {
        // W3WL_MANUAL_UNLOCK_<PROJECT_ID>_<TIMESTAMP> -> [W3WL, MANUAL, UNLOCK, PROJECT_ID, TIMESTAMP]
        projectIdToUnlock = parts[3];
      } else {
        // W3WL_UNLOCK_<PROJECT_ID>_<TIMESTAMP> -> [W3WL, UNLOCK, PROJECT_ID, TIMESTAMP]
        projectIdToUnlock = parts[2];
      }

      if (projectIdToUnlock) {
        await supabaseAdmin
          .from('projects')
          .update({ is_unlocked: true, tier: 'unlocked' })
          .eq('id', projectIdToUnlock);
        
        console.log(`Admin manually unlocked project: ${projectIdToUnlock}`);
      }
    }

    // ✅ Handle Humanizer Refill for Manual Verification
    if (updated.paystack_reference && updated.paystack_reference.startsWith('W3WL_REFILL_')) {
      const parts = updated.paystack_reference.split('_');
      // Format: W3WL_REFILL_PROJECTID_WORDSAMOUNT_TIMESTAMP
      if (parts.length >= 5) {
        const refillProjectId = parts[2];
        const refillWords = Number(parts[3]);
        
        if (refillProjectId && !isNaN(refillWords)) {
          try {
            // 1. Fetch current words used
            const { data: currentProject } = await supabaseAdmin
              .from('premium_projects')
              .select('humanizer_words_used')
              .eq('id', refillProjectId)
              .single();

            if (currentProject) {
              const currentUsed = currentProject.humanizer_words_used || 0;
              const newWordsUsed = Math.max(0, currentUsed - refillWords);

              // 2. Update premium_projects
              await supabaseAdmin
                .from('premium_projects')
                .update({ humanizer_words_used: newWordsUsed })
                .eq('id', refillProjectId);

              console.log(`Admin manually verified refill: ${refillWords} words for project ${refillProjectId}. Old: ${currentUsed}, New: ${newWordsUsed}`);
            }
          } catch (refillErr) {
            console.error('Error executing manual humanizer refill:', refillErr);
          }
        }
      }
    }

    return NextResponse.json({ success: true, transaction: updated });

  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
