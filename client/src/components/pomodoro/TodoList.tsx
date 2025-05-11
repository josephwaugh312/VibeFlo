import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import { 
  DndContext, 
  closestCenter, 
  KeyboardSensor, 
  PointerSensor, 
  DragEndEvent
} from '@dnd-kit/core';
import {
  useSensor,
  useSensors
} from '@dnd-kit/core';
import { 
  arrayMove, 
  SortableContext, 
  sortableKeyboardCoordinates, 
  verticalListSortingStrategy 
} from '@dnd-kit/sortable';
import { SortableTodo } from './SortableTodo';
import { generateId } from '../../utils/generateId';

export interface Todo {
  id: string;
  text: string;
  completed: boolean;
  recordedInStats: boolean;
}

interface TodoListProps {
  isOpen: boolean;
  onClose: () => void;
  onTaskSelect: (task: string) => void;
  currentTask?: string;
  todos: Todo[];
  onSave: (todos: Todo[]) => void;
  isAuthenticated?: boolean;
}

const TodoList: React.FC<TodoListProps> = ({
  isOpen,
  onClose,
  onTaskSelect,
  currentTask = '',
  todos = [],
  onSave,
  isAuthenticated = false
}) => {
  const [localTodos, setLocalTodos] = useState<Todo[]>([]);
  const [selectedTodoId, setSelectedTodoId] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Load todos from provided todos prop
  useEffect(() => {
    if (todos && todos.length > 0) {
      setLocalTodos(todos);
    } else {
      // Set default empty todos if none provided
      const emptyTodos = [
        { id: `todo-1-${generateId()}`, text: '', completed: false, recordedInStats: false },
        { id: `todo-2-${generateId()}`, text: '', completed: false, recordedInStats: false },
        { id: `todo-3-${generateId()}`, text: '', completed: false, recordedInStats: false },
      ];
      setLocalTodos(emptyTodos);
      
      // Update parent component
      onSave(emptyTodos);
    }
  }, [todos]);

  // Save todos when they change
  useEffect(() => {
    setSaving(true);
    // Add a small delay to simulate saving
    const timeout = setTimeout(() => {
      onSave(localTodos);
      setSaving(false);
    }, 300);
    
    return () => clearTimeout(timeout);
  }, [localTodos, onSave]);

  // Select the todo that matches the current task
  useEffect(() => {
    if (currentTask) {
      const matchingTodo = localTodos.find(todo => todo.text === currentTask);
      if (matchingTodo) {
        setSelectedTodoId(matchingTodo.id);
      } else {
        setSelectedTodoId(null);
      }
    } else {
      setSelectedTodoId(null);
    }
  }, [currentTask, localTodos]);

  const handleToggleComplete = (id: string) => {
    setLocalTodos(prevTodos => 
      prevTodos.map(todo => 
        todo.id === id ? { ...todo, completed: !todo.completed } : todo
      )
    );
  };

  const handleChangeText = (id: string, newText: string) => {
    setLocalTodos(prevTodos => 
      prevTodos.map(todo => 
        todo.id === id ? { ...todo, text: newText } : todo
      )
    );
  };

  const handleSelectTask = (id: string) => {
    setSelectedTodoId(id);
    const selectedTodo = localTodos.find(todo => todo.id === id);
    if (selectedTodo) {
      onTaskSelect(selectedTodo.text);
    }
  };
  
  // Handle drag end event for dnd-kit
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (over && active.id !== over.id) {
      setLocalTodos((todos) => {
        const oldIndex = todos.findIndex(todo => todo.id === active.id);
        const newIndex = todos.findIndex(todo => todo.id === over.id);
        
        return arrayMove(todos, oldIndex, newIndex);
      });
    }
  };

  const resetTodos = () => {
    // Don't record tasks when resetting anymore
    const emptyTodos = [
      { id: `todo-1-${generateId()}`, text: '', completed: false, recordedInStats: false },
      { id: `todo-2-${generateId()}`, text: '', completed: false, recordedInStats: false },
      { id: `todo-3-${generateId()}`, text: '', completed: false, recordedInStats: false },
    ];
    setLocalTodos(emptyTodos);
    setSelectedTodoId(null);
    if (currentTask) {
      onTaskSelect('');
    }
    
    // Make sure to call onSave to update localStorage
    onSave(emptyTodos);
    
    toast.success('Tasks have been reset');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70">
      <div className="bg-gray-800 text-white rounded-lg shadow-lg p-6 sm:p-8 w-full max-w-3xl sm:max-w-4xl max-h-[85vh] overflow-y-auto mt-[-10px] relative">
        {/* Header with explicit spacing for mobile and desktop */}
        <div className="mb-8 relative">
          {/* Close button - fixed position */}
          <button 
            onClick={onClose}
            className="absolute left-0 top-0 text-gray-300 hover:text-white"
            aria-label="Close"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          
          {/* Reset button - fixed position */}
          <button 
            onClick={resetTodos}
            className="absolute right-0 top-0 text-white hover:text-white bg-transparent hover:bg-red-600 border-2 border-red-600 rounded py-1 px-3 transition-colors text-base font-medium"
            aria-label="Reset Tasks"
            title="Reset all tasks"
          >
            Reset
          </button>
          
          {/* Title - centered with enough margin to avoid buttons */}
          <h2 className="text-2xl sm:text-3xl font-bold text-center text-purple-400 mx-auto mt-12 sm:mt-8" style={{ maxWidth: '65%' }}>
            Organize Your Day
          </h2>
        </div>
        
        <div className="mb-10">
          <p className="text-xl text-gray-300 text-center">What are your goals today?</p>
          {saving && <p className="text-sm text-purple-400 text-center mt-2">Saving your tasks...</p>}
        </div>

        {loading ? (
          <div className="flex justify-center mb-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
          </div>
        ) : (
          <DndContext 
            sensors={sensors} 
            collisionDetection={closestCenter} 
            onDragEnd={handleDragEnd}
          >
            <SortableContext items={localTodos.map(todo => todo.id)} strategy={verticalListSortingStrategy}>
              <ul className="space-y-8 mb-8 list-none">
                {localTodos.map((todo) => (
                  <SortableTodo
                    key={todo.id}
                    todo={todo}
                    isSelected={selectedTodoId === todo.id}
                    onToggleComplete={handleToggleComplete}
                    onChangeText={handleChangeText}
                    onSelect={handleSelectTask}
                  />
                ))}
              </ul>
            </SortableContext>
          </DndContext>
        )}
        
        {!isAuthenticated && (
          <div className="text-sm text-center text-gray-400 mb-6">
            <p>Sign in to sync your tasks across devices</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TodoList; 