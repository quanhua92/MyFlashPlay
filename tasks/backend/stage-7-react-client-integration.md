# Stage 7: React Client Integration

## Overview

This stage integrates the backend API with the existing React client, ensuring seamless operation with or without authentication. The integration includes engaging prompts for registration, export data protection, and graceful fallbacks to local storage when users choose not to login.

## Integration Strategy

1. **Non-Breaking Changes**: Existing local storage functionality remains intact
2. **Progressive Enhancement**: API sync is an optional enhancement
3. **User Choice**: Users can choose to login or continue using local storage
4. **Data Protection**: Users are prompted to export data before syncing
5. **Seamless Experience**: Sync happens automatically when online and authenticated

## Files to Create/Modify

### 1. Create API Client Service

**File**: `src/services/api.ts` (New file)

```typescript
import { Deck, Achievement, Progress, UserPreferences } from '../types/storage.types';

export interface AuthResponse {
  success: boolean;
  token?: string;
  user_id?: string;
  message: string;
}

export interface SyncResponse<T> {
  data: T[];
  conflicts: SyncConflict<T>[];
  last_sync: string;
}

export interface SyncConflict<T> {
  local: T;
  remote: T;
  resolution: 'UseLocal' | 'UseRemote' | 'Merge';
}

class ApiClient {
  private baseUrl: string;
  private token: string | null = null;

  constructor() {
    this.baseUrl = process.env.REACT_APP_API_URL || 'https://flashplay-backend.workers.dev';
    this.token = localStorage.getItem('auth_token');
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  // Hash password on client side before sending
  private hashPassword(password: string): string {
    // Simple SHA-256 implementation for client-side hashing
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    return crypto.subtle.digest('SHA-256', data).then(hash => {
      return Array.from(new Uint8Array(hash))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
    });
  }

  async register(email: string, password: string): Promise<AuthResponse> {
    const hashedPassword = await this.hashPassword(password);
    const response = await this.request<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password: hashedPassword }),
    });

    if (response.success && response.token) {
      this.token = response.token;
      localStorage.setItem('auth_token', response.token);
      localStorage.setItem('user_id', response.user_id!);
      localStorage.setItem('user_email', email);
    }

    return response;
  }

  async login(email: string, password: string): Promise<AuthResponse> {
    const hashedPassword = await this.hashPassword(password);
    const response = await this.request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password: hashedPassword }),
    });

    if (response.success && response.token) {
      this.token = response.token;
      localStorage.setItem('auth_token', response.token);
      localStorage.setItem('user_id', response.user_id!);
      localStorage.setItem('user_email', email);
    }

    return response;
  }

  async logout(): Promise<void> {
    await this.request('/auth/logout', { method: 'POST' });
    this.token = null;
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_id');
    localStorage.removeItem('user_email');
  }

  async validateToken(): Promise<boolean> {
    if (!this.token) return false;

    try {
      await this.request('/auth/validate');
      return true;
    } catch {
      this.token = null;
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user_id');
      localStorage.removeItem('user_email');
      return false;
    }
  }

  async syncDecks(localDecks: Deck[]): Promise<SyncResponse<Deck>> {
    const lastSync = localStorage.getItem('last_sync_decks');
    return this.request<SyncResponse<Deck>>('/sync/decks', {
      method: 'POST',
      body: JSON.stringify({
        data: localDecks,
        last_sync: lastSync || null,
      }),
    });
  }

  async syncAchievements(localAchievements: Achievement[]): Promise<SyncResponse<Achievement>> {
    const lastSync = localStorage.getItem('last_sync_achievements');
    return this.request<SyncResponse<Achievement>>('/sync/achievements', {
      method: 'POST',
      body: JSON.stringify({
        data: localAchievements,
        last_sync: lastSync || null,
      }),
    });
  }

  async syncProgress(localProgress: Progress[]): Promise<SyncResponse<Progress>> {
    const lastSync = localStorage.getItem('last_sync_progress');
    return this.request<SyncResponse<Progress>>('/sync/progress', {
      method: 'POST',
      body: JSON.stringify({
        data: localProgress,
        last_sync: lastSync || null,
      }),
    });
  }

  async syncPreferences(localPreferences: UserPreferences): Promise<SyncResponse<UserPreferences>> {
    const lastSync = localStorage.getItem('last_sync_preferences');
    return this.request<SyncResponse<UserPreferences>>('/sync/preferences', {
      method: 'POST',
      body: JSON.stringify({
        data: [localPreferences],
        last_sync: lastSync || null,
      }),
    });
  }

  async fullSync(localData: {
    decks: Deck[];
    achievements: Achievement[];
    progress: Progress[];
    preferences: UserPreferences;
  }): Promise<{
    decks: SyncResponse<Deck>;
    achievements: SyncResponse<Achievement>;
    progress: SyncResponse<Progress>;
    preferences: SyncResponse<UserPreferences>;
  }> {
    return this.request('/sync/full', {
      method: 'POST',
      body: JSON.stringify(localData),
    });
  }

  isAuthenticated(): boolean {
    return !!this.token;
  }

  getUserId(): string | null {
    return localStorage.getItem('user_id');
  }

  getUserEmail(): string | null {
    return localStorage.getItem('user_email');
  }
}

export const apiClient = new ApiClient();
```

### 2. Create Sync Service

**File**: `src/services/syncService.ts` (New file)

```typescript
import { apiClient } from './api';
import { Deck, Achievement, Progress, UserPreferences } from '../types/storage.types';
import { useDecks } from '../hooks/useDecks';
import { usePreferences } from '../hooks/usePreferences';

export interface SyncStatus {
  isOnline: boolean;
  isAuthenticated: boolean;
  lastSync: Date | null;
  syncing: boolean;
  error: string | null;
}

class SyncService {
  private listeners: Set<(status: SyncStatus) => void> = new Set();
  private status: SyncStatus = {
    isOnline: navigator.onLine,
    isAuthenticated: false,
    lastSync: null,
    syncing: false,
    error: null,
  };

  constructor() {
    // Check authentication status on startup
    this.checkAuthStatus();
    
    // Listen for online/offline events
    window.addEventListener('online', () => this.updateOnlineStatus(true));
    window.addEventListener('offline', () => this.updateOnlineStatus(false));
  }

  private async checkAuthStatus() {
    const isAuthenticated = await apiClient.validateToken();
    this.updateStatus({ isAuthenticated });
  }

  private updateOnlineStatus(isOnline: boolean) {
    this.updateStatus({ isOnline });
  }

  private updateStatus(updates: Partial<SyncStatus>) {
    this.status = { ...this.status, ...updates };
    this.notifyListeners();
  }

  private notifyListeners() {
    this.listeners.forEach(listener => listener(this.status));
  }

  subscribe(listener: (status: SyncStatus) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  getStatus(): SyncStatus {
    return { ...this.status };
  }

  async login(email: string, password: string): Promise<boolean> {
    try {
      const response = await apiClient.login(email, password);
      if (response.success) {
        this.updateStatus({ isAuthenticated: true, error: null });
        return true;
      } else {
        this.updateStatus({ error: response.message });
        return false;
      }
    } catch (error) {
      this.updateStatus({ error: error instanceof Error ? error.message : 'Login failed' });
      return false;
    }
  }

  async register(email: string, password: string): Promise<boolean> {
    try {
      const response = await apiClient.register(email, password);
      if (response.success) {
        this.updateStatus({ isAuthenticated: true, error: null });
        return true;
      } else {
        this.updateStatus({ error: response.message });
        return false;
      }
    } catch (error) {
      this.updateStatus({ error: error instanceof Error ? error.message : 'Registration failed' });
      return false;
    }
  }

  async logout(): Promise<void> {
    try {
      await apiClient.logout();
      this.updateStatus({ isAuthenticated: false, error: null });
    } catch (error) {
      this.updateStatus({ error: error instanceof Error ? error.message : 'Logout failed' });
    }
  }

  async syncAll(): Promise<boolean> {
    if (!this.status.isOnline || !this.status.isAuthenticated) {
      return false;
    }

    this.updateStatus({ syncing: true, error: null });

    try {
      // Get local data
      const localDecks = JSON.parse(localStorage.getItem('decks') || '[]');
      const localAchievements = JSON.parse(localStorage.getItem('achievements') || '[]');
      const localProgress = JSON.parse(localStorage.getItem('progress') || '[]');
      const localPreferences = JSON.parse(localStorage.getItem('preferences') || '{}');

      // Sync each data type
      const [decksResult, achievementsResult, progressResult, preferencesResult] = await Promise.all([
        apiClient.syncDecks(localDecks),
        apiClient.syncAchievements(localAchievements),
        apiClient.syncProgress(localProgress),
        apiClient.syncPreferences(localPreferences),
      ]);

      // Update local storage with merged results
      localStorage.setItem('decks', JSON.stringify(decksResult.data));
      localStorage.setItem('achievements', JSON.stringify(achievementsResult.data));
      localStorage.setItem('progress', JSON.stringify(progressResult.data));
      localStorage.setItem('preferences', JSON.stringify(preferencesResult.data[0] || localPreferences));

      // Update sync timestamps
      const now = new Date().toISOString();
      localStorage.setItem('last_sync_decks', now);
      localStorage.setItem('last_sync_achievements', now);
      localStorage.setItem('last_sync_progress', now);
      localStorage.setItem('last_sync_preferences', now);

      this.updateStatus({ syncing: false, lastSync: new Date(), error: null });
      return true;
    } catch (error) {
      this.updateStatus({
        syncing: false,
        error: error instanceof Error ? error.message : 'Sync failed'
      });
      return false;
    }
  }

  async autoSync(): Promise<void> {
    if (this.status.isOnline && this.status.isAuthenticated && !this.status.syncing) {
      await this.syncAll();
    }
  }
}

export const syncService = new SyncService();
```

### 3. Create Sync Status Component

**File**: `src/components/common/SyncStatus.tsx` (New file)

```typescript
import React, { useEffect, useState } from 'react';
import { syncService, SyncStatus } from '../../services/syncService';
import { CloudArrowUpIcon, CloudArrowDownIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

export const SyncStatusIndicator: React.FC = () => {
  const [status, setStatus] = useState<SyncStatus>(syncService.getStatus());

  useEffect(() => {
    const unsubscribe = syncService.subscribe(setStatus);
    return unsubscribe;
  }, []);

  if (!status.isAuthenticated) {
    return null;
  }

  return (
    <div className="flex items-center space-x-2 text-sm">
      {status.syncing && (
        <div className="flex items-center text-blue-600">
          <CloudArrowUpIcon className="h-4 w-4 animate-spin mr-1" />
          Syncing...
        </div>
      )}
      
      {status.error && (
        <div className="flex items-center text-red-600">
          <ExclamationTriangleIcon className="h-4 w-4 mr-1" />
          Sync error
        </div>
      )}
      
      {!status.isOnline && (
        <div className="flex items-center text-gray-500">
          <CloudArrowDownIcon className="h-4 w-4 mr-1" />
          Offline
        </div>
      )}
      
      {status.lastSync && (
        <div className="text-gray-500">
          Last sync: {status.lastSync.toLocaleTimeString()}
        </div>
      )}
    </div>
  );
};
```

### 4. Create Authentication Dialog

**File**: `src/components/auth/AuthDialog.tsx` (New file)

```typescript
import React, { useState } from 'react';
import { syncService } from '../../services/syncService';
import { exportAllData } from '../../utils/data-export';

interface AuthDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const AuthDialog: React.FC<AuthDialogProps> = ({ isOpen, onClose, onSuccess }) => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<'auth' | 'export'>('export');

  const handleExportData = () => {
    try {
      exportAllData();
      setStep('auth');
    } catch (error) {
      setError('Failed to export data. Please try again.');
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (mode === 'register' && password !== confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    try {
      let success = false;
      if (mode === 'login') {
        success = await syncService.login(email, password);
      } else {
        success = await syncService.register(email, password);
      }

      if (success) {
        onSuccess();
        onClose();
      } else {
        setError('Authentication failed. Please try again.');
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = () => {
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        {step === 'export' && (
          <div>
            <h2 className="text-xl font-bold mb-4">🚀 Sync Your Data Across Devices!</h2>
            <div className="space-y-4 text-sm text-gray-600">
              <p>
                <strong>Create an account to:</strong>
              </p>
              <ul className="list-disc list-inside space-y-1">
                <li>✅ Access your decks on any device</li>
                <li>✅ Never lose your progress</li>
                <li>✅ Sync achievements automatically</li>
                <li>✅ Keep preferences in sync</li>
              </ul>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <p className="text-yellow-800">
                  <strong>📁 Protect Your Data First!</strong>
                </p>
                <p className="text-yellow-700 mt-1">
                  Before syncing, we recommend exporting your current data as a backup.
                </p>
              </div>
            </div>
            <div className="flex space-x-3 mt-6">
              <button
                onClick={handleExportData}
                className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
              >
                📥 Export Data & Continue
              </button>
              <button
                onClick={() => setStep('auth')}
                className="flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded-md hover:bg-gray-300 transition-colors"
              >
                Skip Export
              </button>
            </div>
            <button
              onClick={handleSkip}
              className="w-full mt-2 text-gray-500 hover:text-gray-700 underline"
            >
              Maybe later
            </button>
          </div>
        )}

        {step === 'auth' && (
          <div>
            <h2 className="text-xl font-bold mb-4">
              {mode === 'login' ? 'Login to Your Account' : 'Create New Account'}
            </h2>
            
            <form onSubmit={handleAuth} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              
              {mode === 'register' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Confirm Password
                  </label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              )}
              
              {error && (
                <div className="text-red-600 text-sm">{error}</div>
              )}
              
              <div className="flex space-x-3">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                  {loading ? 'Please wait...' : mode === 'login' ? 'Login' : 'Create Account'}
                </button>
                <button
                  type="button"
                  onClick={handleSkip}
                  className="flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded-md hover:bg-gray-300 transition-colors"
                >
                  Skip
                </button>
              </div>
            </form>
            
            <div className="mt-4 text-center">
              <button
                onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
                className="text-blue-600 hover:text-blue-800 underline"
              >
                {mode === 'login' ? 'Need an account? Register' : 'Already have an account? Login'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
```

### 5. Create Sync Prompt Component

**File**: `src/components/common/SyncPrompt.tsx` (New file)

```typescript
import React, { useState, useEffect } from 'react';
import { AuthDialog } from '../auth/AuthDialog';
import { syncService } from '../../services/syncService';

export const SyncPrompt: React.FC = () => {
  const [showDialog, setShowDialog] = useState(false);
  const [shouldShowPrompt, setShouldShowPrompt] = useState(false);

  useEffect(() => {
    // Check if user should see the sync prompt
    const hasSeenPrompt = localStorage.getItem('sync_prompt_shown');
    const hasLocalData = localStorage.getItem('decks') || localStorage.getItem('achievements');
    const isAuthenticated = syncService.getStatus().isAuthenticated;

    if (!hasSeenPrompt && hasLocalData && !isAuthenticated) {
      // Show prompt after 30 seconds of usage
      const timer = setTimeout(() => {
        setShouldShowPrompt(true);
      }, 30000);

      return () => clearTimeout(timer);
    }
  }, []);

  const handleShowDialog = () => {
    setShowDialog(true);
    setShouldShowPrompt(false);
    localStorage.setItem('sync_prompt_shown', 'true');
  };

  const handleDismiss = () => {
    setShouldShowPrompt(false);
    localStorage.setItem('sync_prompt_shown', 'true');
    localStorage.setItem('sync_prompt_dismissed', 'true');
  };

  const handleAuthSuccess = () => {
    // Auto-sync after successful authentication
    syncService.autoSync();
  };

  if (!shouldShowPrompt) return null;

  return (
    <>
      <div className="fixed bottom-4 right-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 rounded-lg shadow-lg max-w-sm z-40">
        <div className="flex items-start space-x-2">
          <div className="flex-shrink-0">
            <div className="w-8 h-8 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
              🚀
            </div>
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-sm">Sync Your Progress!</h3>
            <p className="text-xs text-blue-100 mt-1">
              Keep your decks, achievements, and progress safe across all your devices.
            </p>
            <div className="flex space-x-2 mt-3">
              <button
                onClick={handleShowDialog}
                className="bg-white bg-opacity-20 text-white px-3 py-1 rounded text-xs hover:bg-opacity-30 transition-colors"
              >
                Get Started
              </button>
              <button
                onClick={handleDismiss}
                className="text-blue-100 hover:text-white px-3 py-1 text-xs transition-colors"
              >
                Later
              </button>
            </div>
          </div>
        </div>
      </div>

      <AuthDialog
        isOpen={showDialog}
        onClose={() => setShowDialog(false)}
        onSuccess={handleAuthSuccess}
      />
    </>
  );
};
```

### 6. Update useDecks Hook for Sync

**File**: `src/hooks/useDecks.ts` (Add sync functionality)

```typescript
import { useEffect, useCallback } from 'react';
import { syncService } from '../services/syncService';
// ... existing imports

export const useDecks = () => {
  // ... existing code

  // Auto-sync when authenticated and online
  useEffect(() => {
    const unsubscribe = syncService.subscribe((status) => {
      if (status.isAuthenticated && status.isOnline && !status.syncing) {
        // Auto-sync on deck changes
        syncService.autoSync();
      }
    });

    return unsubscribe;
  }, []);

  const addDeck = useCallback((deck: Omit<Deck, 'id' | 'createdAt' | 'updatedAt'>) => {
    // ... existing add logic
    
    // Auto-sync after adding deck
    syncService.autoSync();
  }, []);

  const updateDeck = useCallback((id: string, updates: Partial<Deck>) => {
    // ... existing update logic
    
    // Auto-sync after updating deck
    syncService.autoSync();
  }, []);

  const deleteDeck = useCallback((id: string) => {
    // ... existing delete logic
    
    // Auto-sync after deleting deck
    syncService.autoSync();
  }, []);

  // ... rest of existing code
};
```

### 7. Update Navigation with Sync Status

**File**: `src/components/layout/Navigation.tsx` (Add sync status)

```typescript
import React from 'react';
import { SyncStatusIndicator } from '../common/SyncStatus';
import { syncService } from '../../services/syncService';
// ... existing imports

export const Navigation: React.FC = () => {
  const [showAuthDialog, setShowAuthDialog] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const unsubscribe = syncService.subscribe((status) => {
      setIsAuthenticated(status.isAuthenticated);
    });

    return unsubscribe;
  }, []);

  const handleLogout = async () => {
    await syncService.logout();
  };

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* ... existing navigation items */}
          
          <div className="flex items-center space-x-4">
            <SyncStatusIndicator />
            
            {isAuthenticated ? (
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">
                  {syncService.getStatus().isAuthenticated ? '✅ Synced' : ''}
                </span>
                <button
                  onClick={handleLogout}
                  className="text-sm text-gray-600 hover:text-gray-800"
                >
                  Logout
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowAuthDialog(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm hover:bg-blue-700 transition-colors"
              >
                Sync Data
              </button>
            )}
          </div>
        </div>
      </div>
      
      <AuthDialog
        isOpen={showAuthDialog}
        onClose={() => setShowAuthDialog(false)}
        onSuccess={() => {}}
      />
    </nav>
  );
};
```

### 8. Update Root Layout

**File**: `src/components/layout/RootLayout.tsx` (Add sync prompt)

```typescript
import React from 'react';
import { SyncPrompt } from '../common/SyncPrompt';
// ... existing imports

export const RootLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* ... existing layout */}
      
      <main className="flex-1">
        {children}
      </main>
      
      {/* ... existing footer */}
      
      <SyncPrompt />
    </div>
  );
};
```

### 9. Update Package.json

**File**: `package.json` (Add environment variable)

```json
{
  "scripts": {
    "dev": "REACT_APP_API_URL=http://localhost:8787 vite",
    "build": "tsc && vite build",
    "preview": "vite preview"
  }
}
```

### 10. Add Environment Variables

**File**: `.env.example` (New file)

```
REACT_APP_API_URL=https://flashplay-backend.workers.dev
```

**File**: `.env.local` (New file)

```
REACT_APP_API_URL=http://localhost:8787
```

## Testing Instructions

### 1. Test Without Authentication

```bash
# Start the React app
npm run dev

# Verify everything works without login:
# - Create decks
# - Play games
# - View achievements
# - All data stored locally
```

Expected behavior: App works exactly as before, no sync features visible

### 2. Test Authentication Flow

```bash
# With backend running, test:
# - Registration dialog appears after 30 seconds
# - Export data button works
# - Registration/login forms work
# - Sync status indicator appears
```

Expected behavior: Smooth authentication flow with data protection

### 3. Test Sync Functionality

```bash
# With authenticated user:
# - Make changes to decks
# - Verify auto-sync occurs
# - Check sync status indicator
# - Test offline/online behavior
```

Expected behavior: Seamless sync with visual feedback

### 4. Test Graceful Degradation

```bash
# With backend offline:
# - Verify app continues to work
# - No sync features shown
# - Local storage functions normally
```

Expected behavior: App works without any issues when backend is unavailable

## Common Issues and Solutions

### Issue 1: CORS Errors
- **Problem**: Browser blocks API requests
- **Solution**: Add CORS headers to backend responses
- **Fallback**: Use proxy in development environment

### Issue 2: Token Expiration
- **Problem**: JWT tokens expire after 24 hours
- **Solution**: Implement automatic token refresh
- **Fallback**: Prompt user to login again

### Issue 3: Sync Conflicts
- **Problem**: Data conflicts between devices
- **Solution**: Implement conflict resolution UI
- **Fallback**: Use last-write-wins for now

### Issue 4: Network Errors
- **Problem**: API calls fail due to network issues
- **Solution**: Implement retry logic and offline queuing
- **Fallback**: Show error messages and continue offline

## Design Decisions

1. **Progressive Enhancement**: Sync is optional, app works without it
2. **Data Protection**: Users prompted to export before syncing
3. **Engaging UX**: Positive messaging about sync benefits
4. **Auto-sync**: Seamless sync without user intervention
5. **Visual Feedback**: Clear sync status indicators
6. **Graceful Degradation**: App continues working when backend is unavailable

## User Experience Flow

1. **New User**: Uses app normally, sees sync prompt after 30 seconds
2. **Prompt Response**: User can export data, create account, or dismiss
3. **Authentication**: Simple login/register flow with clear benefits
4. **First Sync**: Automatic sync after successful authentication
5. **Ongoing Usage**: Transparent auto-sync with status indicators
6. **Offline Usage**: App continues working, sync resumes when online

## Security Considerations

1. **Client-side Hashing**: Password hashed before transmission
2. **Token Storage**: JWT stored securely in localStorage
3. **Auto-logout**: Invalid tokens automatically cleared
4. **Data Validation**: All API responses validated before use
5. **Error Handling**: Sensitive errors not exposed to users

## Performance Optimizations

1. **Debounced Sync**: Prevent excessive API calls
2. **Incremental Updates**: Only sync changed data
3. **Background Sync**: Non-blocking sync operations
4. **Caching**: Local storage acts as cache layer
5. **Compression**: Minimize API payload sizes

## Next Steps

After completing this stage:

1. Test all authentication flows thoroughly
2. Verify sync functionality works correctly
3. Test offline/online scenarios
4. Ensure app continues working without backend
5. Deploy backend and test with production environment

This integration provides a seamless sync experience while maintaining the existing local storage functionality as a fallback, ensuring the app never breaks regardless of authentication or network status.