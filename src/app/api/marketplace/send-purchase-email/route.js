import { NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request) {
  try {
    const { email, projectTitle, price, downloadUrl } = await request.json();

    if (!email || !projectTitle || !downloadUrl) {
      console.error("Purchase Email Error: Missing fields", { email, projectTitle, downloadUrl });
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    console.log(`Attempting to send purchase email to: ${email} for project: ${projectTitle}`);

    const { data, error } = await resend.emails.send({
      from: 'W3 Hub <noreply@w3writelab.com>', 
      to: email,
      subject: `Your Project Download: ${projectTitle}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <img src="https://writelab.w3hub.com.ng/favicon.ico" alt="W3 Hub" style="width: 50px; height: 50px;">
            <h1 style="color: #111827; margin-top: 10px;">W3 HUB</h1>
          </div>
          
          <h2 style="color: #111827;">Purchase Confirmation</h2>
          <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
            Thank you for your purchase! You now have full access to the project: <strong>${projectTitle}</strong>.
          </p>
          
          <div style="background-color: #f9fafb; padding: 20px; border-radius: 12px; margin: 30px 0;">
            <p style="margin: 0; color: #6b7280; font-size: 14px; text-transform: uppercase; letter-spacing: 0.05em;">Amount Paid</p>
            <p style="margin: 5px 0 0 0; color: #111827; font-size: 24px; font-weight: bold;">₦${parseInt(price).toLocaleString()}</p>
          </div>
          
          <div style="text-align: center; margin: 40px 0;">
            <a href="${downloadUrl}" style="background-color: #111827; color: white; padding: 16px 32px; border-radius: 30px; text-decoration: none; font-weight: bold; font-size: 14px; text-transform: uppercase; letter-spacing: 0.1em; display: inline-block;">
              Download Project Repository
            </a>
          </div>
          
          <p style="color: #9ca3af; font-size: 12px; text-align: center; margin-top: 50px;">
            This project was verified and tested by the W3 HUB engineering team.<br>
            Always keep transactions within the platform for your protection.
          </p>
        </div>
      `
    });

    if (error) {
      console.error("Resend API error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log("Purchase email sent successfully:", data.id);
    return NextResponse.json({ success: true, id: data.id });

  } catch (error) {
    console.error('Fatal Email sending error:', error);
    return NextResponse.json({ error: error.message || "Failed to send email" }, { status: 500 });
  }
}
