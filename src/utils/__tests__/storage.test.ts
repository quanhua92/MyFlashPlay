import { describe, it, expect, vi, beforeEach } from 'vitest';
import { storageManager } from '../storage';

describe('Storage Manager', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('should save and load data correctly', () => {
    const testData = { name: 'Test', value: 42 };
    const key = 'test-key';

    storageManager.save(key, testData);
    const loaded = storageManager.load(key);

    expect(loaded).toEqual(testData);
  });

  it('should return null for non-existent keys', () => {
    const result = storageManager.load('non-existent');
    expect(result).toBeNull();
  });

  it('should handle JSON parsing errors', () => {
    // Mock invalid JSON
    vi.mocked(localStorage.getItem).mockReturnValue('invalid json');
    
    const result = storageManager.load('test-key');
    expect(result).toBeNull();
  });

  it('should remove data correctly', () => {
    const testData = { name: 'Test' };
    const key = 'test-key';

    storageManager.save(key, testData);
    expect(storageManager.load(key)).toEqual(testData);

    storageManager.remove(key);
    expect(storageManager.load(key)).toBeNull();
  });

  it('should clear all data', () => {
    storageManager.save('key1', { data: 1 });
    storageManager.save('key2', { data: 2 });

    storageManager.clear();

    expect(storageManager.load('key1')).toBeNull();
    expect(storageManager.load('key2')).toBeNull();
  });

  it('should handle localStorage quota exceeded', () => {
    // Mock quota exceeded error
    vi.mocked(localStorage.setItem).mockImplementation(() => {
      throw new Error('QuotaExceededError');
    });

    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    storageManager.save('test-key', { data: 'test' });
    
    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });

  it('should get all keys with prefix', () => {
    storageManager.save('prefix_key1', { data: 1 });
    storageManager.save('prefix_key2', { data: 2 });
    storageManager.save('other_key', { data: 3 });

    const keys = storageManager.getKeys('prefix_');
    
    expect(keys).toHaveLength(2);
    expect(keys).toContain('prefix_key1');
    expect(keys).toContain('prefix_key2');
    expect(keys).not.toContain('other_key');
  });

  it('should get storage size', () => {
    storageManager.save('test-key', { data: 'test data' });
    
    const size = storageManager.getSize();
    expect(size).toBeGreaterThan(0);
  });

  it('should check if key exists', () => {
    storageManager.save('existing-key', { data: 'test' });
    
    expect(storageManager.exists('existing-key')).toBe(true);
    expect(storageManager.exists('non-existing-key')).toBe(false);
  });

  it('should handle migration', () => {
    // Set up old format data
    localStorage.setItem('old-key', JSON.stringify({ oldFormat: true }));
    
    const migrationFn = vi.fn((oldData) => ({ ...oldData, migrated: true }));
    const result = storageManager.migrate('old-key', 'new-key', migrationFn);
    
    expect(result).toBe(true);
    expect(migrationFn).toHaveBeenCalled();
    expect(storageManager.load('new-key')).toEqual({ oldFormat: true, migrated: true });
    expect(storageManager.exists('old-key')).toBe(false);
  });
});