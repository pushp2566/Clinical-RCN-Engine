import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(request) {
  try {
    const { to, subject, html } = await request.json();

    if (!to) {
       return NextResponse.json({ success: false, error: 'Recipient email is required.' }, { status: 400 });
    }

    // Generate test SMTP service account from ethereal.email
    const testAccount = await nodemailer.createTestAccount();

    const transporter = nodemailer.createTransport({
      host: testAccount.smtp.host,
      port: testAccount.smtp.port,
      secure: testAccount.smtp.secure,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });

    const info = await transporter.sendMail({
      from: '"Antigravity Workflow" <system@antigravity-clinical.local>',
      to,
      subject: subject || 'Antigravity Automated Notification',
      html: html || '<p>Automated message triggered from clinical dashboard workflow.</p>',
    });

    // Preview URL generation using Ethereal
    const previewUrl = nodemailer.getTestMessageUrl(info);

    return NextResponse.json({ 
        success: true, 
        messageId: info.messageId, 
        previewUrl 
    });

  } catch (error) {
    console.error("Mail routing Error:", error);
    return NextResponse.json({ success: false, error: "Failed to send email." }, { status: 500 });
  }
}
