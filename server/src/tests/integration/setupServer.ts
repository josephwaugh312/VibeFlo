import http from 'http';
import { app } from '../../app';
import { Express } from 'express';

/**
 * Creates a test server that works with supertest
 * 
 * Supertest needs the .address() method to be present on the app
 * but doesn't actually need the server to be listening on a real port
 */
export function createTestServer() {
  // Create an HTTP server from the Express app
  const server = http.createServer(app);
  
  // Add necessary methods for supertest integration
  const testApp = app as any;
  
  // Mock the address method that supertest requires
  // We'll use localhost to avoid EADDRNOTAVAIL errors
  testApp.address = function() {
    return { address: 'localhost', port: 0, family: 'IPv4' };
  };
  
  // Store a reference to the server on the app
  testApp.httpServer = server;
  
  // Keep track of connections to properly close them
  const connections = new Set<any>();
  server.on('connection', (conn) => {
    connections.add(conn);
    conn.on('close', () => connections.delete(conn));
  });
  
  // Add a close method that ensures all connections are closed
  const originalClose = testApp.close;
  testApp.close = function(callback?: () => void) {
    // Close all active connections
    connections.forEach(conn => {
      conn.destroy();
    });
    
    if (server.listening) {
      server.close(() => {
        if (originalClose) {
          originalClose.call(testApp, callback);
        } else if (callback) {
          callback();
        }
      });
    } else if (callback) {
      callback();
    }
  };
  
  // Add a listen method that starts the actual server if needed
  const originalListen = testApp.listen;
  testApp.listen = function(...args: any[]) {
    if (originalListen) {
      return originalListen.apply(testApp, args);
    }
    
    // Default to listening on localhost only
    if (args.length === 0 || typeof args[0] === 'function') {
      const callback = typeof args[0] === 'function' ? args[0] : undefined;
      server.listen(0, 'localhost', callback);
    } else {
      server.listen(...args);
    }
    
    return server;
  };
  
  return testApp;
}

// Ensure we clean up any previous instances
let testServerInstance: any = null;

// Export a singleton instance for tests to use
export function getTestServer() {
  if (!testServerInstance) {
    testServerInstance = createTestServer();
    
    // Add cleanup handler for Jest
    // @ts-ignore
    if (global.afterAll) {
      // @ts-ignore
      global.afterAll(() => {
        if (testServerInstance) {
          testServerInstance.close();
          testServerInstance = null;
        }
      });
    }
  }
  
  return testServerInstance;
}

export const testServer = getTestServer(); 