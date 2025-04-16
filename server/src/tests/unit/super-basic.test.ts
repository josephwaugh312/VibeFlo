// Extremely simple tests with no dependencies

describe('Math Operations', () => {
  test('addition works', () => {
    expect(1 + 2).toBe(3);
  });
  
  test('subtraction works', () => {
    expect(5 - 3).toBe(2);
  });
  
  test('multiplication works', () => {
    expect(2 * 3).toBe(6);
  });
  
  test('division works', () => {
    expect(10 / 2).toBe(5);
  });
});

describe('String Operations', () => {
  test('concatenation works', () => {
    expect('hello' + ' ' + 'world').toBe('hello world');
  });
  
  test('uppercase conversion works', () => {
    expect('hello'.toUpperCase()).toBe('HELLO');
  });
  
  test('lowercase conversion works', () => {
    expect('WORLD'.toLowerCase()).toBe('world');
  });
});

describe('Array Operations', () => {
  test('array length works', () => {
    expect([1, 2, 3].length).toBe(3);
  });
  
  test('array push works', () => {
    const arr = [1, 2];
    arr.push(3);
    expect(arr).toEqual([1, 2, 3]);
  });
  
  test('array pop works', () => {
    const arr = [1, 2, 3];
    const popped = arr.pop();
    expect(popped).toBe(3);
    expect(arr).toEqual([1, 2]);
  });
});

describe('Object Operations', () => {
  test('should access object properties', () => {
    const obj: { name: string; value?: number } = { name: 'test' };
    expect(obj.name).toBe('test');
  });

  test('should assign to object properties', () => {
    const obj: { name: string; value?: number } = { name: 'test' };
    obj.value = 42;
    expect(obj.value).toBe(42);
  });
}); 