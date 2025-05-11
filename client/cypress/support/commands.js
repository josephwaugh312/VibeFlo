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

/**
 * Login command to authenticate user
 * @param {string} email - User email
 * @param {string} password - User password
 */
Cypress.Commands.add('login', (email = 'test@example.com', password = 'password123') => {
  cy.visit('/login');
  cy.get('[data-cy="email-input"]').type(email);
  cy.get('[data-cy="password-input"]').type(password);
  cy.get('[data-cy="login-button"]').click();
  
  // Verify login by checking for user info in the navbar
  cy.get('[data-cy="user-avatar"]', { timeout: 10000 }).should('exist');
});

/**
 * Navigate to a section and wait for it to load
 * @param {string} route - Route to navigate to
 * @param {string} titleText - Text to wait for on the page
 */
Cypress.Commands.add('visitSection', (route, titleText) => {
  cy.visit(route);
  cy.contains(titleText, { timeout: 10000 });
});

/**
 * Create a todo item
 * @param {string} text - Todo text
 */
Cypress.Commands.add('createTodo', (text) => {
  cy.get('[data-cy="add-todo-input"]').type(`${text}{enter}`);
  cy.contains(text).should('exist');
});

/**
 * Create a playlist
 * @param {string} name - Playlist name
 */
Cypress.Commands.add('createPlaylist', (name) => {
  cy.get('[data-cy="create-playlist-button"]').click();
  cy.get('[data-cy="playlist-name-input"]').type(name);
  cy.get('[data-cy="save-playlist-button"]').click();
  cy.get('[data-cy="playlists-list"]').contains(name).should('exist');
});

/**
 * Create a custom theme
 * @param {string} name - Theme name
 * @param {string} bgColor - Background color hex code
 * @param {string} textColor - Text color hex code
 */
Cypress.Commands.add('createTheme', (name, bgColor = '#3498db', textColor = '#ffffff') => {
  cy.get('[data-cy="create-theme-button"]').click();
  cy.get('[data-cy="theme-name-input"]').type(name);
  cy.get('[data-cy="background-color-picker"]').invoke('val', bgColor).trigger('change');
  cy.get('[data-cy="text-color-picker"]').invoke('val', textColor).trigger('change');
  cy.get('[data-cy="save-theme-button"]').click();
  cy.get('[data-cy="themes-list"]').contains(name).should('exist');
}); 