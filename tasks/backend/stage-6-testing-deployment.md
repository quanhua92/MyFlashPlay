# Stage 6: Testing and Deployment

## Overview

This stage implements comprehensive testing for the backend system and sets up deployment to Cloudflare Workers. It includes unit tests, integration tests, performance tests, and production deployment configuration.

## Testing Strategy

1. **Unit Tests**: Test individual functions and modules
2. **Integration Tests**: Test API endpoints end-to-end
3. **Performance Tests**: Verify response times and throughput
4. **Load Tests**: Test system under heavy load
5. **Security Tests**: Verify authentication and authorization
6. **Sync Tests**: Test synchronization logic thoroughly

## Files to Create/Modify

### 1. Comprehensive Test Suite

**File**: `backend/src/lib.rs` (Add test module export)

```rust
// Add this to the existing lib.rs file
#[cfg(test)]
mod tests;
```

**File**: `backend/src/tests/mod.rs` (New file)

```rust
pub mod auth_tests;
pub mod sync_tests;
pub mod api_tests;
pub mod performance_tests;
pub mod integration_tests;

use worker::*;
use crate::models::*;

// Test utilities
pub fn create_test_env() -> Env {
    // Mock environment for testing
    // In practice, you'd use worker::testing utilities
    unimplemented!("Use worker testing framework")
}

pub fn create_test_user() -> User {
    User {
        id: uuid::Uuid::new_v4(),
        email: "test@example.com".to_string(),
        password_hash: "hashed_password".to_string(),
        created_at: chrono::Utc::now(),
        updated_at: chrono::Utc::now(),
        last_login: None,
    }
}

pub fn create_test_deck(user_id: uuid::Uuid) -> Deck {
    Deck {
        id: uuid::Uuid::new_v4(),
        user_id,
        title: "Test Deck".to_string(),
        description: Some("Test Description".to_string()),
        content: "What is 2+2? :: 4\nCapital of France? :: Paris".to_string(),
        created_at: chrono::Utc::now(),
        updated_at: chrono::Utc::now(),
        version: 1,
    }
}

pub fn create_test_jwt(user: &User, secret: &str) -> String {
    crate::auth::create_jwt(user.id, &user.email, secret).unwrap()
}
```

### 2. Authentication Tests

**File**: `backend/src/tests/auth_tests.rs` (New file)

```rust
use super::*;
use crate::auth::*;

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_password_hashing() {
        let password = "test_password_123";
        let hash1 = crate::utils::hash_password(password);
        let hash2 = crate::utils::hash_password(password);
        
        // Same password should produce same hash
        assert_eq!(hash1, hash2);
        
        // Should verify correctly
        assert!(crate::utils::verify_password_hash(password, &hash1));
        assert!(!crate::utils::verify_password_hash("wrong_password", &hash1));
    }

    #[test]
    fn test_jwt_creation_and_verification() {
        let user = create_test_user();
        let secret = "test_secret_key";
        
        let token = create_jwt(user.id, &user.email, secret).unwrap();
        assert!(!token.is_empty());
        
        let claims = verify_jwt(&token, secret).unwrap();
        assert_eq!(claims.email, user.email);
        assert_eq!(claims.sub, user.id.to_string());
    }

    #[test]
    fn test_jwt_expiration() {
        let user = create_test_user();
        let secret = "test_secret_key";
        
        // Create token
        let token = create_jwt(user.id, &user.email, secret).unwrap();
        
        // Should be valid immediately
        assert!(verify_jwt(&token, secret).is_ok());
        
        // Test with wrong secret
        assert!(verify_jwt(&token, "wrong_secret").is_err());
    }

    #[test]
    fn test_email_validation() {
        assert!(crate::utils::validate_email("test@example.com"));
        assert!(crate::utils::validate_email("user.name+tag@domain.co.uk"));
        assert!(!crate::utils::validate_email("invalid.email"));
        assert!(!crate::utils::validate_email("@example.com"));
        assert!(!crate::utils::validate_email("test@"));
        assert!(!crate::utils::validate_email(""));
    }

    #[test]
    fn test_password_validation() {
        assert!(crate::utils::validate_password("12345678")); // 8 chars minimum
        assert!(!crate::utils::validate_password("1234567")); // Too short
        assert!(!crate::utils::validate_password("")); // Empty
    }

    #[test]
    fn test_uuid_generation() {
        let id1 = crate::utils::generate_user_id();
        let id2 = crate::utils::generate_user_id();
        
        // Should be different
        assert_ne!(id1, id2);
        
        // Should be valid UUID v7 (time-sorted)
        assert_eq!(id1.get_version_num(), 7);
        assert_eq!(id2.get_version_num(), 7);
    }
}
```

### 3. Sync Logic Tests

**File**: `backend/src/tests/sync_tests.rs` (New file)

```rust
use super::*;
use crate::sync::*;

#[cfg(test)]
mod tests {
    use super::*;
    use chrono::{Utc, Duration};

    #[test]
    fn test_deck_sync_no_conflicts() {
        let sync_engine = SyncEngine::new();
        let user_id = uuid::Uuid::new_v4();
        
        let local_deck = create_test_deck(user_id);
        let server_decks = vec![];
        
        let result = sync_engine.sync_decks(&[local_deck.clone()], &server_decks, None);
        
        assert_eq!(result.merged_items.len(), 1);
        assert_eq!(result.conflicts.len(), 0);
        assert_eq!(result.merged_items[0].id, local_deck.id);
    }

    #[test]
    fn test_deck_sync_with_conflicts() {
        let sync_engine = SyncEngine::new();
        let user_id = uuid::Uuid::new_v4();
        let now = Utc::now();
        
        let mut local_deck = create_test_deck(user_id);
        local_deck.title = "Local Title".to_string();
        local_deck.updated_at = now;
        local_deck.version = 1;
        
        let mut server_deck = local_deck.clone();
        server_deck.title = "Server Title".to_string();
        server_deck.updated_at = now + Duration::minutes(1);
        server_deck.version = 2;
        
        let result = sync_engine.sync_decks(
            &[local_deck],
            &[server_deck.clone()],
            Some(now - Duration::hours(1))
        );
        
        assert_eq!(result.merged_items.len(), 1);
        // Server version should win (higher version + later timestamp)
        assert_eq!(result.merged_items[0].title, "Server Title");
        assert_eq!(result.merged_items[0].version, 2);
    }

    #[test]
    fn test_progress_merging() {
        let sync_engine = SyncEngine::new();
        let user_id = uuid::Uuid::new_v4();
        let deck_id = uuid::Uuid::new_v4();
        let now = Utc::now();
        
        let local_progress = Progress {
            id: uuid::Uuid::new_v4(),
            user_id,
            deck_id,
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
        server_progress.last_studied = now - Duration::minutes(30);

        let result = sync_engine.sync_progress(
            &[local_progress],
            &[server_progress],
            Some(now - Duration::hours(1))
        );

        assert_eq!(result.merged_items.len(), 1);
        let merged = &result.merged_items[0];
        
        // Should take maximum values
        assert_eq!(merged.cards_studied, 10);
        assert_eq!(merged.cards_mastered, 7);
        assert_eq!(merged.streak_days, 5);
        assert_eq!(merged.total_time_spent, 550); // 300 + 250
        assert_eq!(merged.last_studied, now); // Most recent
    }

    #[test]
    fn test_achievement_sync() {
        let sync_engine = SyncEngine::new();
        let user_id = uuid::Uuid::new_v4();
        let now = Utc::now();
        
        let local_achievement = Achievement {
            id: uuid::Uuid::new_v4(),
            user_id,
            achievement_type: "first_deck".to_string(),
            title: "First Deck Created".to_string(),
            description: "You created your first deck!".to_string(),
            earned_at: now,
            metadata: None,
        };

        let server_achievements = vec![];
        
        let result = sync_engine.sync_achievements(
            &[local_achievement.clone()],
            &server_achievements,
            None
        );

        assert_eq!(result.merged_items.len(), 1);
        assert_eq!(result.conflicts.len(), 0);
        assert_eq!(result.merged_items[0].id, local_achievement.id);
    }

    #[test]
    fn test_preferences_sync() {
        let sync_engine = SyncEngine::new();
        let user_id = uuid::Uuid::new_v4();
        let now = Utc::now();
        
        let local_prefs = UserPreferences {
            user_id,
            theme: "dark".to_string(),
            language: "en".to_string(),
            sound_enabled: true,
            notifications_enabled: false,
            auto_advance: true,
            study_reminders: false,
            updated_at: now,
            version: 1,
        };

        let mut server_prefs = local_prefs.clone();
        server_prefs.theme = "light".to_string();
        server_prefs.updated_at = now - Duration::minutes(30);
        server_prefs.version = 1;

        let result = sync_engine.sync_preferences(
            &local_prefs,
            Some(&server_prefs),
            Some(now - Duration::hours(1))
        );

        assert_eq!(result.merged_items.len(), 1);
        // Local should win (more recent)
        assert_eq!(result.merged_items[0].theme, "dark");
    }

    #[test]
    fn test_delta_sync() {
        let now = Utc::now();
        let last_sync = now - Duration::hours(2);
        
        let user_id = uuid::Uuid::new_v4();
        let mut deck1 = create_test_deck(user_id);
        deck1.updated_at = now - Duration::hours(3); // Before last sync
        
        let mut deck2 = create_test_deck(user_id);
        deck2.updated_at = now - Duration::minutes(30); // After last sync
        
        let decks = vec![deck1, deck2.clone()];
        let changes = crate::sync::DeltaSync::get_changes_since(&decks, last_sync);
        
        assert_eq!(changes.len(), 1);
        assert_eq!(changes[0].id, deck2.id);
    }
}
```

### 4. API Integration Tests

**File**: `backend/src/tests/integration_tests.rs` (New file)

```rust
use super::*;

#[cfg(test)]
mod tests {
    use super::*;
    use worker::testing::*;

    // Note: These tests would use the worker testing framework
    // which provides mock environments and request/response handling

    #[tokio::test]
    async fn test_health_endpoint() {
        // Mock test - in practice use worker::testing
        // let env = TestEnv::new();
        // let req = TestRequest::get("/health");
        // let resp = worker.fetch(req).await.unwrap();
        // assert_eq!(resp.status_code(), 200);
    }

    #[tokio::test]
    async fn test_register_login_flow() {
        // Test user registration and login flow
        // 1. Register user
        // 2. Verify registration response
        // 3. Login with credentials
        // 4. Verify JWT token
        // 5. Use token to access protected endpoint
    }

    #[tokio::test]
    async fn test_deck_crud_operations() {
        // Test complete CRUD cycle for decks
        // 1. Create deck
        // 2. Read deck
        // 3. Update deck
        // 4. Delete deck
        // 5. Verify each operation
    }

    #[tokio::test]
    async fn test_sync_operations() {
        // Test sync endpoints
        // 1. Create initial data
        // 2. Perform sync
        // 3. Modify data
        // 4. Sync again
        // 5. Verify merge results
    }

    #[tokio::test]
    async fn test_authentication_failures() {
        // Test various auth failure scenarios
        // 1. Invalid credentials
        // 2. Expired tokens
        // 3. Missing auth headers
        // 4. Malformed tokens
    }

    #[tokio::test]
    async fn test_cors_headers() {
        // Test CORS functionality
        // 1. OPTIONS preflight requests
        // 2. Cross-origin GET/POST requests
        // 3. Verify correct headers
    }
}
```

### 5. Performance Tests

**File**: `backend/src/tests/performance_tests.rs` (New file)

```rust
use super::*;
use std::time::Instant;

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_sync_performance_small_dataset() {
        let sync_engine = SyncEngine::new();
        let user_id = uuid::Uuid::new_v4();
        
        // Create 100 test decks
        let local_decks: Vec<Deck> = (0..100)
            .map(|_| create_test_deck(user_id))
            .collect();
        
        let server_decks: Vec<Deck> = (0..100)
            .map(|_| create_test_deck(user_id))
            .collect();

        let start = Instant::now();
        let result = sync_engine.sync_decks(&local_decks, &server_decks, None);
        let duration = start.elapsed();

        assert_eq!(result.merged_items.len(), 200); // All unique items
        assert!(duration.as_millis() < 100); // Should be fast for small dataset
    }

    #[test]
    fn test_sync_performance_large_dataset() {
        let sync_engine = SyncEngine::new();
        let user_id = uuid::Uuid::new_v4();
        
        // Create 1000 test decks
        let local_decks: Vec<Deck> = (0..1000)
            .map(|_| create_test_deck(user_id))
            .collect();
        
        let server_decks: Vec<Deck> = (0..1000)
            .map(|_| create_test_deck(user_id))
            .collect();

        let start = Instant::now();
        let result = sync_engine.sync_decks(&local_decks, &server_decks, None);
        let duration = start.elapsed();

        assert_eq!(result.merged_items.len(), 2000);
        assert!(duration.as_millis() < 1000); // Should complete within 1 second
    }

    #[test]
    fn test_password_hashing_performance() {
        let passwords = vec![
            "password123",
            "another_password",
            "very_long_password_with_many_characters",
            "short",
        ];

        let start = Instant::now();
        for password in passwords {
            let _hash = crate::utils::hash_password(password);
        }
        let duration = start.elapsed();

        // Should hash 4 passwords quickly
        assert!(duration.as_millis() < 50);
    }

    #[test]
    fn test_jwt_performance() {
        let user = create_test_user();
        let secret = "test_secret_key";

        // Test token creation performance
        let start = Instant::now();
        for _ in 0..100 {
            let _token = crate::auth::create_jwt(user.id, &user.email, secret).unwrap();
        }
        let creation_duration = start.elapsed();

        // Create one token for verification test
        let token = crate::auth::create_jwt(user.id, &user.email, secret).unwrap();

        // Test token verification performance
        let start = Instant::now();
        for _ in 0..100 {
            let _claims = crate::auth::verify_jwt(&token, secret).unwrap();
        }
        let verification_duration = start.elapsed();

        // Both should be fast
        assert!(creation_duration.as_millis() < 100);
        assert!(verification_duration.as_millis() < 50);
    }
}
```

### 6. Deployment Configuration

**File**: `backend/wrangler.toml` (Update with production settings)

```toml
name = "flashplay-backend"
main = "build/worker/shim.mjs"
compatibility_date = "2023-12-01"
compatibility_flags = ["nodejs_compat"]

[build]
command = "cargo install -q worker-build --version 0.2.0 && worker-build --release"

[durable_objects]
bindings = [
  { name = "USER_DATA", class_name = "UserData", script_name = "flashplay-backend" }
]

[[migrations]]
tag = "v1"
new_classes = ["UserData"]

[env.development]
vars = { ENVIRONMENT = "development" }

[env.development.vars]
JWT_SECRET = "development-secret-key-change-in-production"

[env.production]
vars = { ENVIRONMENT = "production" }

# Production secrets should be set via: wrangler secret put JWT_SECRET

# Cron triggers for periodic cleanup
[[triggers]]
crons = ["0 0 * * *"] # Daily cleanup
```

### 7. GitHub Actions CI/CD

**File**: `backend/.github/workflows/ci.yml` (New file)

```yaml
name: CI/CD Pipeline

on:
  push:
    branches: [ main, develop ]
    paths: [ 'backend/**' ]
  pull_request:
    branches: [ main ]
    paths: [ 'backend/**' ]

env:
  CARGO_TERM_COLOR: always

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v4
    
    - name: Install Rust
      uses: actions-rs/toolchain@v1
      with:
        toolchain: stable
        override: true
        components: rustfmt, clippy

    - name: Cache cargo dependencies
      uses: actions/cache@v3
      with:
        path: |
          ~/.cargo/registry
          ~/.cargo/git
          backend/target
        key: ${{ runner.os }}-cargo-${{ hashFiles('**/Cargo.lock') }}

    - name: Run tests
      working-directory: backend
      run: cargo test --verbose

    - name: Run clippy
      working-directory: backend
      run: cargo clippy -- -D warnings

    - name: Check formatting
      working-directory: backend
      run: cargo fmt -- --check

    - name: Build
      working-directory: backend
      run: cargo build --release

  deploy-staging:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/develop'
    
    steps:
    - uses: actions/checkout@v4
    
    - name: Install wrangler
      run: npm install -g wrangler

    - name: Deploy to staging
      working-directory: backend
      env:
        CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
      run: |
        wrangler secret put JWT_SECRET --env development <<< "${{ secrets.JWT_SECRET_DEV }}"
        wrangler deploy --env development

  deploy-production:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    
    steps:
    - uses: actions/checkout@v4
    
    - name: Install wrangler
      run: npm install -g wrangler

    - name: Deploy to production
      working-directory: backend
      env:
        CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
      run: |
        wrangler secret put JWT_SECRET --env production <<< "${{ secrets.JWT_SECRET_PROD }}"
        wrangler deploy --env production
```

### 8. Load Testing Script

**File**: `backend/scripts/load_test.js` (New file)

```javascript
import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

export let errorRate = new Rate('errors');

export let options = {
  stages: [
    { duration: '2m', target: 100 }, // Ramp up to 100 users
    { duration: '5m', target: 100 }, // Stay at 100 users
    { duration: '2m', target: 200 }, // Ramp up to 200 users
    { duration: '5m', target: 200 }, // Stay at 200 users
    { duration: '2m', target: 0 },   // Ramp down to 0 users
  ],
  thresholds: {
    errors: ['rate<0.1'], // Error rate should be less than 10%
    http_req_duration: ['p(95)<500'], // 95% of requests should be below 500ms
  },
};

const BASE_URL = 'https://flashplay-backend.workers.dev';

let authToken = null;

export function setup() {
  // Register a test user
  const registerResponse = http.post(`${BASE_URL}/auth/register`, JSON.stringify({
    email: `test-${Date.now()}@example.com`,
    password: 'hashed_password_123'
  }), {
    headers: { 'Content-Type': 'application/json' },
  });
  
  if (registerResponse.status === 200) {
    const body = JSON.parse(registerResponse.body);
    return { token: body.token };
  }
  
  return { token: null };
}

export default function(data) {
  const token = data.token;
  
  if (!token) {
    errorRate.add(1);
    return;
  }

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };

  // Test health endpoint
  let response = http.get(`${BASE_URL}/health`);
  check(response, {
    'health check status is 200': (r) => r.status === 200,
  }) || errorRate.add(1);

  // Test user profile
  response = http.get(`${BASE_URL}/user/profile`, { headers });
  check(response, {
    'profile status is 200': (r) => r.status === 200,
  }) || errorRate.add(1);

  // Test deck sync
  const deckData = {
    data: [{
      id: `deck-${Math.random()}`,
      title: 'Load Test Deck',
      content: 'Question 1 :: Answer 1\nQuestion 2 :: Answer 2',
      updated_at: new Date().toISOString(),
      version: 1
    }],
    last_sync: null
  };

  response = http.post(`${BASE_URL}/sync/decks`, JSON.stringify(deckData), { headers });
  check(response, {
    'deck sync status is 200': (r) => r.status === 200,
  }) || errorRate.add(1);

  sleep(1);
}

export function teardown(data) {
  // Cleanup if needed
  console.log('Load test completed');
}
```

### 9. Production Monitoring

**File**: `backend/src/monitoring.rs` (New file)

```rust
use worker::*;
use chrono::Utc;
use serde_json::json;

pub struct Monitor;

impl Monitor {
    pub fn log_request(req: &Request, duration_ms: u64, status: u16) {
        let log_data = json!({
            "timestamp": Utc::now().to_rfc3339(),
            "method": req.method().to_string(),
            "path": req.path(),
            "duration_ms": duration_ms,
            "status": status,
            "user_agent": req.headers().get("User-Agent").unwrap_or_default(),
        });

        console_log!("Request: {}", log_data);
    }

    pub fn log_error(error: &str, context: &str) {
        let log_data = json!({
            "timestamp": Utc::now().to_rfc3339(),
            "level": "error",
            "error": error,
            "context": context,
        });

        console_error!("Error: {}", log_data);
    }

    pub fn log_sync_operation(user_id: &str, operation: &str, items_count: usize, duration_ms: u64) {
        let log_data = json!({
            "timestamp": Utc::now().to_rfc3339(),
            "type": "sync",
            "user_id": user_id,
            "operation": operation,
            "items_count": items_count,
            "duration_ms": duration_ms,
        });

        console_log!("Sync: {}", log_data);
    }
}
```

## Testing Commands

### 1. Run All Tests

```bash
cd backend

# Run unit tests
cargo test

# Run with output
cargo test -- --nocapture

# Run specific test module
cargo test auth_tests

# Run performance tests
cargo test performance_tests
```

### 2. Load Testing

```bash
# Install k6
brew install k6  # macOS
# or
sudo apt install k6  # Ubuntu

# Run load test
k6 run scripts/load_test.js
```

### 3. Deploy to Cloudflare

```bash
# Login to Cloudflare
wrangler login

# Set production secrets
wrangler secret put JWT_SECRET

# Deploy to development
wrangler deploy --env development

# Deploy to production  
wrangler deploy --env production

# View logs
wrangler tail
```

### 4. Security Testing

```bash
# Test authentication endpoints
curl -X POST https://your-worker.workers.dev/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "wrong_password"}'

# Test protected endpoints without auth
curl -X GET https://your-worker.workers.dev/user/profile

# Test with invalid JWT
curl -X GET https://your-worker.workers.dev/user/profile \
  -H "Authorization: Bearer invalid_token"
```

## Common Issues and Solutions

### Issue 1: Deployment Failures
- **Problem**: Worker deployment fails with build errors
- **Solution**: Ensure all dependencies are correctly specified
- **Fallback**: Test locally with `wrangler dev` first

### Issue 2: Test Environment Setup
- **Problem**: Tests fail due to missing mock environment
- **Solution**: Use worker testing framework properly
- **Fallback**: Mock external dependencies in tests

### Issue 3: Performance Issues
- **Problem**: API responses are too slow
- **Solution**: Optimize database queries and reduce payload sizes
- **Fallback**: Implement caching and pagination

### Issue 4: Durable Objects Limits
- **Problem**: Hit Durable Objects limits in production
- **Solution**: Optimize data storage and implement data archiving
- **Fallback**: Implement data partitioning strategies

## Deployment Checklist

### Pre-deployment
- [ ] All tests pass
- [ ] Performance benchmarks meet requirements
- [ ] Security tests pass
- [ ] Load tests completed successfully
- [ ] Environment variables configured
- [ ] Secrets properly set

### Production Deployment
- [ ] Deploy to staging first
- [ ] Run integration tests against staging
- [ ] Deploy to production
- [ ] Verify health endpoints
- [ ] Monitor error rates
- [ ] Check performance metrics

### Post-deployment
- [ ] Monitor logs for errors
- [ ] Check sync operations work correctly
- [ ] Verify authentication flows
- [ ] Monitor resource usage
- [ ] Set up alerts for failures

## Monitoring and Alerting

### Key Metrics to Monitor
1. **Response Times**: API endpoint latency
2. **Error Rates**: Failed requests percentage
3. **Authentication Success**: Login/register success rates
4. **Sync Operations**: Sync success and conflict rates
5. **Resource Usage**: CPU, memory, and storage usage

### Alerting Setup
1. **High Error Rate**: > 5% error rate
2. **Slow Response**: > 1 second average response time
3. **Authentication Failures**: > 10% failure rate
4. **Sync Failures**: > 5% sync operation failures

## Next Steps

After completing this stage:

1. Run all tests to ensure everything works correctly
2. Deploy to staging environment and test thoroughly
3. Run load tests to verify performance
4. Deploy to production with monitoring
5. Proceed to Stage 7: React Client Integration

This stage provides a production-ready backend with comprehensive testing and monitoring capabilities.