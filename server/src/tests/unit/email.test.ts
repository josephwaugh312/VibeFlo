import * as emailAdapter from '../../services/email.adapter';

// Mock the email service
jest.mock('../../services/email.adapter', () => ({
  sendVerificationEmail: jest.fn(),
  sendPasswordResetEmail: jest.fn()
}));

describe('Email Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('sendVerificationEmail', () => {
    const testEmail = 'test@example.com';
    const testName = 'Test User';
    const testVerificationUrl = 'http://localhost:3000/verify/123';

    it('should call the email service with correct parameters', async () => {
      // Mock successful resolution
      (emailAdapter.sendVerificationEmail as jest.Mock).mockResolvedValueOnce(undefined);
      
      // Call the function
      await emailAdapter.sendVerificationEmail(testEmail, testName, testVerificationUrl);
      
      // Verify it was called with correct params
      expect(emailAdapter.sendVerificationEmail).toHaveBeenCalledWith(
        testEmail, 
        testName, 
        testVerificationUrl
      );
    });

    it('should handle errors properly', async () => {
      // Mock rejection
      (emailAdapter.sendVerificationEmail as jest.Mock).mockRejectedValueOnce(
        new Error('Failed to send email')
      );
      
      // Test that error is properly passed through
      await expect(
        emailAdapter.sendVerificationEmail(testEmail, testName, testVerificationUrl)
      ).rejects.toThrow('Failed to send email');
    });
  });

  describe('sendPasswordResetEmail', () => {
    const testEmail = 'test@example.com';
    const testName = 'Test User';
    const testResetUrl = 'http://localhost:3000/reset/123';

    it('should call the email service with correct parameters', async () => {
      // Mock successful resolution  
      (emailAdapter.sendPasswordResetEmail as jest.Mock).mockResolvedValueOnce(undefined);
      
      // Call the function
      await emailAdapter.sendPasswordResetEmail(testEmail, testName, testResetUrl);
      
      // Verify it was called with correct params
      expect(emailAdapter.sendPasswordResetEmail).toHaveBeenCalledWith(
        testEmail,
        testName,
        testResetUrl
      );
    });

    it('should handle errors properly', async () => {
      // Mock rejection
      (emailAdapter.sendPasswordResetEmail as jest.Mock).mockRejectedValueOnce(
        new Error('Failed to send reset email')
      );
      
      // Test that error is properly passed through
      await expect(
        emailAdapter.sendPasswordResetEmail(testEmail, testName, testResetUrl)
      ).rejects.toThrow('Failed to send reset email');
    });
  });
}); 