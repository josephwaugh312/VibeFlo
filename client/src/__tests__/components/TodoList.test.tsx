import React from 'react';
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import TodoList from '../../components/pomodoro/TodoList';
import { generateId } from '../../utils/generateId';
import { toast } from 'react-hot-toast';

// Mock the dnd-kit library
jest.mock('@dnd-kit/core', () => {
  return {
    DndContext: ({ children }: { children: React.ReactNode }) => <div data-testid="dnd-context">{children}</div>,
    closestCenter: jest.fn(),
    KeyboardSensor: jest.fn(),
    PointerSensor: jest.fn(),
    useSensor: jest.fn(() => ({})),
    useSensors: jest.fn(() => ({}))
  };
});

jest.mock('@dnd-kit/sortable', () => {
  return {
    SortableContext: ({ children }: { children: React.ReactNode }) => <div data-testid="sortable-context">{children}</div>,
    arrayMove: jest.fn((arr, oldIndex, newIndex) => {
      const result = Array.from(arr);
      const [removed] = result.splice(oldIndex, 1);
      result.splice(newIndex, 0, removed);
      return result;
    }),
    sortableKeyboardCoordinates: jest.fn(),
    verticalListSortingStrategy: 'vertical'
  };
});

// Mock the SortableTodo component
jest.mock('../../components/pomodoro/SortableTodo', () => ({
  SortableTodo: ({ 
    todo, 
    isSelected, 
    onToggleComplete, 
    onChangeText, 
    onSelect 
  }: any) => (
    <li 
      data-testid={`todo-item-${todo.id}`}
      className={isSelected ? 'selected' : ''}
    >
      <input 
        type="checkbox" 
        checked={todo.completed}
        onChange={() => onToggleComplete(todo.id)}
        data-testid={`todo-checkbox-${todo.id}`}
      />
      <input 
        type="text" 
        value={todo.text}
        onChange={(e) => onChangeText(todo.id, e.target.value)}
        onClick={() => onSelect(todo.id)}
        placeholder="Add a task..."
        data-testid={`todo-input-${todo.id}`}
      />
    </li>
  )
}));

// Mock the entire react-hot-toast module
jest.mock('react-hot-toast', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn()
  }
}));

// Mock the generateId utility
jest.mock('../../utils/generateId', () => ({
  generateId: jest.fn()
}));

// Mock the setTimeout function
jest.useFakeTimers();

describe('TodoList Component', () => {
  // Common props for testing
  const mockOnClose = jest.fn();
  const mockOnTaskSelect = jest.fn();
  const mockOnTodosChange = jest.fn();
  
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    // Set up generateId mock implementation
    (generateId as jest.Mock).mockImplementation(() => 'mocked-id');
  });
  
  afterEach(() => {
    // Clear any pending timeouts
    jest.clearAllTimers();
    jest.useRealTimers();
  });
  
  it('renders correctly when open', () => {
    render(
      <TodoList 
        isOpen={true} 
        onClose={mockOnClose} 
        onTaskSelect={mockOnTaskSelect}
        onTodosChange={mockOnTodosChange}
      />
    );
    
    // Check header is rendered
    expect(screen.getByText('Organize Your Day')).toBeInTheDocument();
    
    // Check that reset button is available
    expect(screen.getByText('Reset')).toBeInTheDocument();
    
    // Check that todos are rendered (3 by default)
    expect(screen.getAllByTestId(/^todo-item/)).toHaveLength(3);
  });
  
  it('does not render when isOpen is false', () => {
    render(
      <TodoList 
        isOpen={false} 
        onClose={mockOnClose} 
        onTaskSelect={mockOnTaskSelect}
        onTodosChange={mockOnTodosChange}
      />
    );
    
    // Should not render anything when closed
    expect(screen.queryByText('Organize Your Day')).not.toBeInTheDocument();
  });
  
  it('renders initial todos when provided', () => {
    const initialTodos = [
      { id: 'test-1', text: 'Task 1', completed: false, recordedInStats: false },
      { id: 'test-2', text: 'Task 2', completed: true, recordedInStats: false }
    ];
    
    render(
      <TodoList 
        isOpen={true} 
        onClose={mockOnClose} 
        onTaskSelect={mockOnTaskSelect}
        initialTodos={initialTodos}
        onTodosChange={mockOnTodosChange}
      />
    );
    
    // Check that the provided todos are rendered
    expect(screen.getByTestId('todo-item-test-1')).toBeInTheDocument();
    expect(screen.getByTestId('todo-item-test-2')).toBeInTheDocument();
    
    // Check values
    expect(screen.getByTestId('todo-input-test-1')).toHaveValue('Task 1');
    expect(screen.getByTestId('todo-checkbox-test-2')).toBeChecked();
  });
  
  it('handles toggling todo completion', async () => {
    const initialTodos = [
      { id: 'test-1', text: 'Task 1', completed: false, recordedInStats: false }
    ];
    
    render(
      <TodoList 
        isOpen={true} 
        onClose={mockOnClose} 
        onTaskSelect={mockOnTaskSelect}
        initialTodos={initialTodos}
        onTodosChange={mockOnTodosChange}
      />
    );
    
    // Toggle completion
    fireEvent.click(screen.getByTestId('todo-checkbox-test-1'));
    
    // Fast-forward timers to trigger the delayed onTodosChange
    act(() => {
      jest.advanceTimersByTime(400);
    });
    
    // Check that the onTodosChange callback was called with updated todos
    await waitFor(() => {
      expect(mockOnTodosChange).toHaveBeenCalled();
    });
    
    const updatedTodos = mockOnTodosChange.mock.calls[0][0];
    
    // First todo should now be completed
    expect(updatedTodos[0].completed).toBe(true);
  });
  
  it('handles changing todo text', async () => {
    const initialTodos = [
      { id: 'test-1', text: '', completed: false, recordedInStats: false }
    ];
    
    render(
      <TodoList 
        isOpen={true} 
        onClose={mockOnClose} 
        onTaskSelect={mockOnTaskSelect}
        initialTodos={initialTodos}
        onTodosChange={mockOnTodosChange}
      />
    );
    
    // Change text
    fireEvent.change(screen.getByTestId('todo-input-test-1'), {
      target: { value: 'New task text' }
    });
    
    // Fast-forward timers to trigger the delayed onTodosChange
    act(() => {
      jest.advanceTimersByTime(400);
    });
    
    // Check that the onTodosChange callback was called with updated todos
    await waitFor(() => {
      expect(mockOnTodosChange).toHaveBeenCalled();
    });
    
    const updatedTodos = mockOnTodosChange.mock.calls[0][0];
    
    // Todo text should be updated
    expect(updatedTodos[0].text).toBe('New task text');
  });
  
  it('handles selecting a task', () => {
    const initialTodos = [
      { id: 'test-1', text: 'Task 1', completed: false, recordedInStats: false }
    ];
    
    render(
      <TodoList 
        isOpen={true} 
        onClose={mockOnClose} 
        onTaskSelect={mockOnTaskSelect}
        initialTodos={initialTodos}
      />
    );
    
    // Select the task
    fireEvent.click(screen.getByTestId('todo-input-test-1'));
    
    // Check that the onTaskSelect callback was called with the task text
    expect(mockOnTaskSelect).toHaveBeenCalledWith('Task 1');
  });
  
  it('resets todos when reset button is clicked', async () => {
    const initialTodos = [
      { id: 'test-1', text: 'Task 1', completed: true, recordedInStats: false }
    ];
    
    render(
      <TodoList 
        isOpen={true} 
        onClose={mockOnClose} 
        onTaskSelect={mockOnTaskSelect}
        initialTodos={initialTodos}
        onTodosChange={mockOnTodosChange}
        currentTask="Task 1"
      />
    );
    
    // Click reset button
    fireEvent.click(screen.getByText('Reset'));
    
    // Fast-forward timers to trigger the delayed onTodosChange
    act(() => {
      jest.advanceTimersByTime(400);
    });
    
    // Check that toast.success was called
    expect(toast.success).toHaveBeenCalledWith('Tasks have been reset');
    
    // Should create 3 empty todos
    await waitFor(() => {
      expect(mockOnTodosChange).toHaveBeenCalled();
    });
    
    const resetTodos = mockOnTodosChange.mock.calls[0][0];
    
    // Should have 3 todos
    expect(resetTodos).toHaveLength(3);
    
    // All todos should be empty and not completed
    resetTodos.forEach(todo => {
      expect(todo.text).toBe('');
      expect(todo.completed).toBe(false);
    });
    
    // Should clear the selected task
    expect(mockOnTaskSelect).toHaveBeenCalledWith('');
  });
  
  it('calls onClose when close button is clicked', () => {
    render(
      <TodoList 
        isOpen={true} 
        onClose={mockOnClose} 
        onTaskSelect={mockOnTaskSelect}
        onTodosChange={mockOnTodosChange}
      />
    );
    
    // Click close button
    fireEvent.click(screen.getByLabelText('Close'));
    
    // Check that onClose was called
    expect(mockOnClose).toHaveBeenCalled();
  });
}); 