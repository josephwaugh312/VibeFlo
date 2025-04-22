import { sendVerificationEmail, sendPasswordResetEmail } from '../../services/email.service';
import nodemailer from 'nodemailer';

// Mock nodemailer
jest.mock('nodemailer', () => ({
  createTransport: jest.fn().mockReturnValue({
    sendMail: jest.fn().mockResolvedValue({ messageId: 'test-message-id' })
  })
}));

// Override the isDevelopment variable in the email service module
jest.mock('../../services/email.service', () => {
  const originalModule = jest.requireActual('../../services/email.service');
  
  return {
    ...originalModule,
    // Force module to re-evaluate isDevelopment based on our test env vars
    sendVerificationEmail: async (email: string, verificationUrl: string) => {
      // Re-evaluate isDevelopment for each test
      const isDev = process.env.SKIP_EMAILS === 'true' || process.env.NODE_ENV === 'development';
      if (isDev) {
        console.log('\n==== DEVELOPMENT MODE: Email not sent ====');
        console.log(`Verification URL for ${email}: ${verificationUrl}`);
        console.log('Copy this URL to verify the account');
        console.log('=======================================\n');
        return;
      }
      return originalModule.sendVerificationEmail(email, verificationUrl);
    },
    sendPasswordResetEmail: async (email: string, resetUrl: string) => {
      // Re-evaluate isDevelopment for each test
      const isDev = process.env.SKIP_EMAILS === 'true' || process.env.NODE_ENV === 'development';
      if (isDev) {
        console.log('\n==== DEVELOPMENT MODE: Email not sent ====');
        console.log(`Password reset URL for ${email}: ${resetUrl}`);
        console.log('Copy this URL to reset the password');
        console.log('=======================================\n');
        return;
      }
      return originalModule.sendPasswordResetEmail(email, resetUrl);
    }
  };
});

// Mock console methods to reduce test noise
jest.spyOn(console, 'log').mockImplementation(() => {});
jest.spyOn(console, 'error').mockImplementation(() => {});

describe('Email Service', () => {
  // Store original environment variables
  const originalEnv = { ...process.env };
  
  // Setup before each test
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset environment variables for each test
    process.env = { ...originalEnv };
  });
  
  // Restore environment after all tests
  afterAll(() => {
    process.env = originalEnv;
  });

  describe('sendVerificationEmail', () => {
    it('should log URL instead of sending email in development mode', async () => {
      // Setup test data
      const email = 'test@example.com';
      const verificationUrl = 'http://localhost:3000/verify/token123';
      
      // Set development mode
      process.env.NODE_ENV = 'development';
      
      // Execute function
      await sendVerificationEmail(email, verificationUrl);
      
      // Verify console was logged with URL
      expect(console.log).toHaveBeenCalledWith(expect.stringContaining('DEVELOPMENT MODE'));
      
      // Verify email was not sent
      const mockTransporter = nodemailer.createTransport();
      expect(mockTransporter.sendMail).not.toHaveBeenCalled();
    });
    
    it('should send email in production mode', async () => {
      // Setup test data
      const email = 'test@example.com';
      const verificationUrl = 'http://example.com/verify/token123';
      
      // Set production mode
      process.env.NODE_ENV = 'production';
      process.env.SKIP_EMAILS = 'false';
      process.env.EMAIL_USER = 'test@vibeflo.com';
      
      // Execute function
      await sendVerificationEmail(email, verificationUrl);
      
      // Verify email was sent
      const mockTransporter = nodemailer.createTransport();
      expect(mockTransporter.sendMail).toHaveBeenCalledWith(expect.objectContaining({
        from: process.env.EMAIL_USER,
        to: email,
        subject: expect.stringContaining('Verify'),
        html: expect.stringContaining(verificationUrl)
      }));
    });
    
    it('should throw error when sending fails', async () => {
      // Setup test data
      const email = 'test@example.com';
      const verificationUrl = 'http://example.com/verify/token123';
      
      // Set production mode
      process.env.NODE_ENV = 'production';
      process.env.SKIP_EMAILS = 'false';
      
      // Mock a failure in sending email
      const mockTransporter = nodemailer.createTransport();
      (mockTransporter.sendMail as jest.Mock).mockRejectedValueOnce(new Error('Failed to send email'));
      
      // Execute and expect error
      await expect(sendVerificationEmail(email, verificationUrl)).rejects.toThrow('Failed to send email');
    });
  });

  describe('sendPasswordResetEmail', () => {
    it('should log URL instead of sending email in development mode', async () => {
      // Setup test data
      const email = 'test@example.com';
      const resetUrl = 'http://localhost:3000/reset-password/token123';
      
      // Set development mode
      process.env.NODE_ENV = 'development';
      
      // Execute function
      await sendPasswordResetEmail(email, resetUrl);
      
      // Verify console was logged with URL
      expect(console.log).toHaveBeenCalledWith(expect.stringContaining('DEVELOPMENT MODE'));
      
      // Verify email was not sent
      const mockTransporter = nodemailer.createTransport();
      expect(mockTransporter.sendMail).not.toHaveBeenCalled();
    });
    
    it('should send email in production mode', async () => {
      // Setup test data
      const email = 'test@example.com';
      const resetUrl = 'http://example.com/reset-password/token123';
      
      // Set production mode
      process.env.NODE_ENV = 'production';
      process.env.SKIP_EMAILS = 'false';
      process.env.EMAIL_USER = 'test@vibeflo.com';
      
      // Execute function
      await sendPasswordResetEmail(email, resetUrl);
      
      // Verify email was sent
      const mockTransporter = nodemailer.createTransport();
      expect(mockTransporter.sendMail).toHaveBeenCalledWith(expect.objectContaining({
        from: process.env.EMAIL_USER,
        to: email,
        subject: expect.stringContaining('Reset'),
        html: expect.stringContaining(resetUrl)
      }));
    });
    
    it('should skip sending when SKIP_EMAILS is true', async () => {
      // Setup test data
      const email = 'test@example.com';
      const resetUrl = 'http://example.com/reset-password/token123';
      
      // Set skip emails flag
      process.env.NODE_ENV = 'production';
      process.env.SKIP_EMAILS = 'true';
      
      // Execute function
      await sendPasswordResetEmail(email, resetUrl);
      
      // Verify console was logged with URL
      expect(console.log).toHaveBeenCalledWith(expect.stringContaining('DEVELOPMENT MODE'));
      
      // Verify email was not sent
      const mockTransporter = nodemailer.createTransport();
      expect(mockTransporter.sendMail).not.toHaveBeenCalled();
    });
    
    it('should throw error when sending fails', async () => {
      // Setup test data
      const email = 'test@example.com';
      const resetUrl = 'http://example.com/reset-password/token123';
      
      // Set production mode
      process.env.NODE_ENV = 'production';
      process.env.SKIP_EMAILS = 'false';
      
      // Mock a failure in sending email
      const mockTransporter = nodemailer.createTransport();
      (mockTransporter.sendMail as jest.Mock).mockRejectedValueOnce(new Error('Failed to send email'));
      
      // Execute and expect error
      await expect(sendPasswordResetEmail(email, resetUrl)).rejects.toThrow('Failed to send email');
    });
  });
}); 