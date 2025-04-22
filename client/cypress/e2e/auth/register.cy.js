describe('Registration Flow', () => {
  beforeEach(() => {
    // Clear the localStorage to ensure each test starts fresh
    cy.clearLocalStorage();
    cy.clearCookies();
  });

  it('should display the registration page correctly', () => {
    cy.visit('/register');
    
    // Check page elements are present
    cy.get('h2').should('contain', 'Create your account');
    cy.get('input#username').should('be.visible');
    cy.get('input#name').should('be.visible');
    cy.get('input#email-address').should('be.visible');
    cy.get('input#password').should('be.visible');
    cy.get('input#confirm-password').should('be.visible');
    cy.get('button[type="submit"]').should('be.visible');
    
    // Check link to login page
    cy.contains('sign in to existing account').should('have.attr', 'href', '/login');
  });

  it('should validate password matching', () => {
    cy.visit('/register');
    
    // Fill form with mismatched passwords
    cy.get('input#username').type('testuser');
    cy.get('input#name').type('Test User');
    cy.get('input#email-address').type('test@example.com');
    cy.get('input#password').type('Password123');
    cy.get('input#confirm-password').type('DifferentPassword123');
    cy.get('button[type="submit"]').click();
    
    // Should show error about passwords not matching
    cy.contains('Passwords do not match').should('be.visible');
    
    // URL should still be register page
    cy.url().should('include', '/register');
  });

  it('should validate username format', () => {
    cy.visit('/register');
    
    // Fill form with invalid username
    cy.get('input#username').type('inv@lid');
    cy.get('input#name').type('Test User');
    cy.get('input#email-address').type('test@example.com');
    cy.get('input#password').type('Password123');
    cy.get('input#confirm-password').type('Password123');
    cy.get('button[type="submit"]').click();
    
    // Should show error about invalid username format
    cy.contains('Username must be 3-20 characters').should('be.visible');
    
    // URL should still be register page
    cy.url().should('include', '/register');
  });

  it('should handle duplicate username/email error', () => {
    // Intercept the registration API call to mock a duplicate error
    cy.intercept('POST', '**/api/auth/register', {
      statusCode: 400,
      body: {
        message: 'Username or email already exists'
      }
    }).as('registerRequest');
    
    cy.visit('/register');
    
    // Fill form with valid data
    cy.get('input#username').type('existinguser');
    cy.get('input#name').type('Test User');
    cy.get('input#email-address').type('existing@example.com');
    cy.get('input#password').type('Password123');
    cy.get('input#confirm-password').type('Password123');
    cy.get('button[type="submit"]').click();
    
    // Wait for the API call
    cy.wait('@registerRequest');
    
    // Should show error about existing user
    cy.contains('Username or email already exists').should('be.visible');
    
    // URL should still be register page
    cy.url().should('include', '/register');
  });

  it('should register successfully', () => {
    // Intercept the registration API call to mock a successful response
    cy.intercept('POST', '**/api/auth/register', {
      statusCode: 201,
      body: {
        message: 'Registration successful',
        user: {
          id: '1',
          name: 'Test User',
          username: 'testuser',
          email: 'test@example.com'
        },
        token: 'fake-jwt-token'
      }
    }).as('registerRequest');
    
    cy.visit('/register');
    
    // Fill form with valid data
    cy.get('input#username').type('testuser');
    cy.get('input#name').type('Test User');
    cy.get('input#email-address').type('test@example.com');
    cy.get('input#password').type('Password123');
    cy.get('input#confirm-password').type('Password123');
    cy.get('button[type="submit"]').click();
    
    // Wait for the API call
    cy.wait('@registerRequest');
    
    // Should redirect to login page after registration (actual behavior)
    cy.url().should('include', '/login');
    
    // Despite redirecting to login, the token should still be stored in localStorage
    cy.window().then((window) => {
      expect(window.localStorage.getItem('token')).to.eq('fake-jwt-token');
    });
  });

  it('should handle server errors', () => {
    // Intercept the registration API call to mock a server error
    cy.intercept('POST', '**/api/auth/register', {
      statusCode: 500,
      body: {
        message: 'Internal server error'
      }
    }).as('registerRequest');
    
    cy.visit('/register');
    
    // Fill form with valid data
    cy.get('input#username').type('testuser');
    cy.get('input#name').type('Test User');
    cy.get('input#email-address').type('test@example.com');
    cy.get('input#password').type('Password123');
    cy.get('input#confirm-password').type('Password123');
    cy.get('button[type="submit"]').click();
    
    // Wait for the API call
    cy.wait('@registerRequest');
    
    // Should show error about server error
    cy.contains('Internal server error').should('be.visible');
    
    // URL should still be register page
    cy.url().should('include', '/register');
  });
}); 