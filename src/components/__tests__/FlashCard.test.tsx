import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '../../test/utils/test-utils';
import { FlashCard } from '../game/FlashCard';
import { mockDeck } from '../../test/utils/test-utils';

describe('FlashCard Component', () => {
  const mockCard = mockDeck.cards[0];
  const mockProps = {
    card: mockCard,
    onAnswer: vi.fn(),
    onNext: vi.fn(),
    showAnswer: false,
    currentIndex: 0,
    totalCards: 2,
    mode: 'study' as const
  };

  it('should render card front initially', () => {
    render(<FlashCard {...mockProps} />);
    
    expect(screen.getByText(mockCard.front)).toBeInTheDocument();
    expect(screen.queryByText(mockCard.back)).not.toBeInTheDocument();
  });

  it('should show answer when showAnswer is true', () => {
    render(<FlashCard {...mockProps} showAnswer={true} />);
    
    expect(screen.getByText(mockCard.back)).toBeInTheDocument();
  });

  it('should call onAnswer when card is clicked', () => {
    render(<FlashCard {...mockProps} />);
    
    fireEvent.click(screen.getByText(mockCard.front));
    
    expect(mockProps.onAnswer).toHaveBeenCalledWith(mockCard.id, true);
  });

  it('should show progress indicator', () => {
    render(<FlashCard {...mockProps} />);
    
    expect(screen.getByText('1 / 2')).toBeInTheDocument();
  });

  it('should handle keyboard navigation', () => {
    render(<FlashCard {...mockProps} />);
    
    fireEvent.keyDown(document, { key: 'Space' });
    
    expect(mockProps.onAnswer).toHaveBeenCalled();
  });

  it('should show difficulty indicator', () => {
    render(<FlashCard {...mockProps} />);
    
    expect(screen.getByText('Easy')).toBeInTheDocument();
  });

  it('should show category if available', () => {
    render(<FlashCard {...mockProps} />);
    
    expect(screen.getByText('math')).toBeInTheDocument();
  });

  it('should handle flip animation', () => {
    render(<FlashCard {...mockProps} />);
    
    const card = screen.getByTestId('flashcard');
    fireEvent.click(card);
    
    expect(card).toHaveClass('flipped');
  });

  it('should show next button when answer is shown', () => {
    render(<FlashCard {...mockProps} showAnswer={true} />);
    
    expect(screen.getByText('Next')).toBeInTheDocument();
  });

  it('should call onNext when next button is clicked', () => {
    render(<FlashCard {...mockProps} showAnswer={true} />);
    
    fireEvent.click(screen.getByText('Next'));
    
    expect(mockProps.onNext).toHaveBeenCalled();
  });

  it('should handle multiple choice cards', () => {
    const multipleChoiceCard = {
      ...mockCard,
      type: 'multiple-choice' as const,
      options: ['A) 3', 'B) 4', 'C) 5', 'D) 6'],
      correctAnswer: 'B) 4'
    };

    render(<FlashCard {...mockProps} card={multipleChoiceCard} />);
    
    expect(screen.getByText('A) 3')).toBeInTheDocument();
    expect(screen.getByText('B) 4')).toBeInTheDocument();
    expect(screen.getByText('C) 5')).toBeInTheDocument();
    expect(screen.getByText('D) 6')).toBeInTheDocument();
  });

  it('should handle accessibility features', () => {
    render(<FlashCard {...mockProps} />);
    
    const card = screen.getByTestId('flashcard');
    
    expect(card).toHaveAttribute('role', 'button');
    expect(card).toHaveAttribute('tabIndex', '0');
    expect(card).toHaveAttribute('aria-label');
  });

  it('should show hint when available', () => {
    const cardWithHint = {
      ...mockCard,
      hint: 'This is a basic math question'
    };

    render(<FlashCard {...mockProps} card={cardWithHint} />);
    
    expect(screen.getByText('Show Hint')).toBeInTheDocument();
  });

  it('should handle timer display', () => {
    render(<FlashCard {...mockProps} timeLimit={30} />);
    
    expect(screen.getByText('30s')).toBeInTheDocument();
  });
});