import { 
  StorageKeys,
  setStorageItem, 
  getStorageItem, 
  removeStorageItem, 
  clearStorage, 
  hasStorageItem 
} from '../../utils/storageUtils';

describe('Storage Utilities', () => {
  // Mock localStorage
  let mockLocalStorage: { 
    getItem: jest.Mock, 
    setItem: jest.Mock, 
    removeItem: jest.Mock, 
    clear: jest.Mock 
  };

  // Preserve original console.error
  const originalConsoleError = console.error;
  
  beforeEach(() => {
    // Create a fresh mock localStorage for each test
    mockLocalStorage = {
      getItem: jest.fn(),
      setItem: jest.fn(),
      removeItem: jest.fn(),
      clear: jest.fn()
    };
    
    // Attach to window
    Object.defineProperty(window, 'localStorage', { value: mockLocalStorage });
    
    // Mock console.error 
    console.error = jest.fn();
  });
  
  afterEach(() => {
    // Restore console.error
    console.error = originalConsoleError;
  });

  describe('StorageKeys', () => {
    it('should define all required storage keys', () => {
      expect(StorageKeys.TOKEN).toBeDefined();
      expect(StorageKeys.USER).toBeDefined();
      expect(StorageKeys.THEME).toBeDefined();
      expect(StorageKeys.PLAYLIST).toBeDefined();
      expect(StorageKeys.CURRENT_TRACK).toBeDefined();
      expect(StorageKeys.MUSIC_PLAYER_STATE).toBeDefined();
      expect(StorageKeys.POMODORO_SETTINGS).toBeDefined();
    });
  });

  describe('setStorageItem', () => {
    it('should store string values directly', () => {
      setStorageItem('test-key', 'test-value');
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('test-key', 'test-value');
    });

    it('should stringify object values', () => {
      const testObj = { name: 'Test', id: 123 };
      setStorageItem('test-key', testObj);
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('test-key', JSON.stringify(testObj));
    });

    it('should remove the item if value is null', () => {
      setStorageItem('test-key', null);
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('test-key');
    });

    it('should remove the item if value is undefined', () => {
      setStorageItem('test-key', undefined);
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('test-key');
    });

    it('should convert numbers to strings', () => {
      setStorageItem('test-key', 123);
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('test-key', '123');
    });

    it('should handle errors gracefully', () => {
      mockLocalStorage.setItem.mockImplementationOnce(() => {
        throw new Error('LocalStorage error');
      });
      
      setStorageItem('test-key', 'test-value');
      expect(console.error).toHaveBeenCalled();
    });
  });

  describe('getStorageItem', () => {
    it('should retrieve string values directly', () => {
      mockLocalStorage.getItem.mockReturnValueOnce('test-value');
      const result = getStorageItem('test-key');
      expect(result).toBe('test-value');
    });

    it('should parse JSON values when requested', () => {
      const testObj = { name: 'Test', id: 123 };
      mockLocalStorage.getItem.mockReturnValueOnce(JSON.stringify(testObj));
      const result = getStorageItem('test-key', true);
      expect(result).toEqual(testObj);
    });

    it('should return null for missing items', () => {
      mockLocalStorage.getItem.mockReturnValueOnce(null);
      const result = getStorageItem('test-key');
      expect(result).toBeNull();
    });

    it('should return null and log error when JSON parsing fails', () => {
      mockLocalStorage.getItem.mockReturnValueOnce('invalid-json');
      const result = getStorageItem('test-key', true);
      expect(result).toBeNull();
      expect(console.error).toHaveBeenCalled();
    });

    it('should handle errors gracefully', () => {
      mockLocalStorage.getItem.mockImplementationOnce(() => {
        throw new Error('LocalStorage error');
      });
      
      const result = getStorageItem('test-key');
      expect(result).toBeNull();
      expect(console.error).toHaveBeenCalled();
    });
  });

  describe('removeStorageItem', () => {
    it('should remove the specified item', () => {
      removeStorageItem('test-key');
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('test-key');
    });

    it('should not throw if item does not exist', () => {
      mockLocalStorage.removeItem.mockImplementationOnce(() => {
        throw new Error('LocalStorage error');
      });
      
      expect(() => removeStorageItem('test-key')).not.toThrow();
      expect(console.error).toHaveBeenCalled();
    });
  });

  describe('clearStorage', () => {
    it('should clear all storage items', () => {
      clearStorage();
      expect(mockLocalStorage.clear).toHaveBeenCalled();
    });

    it('should not throw if clear fails', () => {
      mockLocalStorage.clear.mockImplementationOnce(() => {
        throw new Error('LocalStorage error');
      });
      
      expect(() => clearStorage()).not.toThrow();
      expect(console.error).toHaveBeenCalled();
    });
  });

  describe('hasStorageItem', () => {
    it('should return true if item exists', () => {
      mockLocalStorage.getItem.mockReturnValueOnce('test-value');
      const result = hasStorageItem('test-key');
      expect(result).toBe(true);
    });

    it('should return false if item does not exist', () => {
      mockLocalStorage.getItem.mockReturnValueOnce(null);
      const result = hasStorageItem('test-key');
      expect(result).toBe(false);
    });

    it('should return false and log error if getItem fails', () => {
      mockLocalStorage.getItem.mockImplementationOnce(() => {
        throw new Error('LocalStorage error');
      });
      
      const result = hasStorageItem('test-key');
      expect(result).toBe(false);
      expect(console.error).toHaveBeenCalled();
    });
  });
}); 