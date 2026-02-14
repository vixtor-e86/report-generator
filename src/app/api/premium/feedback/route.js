import { NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request) {
  try {
    const { 
      userId, 
      username, 
      userEmail, 
      contactEmail, 
      comment, 
      attachments, 
      projectId, 
      url 
    } = await request.json();

    if (!comment) {
      return NextResponse.json({ error: 'Comment is required' }, { status: 400 });
    }

    // Format attachments for email
    const attachmentLinks = attachments && attachments.length > 0 
      ? attachments.map(a => `<li><a href="${a.url}">${a.name}</a></li>`).join('')
      : 'None';

    try {
      const { data, error } = await resend.emails.send({
        from: 'W3 WriteLab Support <system@w3writelab.com>', 
        to: 'w3writelab@gmail.com',
        reply_to: contactEmail || userEmail,
        subject: `New Premium Feedback from ${username}`,
        html: `
          <div style="font-family: sans-serif; line-height: 1.6; color: #333; max-width: 600px;">
            <h2 style="color: #4f46e5; border-bottom: 2px solid #4f46e5; padding-bottom: 10px;">New Premium Feedback</h2>
            <p><strong>Username:</strong> ${username}</p>
            <p><strong>Account Email:</strong> ${userEmail}</p>
            <p><strong>Reply-to Email:</strong> ${contactEmail || 'Same as account'}</p>
            <p><strong>Project ID:</strong> ${projectId || 'N/A'}</p>
            <p><strong>Submitted From:</strong> <a href="${url}">${url}</a></p>
            
            <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0; border: 1px solid #e5e7eb;">
              <h3 style="margin-top: 0;">Comment:</h3>
              <p>${comment}</p>
            </div>

            <h3>Attachments:</h3>
            <ul>${attachmentLinks}</ul>
            
            <hr style="border: 0; border-top: 1px solid #eee; margin: 30px 0;" />
            <p style="font-size: 12px; color: #999;">Sent via W3 WriteLab Feedback System</p>
          </div>
        `
      });

      if (error) {
        console.error('Resend API Specific Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ success: true, data });
    } catch (resendException) {
      console.error('Resend Exception:', resendException);
      return NextResponse.json({ error: 'Mail service failed to initialize' }, { status: 500 });
    }

  } catch (error) {
    console.error('Feedback API Request Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
