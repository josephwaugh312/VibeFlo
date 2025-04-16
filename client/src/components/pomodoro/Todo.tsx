import React from 'react';
import { Todo as TodoItem } from './TodoList';

interface TodoProps {
  todo: TodoItem;
  isSelected: boolean;
  onToggleComplete: (id: string) => void;
  onChangeText: (id: string, newText: string) => void;
  onSelect: (id: string) => void;
}

const TodoComponent: React.FC<TodoProps> = ({
  todo,
  isSelected,
  onToggleComplete,
  onChangeText,
  onSelect
}) => {
  return (
    <li
      style={{
        background: '#374151',
        padding: '18px 20px',
        borderRadius: '8px',
        display: 'flex',
        alignItems: 'center',
        gap: '18px'
      }}
      className={isSelected ? 'ring-2 ring-purple-500' : ''}
      onClick={() => onSelect(todo.id)}
    >
      <div className="flex-shrink-0">
        <input
          type="checkbox"
          checked={todo.completed}
          onChange={(e) => {
            e.stopPropagation();
            onToggleComplete(todo.id);
          }}
          className="h-6 w-6 accent-purple-600 rounded"
        />
      </div>
      <input
        type="text"
        value={todo.text}
        onChange={(e) => onChangeText(todo.id, e.target.value)}
        onClick={(e) => e.stopPropagation()}
        placeholder="Type your task here"
        className={`flex-1 bg-transparent border-none focus:outline-none text-xl ${
          todo.completed ? 'line-through text-gray-400' : 'text-white'
        }`}
      />
    </li>
  );
};

export default TodoComponent; 