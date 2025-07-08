# Stage 4: Core API Endpoints

## Overview

This stage implements the core API endpoints for user management and data synchronization. All endpoints are protected by JWT authentication and provide full CRUD operations for decks, achievements, progress, starred content, and preferences.

## API Endpoints Overview

### Authentication Endpoints
- `POST /auth/register` - User registration
- `POST /auth/login` - User login
- `POST /auth/logout` - User logout
- `POST /auth/refresh` - Token refresh
- `GET /auth/validate` - Token validation

### User Management Endpoints
- `GET /user/profile` - Get user profile
- `PUT /user/profile` - Update user profile
- `DELETE /user/account` - Delete user account

### Sync Endpoints
- `GET /sync/decks` - Get user's decks
- `POST /sync/decks` - Sync user's decks
- `GET /sync/achievements` - Get user's achievements
- `POST /sync/achievements` - Sync user's achievements
- `GET /sync/progress` - Get user's progress
- `POST /sync/progress` - Sync user's progress
- `GET /sync/starred` - Get user's starred decks
- `POST /sync/starred` - Sync user's starred decks
- `GET /sync/preferences` - Get user's preferences
- `POST /sync/preferences` - Sync user's preferences
- `POST /sync/full` - Full data synchronization

## Files to Create/Modify

### 1. Update User Handlers

**File**: `backend/src/handlers/user.rs` (Replace entire content)

```rust
use worker::*;
use crate::models::*;
use crate::auth::authenticate_request;
use crate::utils::*;

pub async fn get_profile(req: Request, ctx: RouteContext<()>) -> Result<Response> {
    // Authenticate user
    let user = match authenticate_request(&req, &ctx.env).await {
        Ok(user) => user,
        Err(_) => return create_error_response("unauthorized", "Authentication required", 401),
    };

    // Return user profile (without password hash)
    let profile = UserProfile {
        id: user.id,
        email: user.email,
        created_at: user.created_at,
        updated_at: user.updated_at,
        last_login: user.last_login,
    };

    Response::from_json(&profile)
}

pub async fn update_profile(mut req: Request, ctx: RouteContext<()>) -> Result<Response> {
    // Authenticate user
    let user = match authenticate_request(&req, &ctx.env).await {
        Ok(user) => user,
        Err(_) => return create_error_response("unauthorized", "Authentication required", 401),
    };

    // Parse update request
    let update_request: UpdateProfileRequest = match req.json().await {
        Ok(req) => req,
        Err(_) => return create_error_response("invalid_request", "Invalid JSON in request body", 400),
    };

    // Validate email if provided
    if let Some(ref email) = update_request.email {
        if !validate_email(email) {
            return create_error_response("validation_error", "Invalid email format", 400);
        }
    }

    // Get user's Durable Object
    let user_data_ns = ctx.env.durable_object("USER_DATA")?;
    let user_stub = user_data_ns.id_from_name(&user.email)?.get_stub()?;

    // Update user data
    let mut updated_user = user.clone();
    if let Some(email) = update_request.email {
        updated_user.email = email;
    }
    updated_user.updated_at = chrono::Utc::now();

    let update_req = Request::new_with_init(
        "http://user-data/user",
        RequestInit::new()
            .with_method(Method::Post)
            .with_body(Some(serde_json::to_string(&updated_user)?.into())),
    )?;

    let save_response = user_stub.fetch_with_request(update_req).await?;
    if save_response.status_code() != 200 {
        return create_error_response("update_failed", "Failed to update profile", 500);
    }

    Response::ok("Profile updated successfully")
}

pub async fn delete_account(req: Request, ctx: RouteContext<()>) -> Result<Response> {
    // Authenticate user
    let user = match authenticate_request(&req, &ctx.env).await {
        Ok(user) => user,
        Err(_) => return create_error_response("unauthorized", "Authentication required", 401),
    };

    // Get user's Durable Object
    let user_data_ns = ctx.env.durable_object("USER_DATA")?;
    let user_stub = user_data_ns.id_from_name(&user.email)?.get_stub()?;

    // Delete all user data
    let delete_req = Request::new_with_init(
        "http://user-data/delete",
        RequestInit::new().with_method(Method::Post),
    )?;

    let delete_response = user_stub.fetch_with_request(delete_req).await?;
    if delete_response.status_code() != 200 {
        return create_error_response("delete_failed", "Failed to delete account", 500);
    }

    Response::ok("Account deleted successfully")
}
```

### 2. Update Sync Handlers

**File**: `backend/src/handlers/sync.rs` (Replace entire content)

```rust
use worker::*;
use crate::models::*;
use crate::auth::authenticate_request;
use crate::utils::*;
use chrono::Utc;

pub async fn get_decks(req: Request, ctx: RouteContext<()>) -> Result<Response> {
    let user = match authenticate_request(&req, &ctx.env).await {
        Ok(user) => user,
        Err(_) => return create_error_response("unauthorized", "Authentication required", 401),
    };

    let user_data_ns = ctx.env.durable_object("USER_DATA")?;
    let user_stub = user_data_ns.id_from_name(&user.email)?.get_stub()?;

    let get_req = Request::new_with_init(
        "http://user-data/decks",
        RequestInit::new().with_method(Method::Get),
    )?;

    let response = user_stub.fetch_with_request(get_req).await?;
    if response.status_code() != 200 {
        return create_error_response("fetch_failed", "Failed to fetch decks", 500);
    }

    let decks: Vec<Deck> = response.json().await?;
    Response::from_json(&decks)
}

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

    // Merge local and server data
    let merged_result = merge_decks(&sync_request.data, &server_decks, sync_request.last_sync);

    // Save merged data back to server
    let save_req = Request::new_with_init(
        "http://user-data/decks",
        RequestInit::new()
            .with_method(Method::Post)
            .with_body(Some(serde_json::to_string(&merged_result.data)?.into())),
    )?;

    let save_response = user_stub.fetch_with_request(save_req).await?;
    if save_response.status_code() != 200 {
        return create_error_response("sync_failed", "Failed to sync decks", 500);
    }

    Response::from_json(&merged_result)
}

pub async fn get_achievements(req: Request, ctx: RouteContext<()>) -> Result<Response> {
    let user = match authenticate_request(&req, &ctx.env).await {
        Ok(user) => user,
        Err(_) => return create_error_response("unauthorized", "Authentication required", 401),
    };

    let user_data_ns = ctx.env.durable_object("USER_DATA")?;
    let user_stub = user_data_ns.id_from_name(&user.email)?.get_stub()?;

    let get_req = Request::new_with_init(
        "http://user-data/achievements",
        RequestInit::new().with_method(Method::Get),
    )?;

    let response = user_stub.fetch_with_request(get_req).await?;
    if response.status_code() != 200 {
        return create_error_response("fetch_failed", "Failed to fetch achievements", 500);
    }

    let achievements: Vec<Achievement> = response.json().await?;
    Response::from_json(&achievements)
}

pub async fn sync_achievements(mut req: Request, ctx: RouteContext<()>) -> Result<Response> {
    let user = match authenticate_request(&req, &ctx.env).await {
        Ok(user) => user,
        Err(_) => return create_error_response("unauthorized", "Authentication required", 401),
    };

    let sync_request: SyncRequest<Achievement> = match req.json().await {
        Ok(req) => req,
        Err(_) => return create_error_response("invalid_request", "Invalid JSON in request body", 400),
    };

    let user_data_ns = ctx.env.durable_object("USER_DATA")?;
    let user_stub = user_data_ns.id_from_name(&user.email)?.get_stub()?;

    // Get current server data
    let get_req = Request::new_with_init(
        "http://user-data/achievements",
        RequestInit::new().with_method(Method::Get),
    )?;

    let response = user_stub.fetch_with_request(get_req).await?;
    let server_achievements: Vec<Achievement> = if response.status_code() == 200 {
        response.json().await?
    } else {
        Vec::new()
    };

    // Merge local and server data
    let merged_result = merge_achievements(&sync_request.data, &server_achievements, sync_request.last_sync);

    // Save merged data back to server
    let save_req = Request::new_with_init(
        "http://user-data/achievements",
        RequestInit::new()
            .with_method(Method::Post)
            .with_body(Some(serde_json::to_string(&merged_result.data)?.into())),
    )?;

    let save_response = user_stub.fetch_with_request(save_req).await?;
    if save_response.status_code() != 200 {
        return create_error_response("sync_failed", "Failed to sync achievements", 500);
    }

    Response::from_json(&merged_result)
}

pub async fn get_progress(req: Request, ctx: RouteContext<()>) -> Result<Response> {
    let user = match authenticate_request(&req, &ctx.env).await {
        Ok(user) => user,
        Err(_) => return create_error_response("unauthorized", "Authentication required", 401),
    };

    let user_data_ns = ctx.env.durable_object("USER_DATA")?;
    let user_stub = user_data_ns.id_from_name(&user.email)?.get_stub()?;

    let get_req = Request::new_with_init(
        "http://user-data/progress",
        RequestInit::new().with_method(Method::Get),
    )?;

    let response = user_stub.fetch_with_request(get_req).await?;
    if response.status_code() != 200 {
        return create_error_response("fetch_failed", "Failed to fetch progress", 500);
    }

    let progress: Vec<Progress> = response.json().await?;
    Response::from_json(&progress)
}

pub async fn sync_progress(mut req: Request, ctx: RouteContext<()>) -> Result<Response> {
    let user = match authenticate_request(&req, &ctx.env).await {
        Ok(user) => user,
        Err(_) => return create_error_response("unauthorized", "Authentication required", 401),
    };

    let sync_request: SyncRequest<Progress> = match req.json().await {
        Ok(req) => req,
        Err(_) => return create_error_response("invalid_request", "Invalid JSON in request body", 400),
    };

    let user_data_ns = ctx.env.durable_object("USER_DATA")?;
    let user_stub = user_data_ns.id_from_name(&user.email)?.get_stub()?;

    // Get current server data
    let get_req = Request::new_with_init(
        "http://user-data/progress",
        RequestInit::new().with_method(Method::Get),
    )?;

    let response = user_stub.fetch_with_request(get_req).await?;
    let server_progress: Vec<Progress> = if response.status_code() == 200 {
        response.json().await?
    } else {
        Vec::new()
    };

    // Merge local and server data
    let merged_result = merge_progress(&sync_request.data, &server_progress, sync_request.last_sync);

    // Save merged data back to server
    let save_req = Request::new_with_init(
        "http://user-data/progress",
        RequestInit::new()
            .with_method(Method::Post)
            .with_body(Some(serde_json::to_string(&merged_result.data)?.into())),
    )?;

    let save_response = user_stub.fetch_with_request(save_req).await?;
    if save_response.status_code() != 200 {
        return create_error_response("sync_failed", "Failed to sync progress", 500);
    }

    Response::from_json(&merged_result)
}

pub async fn get_starred(req: Request, ctx: RouteContext<()>) -> Result<Response> {
    let user = match authenticate_request(&req, &ctx.env).await {
        Ok(user) => user,
        Err(_) => return create_error_response("unauthorized", "Authentication required", 401),
    };

    let user_data_ns = ctx.env.durable_object("USER_DATA")?;
    let user_stub = user_data_ns.id_from_name(&user.email)?.get_stub()?;

    let get_req = Request::new_with_init(
        "http://user-data/starred",
        RequestInit::new().with_method(Method::Get),
    )?;

    let response = user_stub.fetch_with_request(get_req).await?;
    if response.status_code() != 200 {
        return create_error_response("fetch_failed", "Failed to fetch starred decks", 500);
    }

    let starred: Vec<StarredDeck> = response.json().await?;
    Response::from_json(&starred)
}

pub async fn sync_starred(mut req: Request, ctx: RouteContext<()>) -> Result<Response> {
    let user = match authenticate_request(&req, &ctx.env).await {
        Ok(user) => user,
        Err(_) => return create_error_response("unauthorized", "Authentication required", 401),
    };

    let sync_request: SyncRequest<StarredDeck> = match req.json().await {
        Ok(req) => req,
        Err(_) => return create_error_response("invalid_request", "Invalid JSON in request body", 400),
    };

    let user_data_ns = ctx.env.durable_object("USER_DATA")?;
    let user_stub = user_data_ns.id_from_name(&user.email)?.get_stub()?;

    // Get current server data
    let get_req = Request::new_with_init(
        "http://user-data/starred",
        RequestInit::new().with_method(Method::Get),
    )?;

    let response = user_stub.fetch_with_request(get_req).await?;
    let server_starred: Vec<StarredDeck> = if response.status_code() == 200 {
        response.json().await?
    } else {
        Vec::new()
    };

    // Merge local and server data
    let merged_result = merge_starred(&sync_request.data, &server_starred, sync_request.last_sync);

    // Save merged data back to server
    let save_req = Request::new_with_init(
        "http://user-data/starred",
        RequestInit::new()
            .with_method(Method::Post)
            .with_body(Some(serde_json::to_string(&merged_result.data)?.into())),
    )?;

    let save_response = user_stub.fetch_with_request(save_req).await?;
    if save_response.status_code() != 200 {
        return create_error_response("sync_failed", "Failed to sync starred decks", 500);
    }

    Response::from_json(&merged_result)
}

pub async fn get_preferences(req: Request, ctx: RouteContext<()>) -> Result<Response> {
    let user = match authenticate_request(&req, &ctx.env).await {
        Ok(user) => user,
        Err(_) => return create_error_response("unauthorized", "Authentication required", 401),
    };

    let user_data_ns = ctx.env.durable_object("USER_DATA")?;
    let user_stub = user_data_ns.id_from_name(&user.email)?.get_stub()?;

    let get_req = Request::new_with_init(
        "http://user-data/preferences",
        RequestInit::new().with_method(Method::Get),
    )?;

    let response = user_stub.fetch_with_request(get_req).await?;
    if response.status_code() != 200 {
        return create_error_response("fetch_failed", "Failed to fetch preferences", 500);
    }

    let preferences: UserPreferences = response.json().await?;
    Response::from_json(&preferences)
}

pub async fn sync_preferences(mut req: Request, ctx: RouteContext<()>) -> Result<Response> {
    let user = match authenticate_request(&req, &ctx.env).await {
        Ok(user) => user,
        Err(_) => return create_error_response("unauthorized", "Authentication required", 401),
    };

    let sync_request: SyncRequest<UserPreferences> = match req.json().await {
        Ok(req) => req,
        Err(_) => return create_error_response("invalid_request", "Invalid JSON in request body", 400),
    };

    let user_data_ns = ctx.env.durable_object("USER_DATA")?;
    let user_stub = user_data_ns.id_from_name(&user.email)?.get_stub()?;

    // Get current server data
    let get_req = Request::new_with_init(
        "http://user-data/preferences",
        RequestInit::new().with_method(Method::Get),
    )?;

    let response = user_stub.fetch_with_request(get_req).await?;
    let server_preferences: Option<UserPreferences> = if response.status_code() == 200 {
        Some(response.json().await?)
    } else {
        None
    };

    // Merge local and server data
    let merged_result = merge_preferences(&sync_request.data, server_preferences, sync_request.last_sync);

    // Save merged data back to server
    let save_req = Request::new_with_init(
        "http://user-data/preferences",
        RequestInit::new()
            .with_method(Method::Post)
            .with_body(Some(serde_json::to_string(&merged_result.data[0])?.into())),
    )?;

    let save_response = user_stub.fetch_with_request(save_req).await?;
    if save_response.status_code() != 200 {
        return create_error_response("sync_failed", "Failed to sync preferences", 500);
    }

    Response::from_json(&merged_result)
}

pub async fn full_sync(mut req: Request, ctx: RouteContext<()>) -> Result<Response> {
    let user = match authenticate_request(&req, &ctx.env).await {
        Ok(user) => user,
        Err(_) => return create_error_response("unauthorized", "Authentication required", 401),
    };

    let full_sync_request: FullSyncRequest = match req.json().await {
        Ok(req) => req,
        Err(_) => return create_error_response("invalid_request", "Invalid JSON in request body", 400),
    };

    let user_data_ns = ctx.env.durable_object("USER_DATA")?;
    let user_stub = user_data_ns.id_from_name(&user.email)?.get_stub()?;

    // Perform full sync
    let full_sync_req = Request::new_with_init(
        "http://user-data/sync",
        RequestInit::new()
            .with_method(Method::Post)
            .with_body(Some(serde_json::to_string(&full_sync_request)?.into())),
    )?;

    let response = user_stub.fetch_with_request(full_sync_req).await?;
    if response.status_code() != 200 {
        return create_error_response("sync_failed", "Full sync failed", 500);
    }

    let full_sync_response: FullSyncResponse = response.json().await?;
    Response::from_json(&full_sync_response)
}

// Helper functions for merging data
fn merge_decks(local: &[Deck], server: &[Deck], last_sync: Option<chrono::DateTime<chrono::Utc>>) -> SyncResponse<Deck> {
    // Simple merge logic - in practice, this would be more sophisticated
    let mut merged = server.to_vec();
    let mut conflicts = Vec::new();

    for local_deck in local {
        if let Some(server_deck) = server.iter().find(|d| d.id == local_deck.id) {
            // Conflict resolution - use the most recently updated
            if local_deck.updated_at > server_deck.updated_at {
                merged.retain(|d| d.id != local_deck.id);
                merged.push(local_deck.clone());
            }
        } else {
            // New local deck
            merged.push(local_deck.clone());
        }
    }

    SyncResponse {
        data: merged,
        conflicts,
        last_sync: chrono::Utc::now(),
    }
}

fn merge_achievements(local: &[Achievement], server: &[Achievement], _last_sync: Option<chrono::DateTime<chrono::Utc>>) -> SyncResponse<Achievement> {
    let mut merged = server.to_vec();
    let conflicts = Vec::new();

    // Achievements are append-only, so we just add new ones
    for local_achievement in local {
        if !server.iter().any(|a| a.id == local_achievement.id) {
            merged.push(local_achievement.clone());
        }
    }

    SyncResponse {
        data: merged,
        conflicts,
        last_sync: chrono::Utc::now(),
    }
}

fn merge_progress(local: &[Progress], server: &[Progress], _last_sync: Option<chrono::DateTime<chrono::Utc>>) -> SyncResponse<Progress> {
    let mut merged = server.to_vec();
    let conflicts = Vec::new();

    for local_progress in local {
        if let Some(server_progress) = server.iter().find(|p| p.deck_id == local_progress.deck_id) {
            // Merge progress by taking the higher values
            let mut updated_progress = server_progress.clone();
            if local_progress.cards_studied > server_progress.cards_studied {
                updated_progress.cards_studied = local_progress.cards_studied;
            }
            if local_progress.cards_mastered > server_progress.cards_mastered {
                updated_progress.cards_mastered = local_progress.cards_mastered;
            }
            if local_progress.last_studied > server_progress.last_studied {
                updated_progress.last_studied = local_progress.last_studied;
            }
            updated_progress.total_time_spent = local_progress.total_time_spent + server_progress.total_time_spent;
            updated_progress.version += 1;

            merged.retain(|p| p.deck_id != local_progress.deck_id);
            merged.push(updated_progress);
        } else {
            merged.push(local_progress.clone());
        }
    }

    SyncResponse {
        data: merged,
        conflicts,
        last_sync: chrono::Utc::now(),
    }
}

fn merge_starred(local: &[StarredDeck], server: &[StarredDeck], _last_sync: Option<chrono::DateTime<chrono::Utc>>) -> SyncResponse<StarredDeck> {
    let mut merged = server.to_vec();
    let conflicts = Vec::new();

    for local_starred in local {
        if !server.iter().any(|s| s.deck_id == local_starred.deck_id) {
            merged.push(local_starred.clone());
        }
    }

    SyncResponse {
        data: merged,
        conflicts,
        last_sync: chrono::Utc::now(),
    }
}

fn merge_preferences(local: &[UserPreferences], server: Option<UserPreferences>, _last_sync: Option<chrono::DateTime<chrono::Utc>>) -> SyncResponse<UserPreferences> {
    let conflicts = Vec::new();

    let merged = if let Some(local_prefs) = local.first() {
        if let Some(server_prefs) = server {
            // Use the most recently updated preferences
            if local_prefs.updated_at > server_prefs.updated_at {
                vec![local_prefs.clone()]
            } else {
                vec![server_prefs]
            }
        } else {
            vec![local_prefs.clone()]
        }
    } else {
        server.map(|s| vec![s]).unwrap_or_default()
    };

    SyncResponse {
        data: merged,
        conflicts,
        last_sync: chrono::Utc::now(),
    }
}
```

### 3. Add Additional Models

**File**: `backend/src/models.rs` (Add these new models)

```rust
// Add these to the existing models.rs file

#[derive(Debug, Serialize, Deserialize)]
pub struct UserProfile {
    pub id: Uuid,
    pub email: String,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    pub last_login: Option<DateTime<Utc>>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct UpdateProfileRequest {
    pub email: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct FullSyncRequest {
    pub decks: Vec<Deck>,
    pub achievements: Vec<Achievement>,
    pub progress: Vec<Progress>,
    pub starred: Vec<StarredDeck>,
    pub preferences: UserPreferences,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct FullSyncResponse {
    pub decks: SyncResponse<Deck>,
    pub achievements: SyncResponse<Achievement>,
    pub progress: SyncResponse<Progress>,
    pub starred: SyncResponse<StarredDeck>,
    pub preferences: SyncResponse<UserPreferences>,
}
```

### 4. Update Durable Object Implementation

**File**: `backend/src/db/mod.rs` (Add delete endpoint)

```rust
// Add this method to the UserData impl DurableObject block

async fn delete_user_data(&mut self) -> Result<Response> {
    let conn = self.get_connection().await.map_err(|e| {
        worker::Error::RustError(format!("Database connection failed: {}", e))
    })?;
    
    // Delete all user data
    let delete_queries = [
        "DELETE FROM starred_decks",
        "DELETE FROM progress", 
        "DELETE FROM achievements",
        "DELETE FROM decks",
        "DELETE FROM preferences",
        "DELETE FROM sync_metadata",
        "DELETE FROM users",
    ];
    
    for query in delete_queries {
        if let Err(e) = conn.execute(query, []) {
            return Response::error(&format!("Delete failed: {}", e), 500);
        }
    }
    
    Response::ok("User data deleted")
}
```

And add this route to the fetch method:

```rust
(Method::Post, "/delete") => self.delete_user_data().await,
```

### 5. Add CORS Headers

**File**: `backend/src/utils/cors.rs` (New file)

```rust
use worker::*;

pub fn add_cors_headers(response: Response) -> Result<Response> {
    response.with_headers([
        ("Access-Control-Allow-Origin", "*"),
        ("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS"),
        ("Access-Control-Allow-Headers", "Content-Type, Authorization"),
        ("Access-Control-Max-Age", "86400"),
    ].iter().cloned())
}

pub async fn handle_options_request(_req: Request, _ctx: RouteContext<()>) -> Result<Response> {
    let response = Response::empty()?;
    add_cors_headers(response)
}
```

### 6. Update Main Router with CORS

**File**: `backend/src/lib.rs` (Add CORS support)

```rust
// Add CORS import
use utils::cors::*;

// Update the main function to add CORS to all responses
#[event(fetch)]
pub async fn main(req: Request, env: Env, ctx: Context) -> Result<Response> {
    console_error_panic_hook::set_once();
    
    let router = Router::new();
    
    let response = router
        .get("/", |_, _| Response::ok("MyFlashPlay Backend API"))
        .get("/health", health_check)
        .options("/*", handle_options_request)
        // ... all other routes
        .run(req, env)
        .await?;
    
    add_cors_headers(response)
}
```

## Testing Instructions

### 1. Test API Endpoints

```bash
cd backend
cargo test
```

### 2. Test with Curl

```bash
# Register
curl -X POST http://localhost:8787/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "test123"}'

# Login and get token
TOKEN=$(curl -X POST http://localhost:8787/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "test123"}' \
  | jq -r '.token')

# Test protected endpoints
curl -X GET http://localhost:8787/user/profile \
  -H "Authorization: Bearer $TOKEN"

curl -X GET http://localhost:8787/sync/decks \
  -H "Authorization: Bearer $TOKEN"
```

### 3. Test CORS

```bash
curl -X OPTIONS http://localhost:8787/auth/login \
  -H "Origin: http://localhost:3000" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type"
```

## Common Issues and Solutions

### Issue 1: Authentication Failures
- **Problem**: JWT tokens not being validated correctly
- **Solution**: Ensure JWT_SECRET is set correctly in environment
- **Fallback**: Add debug logging to auth middleware

### Issue 2: CORS Issues
- **Problem**: Browser blocks requests due to CORS policy
- **Solution**: Ensure all responses include proper CORS headers
- **Fallback**: Add preflight OPTIONS handler for all routes

### Issue 3: Durable Object Errors
- **Problem**: Cannot access user's Durable Object
- **Solution**: Verify namespace configuration and user email format
- **Fallback**: Add error handling for Durable Object creation

### Issue 4: Sync Conflicts
- **Problem**: Data conflicts between local and server
- **Solution**: Implement proper conflict resolution logic
- **Fallback**: Use last-write-wins strategy temporarily

## Design Decisions

1. **RESTful API**: Standard REST endpoints for predictable behavior
2. **JWT Authentication**: Stateless authentication for scalability
3. **Conflict Resolution**: Timestamp-based merging with future enhancement support
4. **Error Handling**: Consistent error response format
5. **CORS Support**: Enable cross-origin requests for web clients

## Performance Optimizations

1. **Batch Operations**: Support for bulk sync operations
2. **Conditional Requests**: Last-sync timestamps to minimize data transfer
3. **Efficient Queries**: Indexed database queries for fast lookups
4. **Connection Reuse**: Reuse database connections within Durable Objects

## Security Measures

1. **Authentication Required**: All endpoints require valid JWT tokens
2. **Data Isolation**: Users can only access their own data
3. **Input Validation**: All inputs validated before processing
4. **SQL Injection Prevention**: Parameterized queries only

## Next Steps

After completing this stage:

1. Run `cargo test` to verify all endpoints work correctly
2. Test with actual HTTP requests using curl or Postman
3. Verify CORS headers are working properly
4. Proceed to Stage 5: Sync Logic and Conflict Resolution

This stage provides a complete API layer for all data operations and user management, with proper authentication and error handling.