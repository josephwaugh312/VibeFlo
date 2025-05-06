import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import SettingsModal from '../../../components/settings/SettingsModal';

describe('SettingsModal Component', () => {
  const mockOnClose = jest.fn();
  const mockOnSave = jest.fn();
  const defaultSettings = {
    pomodoro_duration: 25,
    short_break_duration: 5,
    long_break_duration: 15,
    pomodoros_until_long_break: 4,
    auto_start_breaks: false,
    auto_start_pomodoros: false,
    sound_enabled: true,
    notification_enabled: true,
  };

  beforeEach(() => {
    mockOnClose.mockClear();
    mockOnSave.mockClear();
  });

  it('renders when isOpen is true', () => {
    render(
      <SettingsModal 
        isOpen={true} 
        onClose={mockOnClose} 
        onSave={mockOnSave} 
        initialSettings={defaultSettings} 
      />
    );
    
    expect(screen.getByText('Timer Settings')).toBeInTheDocument();
    expect(screen.getByLabelText('Pomodoro')).toBeInTheDocument();
    expect(screen.getByLabelText('Short Break')).toBeInTheDocument();
    expect(screen.getByLabelText('Long Break')).toBeInTheDocument();
  });

  it('does not render when isOpen is false', () => {
    render(
      <SettingsModal 
        isOpen={false} 
        onClose={mockOnClose} 
        onSave={mockOnSave} 
        initialSettings={defaultSettings} 
      />
    );
    
    expect(screen.queryByText('Timer Settings')).not.toBeInTheDocument();
  });

  it('shows the initial settings values', () => {
    render(
      <SettingsModal 
        isOpen={true} 
        onClose={mockOnClose} 
        onSave={mockOnSave} 
        initialSettings={defaultSettings} 
      />
    );
    
    expect(screen.getByLabelText('Pomodoro')).toHaveValue('25');
    expect(screen.getByLabelText('Short Break')).toHaveValue('5');
    expect(screen.getByLabelText('Long Break')).toHaveValue('15');
    expect(screen.getByLabelText('Pomodoros until long break')).toHaveValue('4');
    expect(screen.getByLabelText('Auto start breaks')).not.toBeChecked();
    expect(screen.getByLabelText('Auto start pomodoros')).not.toBeChecked();
    expect(screen.getByLabelText('Sound notifications')).toBeChecked();
    expect(screen.getByLabelText('Browser notifications')).toBeChecked();
  });

  it('updates form values when changed', () => {
    render(
      <SettingsModal 
        isOpen={true} 
        onClose={mockOnClose} 
        onSave={mockOnSave} 
        initialSettings={defaultSettings} 
      />
    );
    
    // Update number inputs
    fireEvent.change(screen.getByLabelText('Pomodoro'), { target: { value: '30' } });
    fireEvent.change(screen.getByLabelText('Short Break'), { target: { value: '10' } });
    fireEvent.change(screen.getByLabelText('Long Break'), { target: { value: '20' } });
    fireEvent.change(screen.getByLabelText('Pomodoros until long break'), { target: { value: '5' } });
    
    // Update checkboxes
    fireEvent.click(screen.getByLabelText('Auto start breaks'));
    fireEvent.click(screen.getByLabelText('Sound notifications'));
    
    // Check that values updated
    expect(screen.getByLabelText('Pomodoro')).toHaveValue('30');
    expect(screen.getByLabelText('Short Break')).toHaveValue('10');
    expect(screen.getByLabelText('Long Break')).toHaveValue('20');
    expect(screen.getByLabelText('Pomodoros until long break')).toHaveValue('5');
    expect(screen.getByLabelText('Auto start breaks')).toBeChecked();
    expect(screen.getByLabelText('Sound notifications')).not.toBeChecked();
  });

  it('calls onSave with updated settings when Save Settings button is clicked', async () => {
    render(
      <SettingsModal 
        isOpen={true} 
        onClose={mockOnClose} 
        onSave={mockOnSave} 
        initialSettings={defaultSettings} 
      />
    );
    
    // Update settings
    fireEvent.change(screen.getByLabelText('Pomodoro'), { target: { value: '30' } });
    fireEvent.click(screen.getByLabelText('Auto start breaks'));
    
    // Click save button
    fireEvent.click(screen.getByText('Save Settings'));
    
    // Check that onSave was called with updated settings
    await waitFor(() => {
      expect(mockOnSave).toHaveBeenCalledTimes(1);
      expect(mockOnSave).toHaveBeenCalledWith({
        ...defaultSettings,
        pomodoro_duration: 30,
        auto_start_breaks: true,
        dark_mode: false,
        timer_completion_sound: 'bell'
      });
    });
    
    // Check that onClose was called
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('resets form values and calls onClose when Cancel button is clicked', () => {
    render(
      <SettingsModal 
        isOpen={true} 
        onClose={mockOnClose} 
        onSave={mockOnSave} 
        initialSettings={defaultSettings} 
      />
    );
    
    // Update settings
    fireEvent.change(screen.getByLabelText('Pomodoro'), { target: { value: '30' } });
    fireEvent.click(screen.getByLabelText('Auto start breaks'));
    
    // Check that values updated
    expect(screen.getByLabelText('Pomodoro')).toHaveValue('30');
    expect(screen.getByLabelText('Auto start breaks')).toBeChecked();
    
    // Click cancel button
    fireEvent.click(screen.getByText('Cancel'));
    
    // Check that onClose was called
    expect(mockOnClose).toHaveBeenCalledTimes(1);
    
    // Re-render to check reset works
    mockOnClose.mockClear();
    render(
      <SettingsModal 
        isOpen={true} 
        onClose={mockOnClose} 
        onSave={mockOnSave} 
        initialSettings={defaultSettings} 
      />
    );
    
    // Check values are back to defaults
    expect(screen.getByLabelText('Pomodoro')).toHaveValue('25');
    expect(screen.getByLabelText('Auto start breaks')).not.toBeChecked();
  });

  it('uses default settings if initialSettings is not provided', () => {
    render(
      <SettingsModal 
        isOpen={true} 
        onClose={mockOnClose} 
        onSave={mockOnSave} 
      />
    );
    
    expect(screen.getByLabelText('Pomodoro')).toHaveValue('25');
    expect(screen.getByLabelText('Short Break')).toHaveValue('5');
    expect(screen.getByLabelText('Long Break')).toHaveValue('15');
    expect(screen.getByLabelText('Pomodoros until long break')).toHaveValue('4');
  });

  it('updates local state when initialSettings changes', () => {
    const { rerender } = render(
      <SettingsModal 
        isOpen={true} 
        onClose={mockOnClose} 
        onSave={mockOnSave} 
        initialSettings={defaultSettings} 
      />
    );
    
    // Initial values
    expect(screen.getByLabelText('Pomodoro')).toHaveValue('25');
    expect(screen.getByLabelText('Auto start breaks')).not.toBeChecked();
    
    // Re-render with new initialSettings
    const updatedSettings = {
      ...defaultSettings,
      pomodoro_duration: 35,
      auto_start_breaks: true
    };
    
    rerender(
      <SettingsModal 
        isOpen={true} 
        onClose={mockOnClose} 
        onSave={mockOnSave} 
        initialSettings={updatedSettings} 
      />
    );
    
    // Check values updated
    expect(screen.getByLabelText('Pomodoro')).toHaveValue('35');
    expect(screen.getByLabelText('Auto start breaks')).toBeChecked();
  });
}); 