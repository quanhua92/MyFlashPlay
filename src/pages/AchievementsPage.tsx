import { useState } from 'react';
import { Trophy, Lock, Star, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';
import { achievementManager } from '@/utils/achievements';
// Types imported for component functionality

export function AchievementsPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  
  const achievements = achievementManager.getAllAchievements();
  const stats = achievementManager.getStats();
  
  const categories = [
    { id: 'all', name: 'All Achievements', icon: Trophy },
    { id: 'beginner', name: 'Beginner', icon: Star },
    { id: 'streak', name: 'Streaks', icon: TrendingUp },
    { id: 'master', name: 'Master', icon: Trophy }
  ];
  
  const filteredAchievements = achievements.filter(achievement => {
    if (selectedCategory === 'all') return true;
    
    if (selectedCategory === 'beginner') {
      return ['first-deck', 'perfect-score', 'speed-demon'].includes(achievement.id);
    }
    if (selectedCategory === 'streak') {
      return achievement.id.includes('streak') || achievement.id === 'daily-player';
    }
    if (selectedCategory === 'master') {
      return ['master-learner', 'quick-learner', 'points-1000', 'points-5000'].includes(achievement.id);
    }
    
    return true;
  });

  return (
    <div className="max-w-6xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
            Achievement Gallery
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300">
            Track your progress and unlock rewards!
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
            className="bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl p-6 text-white text-center"
          >
            <div className="text-3xl font-bold mb-1">{stats.totalUnlocked}</div>
            <div className="text-sm opacity-90">Unlocked</div>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl p-6 text-white text-center"
          >
            <div className="text-3xl font-bold mb-1">{stats.totalAchievements}</div>
            <div className="text-sm opacity-90">Total</div>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="bg-gradient-to-br from-green-500 to-emerald-500 rounded-2xl p-6 text-white text-center"
          >
            <div className="text-3xl font-bold mb-1">{stats.totalPoints}</div>
            <div className="text-sm opacity-90">Points</div>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, delay: 0.3 }}
            className="bg-gradient-to-br from-yellow-500 to-orange-500 rounded-2xl p-6 text-white text-center"
          >
            <div className="text-3xl font-bold mb-1">{Math.round(stats.completionPercentage)}%</div>
            <div className="text-sm opacity-90">Complete</div>
          </motion.div>
        </div>

        {/* Category Filters */}
        <div className="flex flex-wrap justify-center gap-4 mb-8">
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`px-6 py-3 rounded-xl font-semibold transition-all flex items-center gap-2 ${
                selectedCategory === category.id
                  ? 'bg-purple-600 text-white shadow-lg scale-105'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              <category.icon className="w-5 h-5" />
              {category.name}
            </button>
          ))}
        </div>

        {/* Achievements Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAchievements.map((achievement, index) => (
            <motion.div
              key={achievement.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: index * 0.05 }}
              className={`relative rounded-2xl p-6 transition-all ${
                achievement.unlockedAt
                  ? 'bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/20 dark:to-pink-900/20 border-2 border-purple-300 dark:border-purple-700'
                  : 'bg-gray-100 dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700'
              }`}
            >
              {/* Lock overlay for locked achievements */}
              {!achievement.unlockedAt && (
                <div className="absolute inset-0 bg-gray-900/10 dark:bg-gray-900/30 rounded-2xl flex items-center justify-center">
                  <Lock className="w-8 h-8 text-gray-400 dark:text-gray-600" />
                </div>
              )}
              
              <div className={`${!achievement.unlockedAt ? 'opacity-50' : ''}`}>
                {/* Icon */}
                <div className="text-5xl mb-4">{achievement.icon}</div>
                
                {/* Title and Description */}
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                  {achievement.name}
                </h3>
                <p className="text-gray-600 dark:text-gray-300 text-sm mb-4">
                  {achievement.description}
                </p>
                
                {/* Progress */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500 dark:text-gray-400">Progress</span>
                    <span className="font-semibold text-purple-600 dark:text-purple-400">
                      {achievement.progress} / {achievement.maxProgress}
                    </span>
                  </div>
                  
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(achievement.progress / achievement.maxProgress) * 100}%` }}
                      transition={{ duration: 0.6, delay: index * 0.05 + 0.2 }}
                      className="h-full bg-gradient-to-r from-purple-600 to-pink-600"
                    />
                  </div>
                </div>
                
                {/* Points and Status */}
                <div className="flex justify-between items-center mt-4">
                  <span className="text-lg font-bold text-purple-600 dark:text-purple-400">
                    +{achievement.points} pts
                  </span>
                  {achievement.unlockedAt && (
                    <span className="text-sm text-green-600 dark:text-green-400 font-semibold">
                      ✓ Unlocked
                    </span>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Motivational Message */}
        {stats.completionPercentage < 100 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="mt-12 text-center"
          >
            <p className="text-lg text-gray-600 dark:text-gray-300">
              Keep playing to unlock more achievements! 🎯
            </p>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}