import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Navigation } from '../layout/Navigation';

// Mock the router hooks
vi.mock('@tanstack/react-router', () => ({
  Link: ({ children, ...props }: any) => <a {...props} role="link">{children}</a>,
  useRouterState: () => ({
    location: { pathname: '/' }
  })
}));

// Mock the translation hook
vi.mock('@/i18n', () => ({
  useTranslation: () => (key: string) => {
    const translations: Record<string, string> = {
      'nav.home': 'Home',
      'nav.create': 'Create',
      'nav.myDecks': 'My Decks',
      'nav.publicDecks': 'Public Decks',
      'nav.achievements': 'Achievements',
      'nav.progress': 'Progress',
      'nav.settings': 'Settings',
      'nav.appTitle': 'MyFlashPlay'
    };
    return translations[key] || key;
  }
}));

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

  it('should render MyFlashPlay logo', () => {
    render(<Navigation />);
    
    expect(screen.getByText('MyFlashPlay')).toBeInTheDocument();
    expect(screen.getByText('🎯')).toBeInTheDocument();
  });

  it('should show mobile menu button on mobile', () => {
    render(<Navigation />);
    
    // Look for the menu button by its icon
    const menuButton = screen.getByRole('button');
    expect(menuButton).toBeInTheDocument();
  });

  it('should toggle mobile menu', () => {
    render(<Navigation />);
    
    const menuButton = screen.getByRole('button');
    fireEvent.click(menuButton);
    
    // Mobile menu should be visible - check for additional navigation links
    const homeLinks = screen.getAllByText('Home');
    expect(homeLinks.length).toBeGreaterThan(1); // Desktop + mobile
  });

  it('should highlight active navigation item', () => {
    render(<Navigation />);
    
    const homeLink = screen.getByText('Home').closest('a');
    expect(homeLink).toHaveAttribute('class');
    expect(homeLink?.className).toContain('bg-purple-100');
  });

  it('should include all navigation items', () => {
    render(<Navigation />);
    
    expect(screen.getByText('Public Decks')).toBeInTheDocument();
  });

  it('should have proper accessibility attributes', () => {
    render(<Navigation />);
    
    const nav = screen.getByRole('navigation');
    expect(nav).toHaveAttribute('aria-label', 'Main navigation');
  });

  it('should close mobile menu when navigation item is clicked', () => {
    render(<Navigation />);
    
    // Open mobile menu
    const menuButton = screen.getByRole('button');
    fireEvent.click(menuButton);
    
    // Click navigation item - get all Home links and click the mobile one
    const homeLinks = screen.getAllByText('Home');
    fireEvent.click(homeLinks[1]); // Second one is mobile
    
    // Menu should close - check that we're back to single Home link
    expect(screen.getAllByText('Home')).toHaveLength(1);
  });

  it('should handle keyboard navigation', () => {
    render(<Navigation />);
    
    const homeLink = screen.getByText('Home').closest('a');
    
    expect(homeLink).toBeInTheDocument();
    if (homeLink) {
      fireEvent.keyDown(homeLink, { key: 'Enter' });
    }
  });

  it('should show correct icons for each navigation item', () => {
    render(<Navigation />);
    
    // Check that navigation icons are present by checking for lucide icons
    const icons = document.querySelectorAll('svg.lucide');
    expect(icons.length).toBeGreaterThan(0);
  });
});