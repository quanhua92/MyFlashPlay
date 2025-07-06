import { useState, useEffect } from 'react';
import { TrendingUp, Trophy, Target, Clock, Calendar, BarChart3, Brain, Zap } from 'lucide-react';
import { motion } from 'framer-motion';
import { Link } from '@tanstack/react-router';
import { 
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { useDecks } from '@/hooks/useDecks';
import { STORAGE_KEYS } from '@/utils/constants';
import { LearningAnalytics } from '@/utils/learning-analytics';
import { SpacedRepetition } from '@/utils/spaced-repetition';
import type { StoredScores, StoredProgress, CardProgress } from '@/types';

const COLORS = ['#9333ea', '#ec4899', '#10b981', '#f59e0b', '#3b82f6'];

export function ProgressPage() {
  const [scores] = useLocalStorage<StoredScores>(STORAGE_KEYS.SCORES, {
    version: '1.0.0',
    sessions: [],
    statistics: {
      totalGames: 0,
      totalScore: 0,
      averageAccuracy: 0,
      bestStreak: 0,
      totalTime: 0
    },
    lastUpdated: new Date().toISOString()
  });

  const [progress] = useLocalStorage<StoredProgress>(STORAGE_KEYS.PROGRESS, {
    version: '1.0.0',
    cardProgress: {},
    deckProgress: {},
    lastUpdated: new Date().toISOString()
  });

  const { decks } = useDecks();

  const [selectedView, setSelectedView] = useState<'overview' | 'cards' | 'decks' | 'time'>('overview');
  const [selectedDeckId, setSelectedDeckId] = useState<string | null>(null);

  // Calculate analytics
  const learningStats = LearningAnalytics.calculateLearningStats(scores.sessions);
  const cardStats = LearningAnalytics.calculateCardStats(scores.sessions);
  const deckStats = LearningAnalytics.calculateDeckStats(scores.sessions);
  const timeStats = LearningAnalytics.calculateTimeStats(scores.sessions);
  const insights = LearningAnalytics.getLearningInsights(learningStats, cardStats, deckStats);

  // Prepare chart data
  const dailyData = Array.from(timeStats.daily.entries())
    .slice(-30)
    .map(([date, time]) => ({
      date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      minutes: Math.round(time / 60)
    }));

  const hourlyData = Array.from(timeStats.hourly.entries()).map(([hour, count]) => ({
    hour: `${hour}:00`,
    sessions: count
  }));

  const deckPieData = Array.from(deckStats.values()).map(deck => ({
    name: deck.deckName,
    value: deck.totalTime,
    sessions: deck.totalSessions
  }));

  const difficultyData = [
    { name: 'Easy', value: Array.from(cardStats.values()).filter(c => c.difficulty === 'easy').length },
    { name: 'Medium', value: Array.from(cardStats.values()).filter(c => c.difficulty === 'medium').length },
    { name: 'Hard', value: Array.from(cardStats.values()).filter(c => c.difficulty === 'hard').length }
  ];

  // Calculate spaced repetition data
  const cardReviews = Object.entries(progress.cardProgress).map(([cardId, progress]) => {
    const lastSession = scores.sessions
      .filter(s => s.details.cardResults.some(r => r.cardId === cardId))
      .pop();
    
    if (!lastSession) {
      return SpacedRepetition.initializeCard(cardId);
    }

    const result = lastSession.details.cardResults.find(r => r.cardId === cardId);
    const quality = result?.wasCorrect ? 4 : 2;

    return SpacedRepetition.calculateNextReview(
      {
        cardId,
        lastReview: lastSession.endTime,
        nextReview: new Date().toISOString(),
        interval: 1,
        repetitions: progress.timesStudied || 0,
        easeFactor: 2.5,
        lapses: progress.stats.incorrectAnswers || 0
      },
      {
        quality,
        timeSpent: result?.timeSpent || 10,
        hintsUsed: result?.hintUsed || false
      }
    );
  });

  const dueCards = SpacedRepetition.getDueCards(cardReviews);
  const retentionStats = SpacedRepetition.calculateRetention(cardReviews);

  const renderOverview = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg"
      >
        <div className="flex items-center justify-between mb-4">
          <Trophy className="w-8 h-8 text-purple-600" />
          <span className="text-3xl font-bold text-gray-900 dark:text-white">
            {learningStats.totalSessions}
          </span>
        </div>
        <h3 className="text-gray-600 dark:text-gray-400">Total Sessions</h3>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg"
      >
        <div className="flex items-center justify-between mb-4">
          <Target className="w-8 h-8 text-green-600" />
          <span className="text-3xl font-bold text-gray-900 dark:text-white">
            {Math.round(learningStats.accuracy)}%
          </span>
        </div>
        <h3 className="text-gray-600 dark:text-gray-400">Average Accuracy</h3>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg"
      >
        <div className="flex items-center justify-between mb-4">
          <Zap className="w-8 h-8 text-orange-600" />
          <span className="text-3xl font-bold text-gray-900 dark:text-white">
            {learningStats.currentStreak}
          </span>
        </div>
        <h3 className="text-gray-600 dark:text-gray-400">Current Streak</h3>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg"
      >
        <div className="flex items-center justify-between mb-4">
          <Clock className="w-8 h-8 text-blue-600" />
          <span className="text-3xl font-bold text-gray-900 dark:text-white">
            {Math.round(learningStats.totalTime / 60)}m
          </span>
        </div>
        <h3 className="text-gray-600 dark:text-gray-400">Total Study Time</h3>
      </motion.div>
    </div>
  );

  const renderCharts = () => {
    switch (selectedView) {
      case 'overview':
        return (
          <>
            {/* Daily Activity Chart */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg mb-6">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                Daily Study Time (Last 30 Days)
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={dailyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="date" stroke="#9CA3AF" />
                  <YAxis stroke="#9CA3AF" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1F2937',
                      border: 'none',
                      borderRadius: '8px'
                    }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="minutes" 
                    stroke="#9333EA" 
                    strokeWidth={2}
                    dot={{ fill: '#9333EA' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Insights */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Brain className="w-6 h-6" />
                Learning Insights
              </h3>
              <div className="space-y-3">
                {insights.map((insight, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg text-purple-800 dark:text-purple-200"
                  >
                    {insight}
                  </motion.div>
                ))}
              </div>
            </div>
          </>
        );

      case 'time':
        return (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Study Time by Hour */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                Study Sessions by Hour
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={hourlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="hour" stroke="#9CA3AF" />
                  <YAxis stroke="#9CA3AF" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1F2937',
                      border: 'none',
                      borderRadius: '8px'
                    }}
                  />
                  <Bar dataKey="sessions" fill="#EC4899" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Time by Deck */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                Time Spent by Deck
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={deckPieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {deckPieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1F2937',
                      border: 'none',
                      borderRadius: '8px'
                    }}
                    formatter={(value: number) => `${Math.round(value / 60)} min`}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        );

      case 'cards':
        return (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Card Difficulty Distribution */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                Card Difficulty Distribution
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={difficultyData}
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    dataKey="value"
                  >
                    <Cell fill="#10B981" />
                    <Cell fill="#F59E0B" />
                    <Cell fill="#EF4444" />
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1F2937',
                      border: 'none',
                      borderRadius: '8px'
                    }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Spaced Repetition Stats */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                Spaced Repetition Status
              </h3>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-gray-600 dark:text-gray-400">Cards Due Today</span>
                    <span className="text-2xl font-bold text-purple-600">{dueCards.length}</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div 
                      className="bg-purple-600 h-2 rounded-full"
                      style={{ width: `${(dueCards.length / cardReviews.length) * 100}%` }}
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 mt-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-green-600">
                      {retentionStats.masteredCards}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Mastered Cards</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-orange-600">
                      {retentionStats.strugglingCards}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Need Practice</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 'decks':
        return (
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              Deck Performance
            </h3>
            <div className="space-y-4">
              {Array.from(deckStats.values()).map(deck => (
                <div key={deck.deckId} className="border-b dark:border-gray-700 pb-4">
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="font-semibold text-gray-900 dark:text-white">
                      {deck.deckName}
                    </h4>
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {deck.totalSessions} sessions
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Accuracy:</span>
                      <span className="ml-2 font-medium">{Math.round(deck.averageAccuracy)}%</span>
                    </div>
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Time:</span>
                      <span className="ml-2 font-medium">{Math.round(deck.totalTime / 60)}m</span>
                    </div>
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Mastery:</span>
                      <span className="ml-2 font-medium">{Math.round(deck.masteryLevel)}%</span>
                    </div>
                  </div>
                  <div className="mt-2">
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div 
                        className="bg-gradient-to-r from-purple-600 to-pink-600 h-2 rounded-full"
                        style={{ width: `${deck.masteryLevel}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="max-w-7xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Learning Progress
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300">
            Track your study habits and improvement over time
          </p>
        </div>

        {renderOverview()}

        {/* View Selector */}
        <div className="flex justify-center mb-8">
          <div className="inline-flex bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
            {[
              { id: 'overview', label: 'Overview', icon: BarChart3 },
              { id: 'time', label: 'Time Analysis', icon: Clock },
              { id: 'cards', label: 'Card Stats', icon: Brain },
              { id: 'decks', label: 'Deck Progress', icon: TrendingUp }
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setSelectedView(id as any)}
                className={`px-4 py-2 rounded-md transition-all flex items-center gap-2 ${
                  selectedView === id
                    ? 'bg-white dark:bg-gray-700 text-purple-600 dark:text-purple-400 shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </button>
            ))}
          </div>
        </div>

        {renderCharts()}

        {/* Study Now CTA */}
        {dueCards.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-8 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl p-6 text-white text-center"
          >
            <h3 className="text-2xl font-bold mb-2">
              You have {dueCards.length} cards due for review!
            </h3>
            <p className="mb-4">Keep your streak going and reinforce your learning.</p>
            <Link
              to="/decks"
              className="inline-flex items-center gap-2 bg-white text-purple-600 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
            >
              <Brain className="w-5 h-5" />
              Study Now
            </Link>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}