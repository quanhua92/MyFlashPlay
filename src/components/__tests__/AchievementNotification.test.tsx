import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AchievementNotification } from '../ui/AchievementNotification';

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: any) => children,
}));

// Mock ConfettiEffect
vi.mock('../ui/ConfettiEffect', () => ({
  ConfettiEffect: ({ 'data-testid': testId }: any) => <div data-testid={testId || 'confetti-effect'} />,
}));

describe('AchievementNotification Component', () => {
  const mockAchievement = {
    id: 'test-achievement',
    name: 'Test Achievement',
    description: 'Test description',
    icon: '🎯',
    points: 100,
    requirement: {
      type: 'games-played' as const,
      value: 1
    }
  };
  const mockOnClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should not render when achievement is null', () => {
    render(
      <AchievementNotification 
        achievement={null} 
        onClose={mockOnClose} 
      />
    );
    
    expect(screen.queryByText('Achievement Unlocked!')).not.toBeInTheDocument();
  });

  it('should render achievement notification', () => {
    render(
      <AchievementNotification 
        achievement={mockAchievement} 
        onClose={mockOnClose} 
      />
    );
    
    expect(screen.getByText('Achievement Unlocked!')).toBeInTheDocument();
    expect(screen.getByText(mockAchievement.name)).toBeInTheDocument();
    expect(screen.getByText(mockAchievement.description)).toBeInTheDocument();
    expect(screen.getByText(`+${mockAchievement.points} points`)).toBeInTheDocument();
  });

  it('should show achievement icon', () => {
    render(
      <AchievementNotification 
        achievement={mockAchievement} 
        onClose={mockOnClose} 
      />
    );
    
    expect(screen.getByText(mockAchievement.icon)).toBeInTheDocument();
  });

  it('should call onClose when close button is clicked', () => {
    render(
      <AchievementNotification 
        achievement={mockAchievement} 
        onClose={mockOnClose} 
      />
    );
    
    const closeButton = screen.getByLabelText('Close notification');
    fireEvent.click(closeButton);
    
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('should auto-close after 5 seconds', async () => {
    vi.useFakeTimers();
    
    render(
      <AchievementNotification 
        achievement={mockAchievement} 
        onClose={mockOnClose} 
      />
    );
    
    // Fast-forward 5 seconds
    vi.advanceTimersByTime(5000);
    
    // Wait for the timer to trigger
    await vi.runAllTimersAsync();
    
    expect(mockOnClose).toHaveBeenCalled();
    
    vi.useRealTimers();
  });

  it('should show confetti effect', () => {
    render(
      <AchievementNotification 
        achievement={mockAchievement} 
        onClose={mockOnClose} 
      />
    );
    
    // ConfettiEffect should be rendered
    expect(screen.getByTestId('confetti-effect')).toBeInTheDocument();
  });

  it('should have proper accessibility attributes', () => {
    render(
      <AchievementNotification 
        achievement={mockAchievement} 
        onClose={mockOnClose} 
      />
    );
    
    const closeButton = screen.getByLabelText('Close notification');
    expect(closeButton).toHaveAttribute('aria-label', 'Close notification');
  });

  it('should show progress bar animation', () => {
    render(
      <AchievementNotification 
        achievement={mockAchievement} 
        onClose={mockOnClose} 
      />
    );
    
    const progressBar = screen.getByRole('progressbar');
    expect(progressBar).toBeInTheDocument();
  });

  it('should handle trophy icon', () => {
    render(
      <AchievementNotification 
        achievement={mockAchievement} 
        onClose={mockOnClose} 
      />
    );
    
    const trophyIcon = screen.getByTestId('trophy-icon');
    expect(trophyIcon).toBeInTheDocument();
  });

  it('should handle theme styles', () => {
    render(
      <AchievementNotification 
        achievement={mockAchievement} 
        onClose={mockOnClose} 
      />
    );
    
    // Find the actual notification container with the background
    const notification = screen.getByText('Test Achievement').closest('[class*="bg-white"]');
    expect(notification).toBeInTheDocument();
  });

  it('should handle motion animations', () => {
    render(
      <AchievementNotification 
        achievement={mockAchievement} 
        onClose={mockOnClose} 
      />
    );
    
    const notification = screen.getByText('Achievement Unlocked!').closest('div');
    expect(notification).toBeInTheDocument();
  });
});