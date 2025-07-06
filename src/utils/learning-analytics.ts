import type { GameSession } from '@/types';

export interface LearningStats {
  totalSessions: number;
  totalTime: number; // seconds
  totalCards: number;
  uniqueCards: Set<string>;
  accuracy: number;
  streakDays: number;
  currentStreak: number;
  bestStreak: number;
  lastStudyDate: string | null;
}

export interface CardStats {
  cardId: string;
  timesStudied: number;
  correctAttempts: number;
  incorrectAttempts: number;
  averageTime: number;
  lastSeen: string;
  accuracy: number;
  difficulty: 'easy' | 'medium' | 'hard';
}

export interface DeckStats {
  deckId: string;
  deckName: string;
  totalSessions: number;
  totalTime: number;
  averageAccuracy: number;
  cardsStudied: number;
  masteryLevel: number; // 0-100%
}

export interface TimeStats {
  daily: Map<string, number>;
  weekly: Map<string, number>;
  monthly: Map<string, number>;
  hourly: Map<number, number>; // Hour of day distribution
}

export class LearningAnalytics {
  /**
   * Calculate overall learning statistics
   */
  static calculateLearningStats(sessions: GameSession[]): LearningStats {
    const uniqueCards = new Set<string>();
    let totalTime = 0;
    let totalCorrect = 0;
    let totalQuestions = 0;
    
    sessions.forEach(session => {
      totalTime += session.duration || 0;
      totalCorrect += session.score.correctAnswers;
      totalQuestions += session.score.totalQuestions;
      
      session.details.cardResults.forEach(result => {
        uniqueCards.add(result.cardId);
      });
    });
    
    const { streakDays, currentStreak, bestStreak } = this.calculateStreaks(sessions);
    
    return {
      totalSessions: sessions.length,
      totalTime,
      totalCards: totalQuestions,
      uniqueCards,
      accuracy: totalQuestions > 0 ? (totalCorrect / totalQuestions) * 100 : 0,
      streakDays,
      currentStreak,
      bestStreak,
      lastStudyDate: sessions.length > 0 
        ? sessions[sessions.length - 1].endTime || null
        : null
    };
  }
  
  /**
   * Calculate per-card statistics
   */
  static calculateCardStats(sessions: GameSession[]): Map<string, CardStats> {
    const cardStatsMap = new Map<string, CardStats>();
    
    sessions.forEach(session => {
      session.details.cardResults.forEach(result => {
        const existing = cardStatsMap.get(result.cardId) || {
          cardId: result.cardId,
          timesStudied: 0,
          correctAttempts: 0,
          incorrectAttempts: 0,
          averageTime: 0,
          lastSeen: session.endTime,
          accuracy: 0,
          difficulty: 'medium' as const
        };
        
        existing.timesStudied++;
        if (result.wasCorrect) {
          existing.correctAttempts++;
        } else {
          existing.incorrectAttempts++;
        }
        
        // Update average time
        existing.averageTime = (
          (existing.averageTime * (existing.timesStudied - 1) + result.timeSpent) / 
          existing.timesStudied
        );
        
        // Update last seen
        if (session.endTime && existing.lastSeen && new Date(session.endTime) > new Date(existing.lastSeen)) {
          existing.lastSeen = session.endTime;
        } else if (session.endTime && !existing.lastSeen) {
          existing.lastSeen = session.endTime;
        }
        
        // Calculate accuracy
        const totalAttempts = existing.correctAttempts + existing.incorrectAttempts;
        existing.accuracy = totalAttempts > 0 
          ? (existing.correctAttempts / totalAttempts) * 100 
          : 0;
        
        // Determine difficulty
        if (existing.accuracy >= 80 && existing.averageTime < 5) {
          existing.difficulty = 'easy';
        } else if (existing.accuracy < 50 || existing.averageTime > 15) {
          existing.difficulty = 'hard';
        } else {
          existing.difficulty = 'medium';
        }
        
        if (existing.lastSeen) {
          cardStatsMap.set(result.cardId, existing);
        }
      });
    });
    
    return cardStatsMap;
  }
  
  /**
   * Calculate per-deck statistics
   */
  static calculateDeckStats(sessions: GameSession[]): Map<string, DeckStats> {
    const deckStatsMap = new Map<string, DeckStats>();
    
    sessions.forEach(session => {
      const existing = deckStatsMap.get(session.deckId) || {
        deckId: session.deckId,
        deckName: session.deckName,
        totalSessions: 0,
        totalTime: 0,
        averageAccuracy: 0,
        cardsStudied: 0,
        masteryLevel: 0
      };
      
      existing.totalSessions++;
      existing.totalTime += session.duration || 0;
      existing.cardsStudied += session.details.cardResults.length;
      
      // Update average accuracy
      existing.averageAccuracy = (
        (existing.averageAccuracy * (existing.totalSessions - 1) + session.score.accuracy) /
        existing.totalSessions
      );
      
      // Calculate mastery level (simplified)
      existing.masteryLevel = Math.min(100, 
        (existing.averageAccuracy * 0.6) + 
        (Math.min(existing.totalSessions, 20) * 2)
      );
      
      deckStatsMap.set(session.deckId, existing);
    });
    
    return deckStatsMap;
  }
  
  /**
   * Calculate time-based statistics
   */
  static calculateTimeStats(sessions: GameSession[]): TimeStats {
    const daily = new Map<string, number>();
    const weekly = new Map<string, number>();
    const monthly = new Map<string, number>();
    const hourly = new Map<number, number>();
    
    // Initialize hourly map
    for (let i = 0; i < 24; i++) {
      hourly.set(i, 0);
    }
    
    sessions.forEach(session => {
      const date = new Date(session.startTime);
      const dayKey = date.toISOString().split('T')[0];
      const weekKey = this.getWeekKey(date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const hour = date.getHours();
      
      daily.set(dayKey, (daily.get(dayKey) || 0) + (session.duration || 0));
      weekly.set(weekKey, (weekly.get(weekKey) || 0) + (session.duration || 0));
      monthly.set(monthKey, (monthly.get(monthKey) || 0) + (session.duration || 0));
      hourly.set(hour, (hourly.get(hour) || 0) + 1);
    });
    
    return { daily, weekly, monthly, hourly };
  }
  
  /**
   * Calculate study streaks
   */
  private static calculateStreaks(sessions: GameSession[]): {
    streakDays: number;
    currentStreak: number;
    bestStreak: number;
  } {
    if (sessions.length === 0) {
      return { streakDays: 0, currentStreak: 0, bestStreak: 0 };
    }
    
    // Get unique study days
    const studyDays = new Set(
      sessions.map(s => new Date(s.startTime).toISOString().split('T')[0])
    );
    
    // Sort days
    const sortedDays = Array.from(studyDays).sort();
    
    let currentStreak = 1;
    let bestStreak = 1;
    let tempStreak = 1;
    
    // Calculate streaks
    for (let i = 1; i < sortedDays.length; i++) {
      const prevDate = new Date(sortedDays[i - 1]);
      const currDate = new Date(sortedDays[i]);
      const dayDiff = Math.floor(
        (currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24)
      );
      
      if (dayDiff === 1) {
        tempStreak++;
        bestStreak = Math.max(bestStreak, tempStreak);
      } else {
        tempStreak = 1;
      }
    }
    
    // Check if current streak is active
    const lastStudyDate = new Date(sortedDays[sortedDays.length - 1]);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const daysSinceLastStudy = Math.floor(
      (today.getTime() - lastStudyDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    
    if (daysSinceLastStudy > 1) {
      currentStreak = 0;
    } else {
      currentStreak = tempStreak;
    }
    
    return {
      streakDays: studyDays.size,
      currentStreak,
      bestStreak
    };
  }
  
  /**
   * Get week key for grouping
   */
  private static getWeekKey(date: Date): string {
    const year = date.getFullYear();
    const firstDayOfYear = new Date(year, 0, 1);
    const days = Math.floor(
      (date.getTime() - firstDayOfYear.getTime()) / (1000 * 60 * 60 * 24)
    );
    const weekNumber = Math.ceil(days / 7);
    return `${year}-W${String(weekNumber).padStart(2, '0')}`;
  }
  
  /**
   * Get learning insights
   */
  static getLearningInsights(
    stats: LearningStats,
    cardStats: Map<string, CardStats>
  ): string[] {
    const insights: string[] = [];
    
    // Streak insights
    if (stats.currentStreak >= 7) {
      insights.push(`🔥 Amazing! You're on a ${stats.currentStreak} day streak!`);
    } else if (stats.currentStreak === 0 && stats.lastStudyDate) {
      insights.push(`💪 Time to get back on track! Your last study session was ${this.getDaysAgo(stats.lastStudyDate)} days ago.`);
    }
    
    // Accuracy insights
    if (stats.accuracy >= 90) {
      insights.push(`🎯 Excellent accuracy at ${Math.round(stats.accuracy)}%!`);
    } else if (stats.accuracy < 60) {
      insights.push(`📚 Focus on reviewing difficult cards to improve your ${Math.round(stats.accuracy)}% accuracy.`);
    }
    
    // Card difficulty insights
    const hardCards = Array.from(cardStats.values()).filter(c => c.difficulty === 'hard');
    if (hardCards.length > 0) {
      insights.push(`🎯 You have ${hardCards.length} challenging cards that need more practice.`);
    }
    
    // Time insights
    const avgSessionTime = stats.totalSessions > 0 ? stats.totalTime / stats.totalSessions : 0;
    if (avgSessionTime > 600) { // 10+ minutes
      insights.push(`⏱️ Your average session is ${Math.round(avgSessionTime / 60)} minutes. Great focus!`);
    }
    
    return insights;
  }
  
  /**
   * Get days ago from date
   */
  private static getDaysAgo(dateStr: string): number {
    const date = new Date(dateStr);
    const today = new Date();
    return Math.floor((today.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
  }
}