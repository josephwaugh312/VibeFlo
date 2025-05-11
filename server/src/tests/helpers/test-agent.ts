/**
 * Test agent helper for integration tests
 * This creates a mock for HTTP requests without relying on supertest
 */

import { Request, Response } from 'express';
import { app } from '../../app';

// Define a custom response interface that includes the body property
interface CustomResponse extends Partial<Response> {
  body?: any;
}

// Enable verbose logging for debugging
const DEBUG = true;

// Create a simplified test client that doesn't use SuperTest
export const testClient = {
  /**
   * Make a GET request
   * @param url The URL to request
   * @param token Optional JWT token for authentication
   * @returns Promise resolving to a mock response
   */
  get: async (url: string, token?: string) => {
    // Create mock request
    const req: Partial<Request> = {
      method: 'GET',
      url,
      path: url,
      headers: {} as any,
      params: {},
      query: {},
    };
    
    // Add auth header if token provided
    if (token) {
      req.headers = {
        authorization: `Bearer ${token}`
      };
    }
    
    // Create mock response
    const res: CustomResponse = {
      statusCode: 200,
      status: function(code) {
        this.statusCode = code;
        return this;
      },
      json: function(data) {
        this.body = data;
        return this;
      },
      send: function(data) {
        this.body = data;
        return this;
      },
      body: undefined
    };
    
    try {
      if (DEBUG) console.log(`Processing GET request to ${url}`);
      
      // Find matching route handler in app
      const handler = findRouteHandler(app, 'get', url);
      
      if (DEBUG) console.log(`Found handler for GET ${url}`);
      
      // Call the route handler directly
      await handler(req as Request, res as Response, () => {});
      
      if (DEBUG) console.log(`GET ${url} completed with status ${res.statusCode}`);
      
      return {
        status: res.statusCode || 200,
        body: res.body,
      };
    } catch (error) {
      console.error(`Error in GET ${url}:`, error);
      return {
        status: 500,
        body: { error: error.message || 'Unknown error' }
      };
    }
  },
  
  /**
   * Make a POST request
   * @param url The URL to request
   * @param data The data to send
   * @param token Optional JWT token for authentication
   * @returns Promise resolving to a mock response
   */
  post: async (url: string, data: any, token?: string) => {
    // Create mock request
    const req: Partial<Request> = {
      method: 'POST',
      url,
      path: url,
      headers: {} as any,
      params: {},
      query: {},
      body: data
    };
    
    // Add auth header if token provided
    if (token) {
      req.headers = {
        authorization: `Bearer ${token}`
      };
    }
    
    // Create mock response
    const res: CustomResponse = {
      statusCode: 200,
      status: function(code) {
        this.statusCode = code;
        return this;
      },
      json: function(data) {
        this.body = data;
        return this;
      },
      send: function(data) {
        this.body = data;
        return this;
      },
      body: undefined
    };
    
    try {
      if (DEBUG) console.log(`Processing POST request to ${url} with data:`, JSON.stringify(data).substring(0, 100));
      
      // Find matching route handler
      const handler = findRouteHandler(app, 'post', url);
      
      if (DEBUG) console.log(`Found handler for POST ${url}`);
      
      // Extract path parameters
      extractPathParams(url, findRoutePath(app, 'post', url), req);
      
      // Call the route handler directly
      await handler(req as Request, res as Response, () => {});
      
      if (DEBUG) console.log(`POST ${url} completed with status ${res.statusCode}`);
      
      return {
        status: res.statusCode || 200,
        body: res.body,
      };
    } catch (error) {
      console.error(`Error in POST ${url}:`, error);
      console.error(`Stack trace:`, error.stack);
      return {
        status: 500,
        body: { error: error.message || 'Unknown error' }
      };
    }
  },
  
  /**
   * Make a PUT request
   * Similar to post but using PUT method
   */
  put: async (url: string, data: any, token?: string) => {
    // Create mock request
    const req: Partial<Request> = {
      method: 'PUT',
      url,
      path: url,
      headers: {} as any,
      params: {},
      query: {},
      body: data
    };
    
    // Add auth header if token provided
    if (token) {
      req.headers = {
        authorization: `Bearer ${token}`
      };
    }
    
    // Create mock response
    const res: CustomResponse = {
      statusCode: 200,
      status: function(code) {
        this.statusCode = code;
        return this;
      },
      json: function(data) {
        this.body = data;
        return this;
      },
      send: function(data) {
        this.body = data;
        return this;
      },
      body: undefined
    };
    
    try {
      if (DEBUG) console.log(`Processing PUT request to ${url}`);
      
      // Find matching route handler
      const handler = findRouteHandler(app, 'put', url);
      
      if (DEBUG) console.log(`Found handler for PUT ${url}`);
      
      // Extract path parameters
      extractPathParams(url, findRoutePath(app, 'put', url), req);
      
      // Call the route handler directly
      await handler(req as Request, res as Response, () => {});
      
      if (DEBUG) console.log(`PUT ${url} completed with status ${res.statusCode}`);
      
      return {
        status: res.statusCode || 200,
        body: res.body,
      };
    } catch (error) {
      console.error(`Error in PUT ${url}:`, error);
      return {
        status: 500,
        body: { error: error.message || 'Unknown error' }
      };
    }
  },
  
  /**
   * Make a DELETE request
   * Similar to other methods but using DELETE
   */
  delete: async (url: string, token?: string) => {
    // Create mock request
    const req: Partial<Request> = {
      method: 'DELETE',
      url,
      path: url,
      headers: {} as any,
      params: {},
      query: {},
    };
    
    // Add auth header if token provided
    if (token) {
      req.headers = {
        authorization: `Bearer ${token}`
      };
    }
    
    // Create mock response
    const res: CustomResponse = {
      statusCode: 200,
      status: function(code) {
        this.statusCode = code;
        return this;
      },
      json: function(data) {
        this.body = data;
        return this;
      },
      send: function(data) {
        this.body = data;
        return this;
      },
      body: undefined
    };
    
    try {
      if (DEBUG) console.log(`Processing DELETE request to ${url}`);
      
      // Find matching route handler
      const handler = findRouteHandler(app, 'delete', url);
      
      if (DEBUG) console.log(`Found handler for DELETE ${url}`);
      
      // Extract path parameters
      extractPathParams(url, findRoutePath(app, 'delete', url), req);
      
      // Call the route handler directly
      await handler(req as Request, res as Response, () => {});
      
      if (DEBUG) console.log(`DELETE ${url} completed with status ${res.statusCode}`);
      
      return {
        status: res.statusCode || 200,
        body: res.body,
      };
    } catch (error) {
      console.error(`Error in DELETE ${url}:`, error);
      return {
        status: 500,
        body: { error: error.message || 'Unknown error' }
      };
    }
  }
};

/**
 * Find a route handler in the Express app that matches the given method and URL
 * @param app Express application
 * @param method HTTP method (get, post, put, delete)
 * @param url URL to match
 * @returns Route handler function
 */
function findRouteHandler(app: any, method: string, url: string): Function {
  if (DEBUG) console.log(`Finding route handler for ${method.toUpperCase()} ${url}`);
  
  // Get all routes from the Express app
  const routes = app._router.stack
    .filter((r: any) => r.route)
    .map((r: any) => ({ 
      path: r.route.path, 
      method: Object.keys(r.route.methods)[0], 
      handler: r.route.stack[0].handle 
    }));
  
  if (DEBUG) console.log(`Available routes:`, routes.map(r => `${r.method.toUpperCase()} ${r.path}`));
  
  // Find a matching route
  const route = routes.find((r: any) => {
    if (r.method.toLowerCase() !== method.toLowerCase()) return false;
    
    // Check if URL matches the route path pattern
    const matches = urlMatchesRoutePath(url, r.path);
    if (DEBUG && matches) console.log(`Found matching route: ${r.method.toUpperCase()} ${r.path}`);
    return matches;
  });
  
  if (!route) {
    throw new Error(`No matching route found for ${method.toUpperCase()} ${url}`);
  }
  
  return route.handler;
}

/**
 * Find the route path that matches the given URL
 */
function findRoutePath(app: any, method: string, url: string): string {
  // Get all routes from the Express app
  const routes = app._router.stack
    .filter((r: any) => r.route)
    .map((r: any) => ({ 
      path: r.route.path, 
      method: Object.keys(r.route.methods)[0]
    }));
  
  // Find a matching route
  const route = routes.find((r: any) => {
    if (r.method.toLowerCase() !== method.toLowerCase()) return false;
    return urlMatchesRoutePath(url, r.path);
  });
  
  if (!route) {
    throw new Error(`No matching route path found for ${method.toUpperCase()} ${url}`);
  }
  
  return route.path;
}

/**
 * Check if a URL matches a route path pattern
 */
function urlMatchesRoutePath(url: string, routePath: string): boolean {
  const urlParts = url.split('/').filter(Boolean);
  const routeParts = routePath.split('/').filter(Boolean);
  
  if (urlParts.length !== routeParts.length) return false;
  
  for (let i = 0; i < routeParts.length; i++) {
    // If route part is a parameter (starts with :), it always matches
    if (routeParts[i].startsWith(':')) continue;
    
    // Otherwise, parts should match exactly
    if (routeParts[i] !== urlParts[i]) return false;
  }
  
  return true;
}

/**
 * Extract path parameters from URL based on route path and add them to the request
 */
function extractPathParams(url: string, routePath: string, req: Partial<Request>): void {
  const urlParts = url.split('/').filter(Boolean);
  const routeParts = routePath.split('/').filter(Boolean);
  
  if (urlParts.length !== routeParts.length) return;
  
  req.params = req.params || {};
  
  for (let i = 0; i < routeParts.length; i++) {
    if (routeParts[i].startsWith(':')) {
      const paramName = routeParts[i].substring(1);
      req.params[paramName] = urlParts[i];
    }
  }
} 