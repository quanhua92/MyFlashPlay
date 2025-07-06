import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Zap, Target, TrendingUp } from 'lucide-react';

interface ScoreDisplayProps {
  score: number;
  streak?: number;
  accuracy?: number;
  showAnimation?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function ScoreDisplay({ 
  score, 
  streak = 0, 
  accuracy, 
  showAnimation = true,
  size = 'md' 
}: ScoreDisplayProps) {
  const [prevScore, setPrevScore] = useState(score);
  const [scoreChange, setScoreChange] = useState(0);
  const [showChange, setShowChange] = useState(false);

  useEffect(() => {
    if (score !== prevScore) {
      const change = score - prevScore;
      setScoreChange(change);
      setShowChange(true);
      setPrevScore(score);
      
      const timer = setTimeout(() => {
        setShowChange(false);
      }, 2000);
      
      return () => clearTimeout(timer);
    }
  }, [score, prevScore]);

  const sizeClasses = {
    sm: 'text-lg',
    md: 'text-2xl',
    lg: 'text-4xl'
  };

  const iconSize = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-lg">
      <div className="flex items-center justify-between gap-6">
        {/* Main Score */}
        <div className="text-center">
          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 mb-1">
            <Trophy className={iconSize[size]} />
            <span className="text-sm font-medium">Score</span>
          </div>
          <div className="relative">
            <motion.div
              key={score}
              initial={showAnimation ? { scale: 0.8, opacity: 0 } : false}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 200, damping: 15 }}
              className={`${sizeClasses[size]} font-bold text-purple-600 dark:text-purple-400`}
            >
              {score.toLocaleString()}
            </motion.div>
            
            <AnimatePresence>
              {showChange && scoreChange !== 0 && (
                <motion.div
                  initial={{ y: 0, opacity: 1 }}
                  animate={{ y: -20, opacity: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 1 }}
                  className={`absolute -right-8 top-0 font-bold ${
                    scoreChange > 0 ? 'text-green-500' : 'text-red-500'
                  }`}
                >
                  {scoreChange > 0 ? '+' : ''}{scoreChange}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Streak */}
        {streak > 0 && (
          <div className="text-center">
            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 mb-1">
              <Zap className={iconSize[size]} />
              <span className="text-sm font-medium">Streak</span>
            </div>
            <motion.div
              key={streak}
              initial={showAnimation ? { scale: 0.8, opacity: 0 } : false}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 200, damping: 15 }}
              className={`${sizeClasses[size]} font-bold text-orange-500`}
            >
              {streak}
            </motion.div>
          </div>
        )}

        {/* Accuracy */}
        {accuracy !== undefined && (
          <div className="text-center">
            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 mb-1">
              <Target className={iconSize[size]} />
              <span className="text-sm font-medium">Accuracy</span>
            </div>
            <motion.div
              initial={showAnimation ? { scale: 0.8, opacity: 0 } : false}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 200, damping: 15 }}
              className={`${sizeClasses[size]} font-bold ${
                accuracy >= 80 ? 'text-green-500' : 
                accuracy >= 60 ? 'text-yellow-500' : 
                'text-red-500'
              }`}
            >
              {Math.round(accuracy)}%
            </motion.div>
          </div>
        )}
      </div>

      {/* Streak Bonus Indicator */}
      {streak >= 5 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-3 flex items-center justify-center gap-2 text-sm"
        >
          <TrendingUp className="w-4 h-4 text-orange-500" />
          <span className="text-orange-600 dark:text-orange-400 font-medium">
            {streak >= 10 ? '3x' : streak >= 5 ? '2x' : ''} Score Multiplier!
          </span>
        </motion.div>
      )}
    </div>
  );
}