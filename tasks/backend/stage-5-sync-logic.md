# Stage 5: Sync Logic and Conflict Resolution

## Overview

This stage implements advanced synchronization logic with intelligent conflict resolution, delta sync capabilities, and real-time update handling. The system handles conflicts gracefully while maintaining data integrity across multiple devices.

## Sync Strategy

1. **Timestamp-Based Merging**: Use `updated_at` timestamps for conflict resolution
2. **Version Control**: Track version numbers for optimistic locking
3. **Delta Sync**: Only sync changed data since last sync
4. **Conflict Detection**: Identify and resolve data conflicts automatically
5. **Merge Strategies**: Different merge strategies for different data types

## Files to Create/Modify

### 1. Create Sync Engine

**File**: `backend/src/sync/mod.rs` (New file)

```rust
pub mod engine;
pub mod conflicts;
pub mod strategies;

pub use engine::*;
pub use conflicts::*;
pub use strategies::*;
```

**File**: `backend/src/sync/engine.rs` (New file)

```rust
use chrono::{DateTime, Utc};
use uuid::Uuid;
use crate::models::*;
use super::conflicts::*;
use super::strategies::*;

pub struct SyncEngine;

impl SyncEngine {
    pub fn new() -> Self {
        Self
    }

    pub fn sync_decks(
        &self,
        local_decks: &[Deck],
        server_decks: &[Deck],
        last_sync: Option<DateTime<Utc>>,
    ) -> SyncResult<Deck> {
        let strategy = DeckMergeStrategy::new();
        self.perform_sync(local_decks, server_decks, last_sync, &strategy)
    }

    pub fn sync_achievements(
        &self,
        local_achievements: &[Achievement],
        server_achievements: &[Achievement],
        last_sync: Option<DateTime<Utc>>,
    ) -> SyncResult<Achievement> {
        let strategy = AchievementMergeStrategy::new();
        self.perform_sync(local_achievements, server_achievements, last_sync, &strategy)
    }

    pub fn sync_progress(
        &self,
        local_progress: &[Progress],
        server_progress: &[Progress],
        last_sync: Option<DateTime<Utc>>,
    ) -> SyncResult<Progress> {
        let strategy = ProgressMergeStrategy::new();
        self.perform_sync(local_progress, server_progress, last_sync, &strategy)
    }

    pub fn sync_starred(
        &self,
        local_starred: &[StarredDeck],
        server_starred: &[StarredDeck],
        last_sync: Option<DateTime<Utc>>,
    ) -> SyncResult<StarredDeck> {
        let strategy = StarredMergeStrategy::new();
        self.perform_sync(local_starred, server_starred, last_sync, &strategy)
    }

    pub fn sync_preferences(
        &self,
        local_preferences: &UserPreferences,
        server_preferences: Option<&UserPreferences>,
        last_sync: Option<DateTime<Utc>>,
    ) -> SyncResult<UserPreferences> {
        let strategy = PreferencesMergeStrategy::new();
        let local_vec = vec![local_preferences.clone()];
        let server_vec = server_preferences.map(|p| vec![p.clone()]).unwrap_or_default();
        self.perform_sync(&local_vec, &server_vec, last_sync, &strategy)
    }

    fn perform_sync<T, S>(
        &self,
        local_items: &[T],
        server_items: &[T],
        last_sync: Option<DateTime<Utc>>,
        strategy: &S,
    ) -> SyncResult<T>
    where
        T: Clone + SyncableItem,
        S: MergeStrategy<T>,
    {
        let mut result = SyncResult {
            merged_items: Vec::new(),
            conflicts: Vec::new(),
            stats: SyncStats::default(),
        };

        // Find items that have changed since last sync
        let changed_local = if let Some(last_sync) = last_sync {
            local_items.iter().filter(|item| item.updated_at() > last_sync).collect()
        } else {
            local_items.iter().collect()
        };

        let changed_server = if let Some(last_sync) = last_sync {
            server_items.iter().filter(|item| item.updated_at() > last_sync).collect()
        } else {
            server_items.iter().collect()
        };

        // Start with server items as base
        let mut merged = server_items.to_vec();

        // Process local changes
        for local_item in changed_local {
            match self.find_matching_item(&merged, local_item) {
                Some(server_index) => {
                    // Potential conflict - both local and server have changes
                    let server_item = &merged[server_index];
                    
                    match strategy.resolve_conflict(local_item, server_item, last_sync) {
                        ConflictResolution::UseLocal => {
                            merged[server_index] = local_item.clone();
                            result.stats.local_wins += 1;
                        }
                        ConflictResolution::UseServer => {
                            // Keep server version
                            result.stats.server_wins += 1;
                        }
                        ConflictResolution::Merge => {
                            if let Some(merged_item) = strategy.merge_items(local_item, server_item) {
                                merged[server_index] = merged_item;
                                result.stats.merged += 1;
                            } else {
                                // Fallback to local if merge fails
                                merged[server_index] = local_item.clone();
                                result.stats.local_wins += 1;
                            }
                        }
                    }

                    // Record conflict for user review if needed
                    if strategy.should_record_conflict(local_item, server_item) {
                        result.conflicts.push(SyncConflict {
                            item_id: local_item.id(),
                            local_item: local_item.clone(),
                            server_item: server_item.clone(),
                            resolution: strategy.resolve_conflict(local_item, server_item, last_sync),
                            resolved_at: Utc::now(),
                        });
                    }
                }
                None => {
                    // New local item
                    merged.push(local_item.clone());
                    result.stats.added += 1;
                }
            }
        }

        // Handle deletions (items that exist on server but not in local)
        if strategy.supports_deletions() {
            merged.retain(|server_item| {
                local_items.iter().any(|local_item| local_item.id() == server_item.id())
            });
        }

        result.merged_items = merged;
        result.stats.total_items = result.merged_items.len();
        result
    }

    fn find_matching_item<T: SyncableItem>(&self, items: &[T], target: &T) -> Option<usize> {
        items.iter().position(|item| item.id() == target.id())
    }
}

#[derive(Debug, Clone)]
pub struct SyncResult<T> {
    pub merged_items: Vec<T>,
    pub conflicts: Vec<SyncConflict<T>>,
    pub stats: SyncStats,
}

#[derive(Debug, Clone, Default)]
pub struct SyncStats {
    pub total_items: usize,
    pub added: usize,
    pub updated: usize,
    pub deleted: usize,
    pub conflicts: usize,
    pub local_wins: usize,
    pub server_wins: usize,
    pub merged: usize,
}

pub trait SyncableItem {
    fn id(&self) -> Uuid;
    fn updated_at(&self) -> DateTime<Utc>;
    fn version(&self) -> Option<i64> { None }
}

// Implement SyncableItem for all data types
impl SyncableItem for Deck {
    fn id(&self) -> Uuid { self.id }
    fn updated_at(&self) -> DateTime<Utc> { self.updated_at }
    fn version(&self) -> Option<i64> { Some(self.version) }
}

impl SyncableItem for Achievement {
    fn id(&self) -> Uuid { self.id }
    fn updated_at(&self) -> DateTime<Utc> { self.earned_at }
}

impl SyncableItem for Progress {
    fn id(&self) -> Uuid { self.id }
    fn updated_at(&self) -> DateTime<Utc> { self.last_studied }
    fn version(&self) -> Option<i64> { Some(self.version) }
}

impl SyncableItem for StarredDeck {
    fn id(&self) -> Uuid { self.id }
    fn updated_at(&self) -> DateTime<Utc> { self.starred_at }
}

impl SyncableItem for UserPreferences {
    fn id(&self) -> Uuid { self.user_id }
    fn updated_at(&self) -> DateTime<Utc> { self.updated_at }
    fn version(&self) -> Option<i64> { Some(self.version) }
}
```

### 2. Create Conflict Resolution System

**File**: `backend/src/sync/conflicts.rs` (New file)

```rust
use chrono::{DateTime, Utc};
use uuid::Uuid;
use serde::{Serialize, Deserialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SyncConflict<T> {
    pub item_id: Uuid,
    pub local_item: T,
    pub server_item: T,
    pub resolution: ConflictResolution,
    pub resolved_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum ConflictResolution {
    UseLocal,
    UseServer,
    Merge,
}

pub trait MergeStrategy<T> {
    fn resolve_conflict(
        &self,
        local_item: &T,
        server_item: &T,
        last_sync: Option<DateTime<Utc>>,
    ) -> ConflictResolution;

    fn merge_items(&self, local_item: &T, server_item: &T) -> Option<T>;
    
    fn should_record_conflict(&self, local_item: &T, server_item: &T) -> bool;
    
    fn supports_deletions(&self) -> bool { true }
}

pub struct ConflictAnalyzer;

impl ConflictAnalyzer {
    pub fn analyze_timestamp_conflict<T>(
        local_item: &T,
        server_item: &T,
        _last_sync: Option<DateTime<Utc>>,
    ) -> ConflictResolution
    where
        T: crate::sync::engine::SyncableItem,
    {
        if local_item.updated_at() > server_item.updated_at() {
            ConflictResolution::UseLocal
        } else if server_item.updated_at() > local_item.updated_at() {
            ConflictResolution::UseServer
        } else {
            // Same timestamp - prefer local (user's device wins)
            ConflictResolution::UseLocal
        }
    }

    pub fn analyze_version_conflict<T>(
        local_item: &T,
        server_item: &T,
        last_sync: Option<DateTime<Utc>>,
    ) -> ConflictResolution
    where
        T: crate::sync::engine::SyncableItem,
    {
        match (local_item.version(), server_item.version()) {
            (Some(local_version), Some(server_version)) => {
                if local_version > server_version {
                    ConflictResolution::UseLocal
                } else if server_version > local_version {
                    ConflictResolution::UseServer
                } else {
                    // Same version - fall back to timestamp
                    Self::analyze_timestamp_conflict(local_item, server_item, last_sync)
                }
            }
            _ => Self::analyze_timestamp_conflict(local_item, server_item, last_sync),
        }
    }
}
```

### 3. Create Merge Strategies

**File**: `backend/src/sync/strategies.rs` (New file)

```rust
use chrono::{DateTime, Utc};
use crate::models::*;
use super::conflicts::*;
use super::engine::SyncableItem;

pub struct DeckMergeStrategy;

impl DeckMergeStrategy {
    pub fn new() -> Self { Self }
}

impl MergeStrategy<Deck> for DeckMergeStrategy {
    fn resolve_conflict(
        &self,
        local_item: &Deck,
        server_item: &Deck,
        last_sync: Option<DateTime<Utc>>,
    ) -> ConflictResolution {
        // For decks, use version-based conflict resolution
        ConflictAnalyzer::analyze_version_conflict(local_item, server_item, last_sync)
    }

    fn merge_items(&self, local_item: &Deck, server_item: &Deck) -> Option<Deck> {
        // Intelligent merge: combine the best of both
        let mut merged = local_item.clone();
        
        // Use the more recent content
        if server_item.updated_at > local_item.updated_at {
            merged.content = server_item.content.clone();
            merged.title = server_item.title.clone();
            merged.description = server_item.description.clone();
        }
        
        // Increment version
        merged.version = std::cmp::max(local_item.version, server_item.version) + 1;
        merged.updated_at = Utc::now();
        
        Some(merged)
    }

    fn should_record_conflict(&self, local_item: &Deck, server_item: &Deck) -> bool {
        // Record conflict if both items have substantial changes
        local_item.content != server_item.content || local_item.title != server_item.title
    }
}

pub struct AchievementMergeStrategy;

impl AchievementMergeStrategy {
    pub fn new() -> Self { Self }
}

impl MergeStrategy<Achievement> for AchievementMergeStrategy {
    fn resolve_conflict(
        &self,
        local_item: &Achievement,
        server_item: &Achievement,
        _last_sync: Option<DateTime<Utc>>,
    ) -> ConflictResolution {
        // Achievements are immutable once created - keep the earlier one
        if local_item.earned_at < server_item.earned_at {
            ConflictResolution::UseLocal
        } else {
            ConflictResolution::UseServer
        }
    }

    fn merge_items(&self, local_item: &Achievement, _server_item: &Achievement) -> Option<Achievement> {
        // Achievements can't be merged - they're immutable
        Some(local_item.clone())
    }

    fn should_record_conflict(&self, _local_item: &Achievement, _server_item: &Achievement) -> bool {
        // Don't record conflicts for achievements - they're append-only
        false
    }

    fn supports_deletions(&self) -> bool {
        false // Achievements are never deleted
    }
}

pub struct ProgressMergeStrategy;

impl ProgressMergeStrategy {
    pub fn new() -> Self { Self }
}

impl MergeStrategy<Progress> for ProgressMergeStrategy {
    fn resolve_conflict(
        &self,
        _local_item: &Progress,
        _server_item: &Progress,
        _last_sync: Option<DateTime<Utc>>,
    ) -> ConflictResolution {
        // Always merge progress - we want to combine the best stats
        ConflictResolution::Merge
    }

    fn merge_items(&self, local_item: &Progress, server_item: &Progress) -> Option<Progress> {
        let mut merged = local_item.clone();
        
        // Take the maximum values for progress stats
        merged.cards_studied = std::cmp::max(local_item.cards_studied, server_item.cards_studied);
        merged.cards_mastered = std::cmp::max(local_item.cards_mastered, server_item.cards_mastered);
        merged.total_cards = std::cmp::max(local_item.total_cards, server_item.total_cards);
        merged.streak_days = std::cmp::max(local_item.streak_days, server_item.streak_days);
        
        // Add time spent from both devices
        merged.total_time_spent = local_item.total_time_spent + server_item.total_time_spent;
        
        // Use the most recent study time
        merged.last_studied = std::cmp::max(local_item.last_studied, server_item.last_studied);
        
        // Increment version
        merged.version = std::cmp::max(local_item.version, server_item.version) + 1;
        
        Some(merged)
    }

    fn should_record_conflict(&self, _local_item: &Progress, _server_item: &Progress) -> bool {
        // Progress merging is automatic, no need to record conflicts
        false
    }
}

pub struct StarredMergeStrategy;

impl StarredMergeStrategy {
    pub fn new() -> Self { Self }
}

impl MergeStrategy<StarredDeck> for StarredMergeStrategy {
    fn resolve_conflict(
        &self,
        local_item: &StarredDeck,
        server_item: &StarredDeck,
        last_sync: Option<DateTime<Utc>>,
    ) -> ConflictResolution {
        ConflictAnalyzer::analyze_timestamp_conflict(local_item, server_item, last_sync)
    }

    fn merge_items(&self, local_item: &StarredDeck, _server_item: &StarredDeck) -> Option<StarredDeck> {
        // Starred items are simple - just use the local version
        Some(local_item.clone())
    }

    fn should_record_conflict(&self, _local_item: &StarredDeck, _server_item: &StarredDeck) -> bool {
        false // Starred items are simple boolean states
    }

    fn supports_deletions(&self) -> bool {
        true // Users can unstar items
    }
}

pub struct PreferencesMergeStrategy;

impl PreferencesMergeStrategy {
    pub fn new() -> Self { Self }
}

impl MergeStrategy<UserPreferences> for PreferencesMergeStrategy {
    fn resolve_conflict(
        &self,
        local_item: &UserPreferences,
        server_item: &UserPreferences,
        last_sync: Option<DateTime<Utc>>,
    ) -> ConflictResolution {
        ConflictAnalyzer::analyze_version_conflict(local_item, server_item, last_sync)
    }

    fn merge_items(&self, local_item: &UserPreferences, server_item: &UserPreferences) -> Option<UserPreferences> {
        // Intelligent preferences merge
        let mut merged = local_item.clone();
        
        // Use the most recent setting for each preference
        if server_item.updated_at > local_item.updated_at {
            // Server is more recent - use server preferences but keep local language if it was changed more recently
            merged = server_item.clone();
            
            // Special handling for language - often set per device
            if local_item.updated_at > server_item.updated_at.checked_sub_signed(chrono::Duration::hours(1)).unwrap_or(server_item.updated_at) {
                merged.language = local_item.language.clone();
            }
        }
        
        merged.version = std::cmp::max(local_item.version, server_item.version) + 1;
        merged.updated_at = Utc::now();
        
        Some(merged)
    }

    fn should_record_conflict(&self, local_item: &UserPreferences, server_item: &UserPreferences) -> bool {
        // Record conflict if there are significant differences
        local_item.theme != server_item.theme || 
        local_item.language != server_item.language ||
        local_item.sound_enabled != server_item.sound_enabled
    }

    fn supports_deletions(&self) -> bool {
        false // Preferences are never deleted, only updated
    }
}
```

### 4. Update Sync Handlers to Use New Engine

**File**: `backend/src/handlers/sync.rs` (Update existing functions)

```rust
use crate::sync::SyncEngine;

// Update the existing sync functions to use the new engine
pub async fn sync_decks(mut req: Request, ctx: RouteContext<()>) -> Result<Response> {
    let user = match authenticate_request(&req, &ctx.env).await {
        Ok(user) => user,
        Err(_) => return create_error_response("unauthorized", "Authentication required", 401),
    };

    let sync_request: SyncRequest<Deck> = match req.json().await {
        Ok(req) => req,
        Err(_) => return create_error_response("invalid_request", "Invalid JSON in request body", 400),
    };

    let user_data_ns = ctx.env.durable_object("USER_DATA")?;
    let user_stub = user_data_ns.id_from_name(&user.email)?.get_stub()?;

    // Get current server data
    let get_req = Request::new_with_init(
        "http://user-data/decks",
        RequestInit::new().with_method(Method::Get),
    )?;

    let response = user_stub.fetch_with_request(get_req).await?;
    let server_decks: Vec<Deck> = if response.status_code() == 200 {
        response.json().await?
    } else {
        Vec::new()
    };

    // Use the new sync engine
    let sync_engine = SyncEngine::new();
    let sync_result = sync_engine.sync_decks(&sync_request.data, &server_decks, sync_request.last_sync);

    // Save merged data back to server
    let save_req = Request::new_with_init(
        "http://user-data/decks",
        RequestInit::new()
            .with_method(Method::Post)
            .with_body(Some(serde_json::to_string(&sync_result.merged_items)?.into())),
    )?;

    let save_response = user_stub.fetch_with_request(save_req).await?;
    if save_response.status_code() != 200 {
        return create_error_response("sync_failed", "Failed to sync decks", 500);
    }

    // Convert to API response format
    let api_response = SyncResponse {
        data: sync_result.merged_items,
        conflicts: sync_result.conflicts.into_iter().map(|c| SyncConflict {
            local: c.local_item,
            remote: c.server_item,
            resolution: c.resolution,
        }).collect(),
        last_sync: Utc::now(),
    };

    Response::from_json(&api_response)
}

// Similar updates for all other sync functions...
```

### 5. Add Delta Sync Capability

**File**: `backend/src/sync/delta.rs` (New file)

```rust
use chrono::{DateTime, Utc};
use crate::models::*;
use super::engine::SyncableItem;

pub struct DeltaSync;

impl DeltaSync {
    pub fn get_changes_since<T: SyncableItem>(
        items: &[T],
        since: DateTime<Utc>,
    ) -> Vec<&T> {
        items.iter()
            .filter(|item| item.updated_at() > since)
            .collect()
    }

    pub fn create_delta_patch<T: SyncableItem + Clone>(
        local_items: &[T],
        server_items: &[T],
        last_sync: DateTime<Utc>,
    ) -> DeltaPatch<T> {
        let local_changes = Self::get_changes_since(local_items, last_sync);
        let server_changes = Self::get_changes_since(server_items, last_sync);

        DeltaPatch {
            local_changes: local_changes.into_iter().cloned().collect(),
            server_changes: server_changes.into_iter().cloned().collect(),
            last_sync,
            patch_created_at: Utc::now(),
        }
    }

    pub fn apply_delta_patch<T: SyncableItem + Clone>(
        base_items: &mut Vec<T>,
        patch: &DeltaPatch<T>,
    ) {
        for change in &patch.local_changes {
            if let Some(index) = base_items.iter().position(|item| item.id() == change.id()) {
                base_items[index] = change.clone();
            } else {
                base_items.push(change.clone());
            }
        }
    }
}

#[derive(Debug, Clone)]
pub struct DeltaPatch<T> {
    pub local_changes: Vec<T>,
    pub server_changes: Vec<T>,
    pub last_sync: DateTime<Utc>,
    pub patch_created_at: DateTime<Utc>,
}
```

### 6. Add Real-time Sync Triggers

**File**: `backend/src/sync/triggers.rs` (New file)

```rust
use chrono::Utc;
use worker::*;

pub struct SyncTrigger;

impl SyncTrigger {
    pub async fn trigger_sync_for_user(env: &Env, user_email: &str, data_type: &str) -> Result<()> {
        // In a real-world scenario, this could trigger WebSocket notifications
        // or queue background sync jobs
        
        console_log!("Sync triggered for user: {} data_type: {}", user_email, data_type);
        
        // Could implement:
        // 1. WebSocket notifications to other connected devices
        // 2. Background job scheduling for offline devices
        // 3. Push notifications for mobile apps
        
        Ok(())
    }

    pub async fn schedule_periodic_sync(env: &Env, user_email: &str) -> Result<()> {
        // Schedule a periodic sync using Cloudflare Cron Triggers
        // This would be configured in wrangler.toml
        
        console_log!("Periodic sync scheduled for user: {}", user_email);
        Ok(())
    }
}
```

### 7. Update Models for Enhanced Sync

**File**: `backend/src/models.rs` (Add enhanced sync models)

```rust
// Add these additional models to the existing file

#[derive(Debug, Serialize, Deserialize)]
pub struct SyncMetrics {
    pub total_syncs: i64,
    pub successful_syncs: i64,
    pub failed_syncs: i64,
    pub conflicts_resolved: i64,
    pub last_sync_duration_ms: i64,
    pub avg_sync_duration_ms: f64,
    pub data_transferred_bytes: i64,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct SyncHealth {
    pub status: SyncHealthStatus,
    pub last_successful_sync: Option<DateTime<Utc>>,
    pub pending_changes: i32,
    pub conflict_count: i32,
    pub error_message: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub enum SyncHealthStatus {
    Healthy,
    Warning,
    Error,
    Offline,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct BatchSyncRequest {
    pub operations: Vec<SyncOperation>,
    pub transaction_id: String,
    pub client_timestamp: DateTime<Utc>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct SyncOperation {
    pub operation_type: SyncOperationType,
    pub data_type: String,
    pub item_id: uuid::Uuid,
    pub data: serde_json::Value,
    pub version: Option<i64>,
}

#[derive(Debug, Serialize, Deserialize)]
pub enum SyncOperationType {
    Create,
    Update,
    Delete,
}
```

## Testing Instructions

### 1. Test Sync Engine

**File**: `backend/src/sync/tests.rs` (New file)

```rust
#[cfg(test)]
mod tests {
    use super::*;
    use chrono::Utc;
    use uuid::Uuid;

    #[test]
    fn test_deck_conflict_resolution() {
        let sync_engine = SyncEngine::new();
        let now = Utc::now();
        
        let local_deck = Deck {
            id: Uuid::new_v4(),
            user_id: Uuid::new_v4(),
            title: "Local Title".to_string(),
            description: None,
            content: "Local content".to_string(),
            created_at: now,
            updated_at: now,
            version: 1,
        };

        let mut server_deck = local_deck.clone();
        server_deck.title = "Server Title".to_string();
        server_deck.updated_at = now + chrono::Duration::minutes(1);
        server_deck.version = 2;

        let result = sync_engine.sync_decks(
            &[local_deck],
            &[server_deck.clone()],
            Some(now - chrono::Duration::hours(1))
        );

        assert_eq!(result.merged_items.len(), 1);
        assert_eq!(result.merged_items[0].title, "Server Title");
    }

    #[test]
    fn test_progress_merging() {
        let sync_engine = SyncEngine::new();
        let now = Utc::now();
        
        let local_progress = Progress {
            id: Uuid::new_v4(),
            user_id: Uuid::new_v4(),
            deck_id: Uuid::new_v4(),
            cards_studied: 10,
            cards_mastered: 5,
            total_cards: 20,
            last_studied: now,
            streak_days: 3,
            total_time_spent: 300,
            version: 1,
        };

        let mut server_progress = local_progress.clone();
        server_progress.cards_studied = 8;
        server_progress.cards_mastered = 7;
        server_progress.total_time_spent = 250;
        server_progress.streak_days = 5;

        let result = sync_engine.sync_progress(
            &[local_progress],
            &[server_progress],
            Some(now - chrono::Duration::hours(1))
        );

        assert_eq!(result.merged_items.len(), 1);
        let merged = &result.merged_items[0];
        
        // Should take maximum values
        assert_eq!(merged.cards_studied, 10);
        assert_eq!(merged.cards_mastered, 7);
        assert_eq!(merged.streak_days, 5);
        assert_eq!(merged.total_time_spent, 550); // Added together
    }
}
```

### 2. Run Sync Tests

```bash
cd backend
cargo test sync::tests
```

### 3. Test Conflict Resolution

```bash
# Create test data with conflicts
curl -X POST http://localhost:8787/sync/decks \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "data": [{"id": "test", "title": "Local Title", "content": "Local content", "updated_at": "2024-01-01T10:00:00Z", "version": 1}],
    "last_sync": "2024-01-01T09:00:00Z"
  }'
```

## Common Issues and Solutions

### Issue 1: Merge Conflicts
- **Problem**: Complex conflicts between local and server data
- **Solution**: Implement intelligent merge strategies per data type
- **Fallback**: Use last-write-wins with user notification

### Issue 2: Performance with Large Datasets
- **Problem**: Sync takes too long with many items
- **Solution**: Implement delta sync and pagination
- **Fallback**: Limit sync to recent changes only

### Issue 3: Network Failures During Sync
- **Problem**: Partial sync states due to network issues
- **Solution**: Implement transactional sync with rollback
- **Fallback**: Queue failed operations for retry

### Issue 4: Clock Skew Between Devices
- **Problem**: Timestamp-based conflicts fail with incorrect clocks
- **Solution**: Use server timestamps and version numbers
- **Fallback**: Implement vector clocks for better ordering

## Design Decisions

1. **Merge Strategies**: Different strategies for different data types based on their characteristics
2. **Conflict Resolution**: Automatic resolution with manual override capability
3. **Version Control**: Optimistic locking with version numbers
4. **Delta Sync**: Only sync changed data for better performance
5. **Real-time Triggers**: Support for real-time sync notifications

## Performance Optimizations

1. **Incremental Sync**: Only sync changes since last sync
2. **Batch Operations**: Group multiple changes into single requests
3. **Compression**: Compress large sync payloads
4. **Caching**: Cache merge results to avoid recomputation
5. **Parallel Processing**: Process different data types in parallel

## Advanced Features

1. **Conflict Visualization**: Show users what conflicts occurred
2. **Manual Resolution**: Allow users to manually resolve conflicts
3. **Sync History**: Track sync operations for debugging
4. **Rollback Support**: Ability to undo problematic syncs
5. **Metrics Collection**: Monitor sync performance and health

## Next Steps

After completing this stage:

1. Run `cargo test` to verify all sync logic works correctly
2. Test conflict resolution with real data scenarios
3. Verify delta sync performance improvements
4. Proceed to Stage 6: Testing and Deployment

This stage provides a robust synchronization system that can handle complex scenarios while maintaining data integrity and providing good user experience.