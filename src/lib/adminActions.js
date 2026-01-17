import { supabase } from './supabase';

/**
 * Check if current user is an admin
 */
export async function isAdmin(userId) {
  try {
    const { data: profile, error } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', userId)
      .single();

    if (error) throw error;
    return profile?.role === 'admin';
  } catch (error) {
    console.error('Error checking admin status:', error);
    return false;
  }
}

/**
 * Log an admin action
 */
export async function logAdminAction(adminId, action, details = null) {
  try {
    const { error } = await supabase
      .from('admin_logs')
      .insert({
        admin_id: adminId,
        action,
        details
      });

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error logging admin action:', error);
    return false;
  }
}

/**
 * Get admin statistics
 */
export async function getAdminStats() {
  try {
    // Total Users
    const { count: totalUsers } = await supabase
      .from('user_profiles')
      .select('*', { count: 'exact', head: true });

    // Total Revenue
    const { data: payments } = await supabase
      .from('payment_transactions')
      .select('amount')
      .eq('status', 'paid');

    const totalRevenue = payments?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0;

    // Projects Today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const { count: projectsToday } = await supabase
      .from('standard_projects')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', today.toISOString());

    // Free Projects Count
    const { count: freeProjects } = await supabase
      .from('projects')
      .select('*', { count: 'exact', head: true });

    // Standard Projects Count
    const { count: standardProjects } = await supabase
      .from('standard_projects')
      .select('*', { count: 'exact', head: true });

    return {
      totalUsers: totalUsers || 0,
      totalRevenue,
      projectsToday: projectsToday || 0,
      freeProjects: freeProjects || 0,
      standardProjects: standardProjects || 0,
      totalProjects: (freeProjects || 0) + (standardProjects || 0)
    };
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    return {
      totalUsers: 0,
      totalRevenue: 0,
      projectsToday: 0,
      freeProjects: 0,
      standardProjects: 0,
      totalProjects: 0
    };
  }
}

/**
 * Get recent transactions
 */
export async function getRecentTransactions(limit = 10) {
  try {
    const { data, error } = await supabase
      .from('payment_transactions')
      .select(`
        *,
        user_profiles!payment_transactions_user_id_fkey(username, email)
      `)
      .eq('status', 'paid')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching recent transactions:', error);
    return [];
  }
}

/**
 * Create a project without payment (admin bypass)
 */
export async function createAdminProject({
  userId,
  tier,
  templateId = null,
  title,
  department,
  description,
  components = []
}) {
  try {
    if (tier === 'free') {
      const { data: project, error } = await supabase
        .from('projects')
        .insert({
          user_id: userId,
          title,
          department,
          description,
          components,
          tier: 'free',
          status: 'not_started',
          current_chapter: 1
        })
        .select()
        .single();

      if (error) throw error;
      
      // Log action
      await logAdminAction(userId, 'create_free_project', {
        project_id: project.id,
        title
      });

      return { success: true, project };

    } else if (tier === 'standard') {
      if (!templateId) throw new Error('Template ID required for standard projects');

      // Get template
      const { data: template } = await supabase
        .from('templates')
        .select('*')
        .eq('id', templateId)
        .single();

      if (!template) throw new Error('Template not found');

      // Create project
      const { data: project, error: projectError } = await supabase
        .from('standard_projects')
        .insert({
          user_id: userId,
          template_id: templateId,
          title,
          department,
          description,
          components,
          tier: 'standard',
          payment_status: 'admin_bypass',
          amount_paid: 0,
          tokens_used: 0,
          tokens_limit: 120000,
          status: 'in_progress',
          current_chapter: 1,
          access_expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        })
        .select()
        .single();

      if (projectError) throw projectError;

      // Create chapters
      const structure = template.structure || { chapters: [] };
      const chaptersToCreate = structure.chapters.map((ch, i) => ({
        project_id: project.id,
        chapter_number: i + 1,
        title: ch.title,
        status: 'not_generated'
      }));

      const { error: chaptersError } = await supabase
        .from('standard_chapters')
        .insert(chaptersToCreate);

      if (chaptersError) throw chaptersError;

      // Log action
      await logAdminAction(userId, 'create_standard_project_bypass', {
        project_id: project.id,
        title,
        template: template.name
      });

      return { success: true, project };
    }

    throw new Error('Invalid tier');
  } catch (error) {
    console.error('Error creating admin project:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Grant admin role to a user
 */
export async function grantAdminRole(userId, targetEmail) {
  try {
    // Verify requester is admin
    const isRequesterAdmin = await isAdmin(userId);
    if (!isRequesterAdmin) {
      throw new Error('Unauthorized: Only admins can grant admin role');
    }

    // Find user by email
    const { data: users } = await supabase
      .from('user_profiles')
      .select('id, email, username')
      .eq('email', targetEmail)
      .single();

    if (!users) throw new Error('User not found');

    // Update role
    const { error } = await supabase
      .from('user_profiles')
      .update({ role: 'admin' })
      .eq('id', users.id);

    if (error) throw error;

    // Log action
    await logAdminAction(userId, 'grant_admin_role', {
      target_user_id: users.id,
      target_email: targetEmail
    });

    return { success: true, message: `Admin role granted to ${targetEmail}` };
  } catch (error) {
    console.error('Error granting admin role:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Revoke admin role from a user
 */
export async function revokeAdminRole(userId, targetEmail) {
  try {
    // Verify requester is admin
    const isRequesterAdmin = await isAdmin(userId);
    if (!isRequesterAdmin) {
      throw new Error('Unauthorized: Only admins can revoke admin role');
    }

    // Find user by email
    const { data: users } = await supabase
      .from('user_profiles')
      .select('id, email, username')
      .eq('email', targetEmail)
      .single();

    if (!users) throw new Error('User not found');

    // Prevent self-revocation
    if (users.id === userId) {
      throw new Error('Cannot revoke your own admin role');
    }

    // Update role
    const { error } = await supabase
      .from('user_profiles')
      .update({ role: 'user' })
      .eq('id', users.id);

    if (error) throw error;

    // Log action
    await logAdminAction(userId, 'revoke_admin_role', {
      target_user_id: users.id,
      target_email: targetEmail
    });

    return { success: true, message: `Admin role revoked from ${targetEmail}` };
  } catch (error) {
    console.error('Error revoking admin role:', error);
    return { success: false, error: error.message };
  }
}