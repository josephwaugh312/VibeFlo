import { 
  validatePassword, 
  validateUsername, 
  validateEmail, 
  validateField 
} from '../../utils/validationUtils';

describe('Validation Utilities', () => {
  describe('validatePassword', () => {
    it('should reject empty passwords', () => {
      const result = validatePassword('');
      expect(result.isValid).toBe(false);
      expect(result.message).toContain('required');
    });
    
    it('should reject short passwords', () => {
      const result = validatePassword('Abc123');
      expect(result.isValid).toBe(false);
      expect(result.message).toContain('8 characters');
    });
    
    it('should reject passwords without uppercase letters', () => {
      const result = validatePassword('abcdefg123');
      expect(result.isValid).toBe(false);
      expect(result.message).toContain('uppercase');
    });
    
    it('should reject passwords without lowercase letters', () => {
      const result = validatePassword('ABCDEFG123');
      expect(result.isValid).toBe(false);
      expect(result.message).toContain('lowercase');
    });
    
    it('should reject passwords without numbers', () => {
      const result = validatePassword('AbcdefgHijk');
      expect(result.isValid).toBe(false);
      expect(result.message).toContain('number');
    });
    
    it('should accept valid passwords', () => {
      const result = validatePassword('Abcdefg123');
      expect(result.isValid).toBe(true);
      expect(result.message).toBeUndefined();
    });
  });
  
  describe('validateUsername', () => {
    it('should reject empty usernames', () => {
      const result = validateUsername('');
      expect(result.isValid).toBe(false);
      expect(result.message).toContain('required');
    });
    
    it('should reject usernames that are too short', () => {
      const result = validateUsername('ab');
      expect(result.isValid).toBe(false);
      expect(result.message).toContain('between 3 and 20');
    });
    
    it('should reject usernames that are too long', () => {
      const result = validateUsername('abcdefghijklmnopqrstuvwxyz');
      expect(result.isValid).toBe(false);
      expect(result.message).toContain('between 3 and 20');
    });
    
    it('should reject usernames that start with a number', () => {
      const result = validateUsername('1abcdef');
      expect(result.isValid).toBe(false);
      expect(result.message).toContain('start with a letter');
    });
    
    it('should reject usernames with special characters', () => {
      const result = validateUsername('abc-def');
      expect(result.isValid).toBe(false);
      expect(result.message).toContain('only contain letters');
    });
    
    it('should accept valid usernames', () => {
      const result = validateUsername('johndoe123');
      expect(result.isValid).toBe(true);
      expect(result.message).toBeUndefined();
    });
    
    it('should accept usernames with underscores', () => {
      const result = validateUsername('john_doe_123');
      expect(result.isValid).toBe(true);
      expect(result.message).toBeUndefined();
    });
  });
  
  describe('validateEmail', () => {
    it('should reject empty emails', () => {
      const result = validateEmail('');
      expect(result.isValid).toBe(false);
      expect(result.message).toContain('required');
    });
    
    it('should reject emails without @ symbol', () => {
      const result = validateEmail('johndoe.com');
      expect(result.isValid).toBe(false);
      expect(result.message).toContain('valid email');
    });
    
    it('should reject emails without domain', () => {
      const result = validateEmail('johndoe@');
      expect(result.isValid).toBe(false);
      expect(result.message).toContain('valid email');
    });
    
    it('should reject emails with invalid TLD', () => {
      const result = validateEmail('johndoe@example.c');
      expect(result.isValid).toBe(false);
      expect(result.message).toContain('valid email');
    });
    
    it('should accept valid emails', () => {
      const result = validateEmail('johndoe@example.com');
      expect(result.isValid).toBe(true);
      expect(result.message).toBeUndefined();
    });
    
    it('should accept emails with subdomains', () => {
      const result = validateEmail('johndoe@sub.example.com');
      expect(result.isValid).toBe(true);
      expect(result.message).toBeUndefined();
    });
    
    it('should accept emails with plus addressing', () => {
      const result = validateEmail('john.doe+test@example.com');
      expect(result.isValid).toBe(true);
      expect(result.message).toBeUndefined();
    });
  });
  
  describe('validateField', () => {
    it('should reject required fields with empty values', () => {
      const result = validateField('', { required: true, fieldName: 'Name' });
      expect(result.isValid).toBe(false);
      expect(result.message).toBe('Name is required');
    });
    
    it('should accept empty fields that are not required', () => {
      const result = validateField('', { required: false });
      expect(result.isValid).toBe(true);
      expect(result.message).toBeUndefined();
    });
    
    it('should reject fields that are too short', () => {
      const result = validateField('ab', { minLength: 3, fieldName: 'Name' });
      expect(result.isValid).toBe(false);
      expect(result.message).toContain('at least 3 characters');
    });
    
    it('should reject fields that are too long', () => {
      const result = validateField('abcdef', { maxLength: 5, fieldName: 'Name' });
      expect(result.isValid).toBe(false);
      expect(result.message).toContain('no more than 5 characters');
    });
    
    it('should apply custom validators', () => {
      const customValidator = (value: string) => {
        return value === 'valid'
          ? { isValid: true }
          : { isValid: false, message: 'Invalid value' };
      };
      
      const validResult = validateField('valid', { customValidator });
      expect(validResult.isValid).toBe(true);
      
      const invalidResult = validateField('invalid', { customValidator });
      expect(invalidResult.isValid).toBe(false);
      expect(invalidResult.message).toBe('Invalid value');
    });
    
    it('should combine multiple validations', () => {
      const result = validateField('a', { 
        required: true, 
        minLength: 3, 
        maxLength: 10,
        fieldName: 'Name'
      });
      expect(result.isValid).toBe(false);
      expect(result.message).toContain('at least 3 characters');
    });
  });
}); 