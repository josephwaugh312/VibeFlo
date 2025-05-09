// Mock for express module
const mockRouter = jest.fn(() => ({
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
  delete: jest.fn(),
  use: jest.fn(),
  param: jest.fn(),
  route: jest.fn(),
}));

const mockApp = {
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
  delete: jest.fn(),
  use: jest.fn(),
  listen: jest.fn().mockImplementation((port, callback) => {
    if (callback) callback();
    return { close: jest.fn() };
  }),
  set: jest.fn(),
  all: jest.fn(),
};

// Create express function that returns mockApp
const express: any = jest.fn(() => mockApp);

// Add properties to express
express.Router = mockRouter;
express.json = jest.fn(() => jest.fn());
express.urlencoded = jest.fn(() => jest.fn());
express.static = jest.fn(() => jest.fn());

module.exports = express;
module.exports.default = express; 