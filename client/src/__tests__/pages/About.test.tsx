import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import About from '../../pages/About';
import { BrowserRouter } from 'react-router-dom';

// Create a wrapper to provide the router context
const AboutWithRouter = () => (
  <BrowserRouter>
    <About />
  </BrowserRouter>
);

describe('About Page', () => {
  it('renders the main heading', () => {
    render(<AboutWithRouter />);
    
    const heading = screen.getByText('About VibeFlo');
    expect(heading).toBeInTheDocument();
  });

  it('renders all section headings', () => {
    render(<AboutWithRouter />);
    
    const headings = [
      'Our Mission',
      'The Pomodoro Technique',
      'Features of VibeFlo',
      'Technology Stack'
    ];
    
    headings.forEach(heading => {
      expect(screen.getByText(heading)).toBeInTheDocument();
    });
  });

  it('renders the Pomodoro Technique steps', () => {
    render(<AboutWithRouter />);
    
    const steps = [
      'Decide on the task to be done',
      'Set the timer (traditionally to 25 minutes)',
      'Work on the task until the timer rings',
      'Take a short break (5 minutes)',
      'After four pomodoros, take a longer break (15-30 minutes)'
    ];
    
    steps.forEach(step => {
      expect(screen.getByText(step)).toBeInTheDocument();
    });
  });

  it('renders the Features section with all features', () => {
    render(<AboutWithRouter />);
    
    const features = [
      'Customizable Timers:',
      'Task Management:',
      'Statistics and Insights:',
      'Secure Authentication:',
      'Cross-device Sync:',
      'Elegant Interface:'
    ];
    
    features.forEach(feature => {
      expect(screen.getByText(new RegExp(feature))).toBeInTheDocument();
    });
  });

  it('renders the Technology Stack section with technologies', () => {
    render(<AboutWithRouter />);
    
    // Find the Technology Stack heading first
    const techStackHeading = screen.getByText('Technology Stack');
    // Then look for technologies within the same section
    const techStackSection = techStackHeading.closest('div');
    
    expect(techStackSection).toHaveTextContent('Frontend:');
    expect(techStackSection).toHaveTextContent('Backend:');
    expect(techStackSection).toHaveTextContent('Database:');
    expect(techStackSection).toHaveTextContent('Authentication:');
  });

  it('renders a "Get Started Free" link that points to registration', () => {
    render(<AboutWithRouter />);
    
    const getStartedLink = screen.getByText('Get Started Free');
    expect(getStartedLink).toBeInTheDocument();
    expect(getStartedLink.closest('a')).toHaveAttribute('href', '/register');
  });
}); 