// app/api/capture-lead/route.ts
import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(request: NextRequest) {
  try {
    const leadData = await request.json();

    const transporter = nodemailer.createTransport({   // ← THIS LINE WAS WRONG BEFORE
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    await transporter.sendMail({
      from: `"Black Vault Audit" <${process.env.FROM_EMAIL}>`,
      to: process.env.TO_TPOS,
      cc: process.env.CC_EMAIL,
      subject: `New Lead: ${leadData.businessName} – $${Number(leadData.annualOvercharge).toLocaleString()} Savings`,
      html: `
        <h2>New Black Vault Forensic Audit Lead</h2>
        <p><strong>Business:</strong> ${leadData.businessName}</p>
        <p><strong>Email:</strong> ${leadData.businessEmail}</p>
        <p><strong>Phone:</strong> ${leadData.businessPhone}</p>
        <p><strong>Industry:</strong> ${leadData.businessType}</p>
        <p><strong>Monthly Volume:</strong> $${Number(leadData.monthlyVolume).toLocaleString()}</p>
        <p><strong>Current Effective Rate:</strong> ${leadData.currentRate}%</p>
        <p><strong>Annual Overcharge / Savings Opportunity:</strong> <strong>$${Number(leadData.annualOvercharge).toLocaleString()}</strong></p>
        <hr>
        <pre>${JSON.stringify(leadData, null, 2)}</pre>
      `,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Lead capture error:', error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
