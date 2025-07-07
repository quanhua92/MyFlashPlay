import { describe, it, expect, vi, beforeEach } from 'vitest';
import { storageManager } from '../storage';

describe('Storage Manager', () => {
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
    // Set invalid JSON directly in localStorage
    localStorageMock.setItem('test-key', 'invalid json');
    
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

  // Clear method not available in current storage manager
  it('should remove individual items', () => {
    storageManager.save('key1', { data: 1 });
    storageManager.save('key2', { data: 2 });

    storageManager.remove('key1');
    storageManager.remove('key2');

    expect(storageManager.load('key1')).toBeNull();
    expect(storageManager.load('key2')).toBeNull();
  });

  it('should handle localStorage quota exceeded', () => {
    // Mock quota exceeded error
    const originalSetItem = localStorageMock.setItem;
    localStorageMock.setItem = vi.fn(() => {
      throw new Error('QuotaExceededError');
    });

    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    storageManager.save('test-key', { data: 'test' });
    
    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
    localStorageMock.setItem = originalSetItem;
  });

  // getKeys method not available in current storage manager
  it('should save and load multiple items', () => {
    storageManager.save('prefix_key1', { data: 1 });
    storageManager.save('prefix_key2', { data: 2 });
    storageManager.save('other_key', { data: 3 });

    expect(storageManager.load('prefix_key1')).toEqual({ data: 1 });
    expect(storageManager.load('prefix_key2')).toEqual({ data: 2 });
    expect(storageManager.load('other_key')).toEqual({ data: 3 });
  });

  // Additional methods not available in current storage manager
  it('should handle basic storage operations', () => {
    storageManager.save('test-key', { data: 'test data' });
    
    expect(storageManager.load('test-key')).toEqual({ data: 'test data' });
    
    storageManager.remove('test-key');
    expect(storageManager.load('test-key')).toBeNull();
  });
});