import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(request: NextRequest) {
  try {
    const leadData = await request.json();

    // Create transporter
    const transporter = nodemailer.createTransporter({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    // Email structure for TPOS
    const mailOptions = {
      from: `"Black Vault Audit" <${process.env.FROM_EMAIL}>`,
      to: process.env.TO_TPOS,
      cc: process.env.CC_EMAIL || undefined,
      subject: `New High-Intent Lead: ${leadData.businessName} - $${leadData.annualOvercharge} Savings Opp`,
      text: `New lead from Black Vault Forensic Audit Tool:\n\n${JSON.stringify(leadData, null, 2)}`,
      html: `
        <h2>New Lead Alert: Black Vault Audit</h2>
        <p><strong>Business:</strong> ${leadData.businessName}</p>
        <p><strong>Email:</strong> ${leadData.businessEmail}</p>
        <p><strong>Phone:</strong> ${leadData.businessPhone}</p>
        <p><strong>Type:</strong> ${leadData.businessType}</p>
        <p><strong>Monthly Volume:</strong> $${leadData.monthlyVolume.toLocaleString()}</p>
        <p><strong>Current Rate:</strong> ${leadData.currentRate}%</p>
        <p><strong>Annual Overcharge:</strong> $${leadData.annualOvercharge.toLocaleString()}</p>
        <p><strong>Full Data:</strong> <pre>${JSON.stringify(leadData, null, 2)}</pre></p>
        <p>Action: Nurture via Lily AI for merchant services follow-up.</p>
      `,
    };

    await transporter.sendMail(mailOptions);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Lead capture error:', error);
    return NextResponse.json({ success: false, error: 'Failed to send lead' }, { status: 500 });
  }
}
