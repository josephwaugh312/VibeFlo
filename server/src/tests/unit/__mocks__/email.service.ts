/**
 * Mock implementation of the EmailService for testing
 */

const sendVerificationEmail = jest.fn().mockResolvedValue(undefined);
const sendPasswordResetEmail = jest.fn().mockResolvedValue(undefined);
const sendNotificationEmail = jest.fn().mockResolvedValue(undefined);

export const EmailService = {
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendNotificationEmail
};

export default {
  EmailService
}; 