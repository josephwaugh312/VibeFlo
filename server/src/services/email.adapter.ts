import emailService from './email.service';

// Export these functions with their expected signatures for testing compatibility
export const sendVerificationEmail = async (to: string, name: string, token: string): Promise<void> => {
  return emailService.sendVerificationEmail(to, name, token);
};

export const sendPasswordResetEmail = async (to: string, name: string, token: string): Promise<void> => {
  return emailService.sendPasswordResetEmail(to, name, token);
};

export default {
  sendVerificationEmail,
  sendPasswordResetEmail
}; 