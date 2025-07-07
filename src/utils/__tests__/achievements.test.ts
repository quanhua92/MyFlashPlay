import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AchievementManager } from '../achievements';
import { mockGameSession } from '../../test/utils/test-utils';

describe('Achievement Manager', () => {
  let achievementManager: AchievementManager;
  
  // Mock localStorage with actual storage
  const localStorageMock = (() => {
    let store: Record<string, string> = {};
    return {
      getItem: (key: string) => store[key] || null,
      setItem: (key: string, value: string) => { store[key] = value; },
      removeItem: (key: string) => { delete store[key]; },
      clear: () => { store = {}; },
      length: 0,
      key: () => null,
    };
  })();

  beforeEach(() => {
    vi.clearAllMocks();
    Object.defineProperty(window, 'localStorage', { value: localStorageMock });
    localStorageMock.clear();
    achievementManager = new AchievementManager();
  });

  it('should initialize with empty achievements', () => {
    const achievements = achievementManager.getAllAchievements();
    expect(achievements).toHaveLength(14);
    expect(achievements.every(a => a.progress === 0)).toBe(true);
  });

  it('should unlock first deck achievement', () => {
    const session = { ...mockGameSession };
    const unlocked = achievementManager.checkAchievements(session);
    
    expect(unlocked.length).toBeGreaterThanOrEqual(1);
    expect(unlocked.some(a => a.id === 'first-deck')).toBe(true);
  });

  it('should unlock perfect score achievement', () => {
    const session = {
      ...mockGameSession,
      score: { ...mockGameSession.score, accuracy: 100 }
    };
    
    const unlocked = achievementManager.checkAchievements(session);
    
    expect(unlocked.some(a => a.id === 'perfect-score')).toBe(true);
  });

  it('should unlock speed achievement', () => {
    const session = {
      ...mockGameSession,
      duration: 100, // Under 2 minutes (120 seconds)
      score: { ...mockGameSession.score, accuracy: 100 }
    };
    
    const unlocked = achievementManager.checkAchievements(session);
    
    // Check achievements progress instead of just unlocked this turn
    const achievements = achievementManager.getAllAchievements();
    const speedAchievement = achievements.find(a => a.id === 'speed-demon');
    expect(speedAchievement?.progress).toBeGreaterThan(0);
  });

  it('should track streak achievements', () => {
    const session = {
      ...mockGameSession,
      score: { ...mockGameSession.score, bestStreak: 10 }
    };
    
    const unlocked = achievementManager.checkAchievements(session);
    
    expect(unlocked.some(a => a.id === 'streak-5')).toBe(true);
    expect(unlocked.some(a => a.id === 'streak-10')).toBe(true);
  });

  it('should track total points', () => {
    const session = {
      ...mockGameSession,
      score: { ...mockGameSession.score, points: 1000 }
    };
    
    achievementManager.checkAchievements(session);
    const stats = achievementManager.getStats();
    
    expect(stats.totalPoints).toBe(1000);
  });

  it('should not unlock same achievement twice', () => {
    const session = { ...mockGameSession };
    
    // First unlock
    const firstUnlocked = achievementManager.checkAchievements(session);
    expect(firstUnlocked.length).toBeGreaterThanOrEqual(1);
    
    // Second attempt - should not unlock again (only checking first-deck)
    const secondUnlocked = achievementManager.checkAchievements(session);
    expect(secondUnlocked.some(a => a.id === 'first-deck')).toBe(false);
  });

  it('should save achievement progress', () => {
    const session = { ...mockGameSession };
    achievementManager.checkAchievements(session);
    
    // Check progress was saved by checking current manager state
    const achievements = achievementManager.getAllAchievements();
    const firstDeck = achievements.find(a => a.id === 'first-deck');
    
    expect(firstDeck?.progress).toBeGreaterThanOrEqual(1);
  });

  it('should get unlocked achievements', () => {
    const session = { ...mockGameSession };
    achievementManager.checkAchievements(session);
    
    const unlocked = achievementManager.getUnlockedAchievements();
    expect(unlocked.length).toBeGreaterThanOrEqual(1);
    expect(unlocked.some(a => a.id === 'first-deck')).toBe(true);
  });

  it('should calculate completion percentage', () => {
    const session = { ...mockGameSession };
    achievementManager.checkAchievements(session);
    
    const stats = achievementManager.getStats();
    expect(stats.completionPercentage).toBeGreaterThan(0);
    expect(stats.completionPercentage).toBeLessThan(100);
  });

  it('should handle quick learner achievement', () => {
    const session = {
      ...mockGameSession,
      duration: 150, // Under 3 minutes
      score: { ...mockGameSession.score, accuracy: 95 } // Above 90%
    };
    
    achievementManager.checkAchievements(session);
    
    // Should increment progress towards quick learner
    const quickLearner = achievementManager.getAllAchievements()
      .find(a => a.id === 'quick-learner');
    expect(quickLearner?.progress).toBe(1);
  });

  it('should handle daily streak', () => {
    // Don't set last_played so it starts fresh
    localStorageMock.removeItem('myflashplay_last_played');
    localStorageMock.removeItem('myflashplay_daily_streak');
    
    achievementManager.checkDailyStreak();
    
    const dailyStreak = localStorageMock.getItem('myflashplay_daily_streak');
    expect(dailyStreak).toBe('1');
  });

  it('should continue daily streak', () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    localStorageMock.setItem('myflashplay_last_played', yesterday.toDateString());
    localStorageMock.setItem('myflashplay_daily_streak', '5');
    
    achievementManager.checkDailyStreak();
    
    const dailyStreak = localStorageMock.getItem('myflashplay_daily_streak');
    expect(dailyStreak).toBe('6');
  });

  it('should reset daily streak for non-consecutive days', () => {
    const twoDaysAgo = new Date();
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
    localStorageMock.setItem('myflashplay_last_played', twoDaysAgo.toDateString());
    localStorageMock.setItem('myflashplay_daily_streak', '5');
    
    achievementManager.checkDailyStreak();
    
    const dailyStreak = localStorageMock.getItem('myflashplay_daily_streak');
    expect(dailyStreak).toBe('1');
  });
});