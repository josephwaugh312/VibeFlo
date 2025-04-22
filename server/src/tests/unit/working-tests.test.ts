// Import Jest functions directly
import '@testing-library/jest-dom';

// Completely standalone tests that don't rely on any external modules
describe('Basic Math Tests', () => {
  it('should add two numbers correctly', () => {
    expect(1 + 1).toBe(2);
    expect(5 + 7).toBe(12);
    expect(-3 + 3).toBe(0);
  });

  it('should subtract two numbers correctly', () => {
    expect(5 - 3).toBe(2);
    expect(10 - 5).toBe(5);
    expect(0 - 5).toBe(-5);
  });

  it('should multiply two numbers correctly', () => {
    expect(3 * 4).toBe(12);
    expect(0 * 5).toBe(0);
    expect(-2 * 3).toBe(-6);
  });

  it('should divide two numbers correctly', () => {
    expect(10 / 2).toBe(5);
    expect(7 / 2).toBe(3.5);
    expect(0 / 5).toBe(0);
  });
});

// Mock functions testing
describe('Jest Mock Functions', () => {
  it('should track function calls and arguments', () => {
    const mockFn = jest.fn();
    
    mockFn();
    mockFn(1, 2);
    mockFn('hello');
    
    expect(mockFn).toHaveBeenCalledTimes(3);
    expect(mockFn).toHaveBeenCalledWith(1, 2);
    expect(mockFn).toHaveBeenCalledWith('hello');
  });

  it('should mock return values', () => {
    const mockFn = jest.fn();
    
    mockFn
      .mockReturnValueOnce(42)
      .mockReturnValueOnce('string value')
      .mockReturnValue(true);
    
    expect(mockFn()).toBe(42);
    expect(mockFn()).toBe('string value');
    expect(mockFn()).toBe(true);
    expect(mockFn()).toBe(true); // Returns the last configured return value
  });

  it('should mock async functions', async () => {
    const mockAsyncFn = jest.fn().mockResolvedValue({ id: 1, name: 'Test' });
    
    const result = await mockAsyncFn();
    
    expect(result).toEqual({ id: 1, name: 'Test' });
    expect(mockAsyncFn).toHaveBeenCalledTimes(1);
  });
});

// Testing objects and arrays
describe('Object and Array Tests', () => {
  it('should compare objects correctly', () => {
    const obj1 = { a: 1, b: 2 };
    const obj2 = { a: 1, b: 2 };
    
    expect(obj1).toEqual(obj2);
  });

  it('should compare arrays correctly', () => {
    const arr1 = [1, 2, 3];
    const arr2 = [1, 2, 3];
    
    expect(arr1).toEqual(arr2);
    expect(arr1.length).toBe(3);
  });

  it('should test for object properties', () => {
    const user = { 
      name: 'John', 
      email: 'john@example.com',
      settings: {
        theme: 'dark',
        notifications: true
      }
    };
    
    expect(user).toHaveProperty('name');
    expect(user).toHaveProperty('email', 'john@example.com');
    expect(user).toHaveProperty('settings.theme', 'dark');
  });
}); 