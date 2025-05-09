const sgMail = require('@sendgrid/mail');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
const FROM_EMAIL = 'noreply@vibeflo.app';
const TO_EMAIL = 'joseph.waugh312@gmail.com';

if (!SENDGRID_API_KEY) {
  console.error('Error: SENDGRID_API_KEY environment variable is not set');
  process.exit(1);
}

sgMail.setApiKey(SENDGRID_API_KEY);

const msg = {
  to: TO_EMAIL,
  from: FROM_EMAIL,
  subject: 'VibeFlo Email Verification Test',
  text: 'This is a test verification email from VibeFlo to confirm email delivery is working correctly.',
  html: `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
      <div style="text-align: center; margin-bottom: 20px;">
        <h1 style="color: #6d28d9;">VibeFlo</h1>
      </div>
      <div style="background-color: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
        <h2 style="color: #333; margin-top: 0;">Email Verification Test</h2>
        <p>Hi Joseph,</p>
        <p>This is a test email to confirm that email delivery from VibeFlo is working correctly.</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="https://vibeflo.app" style="background-color: #6d28d9; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block; font-weight: bold;">Visit VibeFlo</a>
        </div>
        <p style="color: #666; font-size: 14px;">If you received this email, your email configuration is working correctly!</p>
        <p>Thank you,<br>The VibeFlo Team</p>
      </div>
      <div style="text-align: center; margin-top: 20px; color: #888; font-size: 12px;">
        <p>&copy; ${new Date().getFullYear()} VibeFlo. All rights reserved.</p>
      </div>
    </div>
  `
};

console.log('Sending test email to:', TO_EMAIL);

sgMail.send(msg)
  .then(() => {
    console.log('Test email sent successfully!');
  })
  .catch((error) => {
    console.error('Error sending test email:');
    console.error(error);
    if (error.response) {
      console.error('SendGrid API Response:', {
        statusCode: error.response.statusCode,
        body: error.response.body,
        headers: error.response.headers
      });
    }
  }); 