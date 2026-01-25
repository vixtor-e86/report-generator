// src/app/api/admin/email/send/route.js
import { NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request) {
  try {
    const { from, recipients, subject, body, attachments } = await request.json();

    if (!recipients || recipients.length === 0) {
      return NextResponse.json({ error: 'No recipients provided' }, { status: 400 });
    }

    if (!subject || !body) {
      return NextResponse.json({ error: 'Subject and body are required' }, { status: 400 });
    }

    const results = {
      success: 0,
      failed: 0,
      errors: []
    };

    // Send emails sequentially to avoid rate limits (or use batch if Plan allows, but simple loop is safer for now)
    for (const email of recipients) {
      try {
        const { data, error } = await resend.emails.send({
          from: from || 'W3 WriteLab <noreply@w3writelab.com>',
          to: [email],
          subject: subject,
          html: `<div style="font-family: sans-serif; color: #333;">${body.replace(/\n/g, '<br>')}</div>`,
          attachments: attachments // Expecting array of { filename, content } from client
        });

        if (error) {
          console.error(`Failed to send to ${email}:`, error);
          results.failed++;
          results.errors.push({ email, error: error.message });
        } else {
          results.success++;
        }
      } catch (err) {
        console.error(`Exception sending to ${email}:`, err);
        results.failed++;
        results.errors.push({ email, error: err.message });
      }
      
      // Small delay to be nice to API
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    return NextResponse.json(results);

  } catch (error) {
    console.error('Email sending error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
