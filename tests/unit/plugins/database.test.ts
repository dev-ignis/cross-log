import { createDatabasePlugin } from '../../../src/plugins/database';
import { createLogger } from '../../../src';

describe('Database Plugin', () => {
  let logger: any;
  let debugSpy: jest.SpyInstance;
  let infoSpy: jest.SpyInstance;
  let warnSpy: jest.SpyInstance;
  let errorSpy: jest.SpyInstance;

  beforeEach(() => {
    // Set up spies before creating logger
    debugSpy = jest.spyOn(console, 'debug').mockImplementation();
    infoSpy = jest.spyOn(console, 'info').mockImplementation();
    warnSpy = jest.spyOn(console, 'warn').mockImplementation();
    errorSpy = jest.spyOn(console, 'error').mockImplementation();
    
    // Now create logger
    logger = createLogger({ minLevel: 0 });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Plugin Registration', () => {
    it('should register database plugin', () => {
      const plugin = createDatabasePlugin();
      logger.use(plugin);
      
      expect(logger.database).toBeDefined();
      expect(logger.database?.query).toBeDefined();
      expect(logger.database?.error).toBeDefined();
      expect(logger.database?.transaction).toBeDefined();
      expect(logger.database?.slowQuery).toBeDefined();
    });

    it('should register with custom config', () => {
      const plugin = createDatabasePlugin({
        truncateQueries: 50,
        includeParams: true,
        slowQueryThreshold: 500
      });
      logger.use(plugin);
      
      expect(logger.database).toBeDefined();
    });
  });

  describe('query method', () => {
    beforeEach(() => {
      const plugin = createDatabasePlugin();
      logger.use(plugin);
    });

    it('should log database queries', () => {
      logger.database?.query('SELECT * FROM users', 45, 10);
      
      expect(debugSpy).toHaveBeenCalled();
      // Find the actual query log (not the plugin initialization log)
      const queryCall = debugSpy.mock.calls.find(call => 
        call[0] && call[0].includes('Database Query')
      );
      expect(queryCall).toBeDefined();
      expect(queryCall[0]).toContain('SELECT * FROM users');
      expect(queryCall[0]).toContain('45ms');
      expect(queryCall[0]).toContain('10 rows');
    });

    it('should truncate long queries', () => {
      // Create a fresh logger for this test
      const freshLogger: any = createLogger({ minLevel: 0 });
      const plugin = createDatabasePlugin({ truncateQueries: 20 });
      freshLogger.use(plugin);
      
      const longQuery = 'SELECT * FROM users WHERE id IN (1,2,3,4,5,6,7,8,9,10)';
      freshLogger.database?.query(longQuery, 100, 5);
      
      expect(debugSpy).toHaveBeenCalled();
      const queryCall = debugSpy.mock.calls.find(call => 
        call[0] && call[0].includes('Database Query')
      );
      expect(queryCall).toBeDefined();
      expect(queryCall[0]).toContain('...');
    });

    it('should include parameters when configured', () => {
      const plugin = createDatabasePlugin({ includeParams: true });
      logger.use(plugin);
      
      logger.database?.query('SELECT * FROM users WHERE id = ?', 30, 1, [123]);
      
      expect(debugSpy).toHaveBeenCalled();
    });

    it('should detect slow queries', () => {
      const plugin = createDatabasePlugin({ slowQueryThreshold: 1000 });
      logger.use(plugin);
      
      logger.database?.query('SELECT * FROM large_table', 1500, 1000);
      
      expect(warnSpy).toHaveBeenCalled();
      const warnCall = warnSpy.mock.calls.find(call => 
        call[0] && call[0].includes('Slow Database Query')
      );
      expect(warnCall).toBeDefined();
      expect(warnCall[0]).toContain('Slow Database Query');
    });
  });

  describe('error method', () => {
    beforeEach(() => {
      const plugin = createDatabasePlugin();
      logger.use(plugin);
    });

    it('should log database errors with Error object', () => {
      const error = new Error('Connection lost');
      logger.database?.error('INSERT INTO logs', error);
      
      expect(errorSpy).toHaveBeenCalled();
      const call = errorSpy.mock.calls[0][0];
      expect(call).toContain('Database Error');
      expect(call).toContain('Connection lost');
    });

    it('should log database errors with string', () => {
      logger.database?.error('UPDATE users', 'Deadlock detected');
      
      expect(errorSpy).toHaveBeenCalled();
      const call = errorSpy.mock.calls[0][0];
      expect(call).toContain('Deadlock detected');
    });

    it('should include params when configured', () => {
      const plugin = createDatabasePlugin({ includeParams: true });
      logger.use(plugin);
      
      logger.database?.error('UPDATE users WHERE id = ?', 'Not found', [123]);
      
      expect(errorSpy).toHaveBeenCalled();
    });
  });

  describe('transaction method', () => {
    beforeEach(() => {
      const plugin = createDatabasePlugin();
      logger.use(plugin);
    });

    it('should log transaction begin', () => {
      logger.database?.transaction('tx_123', 'begin');
      
      expect(infoSpy).toHaveBeenCalled();
      const call = infoSpy.mock.calls[0][0];
      expect(call).toContain('Database Transaction: BEGIN tx_123');
    });

    it('should log transaction commit with duration', () => {
      logger.database?.transaction('tx_123', 'commit', 250);
      
      expect(infoSpy).toHaveBeenCalled();
      const call = infoSpy.mock.calls[0][0];
      expect(call).toContain('COMMIT');
      expect(call).toContain('250ms');
    });

    it('should warn on rollback', () => {
      logger.database?.transaction('tx_456', 'rollback');
      
      expect(warnSpy).toHaveBeenCalled();
      const call = warnSpy.mock.calls[0][0];
      expect(call).toContain('ROLLBACK');
    });
  });

  describe('slowQuery method', () => {
    beforeEach(() => {
      const plugin = createDatabasePlugin();
      logger.use(plugin);
    });

    it('should log slow queries explicitly', () => {
      logger.database?.slowQuery('SELECT * FROM massive_join', 5000);
      
      expect(warnSpy).toHaveBeenCalled();
      const call = warnSpy.mock.calls[0][0];
      expect(call).toContain('Slow Database Query');
      expect(call).toContain('5.00s');
    });

    it('should include params when configured', () => {
      const plugin = createDatabasePlugin({ includeParams: true });
      logger.use(plugin);
      
      logger.database?.slowQuery('SELECT * FROM users WHERE status = ?', 3000, ['active']);
      
      expect(warnSpy).toHaveBeenCalled();
    });
  });

  describe('Plugin Cleanup', () => {
    it('should clean up on destroy', () => {
      const plugin = createDatabasePlugin();
      logger.use(plugin);
      
      expect(logger.database).toBeDefined();
      
      plugin.destroy();
      expect(plugin.name).toBe('database');
    });
  });
});