import { motion } from 'framer-motion';
import { CheckCircle } from 'lucide-react';

interface ProgressBarProps {
  current: number;
  total: number;
  showPercentage?: boolean;
  showSteps?: boolean;
  color?: 'purple' | 'green' | 'blue' | 'orange';
  size?: 'sm' | 'md' | 'lg';
  animated?: boolean;
}

export function ProgressBar({
  current,
  total,
  showPercentage = true,
  showSteps = true,
  color = 'purple',
  size = 'md',
  animated = true
}: ProgressBarProps) {
  const percentage = total > 0 ? (current / total) * 100 : 0;

  const colorClasses = {
    purple: 'bg-purple-600',
    green: 'bg-green-600',
    blue: 'bg-blue-600',
    orange: 'bg-orange-600'
  };

  const sizeClasses = {
    sm: 'h-2',
    md: 'h-3',
    lg: 'h-4'
  };

  const textSize = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base'
  };

  return (
    <div className="w-full">
      {/* Progress Text */}
      <div className="flex items-center justify-between mb-2">
        {showSteps && (
          <span className={`${textSize[size]} text-gray-600 dark:text-gray-400 font-medium`}>
            Step {current} of {total}
          </span>
        )}
        {showPercentage && (
          <span className={`${textSize[size]} text-gray-600 dark:text-gray-400 font-medium`}>
            {Math.round(percentage)}%
          </span>
        )}
      </div>

      {/* Progress Bar */}
      <div className="relative">
        <div className={`w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden ${sizeClasses[size]}`}>
          <motion.div
            className={`h-full ${colorClasses[color]} rounded-full relative`}
            initial={animated ? { width: 0 } : { width: `${percentage}%` }}
            animate={{ width: `${percentage}%` }}
            transition={{
              duration: animated ? 0.5 : 0,
              ease: 'easeOut'
            }}
          >
            {/* Shimmer Effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
          </motion.div>
        </div>

        {/* Milestone Dots */}
        {total <= 10 && size !== 'sm' && (
          <div className="absolute inset-0 flex items-center">
            {Array.from({ length: total }, (_, i) => {
              const position = ((i + 1) / total) * 100;
              const isCompleted = i < current;
              
              return (
                <div
                  key={i}
                  className="absolute flex items-center justify-center"
                  style={{ left: `${position}%`, transform: 'translateX(-50%)' }}
                >
                  <motion.div
                    initial={animated ? { scale: 0 } : { scale: 1 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: animated ? i * 0.1 : 0 }}
                    className={`w-4 h-4 rounded-full border-2 ${
                      isCompleted
                        ? `${colorClasses[color]} border-white dark:border-gray-900`
                        : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600'
                    }`}
                  >
                    {isCompleted && (
                      <CheckCircle className="w-3 h-3 text-white" />
                    )}
                  </motion.div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Completion Message */}
      {percentage === 100 && (
        <motion.div
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className={`mt-2 text-center ${textSize[size]} text-green-600 dark:text-green-400 font-medium`}
        >
          Complete! 🎉
        </motion.div>
      )}
    </div>
  );
}