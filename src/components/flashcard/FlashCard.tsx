import { useState } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { SafeContentRenderer } from '@/components/common/SafeContentRenderer';
import type { Flashcard } from '@/types';

interface FlashCardProps {
  card: Flashcard;
  onFlip?: () => void;
  className?: string;
  showBack?: boolean;
}

export function FlashCard({ card, onFlip, className, showBack = false }: FlashCardProps) {
  const [isFlipped, setIsFlipped] = useState(showBack);
  
  const handleFlip = () => {
    setIsFlipped(!isFlipped);
    onFlip?.();
  };
  
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      handleFlip();
    }
  };
  
  return (
    <div className={cn('perspective-1000 w-full h-80', className)}>
      <motion.div
        className="relative w-full h-full cursor-pointer preserve-3d"
        animate={{ rotateY: isFlipped ? 180 : 0 }}
        transition={{ duration: 0.6, type: 'spring', stiffness: 260, damping: 20 }}
        onClick={handleFlip}
        onKeyDown={handleKeyPress}
        tabIndex={0}
        role="button"
        aria-label={`Flashcard: ${card.front}. ${isFlipped ? `Answer: ${card.back}.` : ''} Press space or enter to flip.`}
        aria-pressed={isFlipped}
      >
        {/* Front */}
        <div className={cn(
          'absolute w-full h-full backface-hidden',
          'bg-gradient-to-br from-purple-500 to-pink-500',
          'rounded-2xl p-8 flex flex-col items-center justify-center',
          'text-white shadow-xl border-4 border-white/20'
        )}>
          <div className="text-center">
            <div className="text-sm font-medium mb-2 opacity-80">
              {card.category && `${card.category} • `}Question
            </div>
            <SafeContentRenderer 
              content={card.front}
              className="text-xl font-bold leading-relaxed"
            />
            {card.metadata.hint && (
              <div className="mt-4 text-sm opacity-70 italic">
                💡 Hint: {card.metadata.hint}
              </div>
            )}
          </div>
          <div className="absolute bottom-4 right-4 text-sm opacity-60" aria-hidden="true">
            Click to flip
          </div>
        </div>
        
        {/* Back */}
        <div className={cn(
          'absolute w-full h-full backface-hidden rotate-y-180',
          'bg-gradient-to-br from-green-500 to-emerald-500',
          'rounded-2xl p-8 flex flex-col items-center justify-center',
          'text-white shadow-xl border-4 border-white/20'
        )}>
          <div className="text-center">
            <div className="text-sm font-medium mb-2 opacity-80">
              Answer
            </div>
            <SafeContentRenderer 
              content={card.back}
              className="text-xl font-bold leading-relaxed"
            />
            {card.metadata.explanation && (
              <div className="mt-4 text-sm opacity-80 leading-relaxed">
                💭 {card.metadata.explanation}
              </div>
            )}
          </div>
          <div className="absolute bottom-4 right-4 text-sm opacity-60" aria-hidden="true">
            Click to flip back
          </div>
        </div>
      </motion.div>
    </div>
  );
}