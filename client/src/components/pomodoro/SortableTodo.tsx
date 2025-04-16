import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Todo as TodoItem } from './TodoList';

interface TodoProps {
  todo: TodoItem;
  isSelected: boolean;
  onToggleComplete: (id: string) => void;
  onChangeText: (id: string, newText: string) => void;
  onSelect: (id: string) => void;
}

export const SortableTodo: React.FC<TodoProps> = ({
  todo,
  isSelected,
  onToggleComplete,
  onChangeText,
  onSelect
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: todo.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 1000 : 1
  };

  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      {...attributes} 
      className={`relative group ${isDragging ? 'opacity-90' : ''}`}
    >
      <div className="flex items-center">
        <div 
          className="pr-3 flex items-center cursor-grab active:cursor-grabbing touch-none" 
          {...listeners}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-purple-400 hover:text-purple-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
          </svg>
        </div>
        <div className="flex-grow">
          <div className={`
            p-4 rounded-lg 
            ${isSelected ? 'bg-purple-900 border-2 border-purple-500' : 'bg-gray-700 border border-gray-600 hover:border-gray-500'} 
            transition-all duration-200 ease-in-out
          `}>
            <div className="flex items-start space-x-3">
              <button
                onClick={() => onToggleComplete(todo.id)}
                className={`
                  flex-shrink-0 w-6 h-6 mt-1 rounded-full border-2 
                  ${todo.completed 
                    ? 'bg-green-500 border-green-400 text-white flex items-center justify-center' 
                    : 'border-gray-400 hover:border-purple-400'
                  }
                  transition-colors duration-200
                `}
                aria-label={todo.completed ? "Mark as incomplete" : "Mark as complete"}
              >
                {todo.completed && (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </button>
              
              <div className="flex-grow">
                <input
                  type="text"
                  value={todo.text}
                  onChange={(e) => onChangeText(todo.id, e.target.value)}
                  onClick={() => onSelect(todo.id)}
                  placeholder="Add a task..."
                  className={`
                    w-full bg-transparent border-none outline-none 
                    ${todo.completed ? 'text-green-400 line-through' : 'text-white'} 
                    placeholder-gray-500 text-lg focus:outline-none
                  `}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}; 