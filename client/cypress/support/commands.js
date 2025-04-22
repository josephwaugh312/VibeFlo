// Custom Cypress commands for OAuth testing

Cypress.Commands.add('loginWithOAuth', (provider, mockResponse = {}) => {
  // Intercept and prevent navigation to external OAuth providers
  if (provider === 'google') {
    cy.intercept('GET', '**/auth/google', req => {
      req.reply({ statusCode: 302, headers: { 'Location': '/oauth-callback?token=mock-token' } });
    }).as('googleAuth');
  } else if (provider === 'github') {
    cy.intercept('GET', '**/auth/github', req => {
      req.reply({ statusCode: 302, headers: { 'Location': '/oauth-callback?token=mock-token' } });
    }).as('githubAuth');
  } else if (provider === 'facebook') {
    // Facebook is a button with click handler, so we don't need to intercept
  }
  
  // Intercept the OAuth callback
  cy.intercept('GET', '/oauth-callback*', mockResponse).as('oauthCallback');
  
  // Click the provider login button
  if (provider === 'facebook') {
    cy.get(`[data-cy="${provider}-login"]`).click();
  } else {
    // Prevent default for links to avoid navigation
    cy.get(`[data-cy="${provider}-login"]`).click();
  }
  
  // For Google and GitHub, simulate redirect to callback
  if (provider !== 'facebook') {
    cy.visit('/oauth-callback?token=mock-token');
  }
  
  // Wait for the callback to be intercepted
  cy.wait('@oauthCallback');
})

// Command to simulate a successful OAuth login
Cypress.Commands.add('mockSuccessfulOAuth', (provider) => {
  const token = 'mock-token-12345';
  
  // Prepare the mock response for the callback
  const mockResponse = {
    statusCode: 200,
    body: {
      success: true,
      token,
      user: {
        id: '123',
        name: 'Test User',
        email: 'test@example.com'
      }
    }
  };
  
  // Login with OAuth
  cy.loginWithOAuth(provider, mockResponse);
  
  // After OAuth callback, localStorage should have token
  cy.window().then((window) => {
    window.localStorage.setItem('token', token);
  });
  
  // Verify we're redirected away from login
  cy.url().should('not.include', '/login');
})

// Command to simulate a failed OAuth login
Cypress.Commands.add('mockFailedOAuth', (provider) => {
  const mockResponse = {
    statusCode: 400,
    body: {
      success: false,
      message: 'Authentication failed'
    }
  };
  
  cy.loginWithOAuth(provider, mockResponse);
}) 