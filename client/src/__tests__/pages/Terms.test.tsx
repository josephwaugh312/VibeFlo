import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import Terms from '../../pages/Terms';

// Mock Material UI components
jest.mock('@mui/material', () => ({
  Box: ({ children }: { children: React.ReactNode }) => <div data-testid="mui-box">{children}</div>,
  Typography: ({
    children,
    variant,
    component,
    gutterBottom,
  }: {
    children: React.ReactNode;
    variant?: string;
    component?: string;
    gutterBottom?: boolean;
  }) => (
    <div
      data-testid="mui-typography"
      data-variant={variant}
      data-component={component}
      data-gutterBottom={gutterBottom}
    >
      {children}
    </div>
  ),
}));

describe('Terms Page', () => {
  it('renders the Terms of Service heading', () => {
    render(<Terms />);
    
    // Check that the heading is displayed
    const heading = screen.getByText('Terms of Service');
    expect(heading).toBeInTheDocument();
  });

  it('renders with appropriate Typography props', () => {
    render(<Terms />);
    
    const typography = screen.getByTestId('mui-typography');
    expect(typography).toHaveAttribute('data-variant', 'h4');
    expect(typography).toHaveAttribute('data-component', 'h1');
    expect(typography).toHaveAttribute('data-gutterBottom', 'true');
  });

  it('renders inside a Box component', () => {
    render(<Terms />);
    
    // Check that the Box container is present
    const box = screen.getByTestId('mui-box');
    expect(box).toBeInTheDocument();
    
    // Verify Box contains the Typography component
    const typography = screen.getByTestId('mui-typography');
    expect(box).toContainElement(typography);
  });
}); 