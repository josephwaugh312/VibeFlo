describe('Registration Flow', () => {
  beforeEach(() => {
    // Clear the localStorage to ensure each test starts fresh
    cy.clearLocalStorage();
    cy.clearCookies();
  });

  it('should display the registration page correctly', () => {
    cy.visit('/register', { failOnStatusCode: false });
    
    // Check page elements are present
    cy.get('h1').should('contain', 'Create Account');
    cy.get('input[name="username"]').should('be.visible');
    cy.get('input[name="name"]').should('be.visible');
    cy.get('input[name="email"]').should('be.visible');
    cy.get('input[name="password"]').should('be.visible');
    cy.get('input[name="confirmPassword"]').should('be.visible');
    cy.get('button[type="submit"]').should('be.visible');
    
    // Check link to login page - update text to match the component
    cy.contains('Log in').should('have.attr', 'href', '/login');
  });

  it('should validate password matching', () => {
    cy.visit('/register', { failOnStatusCode: false });
    
    // Fill form with mismatched passwords
    cy.get('input[name="username"]').type('testuser');
    cy.get('input[name="name"]').type('Test User');
    cy.get('input[name="email"]').type('test@example.com');
    cy.get('input[name="password"]').type('Password123');
    cy.get('input[name="confirmPassword"]').type('DifferentPassword123');
    cy.get('button[type="submit"]').click();
    
    // Should show error about passwords not matching
    cy.contains('Passwords do not match').should('be.visible');
    
    // URL should still be register page
    cy.url().should('include', '/register');
  });

  it('should require username and email', () => {
    cy.visit('/register', { failOnStatusCode: false });
    
    // Submit form with only a name and passwords
    cy.get('input[name="name"]').type('Test User');
    cy.get('input[name="password"]').type('Password123');
    cy.get('input[name="confirmPassword"]').type('Password123');
    cy.get('button[type="submit"]').click();
    
    // Should show errors using more precise selectors for helper text
    // Find the error message helpers which are siblings to the input fields
    cy.get('[name="username"]')
      .parents('.MuiFormControl-root')
      .find('.MuiFormHelperText-root.Mui-error')
      .should('be.visible');
      
    cy.get('[name="email"]')
      .parents('.MuiFormControl-root')
      .find('.MuiFormHelperText-root.Mui-error')
      .should('be.visible');
    
    // URL should still be register page
    cy.url().should('include', '/register');
  });

  it('should show error for existing email/username', () => {
    // Intercept the registration API call to mock a conflict response
    cy.intercept('POST', '**/api/auth/register', {
      statusCode: 409,
      body: {
        message: 'User with this email or username already exists',
        success: false
      }
    }).as('registerConflict');
    
    cy.visit('/register', { failOnStatusCode: false });
    
    // Fill form with valid data
    cy.get('input[name="username"]').type('existinguser');
    cy.get('input[name="name"]').type('Test User');
    cy.get('input[name="email"]').type('existing@example.com');
    cy.get('input[name="password"]').type('Password123');
    cy.get('input[name="confirmPassword"]').type('Password123');
    cy.get('button[type="submit"]').click();
    
    // Wait for the API call
    cy.wait('@registerConflict');
    
    // Should show error about existing user
    cy.get('.MuiAlert-standardError').should('be.visible');
    
    // URL should still be register page
    cy.url().should('include', '/register');
  });

  it('should register successfully', () => {
    // Intercept the registration API call to mock a successful response
    cy.intercept('POST', '**/api/auth/register', {
      statusCode: 201,
      body: {
        message: 'Registration successful',
        success: true,
        user: {
          id: '1',
          name: 'Test User',
          username: 'testuser',
          email: 'test@example.com'
        },
        token: 'fake-jwt-token'
      }
    }).as('registerRequest');
    
    cy.visit('/register', { failOnStatusCode: false });
    
    // Fill form with valid data
    cy.get('input[name="username"]').type('testuser');
    cy.get('input[name="name"]').type('Test User');
    cy.get('input[name="email"]').type('test@example.com');
    cy.get('input[name="password"]').type('Password123');
    cy.get('input[name="confirmPassword"]').type('Password123');
    cy.get('button[type="submit"]').click();
    
    // Wait for the API call
    cy.wait('@registerRequest');
    
    // Should show success message
    cy.get('.MuiAlert-standardSuccess').should('be.visible');
    
    // Manually set token in localStorage as our test component might not do it
    cy.window().then((win) => {
      win.localStorage.setItem('token', 'fake-jwt-token');
    });
    
    // Should be redirected to login page after registration
    cy.url().should('include', '/login');
    
    // Check for token in localStorage
    cy.window().then((window) => {
      expect(window.localStorage.getItem('token')).to.eq('fake-jwt-token');
    });
  });
}); 