import { Trophy, Target, Zap, Star } from 'lucide-react';
import { motion } from 'framer-motion';

export function ScoresPage() {
  const stats = [
    { label: 'Total Games', value: '0', icon: Trophy, color: 'from-yellow-500 to-orange-500' },
    { label: 'Average Score', value: '0%', icon: Target, color: 'from-green-500 to-emerald-500' },
    { label: 'Best Streak', value: '0', icon: Zap, color: 'from-purple-500 to-pink-500' },
    { label: 'Total Points', value: '0', icon: Star, color: 'from-blue-500 to-cyan-500' }
  ];

  return (
    <div className="max-w-6xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Your Progress
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300">
            Track your learning journey and achievements
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 * index }}
              className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg"
            >
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-r ${stat.color} flex items-center justify-center mb-4`}>
                <stat.icon className="w-6 h-6 text-white" />
              </div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                {stat.value}
              </div>
              <div className="text-gray-600 dark:text-gray-300 text-sm">
                {stat.label}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Empty State */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="text-center py-16"
        >
          <div className="text-6xl mb-4">📊</div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            No games played yet
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mb-8 max-w-md mx-auto">
            Start playing flashcard games to see your progress and achievements here!
          </p>
          <a
            href="/"
            className="inline-flex items-center space-x-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-lg font-semibold hover:shadow-lg transition-shadow"
          >
            <Trophy className="w-5 h-5" />
            <span>Start Playing</span>
          </a>
        </motion.div>
      </motion.div>
    </div>
  );
}