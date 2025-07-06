import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '../../test/utils/test-utils';
import { Navigation } from '../layout/Navigation';

describe('Navigation Component', () => {
  it('should render all navigation items', () => {
    render(<Navigation />);
    
    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('Create')).toBeInTheDocument();
    expect(screen.getByText('My Decks')).toBeInTheDocument();
    expect(screen.getByText('Achievements')).toBeInTheDocument();
    expect(screen.getByText('Progress')).toBeInTheDocument();
    expect(screen.getByText('Settings')).toBeInTheDocument();
  });

  it('should render FlashPlay logo', () => {
    render(<Navigation />);
    
    expect(screen.getByText('FlashPlay')).toBeInTheDocument();
    expect(screen.getByText('🎯')).toBeInTheDocument();
  });

  it('should show mobile menu button on mobile', () => {
    render(<Navigation />);
    
    const menuButton = screen.getByLabelText(/menu/i);
    expect(menuButton).toBeInTheDocument();
  });

  it('should toggle mobile menu', () => {
    render(<Navigation />);
    
    const menuButton = screen.getByLabelText(/menu/i);
    fireEvent.click(menuButton);
    
    // Mobile menu should be visible
    expect(screen.getByRole('navigation')).toBeInTheDocument();
  });

  it('should highlight active navigation item', () => {
    render(<Navigation />);
    
    const homeLink = screen.getByText('Home').closest('a');
    expect(homeLink).toHaveClass('bg-purple-100');
  });

  it('should include theme toggle', () => {
    render(<Navigation />);
    
    expect(screen.getByLabelText(/toggle theme/i)).toBeInTheDocument();
  });

  it('should have proper accessibility attributes', () => {
    render(<Navigation />);
    
    const nav = screen.getByRole('navigation');
    expect(nav).toHaveAttribute('aria-label', 'Main navigation');
  });

  it('should close mobile menu when navigation item is clicked', () => {
    render(<Navigation />);
    
    // Open mobile menu
    const menuButton = screen.getByLabelText(/menu/i);
    fireEvent.click(menuButton);
    
    // Click navigation item
    const homeLink = screen.getByText('Home');
    fireEvent.click(homeLink);
    
    // Menu should close (X icon should change back to Menu icon)
    expect(screen.queryByLabelText(/close/i)).not.toBeInTheDocument();
  });

  it('should handle keyboard navigation', () => {
    render(<Navigation />);
    
    const homeLink = screen.getByText('Home').closest('a');
    
    expect(homeLink).toHaveAttribute('tabIndex', '0');
    fireEvent.keyDown(homeLink!, { key: 'Enter' });
  });

  it('should show correct icons for each navigation item', () => {
    render(<Navigation />);
    
    // Check that each navigation item has an icon
    const navItems = screen.getAllByRole('link');
    
    navItems.forEach(item => {
      const icon = item.querySelector('svg');
      expect(icon).toBeInTheDocument();
    });
  });
});