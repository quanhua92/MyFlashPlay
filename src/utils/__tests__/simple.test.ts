import { describe, it, expect } from 'vitest';
import { ACHIEVEMENTS } from '../achievements';

describe('Basic Functionality Tests', () => {
  it('should have achievements defined', () => {
    expect(ACHIEVEMENTS).toBeDefined();
    expect(ACHIEVEMENTS.length).toBeGreaterThan(0);
  });

  it('should have achievement structure', () => {
    const achievement = ACHIEVEMENTS[0];
    expect(achievement).toHaveProperty('id');
    expect(achievement).toHaveProperty('name');
    expect(achievement).toHaveProperty('description');
    expect(achievement).toHaveProperty('icon');
    expect(achievement).toHaveProperty('requirement');
    expect(achievement).toHaveProperty('points');
  });

  it('should calculate basic math', () => {
    expect(2 + 2).toBe(4);
  });

  it('should handle arrays', () => {
    const arr = [1, 2, 3];
    expect(arr.length).toBe(3);
    expect(arr.includes(2)).toBe(true);
  });

  it('should handle objects', () => {
    const obj = { name: 'test', value: 42 };
    expect(obj.name).toBe('test');
    expect(obj.value).toBe(42);
  });
});