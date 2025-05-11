describe('Login Flow', () => {
  beforeEach(() => {
    // Clear the localStorage to ensure each test starts fresh
    cy.clearLocalStorage();
    cy.clearCookies();
  });

  it('should display the login page correctly', () => {
    cy.visit('/login');
    
    // Check page elements are present using correct selectors
    cy.get('h1').should('contain', 'Welcome Back');
    cy.get('input#loginIdentifier').should('be.visible');
    cy.get('input[type="password"]').should('be.visible');
    cy.get('button[type="submit"]').should('be.visible');
    
    // Check OAuth buttons with correct data-cy attributes
    cy.get('[data-cy="google-login"]').should('exist');
    cy.get('[data-cy="github-login"]').should('exist');
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
        success: true,
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
    
    // Fill and submit the login form with correct selectors
    cy.get('input#loginIdentifier').type('test@example.com');
    cy.get('input[type="password"]').type('Password123');
    cy.get('button[type="submit"]').click();
    
    // Wait for the API call
    cy.wait('@loginRequest');
    
    // Should redirect to dashboard after login
    cy.url().should('not.include', '/login');
    
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
        message: 'Invalid credentials',
        success: false
      }
    }).as('loginRequest');
    
    cy.visit('/login');
    
    // Fill and submit the login form with correct selectors
    cy.get('input#loginIdentifier').type('test@example.com');
    cy.get('input[type="password"]').type('WrongPassword');
    cy.get('button[type="submit"]').click();
    
    // Wait for the API call
    cy.wait('@loginRequest');
    
    // Error message should be displayed in an Alert
    cy.get('.MuiAlert-standardError').should('be.visible');
    
    // Should stay on login page
    cy.url().should('include', '/login');
  });

  it('should remember logged in user with token', () => {
    // Intercept the login API call to mock a successful response
    cy.intercept('POST', '**/api/auth/login', {
      statusCode: 200,
      body: {
        message: 'Login successful',
        success: true,
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
    
    // Fill and submit the login form with correct selectors
    cy.get('input#loginIdentifier').type('test@example.com');
    cy.get('input[type="password"]').type('Password123');
    
    // Check "Remember me" option
    cy.get('input[type="checkbox"]').check();
    
    cy.get('button[type="submit"]').click();
    
    // Wait for the API call
    cy.wait('@loginRequest');
    
    // Should save token to localStorage
    cy.window().then((window) => {
      expect(window.localStorage.getItem('token')).to.eq('fake-jwt-token');
    });
  });
}); 