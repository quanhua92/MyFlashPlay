import { storageManager } from './storage';
import { STORAGE_KEYS } from './constants';
import type { Achievement, GameSession } from '@/types';
// import { v4 as uuidv4 } from 'uuid'; // Removed unused import

export interface AchievementProgress {
  achievementId: string;
  progress: number;
  maxProgress: number;
  unlockedAt?: string;
}

export interface StoredAchievements {
  version: string;
  achievements: AchievementProgress[];
  totalPoints: number;
  lastUpdated: string;
}

// Define all achievements
export const ACHIEVEMENTS: Achievement[] = [
  // Beginner achievements
  {
    id: 'first-deck',
    name: 'First Steps',
    description: 'Complete your first deck',
    icon: '🎯',
    requirement: { type: 'games-played', value: 1 },
    points: 10
  },
  {
    id: 'perfect-score',
    name: 'Perfect!',
    description: 'Get 100% accuracy in any game',
    icon: '⭐',
    requirement: { type: 'perfect-score', value: 1 },
    points: 25
  },
  {
    id: 'speed-demon',
    name: 'Speed Demon',
    description: 'Complete a deck in under 2 minutes',
    icon: '⚡',
    requirement: { type: 'speed', value: 120 },
    points: 30
  },
  
  // Streak achievements
  {
    id: 'streak-5',
    name: 'Getting Warmed Up',
    description: 'Get a 5 card streak',
    icon: '🔥',
    requirement: { type: 'streak', value: 5 },
    points: 15
  },
  {
    id: 'streak-10',
    name: 'On Fire!',
    description: 'Get a 10 card streak',
    icon: '🔥',
    requirement: { type: 'streak', value: 10 },
    points: 30
  },
  {
    id: 'streak-20',
    name: 'Streak Master',
    description: 'Get a 20 card streak',
    icon: '🔥',
    requirement: { type: 'streak', value: 20 },
    points: 50
  },
  
  // Progress achievements
  {
    id: 'daily-player',
    name: 'Daily Dedication',
    description: 'Play for 7 days in a row',
    icon: '📅',
    requirement: { type: 'streak', value: 7 },
    points: 40
  },
  {
    id: 'games-10',
    name: 'Practice Makes Perfect',
    description: 'Play 10 games',
    icon: '🎮',
    requirement: { type: 'games-played', value: 10 },
    points: 20
  },
  {
    id: 'games-50',
    name: 'Dedicated Learner',
    description: 'Play 50 games',
    icon: '🎓',
    requirement: { type: 'games-played', value: 50 },
    points: 50
  },
  {
    id: 'games-100',
    name: 'Century Club',
    description: 'Play 100 games',
    icon: '💯',
    requirement: { type: 'games-played', value: 100 },
    points: 100
  },
  
  // Master achievements
  {
    id: 'master-learner',
    name: 'Master Learner',
    description: 'Get 100% accuracy on 5 different decks',
    icon: '🏆',
    requirement: { type: 'perfect-score', value: 5 },
    points: 75
  },
  {
    id: 'quick-learner',
    name: 'Quick Learner',
    description: 'Complete 10 games with >90% accuracy and <3 min time',
    icon: '🚀',
    requirement: { type: 'speed', value: 10 },
    points: 60
  },
  {
    id: 'points-1000',
    name: 'Point Collector',
    description: 'Earn 1,000 total points',
    icon: '💎',
    requirement: { type: 'total-points', value: 1000 },
    points: 50
  },
  {
    id: 'points-5000',
    name: 'Point Master',
    description: 'Earn 5,000 total points',
    icon: '👑',
    requirement: { type: 'total-points', value: 5000 },
    points: 100
  }
];

export class AchievementManager {
  private achievements: StoredAchievements;
  private newUnlocks: Achievement[] = [];

  constructor() {
    this.achievements = this.loadAchievements();
  }

  private loadAchievements(): StoredAchievements {
    const stored = storageManager.load<StoredAchievements>(STORAGE_KEYS.ACHIEVEMENTS);
    if (stored) return stored;

    // Initialize with empty achievements
    const initial: StoredAchievements = {
      version: '1.0.0',
      achievements: ACHIEVEMENTS.map(a => ({
        achievementId: a.id,
        progress: 0,
        maxProgress: a.requirement.value
      })),
      totalPoints: 0,
      lastUpdated: new Date().toISOString()
    };

    storageManager.save(STORAGE_KEYS.ACHIEVEMENTS, initial);
    return initial;
  }

  private saveAchievements(): void {
    this.achievements.lastUpdated = new Date().toISOString();
    storageManager.save(STORAGE_KEYS.ACHIEVEMENTS, this.achievements);
  }

  // Check achievements after game session
  checkAchievements(session: GameSession): Achievement[] {
    this.newUnlocks = [];
    
    // Check games played
    this.checkGamesPlayed();
    
    // Check perfect score
    if (session.score.accuracy === 100) {
      this.checkPerfectScore();
    }
    
    // Check speed achievements
    if (session.duration && session.duration < 120) {
      this.checkSpeed(session.duration);
    }
    
    // Check streak achievements
    if (session.score.bestStreak > 0) {
      this.checkStreak(session.score.bestStreak);
    }
    
    // Check points
    this.checkTotalPoints(session.score.points);
    
    // Check quick learner (speed + accuracy)
    if (session.score.accuracy > 90 && session.duration && session.duration < 180) {
      this.incrementProgress('quick-learner', 1);
    }
    
    this.saveAchievements();
    return this.newUnlocks;
  }

  private checkGamesPlayed(): void {
    this.incrementProgress('first-deck', 1);
    this.incrementProgress('games-10', 1);
    this.incrementProgress('games-50', 1);
    this.incrementProgress('games-100', 1);
  }

  private checkPerfectScore(): void {
    this.incrementProgress('perfect-score', 1);
    
    // Check master learner (5 perfect scores)
    const perfectCount = this.getProgress('perfect-score');
    if (perfectCount <= 5) {
      this.incrementProgress('master-learner', 1);
    }
  }

  private checkSpeed(duration: number): void {
    if (duration < 120) {
      this.incrementProgress('speed-demon', 1);
    }
  }

  private checkStreak(streak: number): void {
    if (streak >= 5) {
      this.setProgress('streak-5', Math.max(this.getProgress('streak-5'), streak));
    }
    if (streak >= 10) {
      this.setProgress('streak-10', Math.max(this.getProgress('streak-10'), streak));
    }
    if (streak >= 20) {
      this.setProgress('streak-20', Math.max(this.getProgress('streak-20'), streak));
    }
  }

  private checkTotalPoints(points: number): void {
    const currentTotal = this.achievements.totalPoints + points;
    this.achievements.totalPoints = currentTotal;
    
    this.setProgress('points-1000', Math.min(currentTotal, 1000));
    this.setProgress('points-5000', Math.min(currentTotal, 5000));
  }

  // Check daily streak
  checkDailyStreak(): void {
    const lastPlayed = localStorage.getItem('myflashplay_last_played');
    const today = new Date().toDateString();
    
    if (lastPlayed !== today) {
      localStorage.setItem('myflashplay_last_played', today);
      
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      
      if (lastPlayed === yesterday.toDateString()) {
        // Continue streak
        const currentStreak = parseInt(localStorage.getItem('myflashplay_daily_streak') || '0') + 1;
        localStorage.setItem('myflashplay_daily_streak', currentStreak.toString());
        
        if (currentStreak <= 7) {
          this.setProgress('daily-player', currentStreak);
          this.saveAchievements();
        }
      } else {
        // Reset streak
        localStorage.setItem('myflashplay_daily_streak', '1');
        this.setProgress('daily-player', 1);
        this.saveAchievements();
      }
    }
  }

  private incrementProgress(achievementId: string, amount: number = 1): void {
    const achievement = this.achievements.achievements.find(a => a.achievementId === achievementId);
    if (!achievement) return;
    
    const wasUnlocked = achievement.unlockedAt !== undefined;
    achievement.progress = Math.min(achievement.progress + amount, achievement.maxProgress);
    
    if (!wasUnlocked && achievement.progress >= achievement.maxProgress) {
      achievement.unlockedAt = new Date().toISOString();
      const fullAchievement = ACHIEVEMENTS.find(a => a.id === achievementId);
      if (fullAchievement) {
        this.newUnlocks.push(fullAchievement);
      }
    }
  }

  private setProgress(achievementId: string, value: number): void {
    const achievement = this.achievements.achievements.find(a => a.achievementId === achievementId);
    if (!achievement) return;
    
    const wasUnlocked = achievement.unlockedAt !== undefined;
    achievement.progress = Math.min(value, achievement.maxProgress);
    
    if (!wasUnlocked && achievement.progress >= achievement.maxProgress) {
      achievement.unlockedAt = new Date().toISOString();
      const fullAchievement = ACHIEVEMENTS.find(a => a.id === achievementId);
      if (fullAchievement) {
        this.newUnlocks.push(fullAchievement);
      }
    }
  }

  private getProgress(achievementId: string): number {
    const achievement = this.achievements.achievements.find(a => a.achievementId === achievementId);
    return achievement?.progress || 0;
  }

  // Get all achievements with progress
  getAllAchievements(): (Achievement & AchievementProgress)[] {
    return ACHIEVEMENTS.map(achievement => {
      const progress = this.achievements.achievements.find(
        a => a.achievementId === achievement.id
      ) || {
        achievementId: achievement.id,
        progress: 0,
        maxProgress: achievement.requirement.value
      };
      
      return { ...achievement, ...progress };
    });
  }

  // Get unlocked achievements
  getUnlockedAchievements(): Achievement[] {
    return ACHIEVEMENTS.filter(achievement => {
      const progress = this.achievements.achievements.find(
        a => a.achievementId === achievement.id
      );
      return progress?.unlockedAt !== undefined;
    });
  }

  // Get achievement stats
  getStats(): {
    totalUnlocked: number;
    totalAchievements: number;
    totalPoints: number;
    completionPercentage: number;
  } {
    const unlocked = this.getUnlockedAchievements();
    return {
      totalUnlocked: unlocked.length,
      totalAchievements: ACHIEVEMENTS.length,
      totalPoints: this.achievements.totalPoints,
      completionPercentage: (unlocked.length / ACHIEVEMENTS.length) * 100
    };
  }
}

export const achievementManager = new AchievementManager();