import { NextResponse } from 'next/server';
import { SESClient, SendRawEmailCommand } from "@aws-sdk/client-ses";

// Initialize SES Client
const sesClient = new SESClient({
  region: process.env.AWS_REGION || "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || ""
  }
});

// Helper to construct a raw MIME email (handles attachments and HTML properly)
function createMimeMessage({ from, to, subject, html, attachments }) {
  const boundary = "----=_Part_" + Math.random().toString(36).substring(2);
  let raw = [];
  raw.push(`From: ${from}`);
  raw.push(`To: ${to}`);
  if (!from.toLowerCase().includes('noreply')) {
    raw.push(`Reply-To: W3 WriteLab <w3writelab@gmail.com>`);
  }
  raw.push(`Subject: ${subject}`);
  raw.push(`Mime-Version: 1.0`);
  raw.push(`Content-Type: multipart/mixed; boundary="${boundary}"`);
  raw.push(``);
  raw.push(`--${boundary}`);
  raw.push(`Content-Type: text/html; charset=UTF-8`);
  raw.push(`Content-Transfer-Encoding: 7bit`);
  raw.push(``);
  raw.push(html);
  
  if (attachments && attachments.length > 0) {
    attachments.forEach(att => {
      const buffer = Buffer.from(att.content);
      const base64Content = buffer.toString("base64");
      
      raw.push(``);
      raw.push(`--${boundary}`);
      raw.push(`Content-Type: application/octet-stream; name="${att.filename}"`);
      raw.push(`Content-Description: ${att.filename}`);
      raw.push(`Content-Disposition: attachment; filename="${att.filename}"; size=${buffer.length}`);
      raw.push(`Content-Transfer-Encoding: base64`);
      raw.push(``);
      raw.push(base64Content);
    });
  }
  raw.push(``);
  raw.push(`--${boundary}--`);
  return raw.join("\r\n");
}

// Branded HTML email template wrapper
function getBrandedTemplate(subject, bodyText, category) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://w3writelab.com';
  const logoUrl = `${baseUrl}/premium_icon/favicon.ico`;
  
  // Format body paragraphs
  const htmlContent = bodyText
    .split('\n\n')
    .filter(p => p.trim().length > 0)
    .map(p => `<p style="margin: 0 0 16px 0; font-size: 15px; line-height: 1.6; color: #334155;">${p.replace(/\n/g, '<br/>')}</p>`)
    .join('');

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; margin: 0; padding: 0;">
  <div style="background-color: #f8fafc; padding: 32px 16px;">
    <div style="background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; max-width: 600px; margin: 0 auto; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.03);">
      
      <!-- Branded Header -->
      <div style="background-color: #0f172a; padding: 28px; text-align: center;">
        <img src="${logoUrl}" alt="W3 WriteLab" style="height: 36px; width: 36px; vertical-align: middle; border-radius: 6px;" />
        <div style="color: #ffffff; font-size: 18px; font-weight: 800; letter-spacing: 0.05em; margin-top: 8px; text-transform: uppercase;">W3 WriteLab</div>
      </div>
      
      <!-- Content Area -->
      <div style="padding: 32px 24px;">
        <div style="display: inline-block; font-size: 10px; font-weight: 800; letter-spacing: 0.1em; text-transform: uppercase; padding: 4px 10px; border-radius: 9999px; margin-bottom: 20px; 
          ${category === 'notice' ? 'background-color: #fef3c7; color: #d97706;' : ''}
          ${category === 'update' ? 'background-color: #dbeafe; color: #2563eb;' : ''}
          ${category === 'promotion' ? 'background-color: #d1fae5; color: #059669;' : ''}
          ${category === 'survey' ? 'background-color: #f3e8ff; color: #7c3aed;' : ''}
          ${category === 'plain' ? 'background-color: #f1f5f9; color: #475569;' : ''}
        ">
          ${category.toUpperCase()}
        </div>
        
        <h1 style="color: #0f172a; font-size: 20px; font-weight: 800; margin: 0 0 16px 0; letter-spacing: -0.02em;">${subject}</h1>
        <div style="margin-top: 8px;">
          ${htmlContent}
        </div>
      </div>
      
      <!-- Footer -->
      <div style="background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 24px; text-align: center;">
        <p style="color: #64748b; font-size: 11px; margin: 0; line-height: 1.5;">This is an official administrative broadcast sent from W3 WriteLab.</p>
        <p style="color: #64748b; font-size: 11px; margin: 4px 0 0 0;">&copy; ${new Date().getFullYear()} W3 WriteLab. All rights reserved.</p>
        <div style="margin-top: 12px;">
          <a href="${baseUrl}" style="color: #6366f1; text-decoration: none; font-weight: 600; font-size: 11px; margin: 0 8px;">Website</a>
          <a href="${baseUrl}/terms" style="color: #6366f1; text-decoration: none; font-weight: 600; font-size: 11px; margin: 0 8px;">Terms</a>
          <a href="mailto:support@w3writelab.com" style="color: #6366f1; text-decoration: none; font-weight: 600; font-size: 11px; margin: 0 8px;">Support</a>
        </div>
      </div>
      
    </div>
  </div>
</body>
</html>`;
}

export async function POST(request) {
  try {
    const { from, recipients, subject, body, category = 'notice', attachments } = await request.json();

    if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
      console.error('AWS Credentials missing in environment');
      return NextResponse.json({ error: 'AWS SES configuration is missing on the server' }, { status: 500 });
    }

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

    // Format the email using our branded template
    const htmlEmail = getBrandedTemplate(subject, body, category);

    // Send emails sequentially through AWS SES
    for (const email of recipients) {
      try {
        const rawMime = createMimeMessage({
          from: from || 'W3 WriteLab Support <support@support.w3writelab.com>',
          to: email,
          subject: subject,
          html: htmlEmail,
          attachments: attachments
        });

        const command = new SendRawEmailCommand({
          RawMessage: {
            Data: new TextEncoder().encode(rawMime)
          }
        });

        await sesClient.send(command);
        results.success++;
      } catch (err) {
        console.error(`AWS SES send failure to ${email}:`, err);
        results.failed++;
        results.errors.push({ email, error: err.message });
      }

      // Small delay to respect SES send limits
      await new Promise(resolve => setTimeout(resolve, 150));
    }

    return NextResponse.json(results);

  } catch (error) {
    console.error('SES Email sending endpoint error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
