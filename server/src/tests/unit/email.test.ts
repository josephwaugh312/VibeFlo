import * as emailService from '../../services/email.service';

describe('Email Service', () => {
  // Save original console methods
  const originalConsoleLog = console.log;
  const originalConsoleError = console.error;
  
  beforeEach(() => {
    // Mock console methods to prevent test output pollution
    console.log = jest.fn();
    console.error = jest.fn();
  });
  
  afterEach(() => {
    // Restore console methods
    console.log = originalConsoleLog;
    console.error = originalConsoleError;
  });
  
  describe('sendVerificationEmail', () => {
    it('should call console.log when sending email', async () => {
      // Setup test data
      const testEmail = 'test@example.com';
      const testVerificationUrl = 'http://example.com/verify/token123';
      
      // Call the function (it will either log or try to send, both of which we've mocked)
      await emailService.sendVerificationEmail(testEmail, testVerificationUrl);
      
      // Verify console.log was called - we don't care about the exact message
      expect(console.log).toHaveBeenCalled();
    });
  });
}); 