import { generateId } from '../../utils/generateId';

describe('generateId utility', () => {
  it('should generate a non-empty string ID', () => {
    const id = generateId();
    expect(typeof id).toBe('string');
    expect(id.length).toBeGreaterThan(0);
  });

  it('should generate unique IDs', () => {
    const idSet = new Set();
    // Generate 100 IDs and check they're all unique
    for (let i = 0; i < 100; i++) {
      const id = generateId();
      expect(idSet.has(id)).toBe(false);
      idSet.add(id);
    }
    expect(idSet.size).toBe(100);
  });

  it('should generate IDs with certain minimum length', () => {
    const id = generateId();
    // The implementation should generate an ID of at least 20 chars
    expect(id.length).toBeGreaterThanOrEqual(20);
  });

  it('should generate alphanumeric IDs', () => {
    const id = generateId();
    // Should only contain alphanumeric characters
    expect(id).toMatch(/^[a-z0-9]+$/);
  });
}); 