import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(request) {
  try {
    const { projectId, userId, rating, feedback, url } = await request.json();

    // Validate inputs
    if (!projectId || !userId || !rating) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: 'Rating must be between 1 and 5' },
        { status: 400 }
      );
    }

    // Get user info
    const { data: userProfile } = await supabase
      .from('user_profiles')
      .select('username, email')
      .eq('id', userId)
      .single();

    // Get project info
    const { data: project } = await supabase
      .from('standard_projects')
      .select('title, tier')
      .eq('id', projectId)
      .single();

    // Save feedback to database (optional - create this table if you want to store feedback)
    const { error: insertError } = await supabase
      .from('feedback')
      .insert({
        user_id: userId,
        project_id: projectId,
        rating,
        feedback: feedback || null,
        url,
        created_at: new Date().toISOString()
      });

    if (insertError) {
      console.error('Failed to save feedback to database:', insertError);
      // Don't fail the request if database save fails
    }

    // Send email notification
    const emailContent = `
      <h2>New Feedback from W3 WriteLab</h2>
      <hr />
      <h3>Rating: ${'⭐'.repeat(rating)} (${rating}/5)</h3>
      
      <h4>User Details:</h4>
      <ul>
        <li><strong>Username:</strong> ${userProfile?.username || 'Unknown'}</li>
        <li><strong>Email:</strong> ${userProfile?.email || 'Unknown'}</li>
        <li><strong>User ID:</strong> ${userId}</li>
      </ul>

      <h4>Project Details:</h4>
      <ul>
        <li><strong>Project:</strong> ${project?.title || 'Unknown'}</li>
        <li><strong>Tier:</strong> ${project?.tier || 'Unknown'}</li>
        <li><strong>Project ID:</strong> ${projectId}</li>
      </ul>

      <h4>Feedback Message:</h4>
      <p style="background: #f5f5f5; padding: 15px; border-radius: 8px;">
        ${feedback || '<em>No additional feedback provided</em>'}
      </p>

      <h4>Page URL:</h4>
      <p><a href="${url}">${url}</a></p>

      <hr />
      <p style="color: #666; font-size: 12px;">
        Sent: ${new Date().toLocaleString('en-NG', { timeZone: 'Africa/Lagos' })}
      </p>
    `;

    // Send email using Resend
    const resendApiKey = process.env.RESEND_API_KEY;
    const adminEmail = process.env.ADMIN_EMAIL || 'your-email@example.com';

    if (resendApiKey) {
      const emailResponse = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: 'W3 WriteLab <onboarding@resend.dev>', // Change this when you verify your domain
          to: [adminEmail],
          subject: `⭐ New ${rating}-Star Feedback - W3 WriteLab`,
          html: emailContent
        })
      });

      if (!emailResponse.ok) {
        console.error('Failed to send email:', await emailResponse.text());
      }
    } else {
      console.warn('RESEND_API_KEY not configured - feedback saved but email not sent');
    }

    return NextResponse.json({
      success: true,
      message: 'Feedback submitted successfully'
    });

  } catch (error) {
    console.error('Feedback API error:', error);
    return NextResponse.json(
      { error: 'Failed to submit feedback' },
      { status: 500 }
    );
  }
}