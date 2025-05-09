import emailService from '../../services/email.service';

// Mock the email service
jest.mock('../../services/email.service', () => ({
  sendVerificationEmail: jest.fn(),
  sendPasswordResetEmail: jest.fn()
}));

// Mock nodemailer
jest.mock('nodemailer', () => ({
  createTransport: jest.fn().mockReturnValue({
    sendMail: jest.fn().mockResolvedValue({ messageId: 'test-message-id' })
  })
}));

// Mock console methods to reduce test noise
jest.spyOn(console, 'log').mockImplementation(() => {});
jest.spyOn(console, 'error').mockImplementation(() => {});

describe('Email Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('sendVerificationEmail', () => {
    it('should call the email service with correct parameters', async () => {
      // Arrange
      const email = 'test@example.com';
      const name = 'Test User';
      const token = 'verification-token-123';
      
      // Mock successful resolution
      (emailService.sendVerificationEmail as jest.Mock).mockResolvedValueOnce(undefined);
      
      // Act
      await emailService.sendVerificationEmail(email, name, token);
      
      // Assert
      expect(emailService.sendVerificationEmail).toHaveBeenCalledTimes(1);
      expect(emailService.sendVerificationEmail).toHaveBeenCalledWith(email, name, token);
    });

    it('should handle errors properly', async () => {
      // Arrange
      const email = 'test@example.com';
      const name = 'Test User';
      const token = 'verification-token-123';
      
      // Mock rejection
      (emailService.sendVerificationEmail as jest.Mock).mockRejectedValueOnce(new Error('Failed to send'));
      
      // Act & Assert
      await expect(emailService.sendVerificationEmail(email, name, token))
        .rejects.toThrow('Failed to send');
    });
  });

  describe('sendPasswordResetEmail', () => {
    it('should call the email service with correct parameters', async () => {
      // Arrange
      const email = 'test@example.com';
      const name = 'Test User';
      const token = 'reset-token-456';
      
      // Mock successful resolution
      (emailService.sendPasswordResetEmail as jest.Mock).mockResolvedValueOnce(undefined);
      
      // Act
      await emailService.sendPasswordResetEmail(email, name, token);
      
      // Assert
      expect(emailService.sendPasswordResetEmail).toHaveBeenCalledTimes(1);
      expect(emailService.sendPasswordResetEmail).toHaveBeenCalledWith(email, name, token);
    });

    it('should handle errors properly', async () => {
      // Arrange
      const email = 'test@example.com';
      const name = 'Test User';
      const token = 'reset-token-456';
      
      // Mock rejection
      (emailService.sendPasswordResetEmail as jest.Mock).mockRejectedValueOnce(new Error('Failed to send'));
      
      // Act & Assert
      await expect(emailService.sendPasswordResetEmail(email, name, token))
        .rejects.toThrow('Failed to send');
    });
  });
}); 