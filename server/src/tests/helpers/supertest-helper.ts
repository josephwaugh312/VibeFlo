/**
 * SuperTest Helper for integration tests
 * This module creates a supertest agent that doesn't bind to network ports
 */

import supertest from 'supertest';
import express from 'express';
import { app } from '../../app';

// Create a supertest agent with the app
export const agent = supertest.agent(app);

// Helper functions for common HTTP methods
export const api = {
  /**
   * Make a GET request
   * @param url The URL to request
   * @param token Optional JWT token for authentication
   */
  get: (url: string, token?: string) => {
    const req = agent.get(url);
    if (token) {
      req.set('Authorization', `Bearer ${token}`);
    }
    return req;
  },
  
  /**
   * Make a POST request
   * @param url The URL to request
   * @param data The data to send
   * @param token Optional JWT token for authentication
   */
  post: (url: string, data: any, token?: string) => {
    const req = agent.post(url).send(data);
    if (token) {
      req.set('Authorization', `Bearer ${token}`);
    }
    return req;
  },
  
  /**
   * Make a PUT request
   * @param url The URL to request
   * @param data The data to send
   * @param token Optional JWT token for authentication
   */
  put: (url: string, data: any, token?: string) => {
    const req = agent.put(url).send(data);
    if (token) {
      req.set('Authorization', `Bearer ${token}`);
    }
    return req;
  },
  
  /**
   * Make a DELETE request
   * @param url The URL to request
   * @param token Optional JWT token for authentication
   */
  delete: (url: string, token?: string) => {
    const req = agent.delete(url);
    if (token) {
      req.set('Authorization', `Bearer ${token}`);
    }
    return req;
  }
}; 