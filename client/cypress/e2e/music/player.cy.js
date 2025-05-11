/// <reference types="cypress" />

describe('Music Player Functionality', () => {
  beforeEach(() => {
    // Login and navigate to music page
    cy.login();
    cy.visitSection('/music', 'Music Player');
  });

  it('should display the music player', () => {
    cy.get('[data-cy="music-player"]').should('exist');
    cy.get('[data-cy="play-button"]').should('exist');
    cy.get('[data-cy="volume-control"]').should('exist');
  });

  it('should search for music', () => {
    // Type in search box
    cy.get('[data-cy="search-input"]').type('lofi study beats');
    cy.get('[data-cy="search-button"]').click();
    
    // Wait for search results
    cy.get('[data-cy="search-results"]', { timeout: 10000 }).should('exist');
    cy.get('[data-cy="search-results"]').find('li').should('have.length.at.least', 1);
  });

  it('should play a selected track', () => {
    // Search for music first
    cy.get('[data-cy="search-input"]').type('lofi study beats');
    cy.get('[data-cy="search-button"]').click();
    
    // Wait for search results and click on the first result
    cy.get('[data-cy="search-results"]', { timeout: 10000 })
      .find('li')
      .first()
      .click();
    
    // Check that the player is active
    cy.get('[data-cy="music-player"]').should('have.class', 'playing');
    cy.get('[data-cy="pause-button"]').should('exist');
  });

  it('should adjust volume', () => {
    // Search and play music first
    cy.get('[data-cy="search-input"]').type('lofi study beats');
    cy.get('[data-cy="search-button"]').click();
    
    cy.get('[data-cy="search-results"]', { timeout: 10000 })
      .find('li')
      .first()
      .click();
    
    // Test volume slider
    cy.get('[data-cy="volume-control"]').as('volumeSlider');
    
    // Set volume to 50%
    cy.get('@volumeSlider')
      .invoke('val', 50)
      .trigger('change');
    
    cy.get('@volumeSlider').should('have.value', '50');
    
    // Set volume to 0%
    cy.get('@volumeSlider')
      .invoke('val', 0)
      .trigger('change');
    
    cy.get('@volumeSlider').should('have.value', '0');
  });

  it('should create and save a playlist', () => {
    const playlistName = 'Test Playlist ' + Date.now();
    
    // Use our custom command to create a playlist
    cy.createPlaylist(playlistName);
  });

  it('should add tracks to a playlist', () => {
    const playlistName = 'Add Tracks Playlist ' + Date.now();
    
    // Create playlist
    cy.createPlaylist(playlistName);
    
    // Search for tracks
    cy.get('[data-cy="search-input"]').type('lofi study beats');
    cy.get('[data-cy="search-button"]').click();
    
    // Wait for search results
    cy.get('[data-cy="search-results"]', { timeout: 10000 }).should('exist');
    
    // Add first track to playlist
    cy.get('[data-cy="search-results"]')
      .find('li')
      .first()
      .find('[data-cy="add-to-playlist-button"]')
      .click();
    
    // Select our playlist from dropdown
    cy.get('[data-cy="playlist-dropdown"]').select(playlistName);
    cy.get('[data-cy="confirm-add-to-playlist"]').click();
    
    // Open the playlist
    cy.get('[data-cy="playlists-list"]').contains(playlistName).click();
    
    // Verify track is in playlist
    cy.get('[data-cy="playlist-tracks"]').find('li').should('have.length', 1);
  });

  it('should continue playing music when navigating to other pages', () => {
    // Search and play music first
    cy.get('[data-cy="search-input"]').type('lofi study beats');
    cy.get('[data-cy="search-button"]').click();
    
    cy.get('[data-cy="search-results"]', { timeout: 10000 })
      .find('li')
      .first()
      .click();
    
    // Navigate to pomodoro page
    cy.visitSection('/pomodoro', 'Pomodoro Timer');
    
    // Mini player should be visible
    cy.get('[data-cy="mini-player"]').should('exist');
    cy.get('[data-cy="mini-player"]').should('have.class', 'playing');
  });
}); 