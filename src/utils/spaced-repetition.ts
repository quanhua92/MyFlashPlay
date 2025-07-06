// SM-2 Spaced Repetition Algorithm Implementation

export interface CardReview {
  cardId: string;
  lastReview: string;
  nextReview: string;
  interval: number; // Days until next review
  repetitions: number;
  easeFactor: number; // Difficulty factor (1.3 to 2.5)
  lapses: number; // Number of times forgotten
}

export interface ReviewPerformance {
  quality: number; // 0-5 rating (0-2: fail, 3-5: pass)
  timeSpent: number; // Seconds
  hintsUsed: boolean;
}

export class SpacedRepetition {
  private static readonly MIN_EASE_FACTOR = 1.3;
  private static readonly DEFAULT_EASE_FACTOR = 2.5;
  
  /**
   * Calculate next review interval using SM-2 algorithm
   */
  static calculateNextReview(
    currentReview: CardReview,
    performance: ReviewPerformance
  ): CardReview {
    const { quality } = performance;
    let { easeFactor, interval, repetitions } = currentReview;
    
    // Reset if failed (quality < 3)
    if (quality < 3) {
      return {
        ...currentReview,
        interval: 1,
        repetitions: 0,
        easeFactor: Math.max(this.MIN_EASE_FACTOR, easeFactor - 0.2),
        lapses: currentReview.lapses + 1,
        lastReview: new Date().toISOString(),
        nextReview: this.getNextReviewDate(1)
      };
    }
    
    // Calculate new ease factor
    easeFactor = this.calculateEaseFactor(easeFactor, quality);
    
    // Calculate interval
    if (repetitions === 0) {
      interval = 1;
    } else if (repetitions === 1) {
      interval = 6;
    } else {
      interval = Math.round(interval * easeFactor);
    }
    
    // Apply time-based bonus/penalty
    if (performance.timeSpent < 5) {
      // Very quick answer - might be too easy
      interval = Math.max(1, Math.round(interval * 0.8));
    } else if (performance.timeSpent > 30) {
      // Took a long time - might be too hard
      interval = Math.max(1, Math.round(interval * 1.2));
    }
    
    return {
      ...currentReview,
      interval,
      repetitions: repetitions + 1,
      easeFactor,
      lastReview: new Date().toISOString(),
      nextReview: this.getNextReviewDate(interval)
    };
  }
  
  /**
   * Calculate new ease factor based on performance
   */
  private static calculateEaseFactor(currentEase: number, quality: number): number {
    const newEase = currentEase + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
    return Math.max(this.MIN_EASE_FACTOR, newEase);
  }
  
  /**
   * Get next review date based on interval
   */
  private static getNextReviewDate(intervalDays: number): string {
    const date = new Date();
    date.setDate(date.getDate() + intervalDays);
    return date.toISOString();
  }
  
  /**
   * Initialize a new card review
   */
  static initializeCard(cardId: string): CardReview {
    return {
      cardId,
      lastReview: new Date().toISOString(),
      nextReview: this.getNextReviewDate(1),
      interval: 1,
      repetitions: 0,
      easeFactor: this.DEFAULT_EASE_FACTOR,
      lapses: 0
    };
  }
  
  /**
   * Get cards due for review
   */
  static getDueCards(reviews: CardReview[]): CardReview[] {
    const now = new Date();
    return reviews.filter(review => new Date(review.nextReview) <= now);
  }
  
  /**
   * Calculate retention statistics
   */
  static calculateRetention(reviews: CardReview[]): {
    averageEaseFactor: number;
    averageInterval: number;
    masteredCards: number;
    strugglingCards: number;
    retentionRate: number;
  } {
    if (reviews.length === 0) {
      return {
        averageEaseFactor: this.DEFAULT_EASE_FACTOR,
        averageInterval: 0,
        masteredCards: 0,
        strugglingCards: 0,
        retentionRate: 0
      };
    }
    
    const totalEase = reviews.reduce((sum, r) => sum + r.easeFactor, 0);
    const totalInterval = reviews.reduce((sum, r) => sum + r.interval, 0);
    const masteredCards = reviews.filter(r => r.interval > 21).length; // 3+ weeks
    const strugglingCards = reviews.filter(r => r.easeFactor < 2.0).length;
    const totalAttempts = reviews.reduce((sum, r) => sum + r.repetitions + r.lapses, 0);
    const successfulAttempts = reviews.reduce((sum, r) => sum + r.repetitions, 0);
    
    return {
      averageEaseFactor: totalEase / reviews.length,
      averageInterval: totalInterval / reviews.length,
      masteredCards,
      strugglingCards,
      retentionRate: totalAttempts > 0 ? (successfulAttempts / totalAttempts) * 100 : 0
    };
  }
  
  /**
   * Get review schedule for upcoming days
   */
  static getReviewSchedule(reviews: CardReview[], days: number = 30): Map<string, number> {
    const schedule = new Map<string, number>();
    const today = new Date();
    
    // Initialize all days with 0
    for (let i = 0; i < days; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() + i);
      schedule.set(date.toISOString().split('T')[0], 0);
    }
    
    // Count reviews per day
    reviews.forEach(review => {
      const reviewDate = new Date(review.nextReview);
      const dateStr = reviewDate.toISOString().split('T')[0];
      
      if (schedule.has(dateStr)) {
        schedule.set(dateStr, (schedule.get(dateStr) || 0) + 1);
      }
    });
    
    return schedule;
  }
}