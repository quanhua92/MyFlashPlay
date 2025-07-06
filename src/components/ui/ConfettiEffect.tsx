import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface ConfettiPiece {
  id: number;
  x: number;
  y: number;
  rotation: number;
  color: string;
  delay: number;
  duration: number;
}

interface ConfettiEffectProps {
  trigger: boolean;
  duration?: number;
  particleCount?: number;
}

const colors = ['#9333ea', '#ec4899', '#10b981', '#f59e0b', '#3b82f6', '#ef4444'];

export function ConfettiEffect({ trigger, duration = 3000, particleCount = 50 }: ConfettiEffectProps) {
  const [pieces, setPieces] = useState<ConfettiPiece[]>([]);

  useEffect(() => {
    if (trigger) {
      const newPieces: ConfettiPiece[] = [];
      
      for (let i = 0; i < particleCount; i++) {
        newPieces.push({
          id: Date.now() + i,
          x: Math.random() * 100,
          y: Math.random() * 100,
          rotation: Math.random() * 360,
          color: colors[Math.floor(Math.random() * colors.length)],
          delay: Math.random() * 0.5,
          duration: 2 + Math.random() * 1
        });
      }
      
      setPieces(newPieces);
      
      const timer = setTimeout(() => {
        setPieces([]);
      }, duration);
      
      return () => clearTimeout(timer);
    }
  }, [trigger, duration, particleCount]);

  return (
    <AnimatePresence>
      {pieces.map((piece) => (
        <motion.div
          key={piece.id}
          className="fixed pointer-events-none z-50"
          initial={{
            left: `${piece.x}%`,
            top: -20,
            opacity: 1,
            rotate: 0,
            scale: 1
          }}
          animate={{
            top: '110%',
            rotate: piece.rotation,
            opacity: [1, 1, 0]
          }}
          exit={{ opacity: 0 }}
          transition={{
            duration: piece.duration,
            delay: piece.delay,
            ease: 'easeOut'
          }}
        >
          <div
            className="w-3 h-3 rounded-sm"
            style={{ backgroundColor: piece.color }}
          />
        </motion.div>
      ))}
    </AnimatePresence>
  );
}