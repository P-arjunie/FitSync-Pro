// Test email configuration
require("dotenv").config();
const nodemailer = require('nodemailer');

console.log("🔍 Testing Email Configuration...");
console.log("==================================");

// Check environment variables
console.log("📋 Environment Variables:");
console.log(`EMAIL_USER: ${process.env.EMAIL_USER ? '✅ Set' : '❌ Not set'}`);
console.log(`EMAIL_PASS: ${process.env.EMAIL_PASS ? '✅ Set' : '❌ Not set'}`);

if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
  console.log("\n❌ Missing email environment variables!");
  console.log("Please set EMAIL_USER and EMAIL_PASS in your .env file");
  process.exit(1);
}

// Test email configuration
async function testEmailConfig() {
  try {
    console.log("\n📧 Testing email transporter...");
    
    const transporter = nodemailer.createTransporter({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    // Verify the configuration
    await transporter.verify();
    console.log("✅ Email transporter is valid!");

    // Test sending a simple email
    console.log("\n📤 Sending test email...");
    const testEmail = await transporter.sendMail({
      from: `"FitSync Pro Test" <${process.env.EMAIL_USER}>`,
      to: process.env.EMAIL_USER, // Send to yourself as a test
      subject: "🧪 FitSync Pro Email Test",
      text: "This is a test email from FitSync Pro to verify email configuration is working.",
      html: `
        <h2>🧪 FitSync Pro Email Test</h2>
        <p>This is a test email to verify that your email configuration is working correctly.</p>
        <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
        <p>If you receive this email, your email setup is working! 🎉</p>
      `
    });

    console.log("✅ Test email sent successfully!");
    console.log(`📧 Message ID: ${testEmail.messageId}`);
    
  } catch (error) {
    console.error("❌ Email test failed:", error.message);
    
    if (error.code === 'EAUTH') {
      console.log("\n🔐 Authentication Error - Possible solutions:");
      console.log("1. Check your Gmail username and password");
      console.log("2. Enable 2-factor authentication on your Gmail account");
      console.log("3. Generate an App Password for this application");
      console.log("4. Make sure you're using an App Password, not your regular password");
    } else if (error.code === 'ECONNECTION') {
      console.log("\n🌐 Connection Error - Possible solutions:");
      console.log("1. Check your internet connection");
      console.log("2. Gmail might be blocking the connection");
      console.log("3. Try using a different email service");
    }
  }
}

testEmailConfig(); 