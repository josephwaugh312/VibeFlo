import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import NotFound from '../../pages/NotFound';
import { BrowserRouter } from 'react-router-dom';

// Wrap component with BrowserRouter to provide router context for Link
const NotFoundWithRouter = () => (
  <BrowserRouter>
    <NotFound />
  </BrowserRouter>
);

describe('NotFound Page', () => {
  it('renders the 404 heading', () => {
    render(<NotFoundWithRouter />);
    
    const heading = screen.getByText('404');
    expect(heading).toBeInTheDocument();
  });

  it('renders the "Page Not Found" text', () => {
    render(<NotFoundWithRouter />);
    
    const subHeading = screen.getByText('Page Not Found');
    expect(subHeading).toBeInTheDocument();
  });

  it('renders the description text', () => {
    render(<NotFoundWithRouter />);
    
    const description = screen.getByText("The page you're looking for doesn't exist or has been moved.");
    expect(description).toBeInTheDocument();
  });

  it('renders a back to home link', () => {
    render(<NotFoundWithRouter />);
    
    const homeLink = screen.getByText('Back to Home');
    expect(homeLink).toBeInTheDocument();
    expect(homeLink.closest('a')).toHaveAttribute('href', '/');
  });
}); 