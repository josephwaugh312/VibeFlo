import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

// Create a transporter using Gmail SMTP
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

// Determine if we're in development mode - either explicitly set or default to true when NODE_ENV is development
const isDevelopment = process.env.SKIP_EMAILS === 'true' || process.env.NODE_ENV === 'development';

export const sendVerificationEmail = async (email: string, verificationUrl: string) => {
  try {
    // In development, just log the URL instead of sending an email
    if (isDevelopment) {
      console.log('\n==== DEVELOPMENT MODE: Email not sent ====');
      console.log(`Verification URL for ${email}: ${verificationUrl}`);
      console.log('Copy this URL to verify the account');
      console.log('=======================================\n');
      return; // Skip actual email sending
    }

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Verify your VibeFlo account',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #7C3AED;">Welcome to VibeFlo!</h2>
          <p>Thank you for creating an account. Please verify your email address by clicking the button below:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${verificationUrl}" 
               style="background-color: #7C3AED; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
              Verify Email
            </a>
          </div>
          <p>Or copy and paste this link into your browser:</p>
          <p style="word-break: break-all;">${verificationUrl}</p>
          <p>This link will expire in 24 hours.</p>
          <p>If you didn't create this account, you can safely ignore this email.</p>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log(`Verification email sent to ${email}`);
  } catch (error) {
    console.error('Error sending verification email:', error);
    throw error;
  }
};

export const sendPasswordResetEmail = async (email: string, resetUrl: string) => {
  try {
    // In development, just log the URL instead of sending an email
    if (isDevelopment) {
      console.log('\n==== DEVELOPMENT MODE: Email not sent ====');
      console.log(`Password reset URL for ${email}: ${resetUrl}`);
      console.log('Copy this URL to reset the password');
      console.log('=======================================\n');
      return; // Skip actual email sending
    }

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Reset your VibeFlo password',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #7C3AED;">Password Reset Request</h2>
          <p>You requested to reset your password. Click the button below to proceed:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" 
               style="background-color: #7C3AED; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
              Reset Password
            </a>
          </div>
          <p>Or copy and paste this link into your browser:</p>
          <p style="word-break: break-all;">${resetUrl}</p>
          <p>This link will expire in 1 hour.</p>
          <p>If you didn't request this password reset, you can safely ignore this email.</p>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log(`Password reset email sent to ${email}`);
  } catch (error) {
    console.error('Error sending password reset email:', error);
    throw error;
  }
}; 