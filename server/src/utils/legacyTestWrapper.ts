import { Request, Response, NextFunction } from 'express';
import { testControllerWrapper, compatTestControllerWrapper } from './testWrappers';

// Create a mock next function for tests
const mockNext = jest.fn();

/**
 * Creates a test wrapper for a controller function that uses the legacy pattern
 * This is to maintain compatibility with existing tests
 */
export function createControllerWrapper(controllerFunction: any) {
  return async (req: Request, res: Response, next: NextFunction = mockNext) => {
    return controllerFunction(req, res, next);
  };
}

/**
 * Legacy wrapper for controller functions that matches the old function signature
 * This provides backward compatibility with tests that were using the old wrapper format
 */
export function legacyTestControllerWrapper(controllerFunction: any) {
  return (req: Request, res: Response, next: NextFunction = mockNext) => {
    return compatTestControllerWrapper(controllerFunction, req, res, next);
  };
}

/**
 * Legacy wrapper for auth controller functions
 * @deprecated Use testControllerWrapper directly
 */
export function wrapAuthController(controllerFunction: any) {
  return createControllerWrapper(controllerFunction);
}

/**
 * Legacy wrapper for playlist controller functions
 * @deprecated Use testControllerWrapper directly
 */
export function wrapPlaylistController(controllerFunction: any) {
  return createControllerWrapper(controllerFunction);
}

/**
 * Legacy wrapper for theme controller functions
 * @deprecated Use testControllerWrapper directly
 */
export function wrapThemeController(controllerFunction: any) {
  return createControllerWrapper(controllerFunction);
}

/**
 * Legacy wrapper for any controller functions
 * @deprecated Use testControllerWrapper directly
 */
export function wrapController(controllerFunction: any) {
  return createControllerWrapper(controllerFunction);
} 