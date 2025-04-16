import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import TodoComponent from '../../components/pomodoro/Todo';

describe('Todo Component', () => {
  // Mock functions
  const mockOnToggleComplete = jest.fn();
  const mockOnChangeText = jest.fn();
  const mockOnSelect = jest.fn();
  
  // Sample todo item
  const sampleTodo = {
    id: 'test-id-1',
    text: 'Test Todo',
    completed: false,
    recordedInStats: false
  };
  
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  it('renders correctly with provided todo', () => {
    render(
      <TodoComponent
        todo={sampleTodo}
        isSelected={false}
        onToggleComplete={mockOnToggleComplete}
        onChangeText={mockOnChangeText}
        onSelect={mockOnSelect}
      />
    );
    
    // Check that todo text is displayed
    const inputElement = screen.getByDisplayValue('Test Todo');
    expect(inputElement).toBeInTheDocument();
    
    // Check that checkbox exists and is unchecked
    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).toBeInTheDocument();
    expect(checkbox).not.toBeChecked();
  });
  
  it('renders a completed todo correctly', () => {
    const completedTodo = { ...sampleTodo, completed: true };
    
    render(
      <TodoComponent
        todo={completedTodo}
        isSelected={false}
        onToggleComplete={mockOnToggleComplete}
        onChangeText={mockOnChangeText}
        onSelect={mockOnSelect}
      />
    );
    
    // Check that checkbox is checked
    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).toBeChecked();
    
    // Check if the input has line-through style
    const inputElement = screen.getByDisplayValue('Test Todo');
    expect(inputElement).toHaveClass('line-through');
    expect(inputElement).toHaveClass('text-gray-400');
  });
  
  it('renders with selected style when isSelected is true', () => {
    render(
      <TodoComponent
        todo={sampleTodo}
        isSelected={true}
        onToggleComplete={mockOnToggleComplete}
        onChangeText={mockOnChangeText}
        onSelect={mockOnSelect}
      />
    );
    
    // Check that list item has the selected style
    const listItem = screen.getByRole('listitem');
    expect(listItem).toHaveClass('ring-2');
    expect(listItem).toHaveClass('ring-purple-500');
  });
  
  it('calls onToggleComplete when checkbox is clicked', () => {
    render(
      <TodoComponent
        todo={sampleTodo}
        isSelected={false}
        onToggleComplete={mockOnToggleComplete}
        onChangeText={mockOnChangeText}
        onSelect={mockOnSelect}
      />
    );
    
    // Click the checkbox
    const checkbox = screen.getByRole('checkbox');
    fireEvent.click(checkbox);
    
    // Check that onToggleComplete was called with the todo id
    expect(mockOnToggleComplete).toHaveBeenCalledTimes(1);
    expect(mockOnToggleComplete).toHaveBeenCalledWith('test-id-1');
  });
  
  it('calls onChangeText when input text is changed', () => {
    render(
      <TodoComponent
        todo={sampleTodo}
        isSelected={false}
        onToggleComplete={mockOnToggleComplete}
        onChangeText={mockOnChangeText}
        onSelect={mockOnSelect}
      />
    );
    
    // Change the input text
    const inputElement = screen.getByDisplayValue('Test Todo');
    fireEvent.change(inputElement, { target: { value: 'Updated Todo' } });
    
    // Check that onChangeText was called with the todo id and new text
    expect(mockOnChangeText).toHaveBeenCalledTimes(1);
    expect(mockOnChangeText).toHaveBeenCalledWith('test-id-1', 'Updated Todo');
  });
  
  it('calls onSelect when list item is clicked', () => {
    render(
      <TodoComponent
        todo={sampleTodo}
        isSelected={false}
        onToggleComplete={mockOnToggleComplete}
        onChangeText={mockOnChangeText}
        onSelect={mockOnSelect}
      />
    );
    
    // Click the list item
    const listItem = screen.getByRole('listitem');
    fireEvent.click(listItem);
    
    // Check that onSelect was called with the todo id
    expect(mockOnSelect).toHaveBeenCalledTimes(1);
    expect(mockOnSelect).toHaveBeenCalledWith('test-id-1');
  });
  
  it('input click stops propagation and does not trigger list item click handler', () => {
    render(
      <TodoComponent
        todo={sampleTodo}
        isSelected={false}
        onToggleComplete={mockOnToggleComplete}
        onChangeText={mockOnChangeText}
        onSelect={mockOnSelect}
      />
    );
    
    // Click the input element
    const inputElement = screen.getByDisplayValue('Test Todo');
    fireEvent.click(inputElement);
    
    // onSelect should not be called when clicking the input
    expect(mockOnSelect).not.toHaveBeenCalled();
  });
  
  it('has appropriate checkbox click handler', () => {
    render(
      <TodoComponent
        todo={sampleTodo}
        isSelected={false}
        onToggleComplete={mockOnToggleComplete}
        onChangeText={mockOnChangeText}
        onSelect={mockOnSelect}
      />
    );
    
    // Verify checkbox exists and has appropriate handler
    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).toBeInTheDocument();
    
    // Just verify the onToggleComplete function is called from the onClick event
    fireEvent.click(checkbox);
    expect(mockOnToggleComplete).toHaveBeenCalledWith('test-id-1');
  });
  
  it('renders placeholder text when todo text is empty', () => {
    const emptyTodo = { ...sampleTodo, text: '' };
    
    render(
      <TodoComponent
        todo={emptyTodo}
        isSelected={false}
        onToggleComplete={mockOnToggleComplete}
        onChangeText={mockOnChangeText}
        onSelect={mockOnSelect}
      />
    );
    
    // Check that input has placeholder
    const inputElement = screen.getByPlaceholderText('Type your task here');
    expect(inputElement).toBeInTheDocument();
  });
}); 