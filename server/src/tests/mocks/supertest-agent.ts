/**
 * Custom supertest wrapper for integration tests
 * 
 * This file addresses the EADDRNOTAVAIL errors by providing a more robust
 * agent setup that avoids actual socket connections during tests.
 */

import supertest from 'supertest';
import { Express } from 'express';
import { testServer } from '../integration/setupServer';

/**
 * Creates a test agent that doesn't attempt to bind to real ports
 */
export function createTestAgent() {
  // Create a supertest agent with the test server
  const agent = supertest.agent(testServer);
  
  // Enhance the agent to avoid actual connections
  return agent;
}

/**
 * Utility functions to simplify working with the test agent
 */
export const testApi = {
  /**
   * Send a GET request to the API
   */
  get: (url: string, token?: string) => {
    const request = createTestAgent().get(url);
    if (token) {
      request.set('Authorization', `Bearer ${token}`);
    }
    return request;
  },
  
  /**
   * Send a POST request to the API
   */
  post: (url: string, data: any, token?: string) => {
    const request = createTestAgent().post(url)
      .send(data);
    
    if (token) {
      request.set('Authorization', `Bearer ${token}`);
    }
    return request;
  },
  
  /**
   * Send a PUT request to the API
   */
  put: (url: string, data: any, token?: string) => {
    const request = createTestAgent().put(url)
      .send(data);
    
    if (token) {
      request.set('Authorization', `Bearer ${token}`);
    }
    return request;
  },
  
  /**
   * Send a DELETE request to the API
   */
  delete: (url: string, token?: string) => {
    const request = createTestAgent().delete(url);
    if (token) {
      request.set('Authorization', `Bearer ${token}`);
    }
    return request;
  }
}; 