/// <reference types="cypress" />

describe('Basic Application Tests', () => {
  it('should load the homepage', () => {
    cy.visit('/');
    cy.get('a').should('exist');
  });

  it('should load the login page', () => {
    cy.visit('/login');
    cy.get('input[type="password"]').should('exist');
    cy.get('button[type="submit"]').should('exist');
  });

  it('should attempt login', () => {
    cy.visit('/login');
    
    // Mock the login API
    cy.intercept('POST', '**/api/auth/login', {
      statusCode: 200,
      body: {
        success: true,
        token: 'fake-jwt-token',
        user: {
          id: '1',
          name: 'Test User',
          username: 'testuser',
          email: 'test@example.com'
        }
      }
    }).as('loginRequest');
    
    // Fill in login form
    cy.get('input#loginIdentifier').type('test@example.com');
    cy.get('input[type="password"]').type('password123');
    cy.get('button[type="submit"]').click();
    
    // Wait for request
    cy.wait('@loginRequest');
    
    // Should redirect away from login
    cy.url().should('not.include', '/login');
  });
  
  it('should load the dashboard after login', () => {
    // Set auth state first
    cy.window().then(win => {
      win.localStorage.setItem('token', 'fake-jwt-token');
      win.localStorage.setItem('user', JSON.stringify({
        id: '1',
        name: 'Test User',
        username: 'testuser',
        email: 'test@example.com'
      }));
    });
    
    // Visit dashboard
    cy.visit('/dashboard');
    
    // Verify we're on the dashboard
    cy.url().should('include', '/dashboard');
    
    // Take screenshot for debug
    cy.screenshot('dashboard-loaded');
  });
  
  it('should load other feature pages', () => {
    // Set auth state first
    cy.window().then(win => {
      win.localStorage.setItem('token', 'fake-jwt-token');
      win.localStorage.setItem('user', JSON.stringify({
        id: '1',
        name: 'Test User',
        username: 'testuser',
        email: 'test@example.com'
      }));
    });
    
    // Try to access other feature pages
    const pages = [
      '/themes',
      '/pomodoro',
      '/music'
    ];
    
    // Visit each page and take a screenshot
    pages.forEach(page => {
      cy.visit(page);
      cy.url().should('include', page);
      cy.wait(1000); // Wait for page to load
      cy.screenshot(`page-${page.replace(/\//g, '-')}`);
    });
  });
}); 