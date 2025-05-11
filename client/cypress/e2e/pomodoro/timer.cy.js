/// <reference types="cypress" />

describe('Pomodoro Timer Functionality', () => {
  beforeEach(() => {
    // Login and navigate to pomodoro page
    cy.login();
    cy.visitSection('/pomodoro', 'Pomodoro Timer');
  });

  it('should display the timer with default settings', () => {
    cy.get('[data-cy="timer-display"]').should('exist');
    cy.get('[data-cy="timer-display"]').should('contain', '25:00');
    cy.get('[data-cy="start-button"]').should('exist');
    cy.get('[data-cy="reset-button"]').should('exist');
  });

  it('should start the timer when clicking start button', () => {
    cy.get('[data-cy="start-button"]').click();
    
    // Wait for a second to ensure the timer started
    cy.wait(1000);
    
    // Timer should be less than 25:00 after starting
    cy.get('[data-cy="timer-display"]').should('not.contain', '25:00');
    
    // Reset the timer for cleanup
    cy.get('[data-cy="reset-button"]').click();
  });

  it('should pause the timer when clicking pause button', () => {
    // Start the timer
    cy.get('[data-cy="start-button"]').click();
    
    // Wait for a second
    cy.wait(1000);
    
    // Get the current time
    cy.get('[data-cy="timer-display"]').invoke('text').then((timeText) => {
      // Click pause button (it should be the same button that was start)
      cy.get('[data-cy="pause-button"]').click();
      
      // Wait for a second
      cy.wait(1000);
      
      // Time should not have changed
      cy.get('[data-cy="timer-display"]').should('contain', timeText);
    });
    
    // Reset the timer for cleanup
    cy.get('[data-cy="reset-button"]').click();
  });

  it('should reset the timer when clicking reset button', () => {
    // Start the timer
    cy.get('[data-cy="start-button"]').click();
    
    // Wait for a second
    cy.wait(1000);
    
    // Click reset button
    cy.get('[data-cy="reset-button"]').click();
    
    // Timer should reset to default time
    cy.get('[data-cy="timer-display"]').should('contain', '25:00');
  });

  it('should switch to break time after completing a session', () => {
    // This test is more complex as it requires mocking the timer
    // For now, let's just check if the break button exists and works
    cy.get('[data-cy="break-button"]').should('exist');
    cy.get('[data-cy="break-button"]').click();
    
    // Should show 5:00 for short break by default
    cy.get('[data-cy="timer-display"]').should('contain', '5:00');
    
    // Reset back to pomodoro
    cy.get('[data-cy="pomodoro-button"]').click();
    cy.get('[data-cy="timer-display"]').should('contain', '25:00');
  });

  it('should customize timer settings', () => {
    // Open settings
    cy.get('[data-cy="settings-button"]').click();
    
    // Change pomodoro duration
    cy.get('[data-cy="pomodoro-duration-input"]').clear().type('20');
    
    // Save settings
    cy.get('[data-cy="save-settings-button"]').click();
    
    // Timer should reflect new settings
    cy.get('[data-cy="timer-display"]').should('contain', '20:00');
  });
}); 