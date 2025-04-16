import { validatePassword, validateUsername, validateEmail } from '../../utils/validation';

describe('Validation Utilities', () => {
  describe('validatePassword', () => {
    it('should return isValid true for a strong password', () => {
      const strongPassword = 'StrongP4ssword';
      const result = validatePassword(strongPassword);
      expect(result.isValid).toBe(true);
      expect(result.message).toBeUndefined();
    });

    it('should return isValid false for a short password', () => {
      const shortPassword = 'Short1';
      const result = validatePassword(shortPassword);
      expect(result.isValid).toBe(false);
      expect(result.message).toContain('at least 8 characters');
    });

    it('should return isValid false for a password without uppercase', () => {
      const noUppercase = 'lowercaseonly123';
      const result = validatePassword(noUppercase);
      expect(result.isValid).toBe(false);
      expect(result.message).toContain('one uppercase letter');
    });

    it('should return isValid false for a password without lowercase', () => {
      const noLowercase = 'UPPERCASEONLY123';
      const result = validatePassword(noLowercase);
      expect(result.isValid).toBe(false);
      expect(result.message).toContain('one lowercase letter');
    });

    it('should return isValid false for a password without numbers', () => {
      const noNumbers = 'NoNumbersHere';
      const result = validatePassword(noNumbers);
      expect(result.isValid).toBe(false);
      expect(result.message).toContain('one number');
    });

    it('should handle undefined or null password', () => {
      const result = validatePassword('');
      expect(result.isValid).toBe(false);
      expect(result.message).toContain('at least 8 characters');
    });
  });

  describe('validateUsername', () => {
    it('should return isValid true for a valid username', () => {
      const validUsername = 'user_123';
      const result = validateUsername(validUsername);
      expect(result.isValid).toBe(true);
      expect(result.message).toBeUndefined();
    });

    it('should return isValid false for an empty username', () => {
      const emptyUsername = '';
      const result = validateUsername(emptyUsername);
      expect(result.isValid).toBe(false);
      expect(result.message).toContain('required');
    });

    it('should return isValid false for a username that is too short', () => {
      const shortUsername = 'a1';
      const result = validateUsername(shortUsername);
      expect(result.isValid).toBe(false);
      expect(result.message).toContain('3-20 characters');
    });

    it('should return isValid false for a username that is too long', () => {
      const longUsername = 'thisusernameiswaytooooooooolong';
      const result = validateUsername(longUsername);
      expect(result.isValid).toBe(false);
      expect(result.message).toContain('3-20 characters');
    });

    it('should return isValid false for a username with invalid characters', () => {
      const invalidUsername = 'user@123';
      const result = validateUsername(invalidUsername);
      expect(result.isValid).toBe(false);
      expect(result.message).toContain('only contain letters, numbers, and underscores');
    });
  });

  describe('validateEmail', () => {
    it('should return isValid true for a valid email', () => {
      const validEmail = 'user@example.com';
      const result = validateEmail(validEmail);
      expect(result.isValid).toBe(true);
      expect(result.message).toBeUndefined();
    });

    it('should return isValid false for an empty email', () => {
      const emptyEmail = '';
      const result = validateEmail(emptyEmail);
      expect(result.isValid).toBe(false);
      expect(result.message).toContain('required');
    });

    it('should return isValid false for an email without @', () => {
      const invalidEmail = 'userexample.com';
      const result = validateEmail(invalidEmail);
      expect(result.isValid).toBe(false);
      expect(result.message).toContain('valid email');
    });

    it('should return isValid false for an email without domain', () => {
      const invalidEmail = 'user@';
      const result = validateEmail(invalidEmail);
      expect(result.isValid).toBe(false);
      expect(result.message).toContain('valid email');
    });

    it('should return isValid false for an email with spaces', () => {
      const invalidEmail = 'user @example.com';
      const result = validateEmail(invalidEmail);
      expect(result.isValid).toBe(false);
      expect(result.message).toContain('valid email');
    });
  });
}); 