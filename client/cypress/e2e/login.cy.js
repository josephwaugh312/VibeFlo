describe('Login Page', () => {
  beforeEach(() => {
    cy.visit('/login')
  })

  it('should display the login form', () => {
    cy.get('h2').should('contain', 'Sign in to your account')
    cy.get('form').should('exist')
    cy.get('input#email-address').should('exist')
    cy.get('input#password').should('exist')
    cy.get('button[type="submit"]').should('exist')
  })

  it('should display OAuth login options', () => {
    cy.get('a[href*="/auth/google"]').should('exist')
    cy.get('button').contains(/Facebook|Sign in with Facebook/).should('exist')
    cy.get('a[href*="/auth/github"]').should('exist')
  })

  it('should handle form submission with validation', () => {
    // Test empty form submission
    cy.get('button[type="submit"]').click()
    
    // The form uses HTML5 validation, so we'll test presence of required fields
    cy.get('input#email-address').should('have.attr', 'required')
    cy.get('input#password').should('have.attr', 'required')
    
    // Test invalid email
    cy.get('input#email-address').type('invalid-email')
    cy.get('input#password').type('password123')
    cy.get('button[type="submit"]').click()
    
    // Browser validation should prevent submission
    cy.url().should('include', '/login')
    
    // Test valid submission (intercepted)
    cy.intercept('POST', '/api/auth/login', {
      statusCode: 200,
      body: {
        token: 'test-token',
        user: { id: '123', name: 'Test User' }
      }
    }).as('loginRequest')
    
    cy.get('input#email-address').clear().type('test@example.com')
    cy.get('input#password').clear().type('password123')
    cy.get('button[type="submit"]').click()
    
    cy.wait('@loginRequest')
    cy.url().should('not.include', '/login')
  })

  it('should handle login errors', () => {
    // Intercept the login API call to mock a failed response 
    cy.intercept('POST', '/api/auth/login', {
      statusCode: 401,
      body: {
        message: 'Invalid credentials'
      }
    }).as('failedLogin')
    
    cy.get('input#email-address').type('test@example.com')
    cy.get('input#password').type('wrongpassword')
    cy.get('button[type="submit"]').click()
    
    // Wait for the API call
    cy.wait('@failedLogin')
    
    // After a failed login, we should still be on the login page
    cy.url().should('include', '/login')
    
    // The form should still be available for retry
    cy.get('input#email-address').should('exist')
    cy.get('input#password').should('exist')
    cy.get('button[type="submit"]').should('exist')
  })
}) 