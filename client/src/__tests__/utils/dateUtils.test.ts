import { formatDate, formatShortDate, getTimeElapsed } from '../../utils/dateUtils';

describe('Date Utility Functions', () => {
  // Original date for reference
  // January 15, 2023, 10:30:00 UTC
  const testDate = '2023-01-15T10:30:00.000Z';
  
  // Save the original Date constructor
  const OriginalDate = global.Date;

  describe('formatDate', () => {
    it('should format a valid date string correctly', () => {
      // The exact format depends on the user's locale, so we'll just verify it contains the month and year
      const result = formatDate(testDate);
      expect(result).toContain('2023');
      expect(result.length).toBeGreaterThan(8); // Should be something like "January 15, 2023"
    });

    it('should handle undefined input', () => {
      expect(formatDate(undefined)).toBe('Unknown date');
    });

    it('should handle empty string input', () => {
      expect(formatDate('')).toBe('Unknown date');
    });

    it('should handle invalid date string input', () => {
      expect(formatDate('not-a-date')).toBe('Invalid date');
    });

    it('should handle Date objects as well as strings', () => {
      const dateObj = new Date('2023-05-15T08:30:00.000Z');
      const result = formatDate(dateObj.toISOString());
      expect(result).toContain('2023');
      expect(result).toContain('May'); // Note: This assumes English locale
    });

    it('should handle different date formats', () => {
      // ISO format
      expect(formatDate('2023-06-15')).toContain('2023');
      
      // MM/DD/YYYY format
      expect(formatDate('06/15/2023')).toContain('2023');
      
      // Month name format
      expect(formatDate('June 15, 2023')).toContain('2023');
    });
  });

  describe('formatShortDate', () => {
    it('should format a valid date string into MM/DD/YYYY format', () => {
      // Test with a specific date that should be formatted consistently regardless of locale
      // Using the test date "2023-01-15T10:30:00.000Z"
      const result = formatShortDate(testDate);
      
      // The result should contain 2023, as well as the month and day
      // The format may differ by locale, but it should contain the year, month, and day
      expect(result).toContain('2023');
      expect(result.length).toBeGreaterThan(8);
    });

    it('should handle empty string input', () => {
      expect(formatShortDate('')).toBe('Unknown date');
    });

    it('should handle invalid date string input', () => {
      expect(formatShortDate('not-a-date')).toBe('Invalid date');
    });

    it('should handle Date objects', () => {
      const dateObj = new Date('2023-07-04T12:00:00.000Z');
      const result = formatShortDate(dateObj.toISOString());
      expect(result).toContain('2023');
      expect(result).toContain('7'); // Month (July = 7)
      expect(result).toContain('4'); // Day
    });

    it('should handle different date string formats', () => {
      // ISO date format
      const isoResult = formatShortDate('2023-12-25');
      expect(isoResult).toContain('2023');
      // Month may be formatted differently based on locale
      expect(isoResult).toMatch(/12|Dec/);
      
      // Short date format
      const shortResult = formatShortDate('12/25/2023');
      expect(shortResult).toContain('2023');
      // Month may be formatted differently based on locale
      expect(shortResult).toMatch(/12|Dec/);
    });

    it('should handle dates with time components', () => {
      expect(formatShortDate('2023-08-18T15:30:45.000Z')).toContain('2023');
      expect(formatShortDate('2023-08-18T15:30:45.000Z')).toContain('8');
      expect(formatShortDate('2023-08-18T15:30:45.000Z')).toContain('18');
    });
  });

  describe('getTimeElapsed', () => {
    beforeEach(() => {
      // Mock the current date for predictable testing
      // Setting "now" to January 16, 2023, 10:30:00 UTC (1 day after test date)
      const mockDate = new Date(2023, 0, 16, 10, 30, 0);
      global.Date = class extends Date {
        constructor() {
          super();
          return mockDate;
        }
        static now() {
          return mockDate.getTime();
        }
      } as any;
    });

    afterEach(() => {
      // Restore original Date
      global.Date = OriginalDate;
    });

    it('should return "1 day ago" when date is 1 day ago', () => {
      const result = getTimeElapsed(testDate);
      expect(result).toBe('1 day ago');
    });

    it('should handle multiple days correctly', () => {
      // Setting test date to 5 days before our mocked "now"
      const fiveDaysAgo = '2023-01-11T10:30:00.000Z';
      const result = getTimeElapsed(fiveDaysAgo);
      expect(result).toBe('5 days ago');
    });

    it('should handle hours correctly', () => {
      // 5 hours before our mocked "now"
      const fiveHoursAgo = '2023-01-16T05:30:00.000Z';
      const result = getTimeElapsed(fiveHoursAgo);
      expect(result).toBe('5 hours ago');
    });

    it('should handle minutes correctly', () => {
      // 30 minutes before our mocked "now"
      const thirtyMinsAgo = '2023-01-16T10:00:00.000Z';
      const result = getTimeElapsed(thirtyMinsAgo);
      expect(result).toBe('30 minutes ago');
    });

    it('should handle seconds correctly', () => {
      // 30 seconds before our mocked "now"
      const thirtySecsAgo = '2023-01-16T10:29:30.000Z';
      const result = getTimeElapsed(thirtySecsAgo);
      expect(result).toBe('30 seconds ago');
    });

    it('should handle empty string input', () => {
      expect(getTimeElapsed('')).toBe('Unknown');
    });

    it('should handle invalid date string input', () => {
      expect(getTimeElapsed('not-a-date')).toBe('Invalid date');
    });

    it('should handle future dates', () => {
      // Setting a date in the future relative to our mocked "now"
      const futureDate = '2023-01-17T10:30:00.000Z'; // 1 day in the future
      const result = getTimeElapsed(futureDate);
      
      // With our current implementation, future dates will show as 0 seconds ago
      // This is a design decision - we could modify to handle future dates differently
      expect(result).toContain('seconds ago');
    });

    it('should handle exactly the same time', () => {
      // Setting a date exactly matching our mocked "now"
      const sameTime = '2023-01-16T10:30:00.000Z';
      const result = getTimeElapsed(sameTime);
      expect(result).toBe('0 seconds ago');
    });

    it('should handle date objects converted to strings', () => {
      const result = getTimeElapsed('2023-01-15T10:30:00.000Z');
      expect(result).toBe('1 day ago');
    });
  });
}); 