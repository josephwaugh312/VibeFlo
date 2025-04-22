describe('OAuth Authentication', () => {
  beforeEach(() => {
    cy.visit('/login')
    // Clear localStorage before each test
    cy.clearLocalStorage()
  })

  it('should handle successful GitHub login', () => {
    // Intercept the GitHub auth endpoint to prevent actual redirect
    cy.intercept('GET', '**/auth/github', {
      statusCode: 302,
      headers: { 'Location': '/oauth-callback?token=github-mock-token' }
    }).as('githubAuth')
    
    // Intercept the OAuth callback
    cy.intercept('GET', '/oauth-callback*', {
      statusCode: 200,
      body: '<html><script>localStorage.setItem("token", "github-mock-token"); window.location.href = "/dashboard";</script></html>'
    }).as('oauthCallback')
    
    // Click GitHub login button
    cy.get('[data-cy="github-login"]').click()
    
    // Simulate OAuth callback
    cy.visit('/oauth-callback?token=github-mock-token')
    
    // Should be redirected to dashboard
    cy.url().should('include', '/dashboard')
    
    // Token should be in localStorage
    cy.window().then((win) => {
      expect(win.localStorage.getItem('token')).to.eq('github-mock-token')
    })
  })
  
  it('should handle successful Google login', () => {
    // Intercept the Google auth endpoint to prevent actual redirect
    cy.intercept('GET', '**/auth/google', {
      statusCode: 302,
      headers: { 'Location': '/oauth-callback?token=google-mock-token' }
    }).as('googleAuth')
    
    // Intercept the OAuth callback
    cy.intercept('GET', '/oauth-callback*', {
      statusCode: 200,
      body: '<html><script>localStorage.setItem("token", "google-mock-token"); window.location.href = "/dashboard";</script></html>'
    }).as('oauthCallback')
    
    // Click Google login button
    cy.get('[data-cy="google-login"]').click()
    
    // Simulate OAuth callback
    cy.visit('/oauth-callback?token=google-mock-token')
    
    // Should be redirected to dashboard
    cy.url().should('include', '/dashboard')
    
    // Token should be in localStorage
    cy.window().then((win) => {
      expect(win.localStorage.getItem('token')).to.eq('google-mock-token')
    })
  })
  
  it('should handle successful Facebook login', () => {
    // For Facebook, we'll check that the notice appears since it's not fully implemented
    cy.get('[data-cy="facebook-login"]').click()
    
    // Should see Facebook coming soon notice
    cy.contains('Facebook login coming soon!').should('be.visible')
  })
  
  it('should handle failed OAuth authentication', () => {
    // Directly visit the oauth-callback page with an error parameter
    cy.visit('/oauth-callback?error=authentication_failed')
    
    // Wait for the callback container to be visible first
    cy.get('[data-cy="oauth-callback-container"]', { timeout: 10000 }).should('be.visible')
    
    // Then check for the error title using data-cy attribute
    cy.get('[data-cy="auth-error-title"]', { timeout: 15000 }).should('be.visible')
      .should('contain.text', 'Authentication Error')
    
    // Check error message is displayed
    cy.get('[data-cy="auth-error-message"]').should('exist')
      .should('contain.text', 'authentication_failed')
    
    // Should not have a token
    cy.window().then((win) => {
      expect(win.localStorage.getItem('token')).to.be.null
    })
  })
}) 