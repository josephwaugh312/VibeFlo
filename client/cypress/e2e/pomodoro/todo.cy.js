/// <reference types="cypress" />

describe('Todo List Functionality', () => {
  beforeEach(() => {
    // Login and navigate to pomodoro page
    cy.login();
    cy.visitSection('/pomodoro', 'To-Do List');
  });

  it('should display the todo list', () => {
    cy.get('[data-cy="todo-list"]').should('exist');
    cy.get('[data-cy="add-todo-input"]').should('exist');
  });

  it('should add a new todo', () => {
    const todoText = 'Test todo ' + Date.now();
    
    // Use our custom command to create a todo
    cy.createTodo(todoText);
  });

  it('should mark a todo as completed', () => {
    const todoText = 'Complete me ' + Date.now();
    
    // Add a new todo
    cy.createTodo(todoText);
    
    // Find the todo and click its checkbox
    cy.contains(todoText)
      .parent()
      .find('[data-cy="todo-checkbox"]')
      .click();
    
    // Todo should have completed class or style
    cy.contains(todoText)
      .parent()
      .should('have.class', 'completed');
  });

  it('should delete a todo', () => {
    const todoText = 'Delete me ' + Date.now();
    
    // Add a new todo
    cy.createTodo(todoText);
    
    // Find the todo and click delete button
    cy.contains(todoText)
      .parent()
      .find('[data-cy="delete-todo-button"]')
      .click();
    
    // Todo should no longer exist
    cy.contains(todoText).should('not.exist');
  });

  it('should reorder todos through drag and drop', () => {
    // Add two todos
    const firstTodo = 'First todo ' + Date.now();
    const secondTodo = 'Second todo ' + Date.now();
    
    cy.createTodo(firstTodo);
    cy.createTodo(secondTodo);
    
    // Get the first todo
    cy.contains(firstTodo)
      .parent()
      .as('firstTodoItem');
    
    // Get the second todo
    cy.contains(secondTodo)
      .parent()
      .as('secondTodoItem');
    
    // Verify initial order
    cy.get('[data-cy="todo-list"] > li').eq(0).should('contain', firstTodo);
    cy.get('[data-cy="todo-list"] > li').eq(1).should('contain', secondTodo);
    
    // Perform drag and drop
    // Note: This requires the drag-and-drop library to be properly set up with data-cy attributes
    cy.get('@firstTodoItem')
      .find('[data-cy="drag-handle"]')
      .trigger('mousedown', { button: 0 })
      .trigger('mousemove', { clientX: 100, clientY: 100 })
      .get('@secondTodoItem')
      .trigger('mousemove')
      .trigger('mouseup', { force: true });
    
    // Verify new order (may need to be adjusted based on actual implementation)
    cy.get('[data-cy="todo-list"] > li').eq(0).should('contain', secondTodo);
    cy.get('[data-cy="todo-list"] > li').eq(1).should('contain', firstTodo);
  });

  it('should persist todos after page refresh', () => {
    const todoText = 'Persistent todo ' + Date.now();
    
    // Add a new todo
    cy.createTodo(todoText);
    
    // Reload the page
    cy.reload();
    
    // Wait for todo list to load
    cy.contains('To-Do List', { timeout: 10000 });
    
    // Todo should still exist
    cy.contains(todoText).should('exist');
  });
}); 