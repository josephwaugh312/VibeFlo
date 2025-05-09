// Mock for passport module
const authenticate = jest.fn((strategy, options) => {
  return jest.fn((req, res, next) => {
    if (next) next();
    return null;
  });
});

const initialize = jest.fn().mockReturnValue('passportInitializeMiddleware');
const session = jest.fn().mockReturnValue('passportSessionMiddleware');
const use = jest.fn();
const serializeUser = jest.fn();
const deserializeUser = jest.fn();

const passport = {
  authenticate,
  initialize,
  session,
  use,
  serializeUser,
  deserializeUser
};

module.exports = passport;
module.exports.default = passport; 