import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, X } from 'lucide-react';
import { ConfettiEffect, playSound } from '@/components/ui';
import type { Achievement } from '@/types';

interface AchievementNotificationProps {
  achievement: Achievement | null;
  onClose: () => void;
}

export function AchievementNotification({ achievement, onClose }: AchievementNotificationProps) {
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    if (achievement) {
      setShowConfetti(true);
      playSound('complete');
      
      // Auto close after 5 seconds
      const timer = setTimeout(() => {
        onClose();
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [achievement, onClose]);

  return (
    <AnimatePresence>
      {achievement && (
        <>
          <ConfettiEffect trigger={showConfetti} duration={3000} />
          
          <motion.div
            initial={{ opacity: 0, y: -100, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -100, scale: 0.8 }}
            transition={{ type: 'spring', stiffness: 200, damping: 20 }}
            className="fixed top-4 right-4 z-50 max-w-sm"
          >
            <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl shadow-2xl p-1">
              <div className="bg-white dark:bg-gray-900 rounded-lg p-6">
                <button
                  onClick={onClose}
                  className="absolute top-2 right-2 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  aria-label="Close notification"
                >
                  <X className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                </button>
                
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center text-3xl shadow-lg">
                      {achievement.icon}
                    </div>
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Trophy className="w-5 h-5 text-yellow-500" />
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                        Achievement Unlocked!
                      </h3>
                    </div>
                    
                    <h4 className="text-xl font-bold text-purple-600 dark:text-purple-400 mb-1">
                      {achievement.name}
                    </h4>
                    
                    <p className="text-gray-600 dark:text-gray-300 text-sm mb-2">
                      {achievement.description}
                    </p>
                    
                    <div className="flex items-center gap-4 text-sm">
                      <span className="text-purple-600 dark:text-purple-400 font-semibold">
                        +{achievement.points} points
                      </span>
                    </div>
                  </div>
                </div>
                
                <motion.div
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ duration: 5, ease: 'linear' }}
                  className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-600 to-pink-600 rounded-b-lg origin-left"
                />
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}