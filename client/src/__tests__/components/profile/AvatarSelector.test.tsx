import React from 'react';
import { render, screen, fireEvent, within } from '@testing-library/react';
import '@testing-library/jest-dom';
import AvatarSelector from '../../../components/profile/AvatarSelector';

describe('AvatarSelector Component', () => {
  const mockOnClose = jest.fn();
  const mockOnSelect = jest.fn();
  const mockProps = {
    open: true,
    onClose: mockOnClose,
    onSelect: mockOnSelect,
    currentAvatar: 'icon:person'
  };

  beforeEach(() => {
    mockOnClose.mockClear();
    mockOnSelect.mockClear();
  });

  it('renders when open is true', () => {
    render(<AvatarSelector {...mockProps} />);
    expect(screen.getByText('Choose an Avatar')).toBeInTheDocument();
  });

  it('does not render when open is false', () => {
    render(<AvatarSelector {...mockProps} open={false} />);
    expect(screen.queryByText('Choose an Avatar')).not.toBeInTheDocument();
  });

  it('displays icon avatars by default', () => {
    render(<AvatarSelector {...mockProps} />);
    
    // Check that Icons tab is selected
    const iconsTab = screen.getByRole('tab', { name: 'Icons' });
    expect(iconsTab).toHaveAttribute('aria-selected', 'true');
    
    // There should be avatar elements in the document
    const avatarContainers = screen.getAllByTestId('avatar-option');
    expect(avatarContainers.length).toBeGreaterThanOrEqual(12);
  });

  it('switches tabs correctly', () => {
    render(<AvatarSelector {...mockProps} />);
    
    // Click Colors tab
    fireEvent.click(screen.getByRole('tab', { name: 'Colors' }));
    expect(screen.getByRole('tab', { name: 'Colors' })).toHaveAttribute('aria-selected', 'true');
    
    // Click Gradients tab
    fireEvent.click(screen.getByRole('tab', { name: 'Gradients' }));
    expect(screen.getByRole('tab', { name: 'Gradients' })).toHaveAttribute('aria-selected', 'true');
    
    // Back to Icons tab
    fireEvent.click(screen.getByRole('tab', { name: 'Icons' }));
    expect(screen.getByRole('tab', { name: 'Icons' })).toHaveAttribute('aria-selected', 'true');
  });

  it('selects an avatar when clicked', () => {
    render(<AvatarSelector {...mockProps} />);
    
    // Click on the first avatar
    const avatarContainers = screen.getAllByTestId('avatar-option');
    fireEvent.click(avatarContainers[0]);
    
    // Apply button should be enabled
    const applyButton = screen.getByRole('button', { name: 'Apply Avatar' });
    expect(applyButton).not.toBeDisabled();
  });

  it('calls onSelect with correct value when Apply Avatar is clicked', () => {
    render(<AvatarSelector {...mockProps} />);
    
    // Click on the first avatar in the Icons tab
    const avatarContainers = screen.getAllByTestId('avatar-option');
    fireEvent.click(avatarContainers[0]);
    
    // Click Apply button
    fireEvent.click(screen.getByRole('button', { name: 'Apply Avatar' }));
    
    // onSelect should be called with the new avatar
    expect(mockOnSelect).toHaveBeenCalledTimes(1);
    expect(mockOnSelect).toHaveBeenCalledWith(expect.stringContaining('icon:'));
  });

  it('closes when Cancel is clicked', () => {
    render(<AvatarSelector {...mockProps} />);
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('closes when X button is clicked', () => {
    render(<AvatarSelector {...mockProps} />);
    fireEvent.click(screen.getByTestId('CloseIcon').closest('button'));
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('disables Apply button when no avatar is selected', () => {
    render(<AvatarSelector {...mockProps} currentAvatar={null} />);
    
    // Apply button should be disabled initially when no avatar is selected
    const applyButton = screen.getByRole('button', { name: 'Apply Avatar' });
    expect(applyButton).toBeDisabled();
    
    // Click on an avatar to select it
    const avatarContainers = screen.getAllByTestId('avatar-option');
    fireEvent.click(avatarContainers[0]);
    
    // Apply button should now be enabled
    expect(applyButton).not.toBeDisabled();
  });

  it('displays the current avatar as selected', () => {
    render(<AvatarSelector {...mockProps} currentAvatar="icon:person" />);
    
    // Apply button should be enabled since there's a current avatar
    const applyButton = screen.getByRole('button', { name: 'Apply Avatar' });
    expect(applyButton).not.toBeDisabled();
  });
}); 