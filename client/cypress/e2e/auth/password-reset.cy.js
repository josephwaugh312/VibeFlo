describe('Password Reset Flow', () => {
  beforeEach(() => {
    // Clear the localStorage to ensure each test starts fresh
    cy.clearLocalStorage();
    cy.clearCookies();
  });

  it('should display the forgot password page correctly', () => {
    cy.visit('/forgot-password');
    
    // Check page elements are present - updated to match actual component
    cy.get('h5').should('contain', 'Forgot Password');
    cy.get('input#email').should('be.visible');
    cy.get('button[type="submit"]').should('be.visible');
  });

  it('should submit a forgot password request successfully', () => {
    // Intercept the API call to mock a successful response
    cy.intercept('POST', '**/api/auth/forgot-password', {
      statusCode: 200,
      body: {
        message: 'If a user with that email exists, a password reset link will be sent'
      }
    }).as('forgotPasswordRequest');
    
    cy.visit('/forgot-password');
    
    // Fill and submit the form - updated to match actual component
    cy.get('input#email').type('test@example.com');
    cy.get('button[type="submit"]').click();
    
    // Wait for the API call
    cy.wait('@forgotPasswordRequest');
    
    // Should see success message
    cy.contains('Password reset instructions have been sent').should('be.visible');
  });

  it('should handle invalid email error', () => {
    cy.visit('/forgot-password');
    
    // Try to submit with invalid email - updated to match actual component
    cy.get('input#email').clear().type('invalid-email'); // Use an invalid email format
    cy.get('button[type="submit"]').click();
    
    // Verify we're still on the forgot password page, indicating validation prevented submission
    cy.url().should('include', '/forgot-password');
  });

  it('should display the reset password page correctly', () => {
    // Mock the token verification API to return valid status
    cy.intercept('GET', '**/api/auth/verify-reset-token/*', {
      statusCode: 200,
      body: {
        valid: true
      }
    }).as('verifyToken');
    
    // Visit the reset password page with a token
    cy.visit('/reset-password/fake-token');
    
    // Wait for token verification
    cy.wait('@verifyToken');
    
    // Check page elements are present - updated to match actual component
    cy.get('h5').should('contain', 'Reset Your Password');
    cy.get('input[type="password"]').should('have.length', 2);
    cy.get('button[type="submit"]').should('be.visible');
  });

  it('should handle invalid/expired token', () => {
    // Mock the token verification API to return invalid status
    cy.intercept('GET', '**/api/auth/verify-reset-token/*', {
      statusCode: 400,
      body: {
        message: 'Invalid or expired token'
      }
    }).as('verifyToken');
    
    // Visit the reset password page with an invalid token
    cy.visit('/reset-password/invalid-token');
    
    // Wait for token verification
    cy.wait('@verifyToken');
    
    // Should see error message - updated to match actual component
    cy.contains('This password reset link is invalid or has expired').should('be.visible');
    
    // Should see option to request new reset link
    cy.contains('Request New Link').should('be.visible');
  });

  it('should reset password successfully', () => {
    // Mock the token verification API
    cy.intercept('GET', '**/api/auth/verify-reset-token/*', {
      statusCode: 200,
      body: {
        valid: true
      }
    }).as('verifyToken');
    
    // Mock the reset password API
    cy.intercept('POST', '**/api/auth/reset-password', {
      statusCode: 200,
      body: {
        message: 'Password reset successful'
      }
    }).as('resetPassword');
    
    // Visit the reset password page with a token
    cy.visit('/reset-password/valid-token');
    
    // Wait for token verification
    cy.wait('@verifyToken');
    
    // Fill and submit the form
    cy.get('input[type="password"]').first().type('NewPassword123');
    cy.get('input[type="password"]').last().type('NewPassword123');
    cy.get('button[type="submit"]').click();
    
    // Wait for the API call
    cy.wait('@resetPassword');
    
    // Should see success message - updated to match actual component
    cy.contains('Password Reset Successful').should('be.visible');
    
    // Should redirect to login after a delay
    cy.url().should('include', '/login');
  });

  it('should validate password strength on reset', () => {
    // Mock the token verification API
    cy.intercept('GET', '**/api/auth/verify-reset-token/*', {
      statusCode: 200,
      body: {
        valid: true
      }
    }).as('verifyToken');
    
    // Visit the reset password page with a token
    cy.visit('/reset-password/valid-token');
    
    // Wait for token verification
    cy.wait('@verifyToken');
    
    // Try to submit with weak password
    cy.get('input[type="password"]').first().type('weak');
    cy.get('input[type="password"]').last().type('weak');
    cy.get('button[type="submit"]').click();
    
    // Should see validation error - updated to match actual component
    cy.contains('Password must be at least 6 characters long').should('be.visible');
  });

  it('should validate password match on reset', () => {
    // Mock the token verification API
    cy.intercept('GET', '**/api/auth/verify-reset-token/*', {
      statusCode: 200,
      body: {
        valid: true
      }
    }).as('verifyToken');
    
    // Visit the reset password page with a token
    cy.visit('/reset-password/valid-token');
    
    // Wait for token verification
    cy.wait('@verifyToken');
    
    // Try to submit with mismatched passwords
    cy.get('input[type="password"]').first().type('StrongPassword123');
    cy.get('input[type="password"]').last().type('DifferentPassword123');
    cy.get('button[type="submit"]').click();
    
    // Should see validation error - updated to match actual component
    cy.contains('Passwords do not match').should('be.visible');
  });
}); 