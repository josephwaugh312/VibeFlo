import { query, transaction } from '../../utils/db.utils';
import pool from '../../config/db';

// Mock the database pool
jest.mock('../../config/db', () => ({
  query: jest.fn(),
  connect: jest.fn()
}));

describe('Database Utilities', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('query function', () => {
    it('should execute a SQL query and return results', async () => {
      const mockResult = { rows: [{ id: 1, name: 'Test' }], rowCount: 1 };
      (pool.query as jest.Mock).mockResolvedValue(mockResult);

      const result = await query('SELECT * FROM test WHERE id = $1', [1]);
      
      expect(pool.query).toHaveBeenCalledWith('SELECT * FROM test WHERE id = $1', [1]);
      expect(result).toEqual(mockResult);
    });

    it('should throw an error when the query fails', async () => {
      const mockError = new Error('Query failed');
      (pool.query as jest.Mock).mockRejectedValue(mockError);

      await expect(query('SELECT * FROM test')).rejects.toThrow('Query failed');
      expect(pool.query).toHaveBeenCalledWith('SELECT * FROM test', undefined);
    });
  });

  describe('transaction function', () => {
    const mockClient = {
      query: jest.fn(),
      release: jest.fn()
    };

    beforeEach(() => {
      (pool.connect as jest.Mock).mockResolvedValue(mockClient);
    });

    it('should execute a transaction successfully', async () => {
      mockClient.query.mockImplementation((query) => {
        return Promise.resolve();
      });

      const callback = jest.fn().mockResolvedValue({ success: true });
      
      const result = await transaction(callback);
      
      expect(pool.connect).toHaveBeenCalled();
      expect(mockClient.query).toHaveBeenCalledWith('BEGIN');
      expect(callback).toHaveBeenCalledWith(mockClient);
      expect(mockClient.query).toHaveBeenCalledWith('COMMIT');
      expect(mockClient.release).toHaveBeenCalled();
      expect(result).toEqual({ success: true });
    });

    it('should rollback a transaction when an error occurs', async () => {
      mockClient.query.mockImplementation((query) => {
        return Promise.resolve();
      });

      const mockError = new Error('Transaction failed');
      const callback = jest.fn().mockRejectedValue(mockError);
      
      await expect(transaction(callback)).rejects.toThrow('Transaction failed');
      
      expect(pool.connect).toHaveBeenCalled();
      expect(mockClient.query).toHaveBeenCalledWith('BEGIN');
      expect(callback).toHaveBeenCalledWith(mockClient);
      expect(mockClient.query).toHaveBeenCalledWith('ROLLBACK');
      expect(mockClient.release).toHaveBeenCalled();
    });
  });
}); 