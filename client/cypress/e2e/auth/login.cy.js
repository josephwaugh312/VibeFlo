describe('Login Flow', () => {
  beforeEach(() => {
    // Clear the localStorage to ensure each test starts fresh
    cy.clearLocalStorage();
    cy.clearCookies();
  });

  it('should display the login page correctly', () => {
    cy.visit('/login');
    
    // Check page elements are present
    cy.get('h2').should('contain', 'Sign in to your account');
    cy.get('input[name="email"]').should('be.visible');
    cy.get('input[name="password"]').should('be.visible');
    cy.get('input[name="remember-me"]').should('be.visible');
    cy.get('button[type="submit"]').should('be.visible');
    
    // Check OAuth buttons
    cy.get('a[href*="/auth/google"]').should('be.visible');
    cy.get('a[href*="/auth/github"]').should('be.visible');
  });

  it('should show validation errors for empty fields', () => {
    cy.visit('/login');
    
    // Submit the form without filling it
    cy.get('button[type="submit"]').click();
    
    // Browser's native validation should prevent submission
    // We can check that we're still on the login page
    cy.url().should('include', '/login');
  });

  it('should login with valid credentials', () => {
    // Intercept the login API call to mock a successful response
    cy.intercept('POST', '**/api/auth/login', {
      statusCode: 200,
      body: {
        message: 'Login successful',
        user: {
          id: '1',
          name: 'Test User',
          username: 'testuser',
          email: 'test@example.com'
        },
        token: 'fake-jwt-token'
      }
    }).as('loginRequest');
    
    cy.visit('/login');
    
    // Fill and submit the login form
    cy.get('input[name="email"]').type('test@example.com');
    cy.get('input[name="password"]').type('Password123');
    cy.get('button[type="submit"]').click();
    
    // Wait for the API call
    cy.wait('@loginRequest');
    
    // Should redirect to dashboard after login
    cy.url().should('include', '/dashboard');
    
    // Check localStorage has token
    cy.window().then((window) => {
      expect(window.localStorage.getItem('token')).to.eq('fake-jwt-token');
    });
  });

  it('should show error with invalid credentials', () => {
    // Intercept the login API call to mock a failed response
    cy.intercept('POST', '**/api/auth/login', {
      statusCode: 401,
      body: {
        message: 'Invalid credentials'
      }
    }).as('loginRequest');
    
    cy.visit('/login');
    
    // Fill and submit the login form
    cy.get('input[name="email"]').type('test@example.com');
    cy.get('input[name="password"]').type('WrongPassword');
    cy.get('button[type="submit"]').click();
    
    // Wait for the API call
    cy.wait('@loginRequest');
    
    // Error message should be displayed - update to correctly target the error
    cy.contains('Invalid credentials').should('be.visible');
    
    // Should stay on login page
    cy.url().should('include', '/login');
  });

  it('should respect the "Remember Me" checkbox', () => {
    // First login with Remember Me checked (default)
    cy.intercept('POST', '**/api/auth/login', {
      statusCode: 200,
      body: {
        message: 'Login successful',
        user: {
          id: '1',
          name: 'Test User',
          username: 'testuser',
          email: 'test@example.com'
        },
        token: 'fake-jwt-token'
      }
    }).as('loginRequest');
    
    cy.visit('/login');
    
    // Make sure "Remember Me" is checked (should be by default)
    cy.get('input[name="remember-me"]').should('be.checked');
    
    // Fill and submit the login form
    cy.get('input[name="email"]').type('test@example.com');
    cy.get('input[name="password"]').type('Password123');
    cy.get('button[type="submit"]').click();
    
    // Wait for the API call
    cy.wait('@loginRequest');
    
    // Should save token to localStorage
    cy.window().then((window) => {
      expect(window.localStorage.getItem('token')).to.eq('fake-jwt-token');
    });
  });
}); 