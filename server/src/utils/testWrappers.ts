import { Request, Response, NextFunction } from 'express';
import { User } from '../types';

/**
 * Helper to create a mock complete Request from a partial one
 * This ensures that a Partial<Request> can be passed to controller functions
 * expecting a full Request
 */
const completeRequest = (req: Partial<Request>): Request => {
  const defaultReq = {
    params: {},
    body: {},
    query: {},
    headers: {},
    cookies: {},
    get: jest.fn().mockReturnValue(null),
    ...req
  } as Request;
  
  return defaultReq;
};

/**
 * Helper to create a mock complete Response from a partial one
 * This ensures that a Partial<Response> can be passed to controller functions
 * expecting a full Response
 */
const completeResponse = (res: Partial<Response>): Response => {
  const defaultRes = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    cookie: jest.fn().mockReturnThis(),
    clearCookie: jest.fn().mockReturnThis(),
    send: jest.fn().mockReturnThis(),
    ...res
  } as Response;
  
  return defaultRes;
};

// Helper to create a mock authenticated request
export const createAuthRequest = (user: User): Partial<Request> => {
  return {
    user: user
  };
};

// Helper to create a mock response
export const createMockResponse = (): Partial<Response> => {
  return {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    cookie: jest.fn().mockReturnThis(),
    clearCookie: jest.fn().mockReturnThis(),
    send: jest.fn().mockReturnThis()
  };
};

// Helper to create a mock next function
export const createMockNext = (): NextFunction => {
  return jest.fn();
};

/**
 * Wrapper for controller functions that need a Next function for tests
 * This helps adapt controllers to work in test environments
 * @param controller The controller function to test
 */
export const testControllerWrapper = (controller: any) => {
  // Return a function that will execute the controller when called
  return async (req: Partial<Request>, res: Partial<Response>, next: NextFunction = jest.fn()) => {
    return controller(completeRequest(req), completeResponse(res), next);
  };
};

/**
 * Compatibility wrapper for the old testControllerWrapper function signature
 * This allows existing tests to work without modification
 * @param controller The controller function to test
 * @param req The mock request object
 * @param res The mock response object
 * @param next The mock next function
 */
export const compatTestControllerWrapper = (
  controller: any,
  req: Partial<Request>,
  res: Partial<Response>,
  next: NextFunction = jest.fn()
) => {
  return controller(completeRequest(req), completeResponse(res), next);
};

/**
 * Test wrapper for theme controller functions
 * Supporting both new and old calling conventions
 */
export const testThemeControllerWrapper = (
  controller: any,
  req?: Partial<Request>,
  res?: Partial<Response>,
  next: NextFunction = jest.fn()
) => {
  if (req && res) {
    // Old style: directly execute controller with provided params
    return compatTestControllerWrapper(controller, req, res, next);
  }
  
  // New style: return a function
  return testControllerWrapper(controller);
};

/**
 * Test wrapper for playlist controller functions
 * Supporting both new and old calling conventions
 */
export const testPlaylistControllerWrapper = (
  controller: any,
  req?: Partial<Request>,
  res?: Partial<Response>,
  next: NextFunction = jest.fn()
) => {
  if (req && res) {
    // Old style: directly execute controller with provided params
    return compatTestControllerWrapper(controller, req, res, next);
  }
  
  // New style: return a function
  return testControllerWrapper(controller);
};

/**
 * Test wrapper for auth controller functions
 * Supporting both new and old calling conventions
 */
export const testAuthControllerWrapper = (
  controller: any,
  req?: Partial<Request>,
  res?: Partial<Response>,
  next: NextFunction = jest.fn()
) => {
  if (req && res) {
    // Old style: directly execute controller with provided params
    return compatTestControllerWrapper(controller, req, res, next);
  }
  
  // New style: return a function
  return testControllerWrapper(controller);
}; 