import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { AddTodoInput } from '../../components/pomodoro/AddTodoInput';

describe('AddTodoInput Component', () => {
  // Mock the onAddTodo function
  const mockAddTodo = jest.fn();
  
  beforeEach(() => {
    // Clear mock before each test
    mockAddTodo.mockClear();
  });
  
  it('renders properly with placeholder text', () => {
    render(<AddTodoInput onAddTodo={mockAddTodo} />);
    
    // Check if input field exists
    const inputElement = screen.getByPlaceholderText('Add a new task...');
    expect(inputElement).toBeInTheDocument();
    
    // Check if button exists
    const buttonElement = screen.getByRole('button');
    expect(buttonElement).toBeInTheDocument();
  });
  
  it('updates text when typing in input field', () => {
    render(<AddTodoInput onAddTodo={mockAddTodo} />);
    
    const inputElement = screen.getByPlaceholderText('Add a new task...') as HTMLInputElement;
    
    // Simulate typing
    fireEvent.change(inputElement, { target: { value: 'New todo item' } });
    
    // Check if input value is updated
    expect(inputElement.value).toBe('New todo item');
  });
  
  it('calls onAddTodo when form is submitted with text', () => {
    const { container } = render(<AddTodoInput onAddTodo={mockAddTodo} />);
    
    const inputElement = screen.getByPlaceholderText('Add a new task...');
    const formElement = container.querySelector('form');
    
    // Type in input
    fireEvent.change(inputElement, { target: { value: 'New todo item' } });
    
    // Submit form
    if (formElement) {
      fireEvent.submit(formElement);
    } else {
      fail('Form element not found');
    }
    
    // Check if onAddTodo was called with correct text
    expect(mockAddTodo).toHaveBeenCalledWith('New todo item');
  });
  
  it('clears input field after form submission', () => {
    const { container } = render(<AddTodoInput onAddTodo={mockAddTodo} />);
    
    const inputElement = screen.getByPlaceholderText('Add a new task...') as HTMLInputElement;
    const formElement = container.querySelector('form');
    
    // Type in input
    fireEvent.change(inputElement, { target: { value: 'New todo item' } });
    
    // Submit form
    if (formElement) {
      fireEvent.submit(formElement);
    } else {
      fail('Form element not found');
    }
    
    // Check if input value is cleared
    expect(inputElement.value).toBe('');
  });
  
  it('does not call onAddTodo when form is submitted with empty text', () => {
    const { container } = render(<AddTodoInput onAddTodo={mockAddTodo} />);
    
    const formElement = container.querySelector('form');
    
    // Submit form without typing anything
    if (formElement) {
      fireEvent.submit(formElement);
    } else {
      fail('Form element not found');
    }
    
    // Check if onAddTodo was not called
    expect(mockAddTodo).not.toHaveBeenCalled();
  });
  
  it('trims whitespace from input before submission', () => {
    const { container } = render(<AddTodoInput onAddTodo={mockAddTodo} />);
    
    const inputElement = screen.getByPlaceholderText('Add a new task...');
    const formElement = container.querySelector('form');
    
    // Type in input with extra spaces
    fireEvent.change(inputElement, { target: { value: '  Trimmed todo item  ' } });
    
    // Submit form
    if (formElement) {
      fireEvent.submit(formElement);
    } else {
      fail('Form element not found');
    }
    
    // Check if onAddTodo was called with trimmed text
    expect(mockAddTodo).toHaveBeenCalledWith('Trimmed todo item');
  });
  
  it('disables button when input is empty', () => {
    render(<AddTodoInput onAddTodo={mockAddTodo} />);
    
    const buttonElement = screen.getByRole('button');
    
    // Button should be disabled initially
    expect(buttonElement).toBeDisabled();
    expect(buttonElement).toHaveClass('opacity-50');
    expect(buttonElement).toHaveClass('cursor-not-allowed');
  });
  
  it('enables button when input has text', () => {
    render(<AddTodoInput onAddTodo={mockAddTodo} />);
    
    const inputElement = screen.getByPlaceholderText('Add a new task...');
    const buttonElement = screen.getByRole('button');
    
    // Type in input
    fireEvent.change(inputElement, { target: { value: 'New todo item' } });
    
    // Button should be enabled
    expect(buttonElement).not.toBeDisabled();
    expect(buttonElement).not.toHaveClass('opacity-50');
    expect(buttonElement).not.toHaveClass('cursor-not-allowed');
  });
}); 