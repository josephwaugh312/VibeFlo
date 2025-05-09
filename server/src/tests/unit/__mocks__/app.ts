import express from 'express';

// Create a mock Express app
const mockApp = {
  use: jest.fn(),
  get: jest.fn(),
  listen: jest.fn().mockImplementation((port, callback) => {
    if (callback) callback();
    return { close: jest.fn() };
  }),
  set: jest.fn(),
  all: jest.fn(),
};

// Export the app for use in index.ts
export { mockApp as app }; 