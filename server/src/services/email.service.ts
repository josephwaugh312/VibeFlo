import sgMail from '@sendgrid/mail';
import dotenv from 'dotenv';

dotenv.config();

// Configure SendGrid with API key from environment variables
const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
const FROM_EMAIL = process.env.EMAIL_FROM || 'joseph.waugh312@gmail.com';
const NODE_ENV = process.env.NODE_ENV || 'development';
const IS_DEV = NODE_ENV === 'development';
const IS_TEST = process.env.NODE_ENV === 'test' || process.env.JEST_WORKER_ID !== undefined;

// Check for SendGrid API key
if (!SENDGRID_API_KEY) {
  console.warn('SENDGRID_API_KEY is not set in environment variables');
  if (!IS_DEV && !IS_TEST) {
    // Only throw error in production
    throw new Error('SendGrid API key is required for email functionality in production');
  }
}

if (!FROM_EMAIL) {
  console.warn('EMAIL_FROM is not set in environment variables');
  if (!IS_DEV && !IS_TEST) {
    // Only throw error in production
    throw new Error('Sender email address is required for email functionality in production');
  }
}

const CLIENT_URL = process.env.CLIENT_URL || 'https://vibeflo.app';

// Initialize SendGrid if API key is available and not in test environment
if (SENDGRID_API_KEY && !IS_TEST) {
  sgMail.setApiKey(SENDGRID_API_KEY);
  console.log('SendGrid configured successfully with sender:', FROM_EMAIL);
  
  // Test SendGrid configuration - Only in development, not in tests
  if (!IS_TEST) {
    sgMail.send({
      to: FROM_EMAIL,
      from: FROM_EMAIL,
      subject: 'SendGrid Test',
      text: 'Testing SendGrid configuration',
      html: '<p>Testing SendGrid configuration</p>'
    }).then(() => {
      console.log('SendGrid test email sent successfully');
    }).catch((error) => {
      console.error('SendGrid test email failed:', error);
      if (error.response) {
        console.error('SendGrid API Response:', {
          statusCode: error.response.statusCode,
          body: error.response.body,
          headers: error.response.headers
        });
      }
    });
  }
} else {
  if (IS_TEST) {
    console.log('Running in test environment - email functionality will be mocked');
  } else {
    console.log('SendGrid not configured - email functionality will use mock implementation in development');
  }
}

/**
 * Base email service providing methods for sending various types of emails
 */
class EmailService {
  /**
   * Send a verification email to a newly registered user
   * @param to Email address of the recipient
   * @param name Name of the recipient
   * @param token Verification token
   */
  async sendVerificationEmail(to: string, name: string, token: string): Promise<void> {
    try {
      if (!SENDGRID_API_KEY || IS_TEST) {
        console.log('Skipping verification email - SendGrid API key not configured or in test environment');
        // Still log the token for testing environments
        console.log(`[DEV] Verification token for ${to}: ${token}`);
        console.log(`[DEV] Verification link: ${CLIENT_URL}/verify/${token}`);
        return;
      }

      const verificationLink = `${CLIENT_URL}/verify/${token}`;
      
      // Create the email
      const msg = {
        to,
        from: FROM_EMAIL,
        subject: 'Verify your VibeFlo account',
        text: `Hi ${name},\n\nWelcome to VibeFlo! Please verify your email address by clicking the link below:\n\n${verificationLink}\n\nThis link will expire in 24 hours.\n\nThank you,\nThe VibeFlo Team`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
            <div style="text-align: center; margin-bottom: 20px;">
              <h1 style="color: #6d28d9;">VibeFlo</h1>
            </div>
            <div style="background-color: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
              <h2 style="color: #333; margin-top: 0;">Welcome to VibeFlo!</h2>
              <p>Hi ${name},</p>
              <p>Thanks for signing up! To get started, please verify your email address.</p>
              <div style="text-align: center; margin: 30px 0;">
                <a href="${verificationLink}" style="background-color: #6d28d9; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block; font-weight: bold;">Verify Email Address</a>
              </div>
              <p style="color: #666; font-size: 14px;">This link will expire in 24 hours.</p>
              <p>If you didn't create an account with VibeFlo, you can ignore this email.</p>
              <p>Thank you,<br>The VibeFlo Team</p>
            </div>
            <div style="text-align: center; margin-top: 20px; color: #888; font-size: 12px;">
              <p>&copy; ${new Date().getFullYear()} VibeFlo. All rights reserved.</p>
            </div>
          </div>
        `
      };

      console.log('Attempting to send verification email with config:', {
        to,
        from: FROM_EMAIL,
        subject: msg.subject,
        apiKeyPresent: !!SENDGRID_API_KEY,
        apiKeyLength: SENDGRID_API_KEY?.length,
        domain: FROM_EMAIL.split('@')[1]
      });

      await sgMail.send(msg);
      console.log('Verification email sent successfully to:', to);
    } catch (error: any) {
      console.error('Error sending verification email:', {
        error: error.message,
        code: error.code,
        response: error.response ? {
          statusCode: error.response.statusCode,
          body: error.response.body,
          headers: error.response.headers
        } : 'No response details',
        to,
        from: FROM_EMAIL,
        apiKeyPresent: !!SENDGRID_API_KEY,
        apiKeyLength: SENDGRID_API_KEY?.length
      });
      throw error;
    }
  }

  /**
   * Send a password reset email
   * @param to Email address of the recipient
   * @param name Name of the recipient
   * @param token Password reset token
   */
  async sendPasswordResetEmail(to: string, name: string, token: string): Promise<void> {
    try {
      if (!SENDGRID_API_KEY || IS_TEST) {
        console.warn('Skipping password reset email - SendGrid API key not configured or in test environment');
        // Still log the token for testing environments
        console.log(`[DEV] Password reset token for ${to}: ${token}`);
        console.log(`[DEV] Password reset link: ${CLIENT_URL}/reset-password/${token}`);
        return;
      }

      const resetLink = `${CLIENT_URL}/reset-password/${token}`;
      
      // Create the email
      const msg = {
        to,
        from: FROM_EMAIL,
        subject: 'Reset your VibeFlo password',
        text: `Hi ${name},\n\nWe received a request to reset your VibeFlo password. Click the link below to set a new password:\n\n${resetLink}\n\nThis link will expire in 1 hour.\n\nIf you didn't request a password reset, you can ignore this email.\n\nThank you,\nThe VibeFlo Team`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
            <div style="text-align: center; margin-bottom: 20px;">
              <h1 style="color: #6d28d9;">VibeFlo</h1>
            </div>
            <div style="background-color: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
              <h2 style="color: #333; margin-top: 0;">Reset Your Password</h2>
              <p>Hi ${name},</p>
              <p>We received a request to reset your VibeFlo password. Click the button below to set a new password:</p>
              <div style="text-align: center; margin: 30px 0;">
                <a href="${resetLink}" style="background-color: #6d28d9; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block; font-weight: bold;">Reset Password</a>
              </div>
              <p style="color: #666; font-size: 14px;">This link will expire in 1 hour.</p>
              <p>If you didn't request a password reset, you can ignore this email.</p>
              <p>Thank you,<br>The VibeFlo Team</p>
            </div>
            <div style="text-align: center; margin-top: 20px; color: #888; font-size: 12px;">
              <p>&copy; ${new Date().getFullYear()} VibeFlo. All rights reserved.</p>
            </div>
          </div>
        `
      };

      // Send the email
      await sgMail.send(msg);
      console.log(`Password reset email sent to ${to}`);
    } catch (error) {
      console.error('Error sending password reset email:', error);
      throw new Error('Failed to send password reset email');
    }
  }

  /**
   * Send a notification email for various purposes
   * @param to Email address of the recipient
   * @param name Name of the recipient 
   * @param subject Email subject
   * @param message Email message
   */
  async sendNotificationEmail(to: string, name: string, subject: string, message: string): Promise<void> {
    try {
      if (!SENDGRID_API_KEY || IS_TEST) {
        console.warn('Skipping notification email - SendGrid API key not configured or in test environment');
        console.log(`[DEV] Notification to ${to}: ${subject} - ${message}`);
        return;
      }

      // Create the email
      const msg = {
        to,
        from: FROM_EMAIL,
        subject,
        text: `Hi ${name},\n\n${message}\n\nThank you,\nThe VibeFlo Team`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
            <div style="text-align: center; margin-bottom: 20px;">
              <h1 style="color: #6d28d9;">VibeFlo</h1>
            </div>
            <div style="background-color: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
              <h2 style="color: #333; margin-top: 0;">${subject}</h2>
              <p>Hi ${name},</p>
              <p>${message}</p>
              <p>Thank you,<br>The VibeFlo Team</p>
            </div>
            <div style="text-align: center; margin-top: 20px; color: #888; font-size: 12px;">
              <p>&copy; ${new Date().getFullYear()} VibeFlo. All rights reserved.</p>
            </div>
          </div>
        `
      };

      // Send the email
      await sgMail.send(msg);
      console.log(`Notification email sent to ${to}`);
    } catch (error) {
      console.error('Error sending notification email:', error);
      throw new Error('Failed to send notification email');
    }
  }
}

// Create instance
const emailServiceInstance = new EmailService();

// Export the methods directly for tests to use
export const sendVerificationEmail = emailServiceInstance.sendVerificationEmail.bind(emailServiceInstance);
export const sendPasswordResetEmail = emailServiceInstance.sendPasswordResetEmail.bind(emailServiceInstance);
export const sendNotificationEmail = emailServiceInstance.sendNotificationEmail.bind(emailServiceInstance);

// Default export - the full service instance
export default emailServiceInstance; 