# Stage 3: Authentication System

## Overview

This stage implements the complete authentication system with double password hashing, JWT tokens, and secure user registration/login functionality. The system uses client-side hashing for initial password protection and server-side hashing for storage.

## Authentication Flow

1. **Registration**: Client hashes password → Server generates UUID v7 → Server hashes again → Store in database
2. **Login**: Client hashes password → Server retrieves user → Server verifies hashed password → Generate JWT
3. **Authorization**: JWT validation on protected endpoints

## Files to Create/Modify

### 1. Update Authentication Service

**File**: `backend/src/auth/service.rs` (Replace entire content)

```rust
use uuid::Uuid;
use chrono::Utc;
use worker::*;
use crate::models::*;
use crate::utils::*;
use crate::db::*;
use crate::auth::jwt::*;

pub struct AuthService {
    env: Env,
}

impl AuthService {
    pub fn new(env: Env) -> Self {
        Self { env }
    }
    
    pub async fn register_user(&self, email: &str, client_hashed_password: &str) -> Result<AuthResponse> {
        // Validate input
        if !validate_email(email) {
            return Ok(AuthResponse {
                success: false,
                token: None,
                user_id: None,
                message: "Invalid email format".to_string(),
            });
        }
        
        if client_hashed_password.is_empty() {
            return Ok(AuthResponse {
                success: false,
                token: None,
                user_id: None,
                message: "Password cannot be empty".to_string(),
            });
        }
        
        // Get user's Durable Object
        let user_data_ns = self.env.durable_object("USER_DATA")?;
        let user_stub = user_data_ns.id_from_name(email)?.get_stub()?;
        
        // Check if user already exists
        let check_req = Request::new_with_init(
            "http://user-data/user",
            RequestInit::new().with_method(Method::Get),
        )?;
        
        let response = user_stub.fetch_with_request(check_req).await?;
        if response.status_code() == 200 {
            return Ok(AuthResponse {
                success: false,
                token: None,
                user_id: None,
                message: "User already exists".to_string(),
            });
        }
        
        // Generate user data
        let user_id = generate_user_id();
        let server_password_hash = hash_password(client_hashed_password);
        let now = Utc::now();
        
        let user = User {
            id: user_id,
            email: email.to_string(),
            password_hash: server_password_hash,
            created_at: now,
            updated_at: now,
            last_login: None,
        };
        
        // Save user to Durable Object
        let save_req = Request::new_with_init(
            "http://user-data/user",
            RequestInit::new()
                .with_method(Method::Post)
                .with_body(Some(serde_json::to_string(&user)?.into())),
        )?;
        
        let save_response = user_stub.fetch_with_request(save_req).await?;
        if save_response.status_code() != 200 {
            return Ok(AuthResponse {
                success: false,
                token: None,
                user_id: None,
                message: "Failed to create user".to_string(),
            });
        }
        
        // Create default preferences
        let preferences = UserPreferences {
            user_id,
            theme: "light".to_string(),
            language: "en".to_string(),
            sound_enabled: true,
            notifications_enabled: true,
            auto_advance: false,
            study_reminders: true,
            updated_at: now,
            version: 1,
        };
        
        let prefs_req = Request::new_with_init(
            "http://user-data/preferences",
            RequestInit::new()
                .with_method(Method::Post)
                .with_body(Some(serde_json::to_string(&preferences)?.into())),
        )?;
        
        let _ = user_stub.fetch_with_request(prefs_req).await?;
        
        // Generate JWT token
        let jwt_secret = self.env.secret("JWT_SECRET")?.to_string();
        match create_jwt(user_id, email, &jwt_secret) {
            Ok(token) => Ok(AuthResponse {
                success: true,
                token: Some(token),
                user_id: Some(user_id),
                message: "Registration successful".to_string(),
            }),
            Err(e) => Ok(AuthResponse {
                success: false,
                token: None,
                user_id: None,
                message: format!("Token generation failed: {}", e),
            }),
        }
    }
    
    pub async fn login_user(&self, email: &str, client_hashed_password: &str) -> Result<AuthResponse> {
        // Validate input
        if !validate_email(email) {
            return Ok(AuthResponse {
                success: false,
                token: None,
                user_id: None,
                message: "Invalid email format".to_string(),
            });
        }
        
        if client_hashed_password.is_empty() {
            return Ok(AuthResponse {
                success: false,
                token: None,
                user_id: None,
                message: "Password cannot be empty".to_string(),
            });
        }
        
        // Get user's Durable Object
        let user_data_ns = self.env.durable_object("USER_DATA")?;
        let user_stub = user_data_ns.id_from_name(email)?.get_stub()?;
        
        // Get user data
        let get_req = Request::new_with_init(
            "http://user-data/user",
            RequestInit::new().with_method(Method::Get),
        )?;
        
        let response = user_stub.fetch_with_request(get_req).await?;
        if response.status_code() != 200 {
            return Ok(AuthResponse {
                success: false,
                token: None,
                user_id: None,
                message: "Invalid credentials".to_string(),
            });
        }
        
        let user: User = response.json().await?;
        
        // Verify password (server-side hash of client-hashed password)
        let expected_hash = hash_password(client_hashed_password);
        if !verify_password_hash(&expected_hash, &user.password_hash) {
            return Ok(AuthResponse {
                success: false,
                token: None,
                user_id: None,
                message: "Invalid credentials".to_string(),
            });
        }
        
        // Update last login
        let mut updated_user = user.clone();
        updated_user.last_login = Some(Utc::now());
        updated_user.updated_at = Utc::now();
        
        let update_req = Request::new_with_init(
            "http://user-data/user",
            RequestInit::new()
                .with_method(Method::Post)
                .with_body(Some(serde_json::to_string(&updated_user)?.into())),
        )?;
        
        let _ = user_stub.fetch_with_request(update_req).await?;
        
        // Generate JWT token
        let jwt_secret = self.env.secret("JWT_SECRET")?.to_string();
        match create_jwt(user.id, email, &jwt_secret) {
            Ok(token) => Ok(AuthResponse {
                success: true,
                token: Some(token),
                user_id: Some(user.id),
                message: "Login successful".to_string(),
            }),
            Err(e) => Ok(AuthResponse {
                success: false,
                token: None,
                user_id: None,
                message: format!("Token generation failed: {}", e),
            }),
        }
    }
    
    pub async fn validate_token(&self, token: &str) -> Result<Claims> {
        let jwt_secret = self.env.secret("JWT_SECRET")?.to_string();
        verify_jwt(token, &jwt_secret)
            .map_err(|e| worker::Error::RustError(e))
    }
    
    pub async fn get_user_from_token(&self, token: &str) -> Result<User> {
        let claims = self.validate_token(token).await?;
        let email = claims.email;
        
        // Get user's Durable Object
        let user_data_ns = self.env.durable_object("USER_DATA")?;
        let user_stub = user_data_ns.id_from_name(&email)?.get_stub()?;
        
        // Get user data
        let get_req = Request::new_with_init(
            "http://user-data/user",
            RequestInit::new().with_method(Method::Get),
        )?;
        
        let response = user_stub.fetch_with_request(get_req).await?;
        if response.status_code() != 200 {
            return Err(worker::Error::RustError("User not found".to_string()));
        }
        
        let user: User = response.json().await?;
        Ok(user)
    }
}
```

### 2. Update JWT Module

**File**: `backend/src/auth/jwt.rs` (Replace entire content)

```rust
use jsonwebtoken::{encode, decode, Header, Algorithm, Validation, EncodingKey, DecodingKey};
use serde::{Deserialize, Serialize};
use uuid::Uuid;
use chrono::{Utc, Duration};
use worker::*;

#[derive(Debug, Serialize, Deserialize)]
pub struct Claims {
    pub sub: String, // User ID
    pub email: String,
    pub iat: i64,
    pub exp: i64,
}

pub fn create_jwt(user_id: Uuid, email: &str, secret: &str) -> Result<String> {
    let now = Utc::now();
    let expiration = now + Duration::hours(24);
    
    let claims = Claims {
        sub: user_id.to_string(),
        email: email.to_string(),
        iat: now.timestamp(),
        exp: expiration.timestamp(),
    };
    
    encode(&Header::default(), &claims, &EncodingKey::from_secret(secret.as_ref()))
        .map_err(|e| worker::Error::RustError(format!("JWT creation failed: {}", e)))
}

pub fn verify_jwt(token: &str, secret: &str) -> Result<Claims> {
    let mut validation = Validation::default();
    validation.algorithms = vec![Algorithm::HS256];
    
    decode::<Claims>(
        token,
        &DecodingKey::from_secret(secret.as_ref()),
        &validation,
    )
    .map(|data| data.claims)
    .map_err(|e| worker::Error::RustError(format!("JWT verification failed: {}", e)))
}

pub fn extract_token_from_header(authorization: &str) -> Option<&str> {
    authorization.strip_prefix("Bearer ")
}

pub async fn authenticate_request(req: &Request, env: &Env) -> Result<User> {
    let headers = req.headers();
    let auth_header = headers.get("Authorization")?;
    
    if let Some(auth_header) = auth_header {
        if let Some(token) = extract_token_from_header(&auth_header) {
            let auth_service = crate::auth::AuthService::new(env.clone());
            return auth_service.get_user_from_token(token).await;
        }
    }
    
    Err(worker::Error::RustError("No valid authentication token found".to_string()))
}
```

### 3. Update Authentication Handlers

**File**: `backend/src/handlers/auth.rs` (Replace entire content)

```rust
use worker::*;
use crate::models::*;
use crate::auth::AuthService;
use crate::utils::*;

pub async fn register(mut req: Request, ctx: RouteContext<()>) -> Result<Response> {
    let request: RegisterRequest = match req.json().await {
        Ok(req) => req,
        Err(_) => {
            return create_error_response(
                "invalid_request",
                "Invalid JSON in request body",
                400,
            );
        }
    };
    
    // Validate request
    if request.email.is_empty() {
        return create_error_response(
            "validation_error",
            "Email is required",
            400,
        );
    }
    
    if request.password.is_empty() {
        return create_error_response(
            "validation_error",
            "Password is required",
            400,
        );
    }
    
    // Create auth service
    let auth_service = AuthService::new(ctx.env.clone());
    
    // Register user
    match auth_service.register_user(&request.email, &request.password).await {
        Ok(response) => {
            if response.success {
                Response::from_json(&response)
            } else {
                create_error_response(
                    "registration_failed",
                    &response.message,
                    400,
                )
            }
        }
        Err(e) => {
            create_error_response(
                "server_error",
                &format!("Registration failed: {}", e),
                500,
            )
        }
    }
}

pub async fn login(mut req: Request, ctx: RouteContext<()>) -> Result<Response> {
    let request: LoginRequest = match req.json().await {
        Ok(req) => req,
        Err(_) => {
            return create_error_response(
                "invalid_request",
                "Invalid JSON in request body",
                400,
            );
        }
    };
    
    // Validate request
    if request.email.is_empty() {
        return create_error_response(
            "validation_error",
            "Email is required",
            400,
        );
    }
    
    if request.password.is_empty() {
        return create_error_response(
            "validation_error",
            "Password is required",
            400,
        );
    }
    
    // Create auth service
    let auth_service = AuthService::new(ctx.env.clone());
    
    // Login user
    match auth_service.login_user(&request.email, &request.password).await {
        Ok(response) => {
            if response.success {
                Response::from_json(&response)
            } else {
                create_error_response(
                    "login_failed",
                    &response.message,
                    401,
                )
            }
        }
        Err(e) => {
            create_error_response(
                "server_error",
                &format!("Login failed: {}", e),
                500,
            )
        }
    }
}

pub async fn logout(req: Request, ctx: RouteContext<()>) -> Result<Response> {
    // For JWT-based auth, logout is handled client-side by discarding the token
    // In the future, we could implement a token blacklist for enhanced security
    
    let response = AuthResponse {
        success: true,
        token: None,
        user_id: None,
        message: "Logout successful".to_string(),
    };
    
    Response::from_json(&response)
}

pub async fn refresh_token(req: Request, ctx: RouteContext<()>) -> Result<Response> {
    // Authenticate current token
    match crate::auth::authenticate_request(&req, &ctx.env).await {
        Ok(user) => {
            // Generate new token
            let auth_service = AuthService::new(ctx.env.clone());
            let jwt_secret = ctx.env.secret("JWT_SECRET")?.to_string();
            
            match crate::auth::create_jwt(user.id, &user.email, &jwt_secret) {
                Ok(new_token) => {
                    let response = AuthResponse {
                        success: true,
                        token: Some(new_token),
                        user_id: Some(user.id),
                        message: "Token refreshed successfully".to_string(),
                    };
                    Response::from_json(&response)
                }
                Err(e) => {
                    create_error_response(
                        "token_generation_failed",
                        &format!("Failed to generate new token: {}", e),
                        500,
                    )
                }
            }
        }
        Err(_) => {
            create_error_response(
                "authentication_failed",
                "Invalid or expired token",
                401,
            )
        }
    }
}

pub async fn validate_token(req: Request, ctx: RouteContext<()>) -> Result<Response> {
    match crate::auth::authenticate_request(&req, &ctx.env).await {
        Ok(user) => {
            #[derive(serde::Serialize)]
            struct TokenValidationResponse {
                valid: bool,
                user_id: uuid::Uuid,
                email: String,
            }
            
            let response = TokenValidationResponse {
                valid: true,
                user_id: user.id,
                email: user.email,
            };
            
            Response::from_json(&response)
        }
        Err(_) => {
            create_error_response(
                "invalid_token",
                "Token is invalid or expired",
                401,
            )
        }
    }
}
```

### 4. Update Crypto Utils

**File**: `backend/src/utils/crypto.rs` (Replace entire content)

```rust
use sha2::{Sha256, Digest};
use uuid::Uuid;
use chrono::Utc;
use argon2::{Argon2, PasswordHash, PasswordHasher, PasswordVerifier};
use argon2::password_hash::{rand_core::OsRng, SaltString};

pub fn hash_password(password: &str) -> String {
    let mut hasher = Sha256::new();
    hasher.update(password.as_bytes());
    hex::encode(hasher.finalize())
}

pub fn hash_password_secure(password: &str) -> Result<String, argon2::password_hash::Error> {
    let salt = SaltString::generate(&mut OsRng);
    let argon2 = Argon2::default();
    let password_hash = argon2.hash_password(password.as_bytes(), &salt)?;
    Ok(password_hash.to_string())
}

pub fn verify_password_hash(password: &str, hash: &str) -> bool {
    hash_password(password) == hash
}

pub fn verify_password_secure(password: &str, hash: &str) -> bool {
    let parsed_hash = match PasswordHash::new(hash) {
        Ok(hash) => hash,
        Err(_) => return false,
    };
    
    let argon2 = Argon2::default();
    argon2.verify_password(password.as_bytes(), &parsed_hash).is_ok()
}

pub fn generate_user_id() -> Uuid {
    Uuid::now_v7()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_password_hashing() {
        let password = "test_password";
        let hash = hash_password(password);
        assert!(verify_password_hash(password, &hash));
        assert!(!verify_password_hash("wrong_password", &hash));
    }

    #[test]
    fn test_secure_password_hashing() {
        let password = "test_password";
        let hash = hash_password_secure(password).unwrap();
        assert!(verify_password_secure(password, &hash));
        assert!(!verify_password_secure("wrong_password", &hash));
    }

    #[test]
    fn test_uuid_generation() {
        let id1 = generate_user_id();
        let id2 = generate_user_id();
        assert_ne!(id1, id2);
    }
}
```

### 5. Update Main Router

**File**: `backend/src/lib.rs` (Update router section)

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
        // Authentication routes
        .post("/auth/register", auth::register)
        .post("/auth/login", auth::login)
        .post("/auth/logout", auth::logout)
        .post("/auth/refresh", auth::refresh_token)
        .get("/auth/validate", auth::validate_token)
        // Protected user routes
        .get("/user/profile", user::get_profile)
        .put("/user/profile", user::update_profile)
        // Protected sync routes
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

## Testing Instructions

### 1. Create Authentication Tests

**File**: `backend/src/auth/tests.rs` (New file)

```rust
#[cfg(test)]
mod tests {
    use super::*;
    use worker::*;

    #[tokio::test]
    async fn test_jwt_creation_and_verification() {
        let user_id = Uuid::new_v4();
        let email = "test@example.com";
        let secret = "test_secret";
        
        let token = create_jwt(user_id, email, secret).unwrap();
        assert!(!token.is_empty());
        
        let claims = verify_jwt(&token, secret).unwrap();
        assert_eq!(claims.sub, user_id.to_string());
        assert_eq!(claims.email, email);
    }
    
    #[test]
    fn test_token_extraction() {
        let auth_header = "Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9";
        let token = extract_token_from_header(auth_header).unwrap();
        assert_eq!(token, "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9");
        
        let invalid_header = "Invalid header";
        assert!(extract_token_from_header(invalid_header).is_none());
    }
}
```

### 2. Test Registration and Login Flow

```bash
cd backend
cargo test auth::tests
```

Expected output: All authentication tests pass

### 3. Test Password Hashing

```bash
cargo test crypto::tests
```

Expected output: All crypto tests pass

### 4. Integration Test with Curl (after deployment)

```bash
# Register a user
curl -X POST https://your-worker.workers.dev/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "hashed_password_from_client"}'

# Login
curl -X POST https://your-worker.workers.dev/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "hashed_password_from_client"}'

# Validate token
curl -X GET https://your-worker.workers.dev/auth/validate \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## Common Issues and Solutions

### Issue 1: JWT Secret Missing
- **Problem**: JWT_SECRET environment variable not set
- **Solution**: Add JWT_SECRET to wrangler.toml vars section
- **Fallback**: Use a default secret for development (never in production)

### Issue 2: Password Hashing Failures
- **Problem**: Argon2 hashing fails in Workers environment
- **Solution**: Use SHA256 as primary hashing method
- **Fallback**: Implement simpler hash function if needed

### Issue 3: Durable Object Access Issues
- **Problem**: Cannot access user's Durable Object
- **Solution**: Ensure proper namespace configuration in wrangler.toml
- **Fallback**: Use email as consistent key for Durable Object access

### Issue 4: CORS Issues
- **Problem**: Browser blocks API requests
- **Solution**: Add proper CORS headers to all responses
- **Fallback**: Implement preflight OPTIONS handler

## Security Considerations

1. **Double Hashing**: Client-side SHA256 + server-side SHA256 for enhanced security
2. **JWT Expiration**: 24-hour token expiration with refresh capability
3. **Password Validation**: Strong password requirements on client and server
4. **Rate Limiting**: Consider implementing rate limiting for auth endpoints
5. **Input Sanitization**: All inputs are validated and sanitized

## Design Decisions

1. **JWT over Sessions**: Stateless authentication for scalability
2. **Durable Object per User**: Data isolation and consistency
3. **Double Password Hashing**: Enhanced security layer
4. **UUID v7**: Time-sortable user IDs for better performance
5. **Refresh Token Support**: Seamless token renewal for better UX

## Performance Optimizations

1. **Token Caching**: JWT validation doesn't require database lookup
2. **Durable Object Reuse**: Single object per user for all operations
3. **Efficient Hashing**: SHA256 for better performance than bcrypt
4. **Minimal Database Calls**: Authentication data cached in JWT claims

## Next Steps

After completing this stage and ensuring all tests pass:

1. Run `cargo test` to verify all authentication functionality works
2. Run `cargo check` to ensure no compilation errors
3. Test with actual HTTP requests if possible
4. Proceed to Stage 4: Core API Endpoints

This stage provides a complete and secure authentication system that will protect all API endpoints in the next stage.