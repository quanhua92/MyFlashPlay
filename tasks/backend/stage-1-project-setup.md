# Stage 1: Project Setup and Basic Structure

## Overview

This stage initializes the Rust project structure for the MyFlashPlay backend using workers-rs and sets up the basic development environment for Cloudflare Workers.

## Prerequisites

- Rust toolchain (stable channel)
- Cloudflare account with Workers enabled
- wrangler CLI tool installed (`npm install -g wrangler`)

## Files to Create/Modify

### 1. Create Backend Directory Structure

```bash
mkdir -p backend
cd backend
```

### 2. Initialize Rust Project

```bash
cargo init --name flashplay-backend
```

### 3. Create Cargo.toml

**File**: `backend/Cargo.toml` (Replace entire content)

```toml
[package]
name = "flashplay-backend"
version = "0.1.0"
edition = "2021"

[lib]
crate-type = ["cdylib"]

[dependencies]
worker = "0.2.0"
serde = { version = "1.0", features = ["derive"] }
serde_json = "1.0"
uuid = { version = "1.6", features = ["v4", "v7", "serde"] }
chrono = { version = "0.4", features = ["serde"] }
sha2 = "0.10"
hex = "0.4"
thiserror = "1.0"
anyhow = "1.0"
regex = "1.10"
url = "2.5"
base64 = "0.21"
rand = "0.8"
argon2 = "0.5"
rusqlite = { version = "0.30", features = ["bundled"] }
getrandom = { version = "0.2", features = ["js"] }
js-sys = "0.3"
wasm-bindgen = "0.2"
wasm-bindgen-futures = "0.4"
web-sys = "0.3"

[dependencies.jsonwebtoken]
version = "9.2"
default-features = false

[profile.release]
opt-level = "s"
lto = true
```

### 4. Create wrangler.toml

**File**: `backend/wrangler.toml` (New file)

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

[vars]
ENVIRONMENT = "development"
JWT_SECRET = "your-jwt-secret-here"
```

### 5. Create Main Worker Entry Point

**File**: `backend/src/lib.rs` (New file)

```rust
use worker::*;

mod auth;
mod db;
mod handlers;
mod models;
mod utils;

use auth::AuthService;
use db::UserData;
use handlers::*;
use models::*;
use utils::*;

#[event(fetch)]
pub async fn main(req: Request, env: Env, ctx: Context) -> Result<Response> {
    console_error_panic_hook::set_once();
    
    let router = Router::new();
    
    router
        .get("/", |_, _| Response::ok("MyFlashPlay Backend API"))
        .get("/health", health_check)
        .post("/auth/register", auth::register)
        .post("/auth/login", auth::login)
        .post("/auth/logout", auth::logout)
        .get("/user/profile", user::get_profile)
        .put("/user/profile", user::update_profile)
        .get("/sync/decks", sync::get_decks)
        .post("/sync/decks", sync::sync_decks)
        .get("/sync/achievements", sync::get_achievements)
        .post("/sync/achievements", sync::sync_achievements)
        .get("/sync/progress", sync::get_progress)
        .post("/sync/progress", sync::sync_progress)
        .get("/sync/starred", sync::get_starred)
        .post("/sync/starred", sync::sync_starred)
        .get("/sync/preferences", sync::get_preferences)
        .post("/sync/preferences", sync::sync_preferences)
        .post("/sync/full", sync::full_sync)
        .run(req, env)
        .await
}

async fn health_check(_req: Request, _ctx: RouteContext<()>) -> Result<Response> {
    let response = HealthResponse {
        status: "ok".to_string(),
        timestamp: chrono::Utc::now(),
        version: "0.1.0".to_string(),
    };
    
    Response::from_json(&response)
}
```

### 6. Create Models Module

**File**: `backend/src/models.rs` (New file)

```rust
use serde::{Deserialize, Serialize};
use chrono::{DateTime, Utc};
use uuid::Uuid;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct User {
    pub id: Uuid,
    pub email: String,
    pub password_hash: String,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    pub last_login: Option<DateTime<Utc>>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Deck {
    pub id: Uuid,
    pub user_id: Uuid,
    pub title: String,
    pub description: Option<String>,
    pub content: String, // Markdown content
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    pub version: i64,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Achievement {
    pub id: Uuid,
    pub user_id: Uuid,
    pub achievement_type: String,
    pub title: String,
    pub description: String,
    pub earned_at: DateTime<Utc>,
    pub metadata: Option<String>, // JSON metadata
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Progress {
    pub id: Uuid,
    pub user_id: Uuid,
    pub deck_id: Uuid,
    pub cards_studied: i32,
    pub cards_mastered: i32,
    pub total_cards: i32,
    pub last_studied: DateTime<Utc>,
    pub streak_days: i32,
    pub total_time_spent: i32, // in seconds
    pub version: i64,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct StarredDeck {
    pub id: Uuid,
    pub user_id: Uuid,
    pub deck_id: Uuid,
    pub starred_at: DateTime<Utc>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct UserPreferences {
    pub user_id: Uuid,
    pub theme: String,
    pub language: String,
    pub sound_enabled: bool,
    pub notifications_enabled: bool,
    pub auto_advance: bool,
    pub study_reminders: bool,
    pub updated_at: DateTime<Utc>,
    pub version: i64,
}

// Request/Response models
#[derive(Debug, Serialize, Deserialize)]
pub struct RegisterRequest {
    pub email: String,
    pub password: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct LoginRequest {
    pub email: String,
    pub password: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct AuthResponse {
    pub success: bool,
    pub token: Option<String>,
    pub user_id: Option<Uuid>,
    pub message: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct HealthResponse {
    pub status: String,
    pub timestamp: DateTime<Utc>,
    pub version: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct SyncRequest<T> {
    pub data: Vec<T>,
    pub last_sync: Option<DateTime<Utc>>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct SyncResponse<T> {
    pub data: Vec<T>,
    pub conflicts: Vec<SyncConflict<T>>,
    pub last_sync: DateTime<Utc>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct SyncConflict<T> {
    pub local: T,
    pub remote: T,
    pub resolution: ConflictResolution,
}

#[derive(Debug, Serialize, Deserialize)]
pub enum ConflictResolution {
    UseLocal,
    UseRemote,
    Merge,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ApiError {
    pub error: String,
    pub message: String,
    pub status: u16,
}

impl ApiError {
    pub fn new(error: &str, message: &str, status: u16) -> Self {
        Self {
            error: error.to_string(),
            message: message.to_string(),
            status,
        }
    }
}
```

### 7. Create Basic Handler Modules

**File**: `backend/src/handlers/mod.rs` (New file)

```rust
pub mod auth;
pub mod sync;
pub mod user;
```

**File**: `backend/src/handlers/auth.rs` (New file)

```rust
use worker::*;
use crate::models::*;

pub async fn register(req: Request, ctx: RouteContext<()>) -> Result<Response> {
    let request: RegisterRequest = req.json().await?;
    
    // TODO: Implement registration logic
    let response = AuthResponse {
        success: true,
        token: Some("placeholder-token".to_string()),
        user_id: Some(uuid::Uuid::new_v4()),
        message: "Registration successful".to_string(),
    };
    
    Response::from_json(&response)
}

pub async fn login(req: Request, ctx: RouteContext<()>) -> Result<Response> {
    let request: LoginRequest = req.json().await?;
    
    // TODO: Implement login logic
    let response = AuthResponse {
        success: true,
        token: Some("placeholder-token".to_string()),
        user_id: Some(uuid::Uuid::new_v4()),
        message: "Login successful".to_string(),
    };
    
    Response::from_json(&response)
}

pub async fn logout(req: Request, ctx: RouteContext<()>) -> Result<Response> {
    // TODO: Implement logout logic
    let response = AuthResponse {
        success: true,
        token: None,
        user_id: None,
        message: "Logout successful".to_string(),
    };
    
    Response::from_json(&response)
}
```

**File**: `backend/src/handlers/user.rs` (New file)

```rust
use worker::*;
use crate::models::*;

pub async fn get_profile(req: Request, ctx: RouteContext<()>) -> Result<Response> {
    // TODO: Implement get profile logic
    Response::ok("User profile placeholder")
}

pub async fn update_profile(req: Request, ctx: RouteContext<()>) -> Result<Response> {
    // TODO: Implement update profile logic
    Response::ok("Profile updated placeholder")
}
```

**File**: `backend/src/handlers/sync.rs` (New file)

```rust
use worker::*;
use crate::models::*;

pub async fn get_decks(req: Request, ctx: RouteContext<()>) -> Result<Response> {
    // TODO: Implement get decks logic
    Response::ok("Get decks placeholder")
}

pub async fn sync_decks(req: Request, ctx: RouteContext<()>) -> Result<Response> {
    // TODO: Implement sync decks logic
    Response::ok("Sync decks placeholder")
}

pub async fn get_achievements(req: Request, ctx: RouteContext<()>) -> Result<Response> {
    // TODO: Implement get achievements logic
    Response::ok("Get achievements placeholder")
}

pub async fn sync_achievements(req: Request, ctx: RouteContext<()>) -> Result<Response> {
    // TODO: Implement sync achievements logic
    Response::ok("Sync achievements placeholder")
}

pub async fn get_progress(req: Request, ctx: RouteContext<()>) -> Result<Response> {
    // TODO: Implement get progress logic
    Response::ok("Get progress placeholder")
}

pub async fn sync_progress(req: Request, ctx: RouteContext<()>) -> Result<Response> {
    // TODO: Implement sync progress logic
    Response::ok("Sync progress placeholder")
}

pub async fn get_starred(req: Request, ctx: RouteContext<()>) -> Result<Response> {
    // TODO: Implement get starred logic
    Response::ok("Get starred placeholder")
}

pub async fn sync_starred(req: Request, ctx: RouteContext<()>) -> Result<Response> {
    // TODO: Implement sync starred logic
    Response::ok("Sync starred placeholder")
}

pub async fn get_preferences(req: Request, ctx: RouteContext<()>) -> Result<Response> {
    // TODO: Implement get preferences logic
    Response::ok("Get preferences placeholder")
}

pub async fn sync_preferences(req: Request, ctx: RouteContext<()>) -> Result<Response> {
    // TODO: Implement sync preferences logic
    Response::ok("Sync preferences placeholder")
}

pub async fn full_sync(req: Request, ctx: RouteContext<()>) -> Result<Response> {
    // TODO: Implement full sync logic
    Response::ok("Full sync placeholder")
}
```

### 8. Create Utility Modules

**File**: `backend/src/utils/mod.rs` (New file)

```rust
pub mod crypto;
pub mod validation;
pub mod errors;

pub use crypto::*;
pub use validation::*;
pub use errors::*;
```

**File**: `backend/src/utils/crypto.rs` (New file)

```rust
use sha2::{Sha256, Digest};
use uuid::Uuid;
use chrono::Utc;

pub fn hash_password(password: &str) -> String {
    let mut hasher = Sha256::new();
    hasher.update(password.as_bytes());
    hex::encode(hasher.finalize())
}

pub fn generate_user_id() -> Uuid {
    Uuid::now_v7()
}

pub fn verify_password(password: &str, hash: &str) -> bool {
    hash_password(password) == hash
}
```

**File**: `backend/src/utils/validation.rs` (New file)

```rust
use regex::Regex;

pub fn validate_email(email: &str) -> bool {
    let email_regex = Regex::new(r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$").unwrap();
    email_regex.is_match(email)
}

pub fn validate_password(password: &str) -> bool {
    password.len() >= 8
}
```

**File**: `backend/src/utils/errors.rs` (New file)

```rust
use worker::*;
use crate::models::ApiError;

pub fn create_error_response(error: &str, message: &str, status: u16) -> Result<Response> {
    let api_error = ApiError::new(error, message, status);
    Response::from_json(&api_error)?.with_status(status)
}
```

### 9. Create Auth Service Module

**File**: `backend/src/auth/mod.rs` (New file)

```rust
pub mod service;
pub mod jwt;

pub use service::*;
pub use jwt::*;
```

**File**: `backend/src/auth/service.rs` (New file)

```rust
use uuid::Uuid;
use chrono::Utc;
use crate::models::*;
use crate::utils::*;

pub struct AuthService;

impl AuthService {
    pub fn new() -> Self {
        Self
    }
    
    pub async fn register_user(&self, email: &str, password: &str) -> Result<User, String> {
        if !validate_email(email) {
            return Err("Invalid email format".to_string());
        }
        
        if !validate_password(password) {
            return Err("Password must be at least 8 characters".to_string());
        }
        
        let user_id = generate_user_id();
        let password_hash = hash_password(password);
        let now = Utc::now();
        
        let user = User {
            id: user_id,
            email: email.to_string(),
            password_hash,
            created_at: now,
            updated_at: now,
            last_login: None,
        };
        
        Ok(user)
    }
    
    pub async fn login_user(&self, email: &str, password: &str) -> Result<User, String> {
        // TODO: Implement actual login logic with database lookup
        Err("Login not implemented yet".to_string())
    }
}
```

**File**: `backend/src/auth/jwt.rs` (New file)

```rust
use jsonwebtoken::{encode, decode, Header, Algorithm, Validation, EncodingKey, DecodingKey};
use serde::{Deserialize, Serialize};
use uuid::Uuid;
use chrono::{Utc, Duration};

#[derive(Debug, Serialize, Deserialize)]
pub struct Claims {
    pub sub: String, // User ID
    pub email: String,
    pub iat: i64,
    pub exp: i64,
}

pub fn create_jwt(user_id: Uuid, email: &str, secret: &str) -> Result<String, String> {
    let now = Utc::now();
    let expiration = now + Duration::hours(24);
    
    let claims = Claims {
        sub: user_id.to_string(),
        email: email.to_string(),
        iat: now.timestamp(),
        exp: expiration.timestamp(),
    };
    
    encode(&Header::default(), &claims, &EncodingKey::from_secret(secret.as_ref()))
        .map_err(|e| format!("JWT creation failed: {}", e))
}

pub fn verify_jwt(token: &str, secret: &str) -> Result<Claims, String> {
    decode::<Claims>(token, &DecodingKey::from_secret(secret.as_ref()), &Validation::default())
        .map(|data| data.claims)
        .map_err(|e| format!("JWT verification failed: {}", e))
}
```

### 10. Create Database Module

**File**: `backend/src/db/mod.rs` (New file)

```rust
use worker::*;

#[durable_object]
pub struct UserData {
    state: State,
    env: Env,
}

#[durable_object]
impl DurableObject for UserData {
    fn new(state: State, env: Env) -> Self {
        Self { state, env }
    }

    async fn fetch(&mut self, _req: Request) -> Result<Response> {
        // TODO: Implement database operations
        Response::ok("UserData durable object placeholder")
    }
}
```

## Testing Instructions

### 1. Verify Project Structure

```bash
cd backend
cargo check
```

Expected output: No compilation errors

### 2. Test Basic Build

```bash
cargo build
```

Expected output: Successful compilation

### 3. Test with Wrangler (if configured)

```bash
# First login to Cloudflare
wrangler login

# Test configuration
wrangler dev --local
```

Expected output: Worker starts locally on port 8787

## Common Issues and Solutions

### Issue 1: Compilation Errors
- **Problem**: Missing dependencies or syntax errors
- **Solution**: Run `cargo check` to identify specific issues
- **Fallback**: Review dependencies in Cargo.toml and ensure all modules are properly imported

### Issue 2: Worker Build Failures
- **Problem**: worker-build command fails
- **Solution**: Ensure worker-build is installed: `cargo install worker-build`
- **Fallback**: Use `cargo build` for basic Rust compilation testing

### Issue 3: Missing Module Errors
- **Problem**: Module not found errors
- **Solution**: Ensure all mod.rs files are created and properly configured
- **Fallback**: Comment out problematic imports temporarily and add them back incrementally

## Design Decisions

1. **Modular Architecture**: Separated concerns into distinct modules (auth, db, handlers, utils) for maintainability
2. **UUID v7**: Chose UUID v7 for time-sortable user IDs with better database performance
3. **Placeholder Implementation**: Used placeholder responses to establish API structure before full implementation
4. **Error Handling**: Implemented structured error responses for consistent API behavior
5. **Type Safety**: Used strong typing with Rust structs for all data models

## Next Steps

After completing this stage and verifying all tests pass:

1. Run `cargo check` to ensure no compilation errors
2. Proceed to Stage 2: Database Schema and Durable Objects
3. Keep the project structure intact as later stages will build upon this foundation

## Troubleshooting

If any step fails:
1. Check Rust toolchain installation: `rustc --version`
2. Verify all file paths and module declarations
3. Ensure all dependencies are properly specified in Cargo.toml
4. Test individual modules with `cargo check --bin <module>`

This stage establishes the foundation for the entire backend system. All subsequent stages will build upon this structure.