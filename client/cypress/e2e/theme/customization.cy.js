/// <reference types="cypress" />

describe('Theme Customization Functionality', () => {
  beforeEach(() => {
    // Login and navigate to settings/themes page
    cy.login();
    cy.visitSection('/settings', 'Theme Settings');
    
    // Click on themes tab if required
    cy.get('[data-cy="themes-tab"]').click();
  });

  it('should display available themes', () => {
    cy.get('[data-cy="themes-list"]').should('exist');
    cy.get('[data-cy="themes-list"]').find('.theme-item').should('have.length.at.least', 1);
  });

  it('should switch between existing themes', () => {
    // Get the first theme
    cy.get('[data-cy="themes-list"]')
      .find('.theme-item')
      .first()
      .as('firstTheme');
    
    // Get the current theme name
    cy.get('@firstTheme').find('.theme-name').invoke('text').as('firstThemeName');
    
    // Click on the first theme
    cy.get('@firstTheme').click();
    
    // Verify theme is selected
    cy.get('@firstTheme').should('have.class', 'selected');
    
    // Get the second theme
    cy.get('[data-cy="themes-list"]')
      .find('.theme-item')
      .eq(1)
      .as('secondTheme');
    
    // Get the second theme name
    cy.get('@secondTheme').find('.theme-name').invoke('text').as('secondThemeName');
    
    // Click on the second theme
    cy.get('@secondTheme').click();
    
    // Verify second theme is selected
    cy.get('@secondTheme').should('have.class', 'selected');
    cy.get('@firstTheme').should('not.have.class', 'selected');
    
    // Verify theme has changed in the UI
    cy.get('@firstThemeName').then(firstThemeName => {
      cy.get('@secondThemeName').then(secondThemeName => {
        // Verify the active theme text shows the second theme
        cy.get('[data-cy="active-theme-name"]').should('contain', secondThemeName);
        cy.get('[data-cy="active-theme-name"]').should('not.contain', firstThemeName);
      });
    });
  });

  it('should create a custom theme', () => {
    const themeName = 'Custom Theme ' + Date.now();
    
    // Use our custom command to create a theme
    cy.createTheme(themeName, '#3498db', '#ffffff');
  });

  it('should edit an existing custom theme', () => {
    const themeName = 'Edit Theme ' + Date.now();
    const editedName = 'Edited Theme ' + Date.now();
    
    // Create a theme first
    cy.createTheme(themeName);
    
    // Find and click edit on the created theme
    cy.get('[data-cy="themes-list"]')
      .contains(themeName)
      .parent()
      .find('[data-cy="edit-theme-button"]')
      .click();
    
    // Edit the theme name
    cy.get('[data-cy="theme-name-input"]').clear().type(editedName);
    
    // Change the background color
    cy.get('[data-cy="background-color-picker"]').invoke('val', '#e74c3c').trigger('change');
    
    // Save the changes
    cy.get('[data-cy="save-theme-button"]').click();
    
    // Verify the edited theme name appears in the list
    cy.get('[data-cy="themes-list"]').contains(editedName).should('exist');
    cy.get('[data-cy="themes-list"]').contains(themeName).should('not.exist');
  });

  it('should delete a custom theme', () => {
    const themeName = 'Delete Theme ' + Date.now();
    
    // Create a theme first
    cy.createTheme(themeName);
    
    // Find and click delete on the created theme
    cy.get('[data-cy="themes-list"]')
      .contains(themeName)
      .parent()
      .find('[data-cy="delete-theme-button"]')
      .click();
    
    // Confirm deletion in the modal
    cy.get('[data-cy="confirm-delete-button"]').click();
    
    // Verify the theme is removed from the list
    cy.get('[data-cy="themes-list"]').contains(themeName).should('not.exist');
  });

  it('should persist theme selection after page refresh', () => {
    // Get and select the first theme
    cy.get('[data-cy="themes-list"]')
      .find('.theme-item')
      .first()
      .click();
    
    // Get the selected theme name
    cy.get('[data-cy="active-theme-name"]').invoke('text').as('selectedThemeName');
    
    // Reload the page
    cy.reload();
    
    // Wait for themes to load
    cy.contains('Theme Settings', { timeout: 10000 });
    
    // Verify the same theme is still selected
    cy.get('@selectedThemeName').then(themeName => {
      cy.get('[data-cy="active-theme-name"]').should('contain', themeName);
    });
  });
}); 