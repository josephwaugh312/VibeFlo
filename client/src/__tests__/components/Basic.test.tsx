import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

// Simple component for testing
const SimpleComponent = () => {
  return (
    <div>
      <h1>Hello, World!</h1>
      <p>This is a simple component for testing purposes.</p>
      <button>Click me</button>
    </div>
  );
};

describe('Basic Component Tests', () => {
  it('renders the component without crashing', () => {
    render(<SimpleComponent />);
    
    // Check if the heading is in the document
    expect(screen.getByRole('heading')).toBeInTheDocument();
    expect(screen.getByText('Hello, World!')).toBeInTheDocument();
  });

  it('displays the paragraph text correctly', () => {
    render(<SimpleComponent />);
    
    const paragraph = screen.getByText(/This is a simple component/i);
    expect(paragraph).toBeInTheDocument();
  });

  it('renders a button that users can interact with', () => {
    render(<SimpleComponent />);
    
    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
    expect(button).toHaveTextContent('Click me');
  });
}); 