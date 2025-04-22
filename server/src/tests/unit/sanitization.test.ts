import { 
  sanitizeHtml, 
  sanitizeSql, 
  sanitizeObject, 
  sanitizeQueryParams, 
  sanitizeEmail 
} from '../../utils/sanitization';

describe('Sanitization Utilities', () => {
  describe('sanitizeHtml', () => {
    it('should sanitize HTML special characters', () => {
      const input = '<script>alert("XSS");</script>';
      const expected = '&lt;script&gt;alert(&quot;XSS&quot;);&lt;&#x2F;script&gt;';
      expect(sanitizeHtml(input)).toBe(expected);
    });

    it('should handle empty input', () => {
      expect(sanitizeHtml('')).toBe('');
      expect(sanitizeHtml(null as any)).toBe('');
      expect(sanitizeHtml(undefined as any)).toBe('');
    });

    it('should not modify safe text', () => {
      const input = 'Hello, world!';
      expect(sanitizeHtml(input)).toBe(input);
    });

    it('should sanitize all potentially dangerous characters', () => {
      const input = '&<>"\'/ are dangerous';
      const expected = '&amp;&lt;&gt;&quot;&#x27;&#x2F; are dangerous';
      expect(sanitizeHtml(input)).toBe(expected);
    });
  });

  describe('sanitizeSql', () => {
    it('should sanitize SQL injection attempts', () => {
      const input = "DROP TABLE users; --";
      expect(sanitizeSql(input)).not.toContain(';');
      expect(sanitizeSql(input)).not.toContain('--');
    });

    it('should handle empty input', () => {
      expect(sanitizeSql('')).toBe('');
      expect(sanitizeSql(null as any)).toBe('');
      expect(sanitizeSql(undefined as any)).toBe('');
    });

    it('should escape single quotes', () => {
      const input = "O'Reilly";
      expect(sanitizeSql(input)).toBe("O''Reilly");
    });

    it('should remove SQL comments', () => {
      const input = "SELECT * FROM users /* get all users */";
      expect(sanitizeSql(input)).not.toContain('/*');
      expect(sanitizeSql(input)).not.toContain('*/');
    });
  });

  describe('sanitizeObject', () => {
    it('should sanitize all string properties of an object', () => {
      const input = {
        name: '<script>alert("XSS");</script>',
        age: 30,
        bio: 'Safe text'
      };
      
      const sanitized = sanitizeObject(input);
      
      expect(sanitized.name).toBe('&lt;script&gt;alert(&quot;XSS&quot;);&lt;&#x2F;script&gt;');
      expect(sanitized.age).toBe(30);
      expect(sanitized.bio).toBe('Safe text');
    });

    it('should handle nested objects', () => {
      const input = {
        user: {
          name: '<b>John</b>',
          profile: {
            website: 'https://example.com/<script>'
          }
        }
      };
      
      const sanitized = sanitizeObject(input);
      
      expect(sanitized.user.name).toBe('&lt;b&gt;John&lt;&#x2F;b&gt;');
      expect(sanitized.user.profile.website).toBe('https:&#x2F;&#x2F;example.com&#x2F;&lt;script&gt;');
    });

    it('should handle arrays', () => {
      const input = {
        tags: ['<script>', 'safe', '<img src="x" onerror="alert(1)">']
      };
      
      const sanitized = sanitizeObject(input);
      
      expect(sanitized.tags[0]).toBe('&lt;script&gt;');
      expect(sanitized.tags[1]).toBe('safe');
      expect(sanitized.tags[2]).toBe('&lt;img src=&quot;x&quot; onerror=&quot;alert(1)&quot;&gt;');
    });

    it('should handle null or undefined input', () => {
      expect(sanitizeObject(null as any)).toBeNull();
      expect(sanitizeObject(undefined as any)).toBeUndefined();
    });
  });

  describe('sanitizeQueryParams', () => {
    it('should sanitize query parameters', () => {
      const input = {
        search: '<script>alert("XSS");</script>',
        page: 1,
        sort: 'asc'
      };
      
      const sanitized = sanitizeQueryParams(input);
      
      expect(sanitized.search).toBe('&lt;script&gt;alert(&quot;XSS&quot;);&lt;&#x2F;script&gt;');
      expect(sanitized.page).toBe('1');
      expect(sanitized.sort).toBe('asc');
    });

    it('should handle empty or null/undefined values', () => {
      const input = {
        name: '',
        age: null,
        city: undefined
      };
      
      const sanitized = sanitizeQueryParams(input);
      
      expect(sanitized.name).toBe('');
      expect(sanitized.age).toBeUndefined();
      expect(sanitized.city).toBeUndefined();
    });
  });

  describe('sanitizeEmail', () => {
    it('should sanitize valid email addresses', () => {
      const input = 'user@example.com';
      expect(sanitizeEmail(input)).toBe(input);
    });

    it('should handle empty input', () => {
      expect(sanitizeEmail('')).toBe('');
      expect(sanitizeEmail(null as any)).toBe('');
      expect(sanitizeEmail(undefined as any)).toBe('');
    });

    it('should return empty string for invalid email addresses', () => {
      expect(sanitizeEmail('not-an-email')).toBe('');
      expect(sanitizeEmail('missing@domain')).toBe('');
    });

    it('should sanitize HTML in email addresses', () => {
      const input = 'user@example.com<script>';
      expect(sanitizeEmail(input)).toBe('user@example.com&lt;script&gt;');
    });

    it('should limit email length', () => {
      const longLocalPart = 'a'.repeat(300);
      const longEmail = `${longLocalPart}@example.com`;
      
      expect(sanitizeEmail(longEmail).length).toBeLessThanOrEqual(254);
    });
  });
}); 