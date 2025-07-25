// app/api/contact/route.ts

import { NextRequest } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(req) {
  console.log('EMAIL_USER:', process.env.EMAIL_USER);
  console.log('EMAIL_PASS:', process.env.EMAIL_PASS ? '*****' : 'Not set');

  const body = await req.json();
  const { name, email, subject, message } = body;

  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      replyTo: email,
      to: process.env.EMAIL_USER,
      subject,
      text: `Name: ${name}\nEmail: ${email}\nMessage: ${message}`,
    });

    // ✅ ADD THIS: Create Notification via API
    await fetch(`${process.env.BASE_URL}/api/notifications/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: 'admin',
        title: `Contact Form Message from ${name}`,
        message,
        type: 'contact',
      }),
    });

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error sending email:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to send message',
      details: error.message,
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
