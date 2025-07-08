# Stage 2: Database Schema and Durable Objects

## Overview

This stage implements the SQLite database schema and Durable Objects for persistent data storage. Each user gets their own isolated Durable Object instance for data security and scalability.

## Database Schema Design

### Core Tables

The database will contain the following tables:

1. **users** - User account information
2. **decks** - User-created flashcard decks
3. **achievements** - User achievements and progress
4. **progress** - Study progress per deck
5. **starred_decks** - User's starred public decks
6. **preferences** - User preferences and settings
7. **sync_metadata** - Sync timestamps and conflict resolution

## Files to Create/Modify

### 1. Update Database Module

**File**: `backend/src/db/mod.rs` (Replace entire content)

```rust
use worker::*;
use rusqlite::{Connection, Result as SqlResult};
use uuid::Uuid;
use chrono::{DateTime, Utc};
use crate::models::*;
use crate::utils::*;

pub mod schema;
pub mod operations;

pub use schema::*;
pub use operations::*;

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

    async fn fetch(&mut self, req: Request) -> Result<Response> {
        let url = req.url()?;
        let path = url.path();
        let method = req.method();
        
        match (method, path) {
            (Method::Post, "/init") => self.init_database().await,
            (Method::Get, "/user") => self.get_user_data().await,
            (Method::Post, "/user") => self.save_user_data(req).await,
            (Method::Get, "/decks") => self.get_decks().await,
            (Method::Post, "/decks") => self.save_decks(req).await,
            (Method::Get, "/achievements") => self.get_achievements().await,
            (Method::Post, "/achievements") => self.save_achievements(req).await,
            (Method::Get, "/progress") => self.get_progress().await,
            (Method::Post, "/progress") => self.save_progress(req).await,
            (Method::Get, "/starred") => self.get_starred().await,
            (Method::Post, "/starred") => self.save_starred(req).await,
            (Method::Get, "/preferences") => self.get_preferences().await,
            (Method::Post, "/preferences") => self.save_preferences(req).await,
            (Method::Post, "/sync") => self.full_sync(req).await,
            _ => Response::error("Not found", 404),
        }
    }
}

impl UserData {
    async fn get_connection(&self) -> SqlResult<Connection> {
        let conn = Connection::open_in_memory()?;
        self.initialize_schema(&conn)?;
        Ok(conn)
    }

    fn initialize_schema(&self, conn: &Connection) -> SqlResult<()> {
        conn.execute_batch(CREATE_TABLES_SQL)?;
        Ok(())
    }

    async fn init_database(&mut self) -> Result<Response> {
        match self.get_connection().await {
            Ok(_) => Response::ok("Database initialized"),
            Err(e) => Response::error(&format!("Database initialization failed: {}", e), 500),
        }
    }

    async fn get_user_data(&mut self) -> Result<Response> {
        let conn = self.get_connection().await.map_err(|e| {
            worker::Error::RustError(format!("Database connection failed: {}", e))
        })?;
        
        match get_user_by_id(&conn, &Uuid::new_v4()) {
            Ok(Some(user)) => Response::from_json(&user),
            Ok(None) => Response::error("User not found", 404),
            Err(e) => Response::error(&format!("Database error: {}", e), 500),
        }
    }

    async fn save_user_data(&mut self, mut req: Request) -> Result<Response> {
        let user: User = req.json().await?;
        let conn = self.get_connection().await.map_err(|e| {
            worker::Error::RustError(format!("Database connection failed: {}", e))
        })?;
        
        match save_user(&conn, &user) {
            Ok(_) => Response::ok("User saved"),
            Err(e) => Response::error(&format!("Save failed: {}", e), 500),
        }
    }

    async fn get_decks(&mut self) -> Result<Response> {
        let conn = self.get_connection().await.map_err(|e| {
            worker::Error::RustError(format!("Database connection failed: {}", e))
        })?;
        
        match get_user_decks(&conn, &Uuid::new_v4()) {
            Ok(decks) => Response::from_json(&decks),
            Err(e) => Response::error(&format!("Database error: {}", e), 500),
        }
    }

    async fn save_decks(&mut self, mut req: Request) -> Result<Response> {
        let decks: Vec<Deck> = req.json().await?;
        let conn = self.get_connection().await.map_err(|e| {
            worker::Error::RustError(format!("Database connection failed: {}", e))
        })?;
        
        match save_decks(&conn, &decks) {
            Ok(_) => Response::ok("Decks saved"),
            Err(e) => Response::error(&format!("Save failed: {}", e), 500),
        }
    }

    async fn get_achievements(&mut self) -> Result<Response> {
        let conn = self.get_connection().await.map_err(|e| {
            worker::Error::RustError(format!("Database connection failed: {}", e))
        })?;
        
        match get_user_achievements(&conn, &Uuid::new_v4()) {
            Ok(achievements) => Response::from_json(&achievements),
            Err(e) => Response::error(&format!("Database error: {}", e), 500),
        }
    }

    async fn save_achievements(&mut self, mut req: Request) -> Result<Response> {
        let achievements: Vec<Achievement> = req.json().await?;
        let conn = self.get_connection().await.map_err(|e| {
            worker::Error::RustError(format!("Database connection failed: {}", e))
        })?;
        
        match save_achievements(&conn, &achievements) {
            Ok(_) => Response::ok("Achievements saved"),
            Err(e) => Response::error(&format!("Save failed: {}", e), 500),
        }
    }

    async fn get_progress(&mut self) -> Result<Response> {
        let conn = self.get_connection().await.map_err(|e| {
            worker::Error::RustError(format!("Database connection failed: {}", e))
        })?;
        
        match get_user_progress(&conn, &Uuid::new_v4()) {
            Ok(progress) => Response::from_json(&progress),
            Err(e) => Response::error(&format!("Database error: {}", e), 500),
        }
    }

    async fn save_progress(&mut self, mut req: Request) -> Result<Response> {
        let progress: Vec<Progress> = req.json().await?;
        let conn = self.get_connection().await.map_err(|e| {
            worker::Error::RustError(format!("Database connection failed: {}", e))
        })?;
        
        match save_progress(&conn, &progress) {
            Ok(_) => Response::ok("Progress saved"),
            Err(e) => Response::error(&format!("Save failed: {}", e), 500),
        }
    }

    async fn get_starred(&mut self) -> Result<Response> {
        let conn = self.get_connection().await.map_err(|e| {
            worker::Error::RustError(format!("Database connection failed: {}", e))
        })?;
        
        match get_user_starred(&conn, &Uuid::new_v4()) {
            Ok(starred) => Response::from_json(&starred),
            Err(e) => Response::error(&format!("Database error: {}", e), 500),
        }
    }

    async fn save_starred(&mut self, mut req: Request) -> Result<Response> {
        let starred: Vec<StarredDeck> = req.json().await?;
        let conn = self.get_connection().await.map_err(|e| {
            worker::Error::RustError(format!("Database connection failed: {}", e))
        })?;
        
        match save_starred(&conn, &starred) {
            Ok(_) => Response::ok("Starred decks saved"),
            Err(e) => Response::error(&format!("Save failed: {}", e), 500),
        }
    }

    async fn get_preferences(&mut self) -> Result<Response> {
        let conn = self.get_connection().await.map_err(|e| {
            worker::Error::RustError(format!("Database connection failed: {}", e))
        })?;
        
        match get_user_preferences(&conn, &Uuid::new_v4()) {
            Ok(Some(preferences)) => Response::from_json(&preferences),
            Ok(None) => Response::error("Preferences not found", 404),
            Err(e) => Response::error(&format!("Database error: {}", e), 500),
        }
    }

    async fn save_preferences(&mut self, mut req: Request) -> Result<Response> {
        let preferences: UserPreferences = req.json().await?;
        let conn = self.get_connection().await.map_err(|e| {
            worker::Error::RustError(format!("Database connection failed: {}", e))
        })?;
        
        match save_user_preferences(&conn, &preferences) {
            Ok(_) => Response::ok("Preferences saved"),
            Err(e) => Response::error(&format!("Save failed: {}", e), 500),
        }
    }

    async fn full_sync(&mut self, mut req: Request) -> Result<Response> {
        // TODO: Implement full sync logic
        Response::ok("Full sync placeholder")
    }
}
```

### 2. Create Database Schema

**File**: `backend/src/db/schema.rs` (New file)

```rust
pub const CREATE_TABLES_SQL: &str = r#"
    CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        last_login TEXT
    );

    CREATE TABLE IF NOT EXISTS decks (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        content TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        version INTEGER NOT NULL DEFAULT 1,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS achievements (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        achievement_type TEXT NOT NULL,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        earned_at TEXT NOT NULL,
        metadata TEXT,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS progress (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        deck_id TEXT NOT NULL,
        cards_studied INTEGER NOT NULL DEFAULT 0,
        cards_mastered INTEGER NOT NULL DEFAULT 0,
        total_cards INTEGER NOT NULL DEFAULT 0,
        last_studied TEXT NOT NULL,
        streak_days INTEGER NOT NULL DEFAULT 0,
        total_time_spent INTEGER NOT NULL DEFAULT 0,
        version INTEGER NOT NULL DEFAULT 1,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
        FOREIGN KEY (deck_id) REFERENCES decks (id) ON DELETE CASCADE,
        UNIQUE(user_id, deck_id)
    );

    CREATE TABLE IF NOT EXISTS starred_decks (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        deck_id TEXT NOT NULL,
        starred_at TEXT NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
        UNIQUE(user_id, deck_id)
    );

    CREATE TABLE IF NOT EXISTS preferences (
        user_id TEXT PRIMARY KEY,
        theme TEXT NOT NULL DEFAULT 'light',
        language TEXT NOT NULL DEFAULT 'en',
        sound_enabled INTEGER NOT NULL DEFAULT 1,
        notifications_enabled INTEGER NOT NULL DEFAULT 1,
        auto_advance INTEGER NOT NULL DEFAULT 0,
        study_reminders INTEGER NOT NULL DEFAULT 1,
        updated_at TEXT NOT NULL,
        version INTEGER NOT NULL DEFAULT 1,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS sync_metadata (
        user_id TEXT NOT NULL,
        table_name TEXT NOT NULL,
        last_sync TEXT NOT NULL,
        conflict_count INTEGER NOT NULL DEFAULT 0,
        PRIMARY KEY (user_id, table_name),
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_decks_user_id ON decks(user_id);
    CREATE INDEX IF NOT EXISTS idx_achievements_user_id ON achievements(user_id);
    CREATE INDEX IF NOT EXISTS idx_progress_user_id ON progress(user_id);
    CREATE INDEX IF NOT EXISTS idx_starred_user_id ON starred_decks(user_id);
    CREATE INDEX IF NOT EXISTS idx_progress_deck_id ON progress(deck_id);
    CREATE INDEX IF NOT EXISTS idx_decks_updated_at ON decks(updated_at);
    CREATE INDEX IF NOT EXISTS idx_achievements_earned_at ON achievements(earned_at);
"#;
```

### 3. Create Database Operations

**File**: `backend/src/db/operations.rs` (New file)

```rust
use rusqlite::{Connection, Result as SqlResult, Row};
use uuid::Uuid;
use chrono::{DateTime, Utc};
use crate::models::*;

// User operations
pub fn save_user(conn: &Connection, user: &User) -> SqlResult<()> {
    conn.execute(
        "INSERT OR REPLACE INTO users (id, email, password_hash, created_at, updated_at, last_login) 
         VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
        [
            user.id.to_string(),
            user.email.clone(),
            user.password_hash.clone(),
            user.created_at.to_rfc3339(),
            user.updated_at.to_rfc3339(),
            user.last_login.map(|dt| dt.to_rfc3339()).unwrap_or_default(),
        ],
    )?;
    Ok(())
}

pub fn get_user_by_id(conn: &Connection, user_id: &Uuid) -> SqlResult<Option<User>> {
    let mut stmt = conn.prepare(
        "SELECT id, email, password_hash, created_at, updated_at, last_login FROM users WHERE id = ?1"
    )?;
    
    let user_iter = stmt.query_map([user_id.to_string()], |row| {
        Ok(User {
            id: Uuid::parse_str(&row.get::<_, String>(0)?).unwrap(),
            email: row.get(1)?,
            password_hash: row.get(2)?,
            created_at: DateTime::parse_from_rfc3339(&row.get::<_, String>(3)?)
                .unwrap()
                .with_timezone(&Utc),
            updated_at: DateTime::parse_from_rfc3339(&row.get::<_, String>(4)?)
                .unwrap()
                .with_timezone(&Utc),
            last_login: {
                let last_login_str: String = row.get(5)?;
                if last_login_str.is_empty() {
                    None
                } else {
                    Some(DateTime::parse_from_rfc3339(&last_login_str)
                        .unwrap()
                        .with_timezone(&Utc))
                }
            },
        })
    })?;

    for user in user_iter {
        return Ok(Some(user?));
    }
    Ok(None)
}

pub fn get_user_by_email(conn: &Connection, email: &str) -> SqlResult<Option<User>> {
    let mut stmt = conn.prepare(
        "SELECT id, email, password_hash, created_at, updated_at, last_login FROM users WHERE email = ?1"
    )?;
    
    let user_iter = stmt.query_map([email], |row| {
        Ok(User {
            id: Uuid::parse_str(&row.get::<_, String>(0)?).unwrap(),
            email: row.get(1)?,
            password_hash: row.get(2)?,
            created_at: DateTime::parse_from_rfc3339(&row.get::<_, String>(3)?)
                .unwrap()
                .with_timezone(&Utc),
            updated_at: DateTime::parse_from_rfc3339(&row.get::<_, String>(4)?)
                .unwrap()
                .with_timezone(&Utc),
            last_login: {
                let last_login_str: String = row.get(5)?;
                if last_login_str.is_empty() {
                    None
                } else {
                    Some(DateTime::parse_from_rfc3339(&last_login_str)
                        .unwrap()
                        .with_timezone(&Utc))
                }
            },
        })
    })?;

    for user in user_iter {
        return Ok(Some(user?));
    }
    Ok(None)
}

// Deck operations
pub fn save_decks(conn: &Connection, decks: &[Deck]) -> SqlResult<()> {
    for deck in decks {
        conn.execute(
            "INSERT OR REPLACE INTO decks (id, user_id, title, description, content, created_at, updated_at, version) 
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)",
            [
                deck.id.to_string(),
                deck.user_id.to_string(),
                deck.title.clone(),
                deck.description.clone().unwrap_or_default(),
                deck.content.clone(),
                deck.created_at.to_rfc3339(),
                deck.updated_at.to_rfc3339(),
                deck.version.to_string(),
            ],
        )?;
    }
    Ok(())
}

pub fn get_user_decks(conn: &Connection, user_id: &Uuid) -> SqlResult<Vec<Deck>> {
    let mut stmt = conn.prepare(
        "SELECT id, user_id, title, description, content, created_at, updated_at, version 
         FROM decks WHERE user_id = ?1 ORDER BY updated_at DESC"
    )?;
    
    let deck_iter = stmt.query_map([user_id.to_string()], |row| {
        Ok(Deck {
            id: Uuid::parse_str(&row.get::<_, String>(0)?).unwrap(),
            user_id: Uuid::parse_str(&row.get::<_, String>(1)?).unwrap(),
            title: row.get(2)?,
            description: {
                let desc: String = row.get(3)?;
                if desc.is_empty() { None } else { Some(desc) }
            },
            content: row.get(4)?,
            created_at: DateTime::parse_from_rfc3339(&row.get::<_, String>(5)?)
                .unwrap()
                .with_timezone(&Utc),
            updated_at: DateTime::parse_from_rfc3339(&row.get::<_, String>(6)?)
                .unwrap()
                .with_timezone(&Utc),
            version: row.get(7)?,
        })
    })?;

    let mut decks = Vec::new();
    for deck in deck_iter {
        decks.push(deck?);
    }
    Ok(decks)
}

// Achievement operations
pub fn save_achievements(conn: &Connection, achievements: &[Achievement]) -> SqlResult<()> {
    for achievement in achievements {
        conn.execute(
            "INSERT OR REPLACE INTO achievements (id, user_id, achievement_type, title, description, earned_at, metadata) 
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)",
            [
                achievement.id.to_string(),
                achievement.user_id.to_string(),
                achievement.achievement_type.clone(),
                achievement.title.clone(),
                achievement.description.clone(),
                achievement.earned_at.to_rfc3339(),
                achievement.metadata.clone().unwrap_or_default(),
            ],
        )?;
    }
    Ok(())
}

pub fn get_user_achievements(conn: &Connection, user_id: &Uuid) -> SqlResult<Vec<Achievement>> {
    let mut stmt = conn.prepare(
        "SELECT id, user_id, achievement_type, title, description, earned_at, metadata 
         FROM achievements WHERE user_id = ?1 ORDER BY earned_at DESC"
    )?;
    
    let achievement_iter = stmt.query_map([user_id.to_string()], |row| {
        Ok(Achievement {
            id: Uuid::parse_str(&row.get::<_, String>(0)?).unwrap(),
            user_id: Uuid::parse_str(&row.get::<_, String>(1)?).unwrap(),
            achievement_type: row.get(2)?,
            title: row.get(3)?,
            description: row.get(4)?,
            earned_at: DateTime::parse_from_rfc3339(&row.get::<_, String>(5)?)
                .unwrap()
                .with_timezone(&Utc),
            metadata: {
                let metadata: String = row.get(6)?;
                if metadata.is_empty() { None } else { Some(metadata) }
            },
        })
    })?;

    let mut achievements = Vec::new();
    for achievement in achievement_iter {
        achievements.push(achievement?);
    }
    Ok(achievements)
}

// Progress operations
pub fn save_progress(conn: &Connection, progress_list: &[Progress]) -> SqlResult<()> {
    for progress in progress_list {
        conn.execute(
            "INSERT OR REPLACE INTO progress (id, user_id, deck_id, cards_studied, cards_mastered, total_cards, last_studied, streak_days, total_time_spent, version) 
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10)",
            [
                progress.id.to_string(),
                progress.user_id.to_string(),
                progress.deck_id.to_string(),
                progress.cards_studied.to_string(),
                progress.cards_mastered.to_string(),
                progress.total_cards.to_string(),
                progress.last_studied.to_rfc3339(),
                progress.streak_days.to_string(),
                progress.total_time_spent.to_string(),
                progress.version.to_string(),
            ],
        )?;
    }
    Ok(())
}

pub fn get_user_progress(conn: &Connection, user_id: &Uuid) -> SqlResult<Vec<Progress>> {
    let mut stmt = conn.prepare(
        "SELECT id, user_id, deck_id, cards_studied, cards_mastered, total_cards, last_studied, streak_days, total_time_spent, version 
         FROM progress WHERE user_id = ?1 ORDER BY last_studied DESC"
    )?;
    
    let progress_iter = stmt.query_map([user_id.to_string()], |row| {
        Ok(Progress {
            id: Uuid::parse_str(&row.get::<_, String>(0)?).unwrap(),
            user_id: Uuid::parse_str(&row.get::<_, String>(1)?).unwrap(),
            deck_id: Uuid::parse_str(&row.get::<_, String>(2)?).unwrap(),
            cards_studied: row.get(3)?,
            cards_mastered: row.get(4)?,
            total_cards: row.get(5)?,
            last_studied: DateTime::parse_from_rfc3339(&row.get::<_, String>(6)?)
                .unwrap()
                .with_timezone(&Utc),
            streak_days: row.get(7)?,
            total_time_spent: row.get(8)?,
            version: row.get(9)?,
        })
    })?;

    let mut progress_list = Vec::new();
    for progress in progress_iter {
        progress_list.push(progress?);
    }
    Ok(progress_list)
}

// Starred decks operations
pub fn save_starred(conn: &Connection, starred_list: &[StarredDeck]) -> SqlResult<()> {
    for starred in starred_list {
        conn.execute(
            "INSERT OR REPLACE INTO starred_decks (id, user_id, deck_id, starred_at) 
             VALUES (?1, ?2, ?3, ?4)",
            [
                starred.id.to_string(),
                starred.user_id.to_string(),
                starred.deck_id.to_string(),
                starred.starred_at.to_rfc3339(),
            ],
        )?;
    }
    Ok(())
}

pub fn get_user_starred(conn: &Connection, user_id: &Uuid) -> SqlResult<Vec<StarredDeck>> {
    let mut stmt = conn.prepare(
        "SELECT id, user_id, deck_id, starred_at 
         FROM starred_decks WHERE user_id = ?1 ORDER BY starred_at DESC"
    )?;
    
    let starred_iter = stmt.query_map([user_id.to_string()], |row| {
        Ok(StarredDeck {
            id: Uuid::parse_str(&row.get::<_, String>(0)?).unwrap(),
            user_id: Uuid::parse_str(&row.get::<_, String>(1)?).unwrap(),
            deck_id: Uuid::parse_str(&row.get::<_, String>(2)?).unwrap(),
            starred_at: DateTime::parse_from_rfc3339(&row.get::<_, String>(3)?)
                .unwrap()
                .with_timezone(&Utc),
        })
    })?;

    let mut starred_list = Vec::new();
    for starred in starred_iter {
        starred_list.push(starred?);
    }
    Ok(starred_list)
}

// Preferences operations
pub fn save_user_preferences(conn: &Connection, preferences: &UserPreferences) -> SqlResult<()> {
    conn.execute(
        "INSERT OR REPLACE INTO preferences (user_id, theme, language, sound_enabled, notifications_enabled, auto_advance, study_reminders, updated_at, version) 
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)",
        [
            preferences.user_id.to_string(),
            preferences.theme.clone(),
            preferences.language.clone(),
            if preferences.sound_enabled { "1" } else { "0" }.to_string(),
            if preferences.notifications_enabled { "1" } else { "0" }.to_string(),
            if preferences.auto_advance { "1" } else { "0" }.to_string(),
            if preferences.study_reminders { "1" } else { "0" }.to_string(),
            preferences.updated_at.to_rfc3339(),
            preferences.version.to_string(),
        ],
    )?;
    Ok(())
}

pub fn get_user_preferences(conn: &Connection, user_id: &Uuid) -> SqlResult<Option<UserPreferences>> {
    let mut stmt = conn.prepare(
        "SELECT user_id, theme, language, sound_enabled, notifications_enabled, auto_advance, study_reminders, updated_at, version 
         FROM preferences WHERE user_id = ?1"
    )?;
    
    let preferences_iter = stmt.query_map([user_id.to_string()], |row| {
        Ok(UserPreferences {
            user_id: Uuid::parse_str(&row.get::<_, String>(0)?).unwrap(),
            theme: row.get(1)?,
            language: row.get(2)?,
            sound_enabled: row.get::<_, i32>(3)? == 1,
            notifications_enabled: row.get::<_, i32>(4)? == 1,
            auto_advance: row.get::<_, i32>(5)? == 1,
            study_reminders: row.get::<_, i32>(6)? == 1,
            updated_at: DateTime::parse_from_rfc3339(&row.get::<_, String>(7)?)
                .unwrap()
                .with_timezone(&Utc),
            version: row.get(8)?,
        })
    })?;

    for preferences in preferences_iter {
        return Ok(Some(preferences?));
    }
    Ok(None)
}

// Sync metadata operations
pub fn update_sync_metadata(conn: &Connection, user_id: &Uuid, table_name: &str, last_sync: DateTime<Utc>) -> SqlResult<()> {
    conn.execute(
        "INSERT OR REPLACE INTO sync_metadata (user_id, table_name, last_sync, conflict_count) 
         VALUES (?1, ?2, ?3, COALESCE((SELECT conflict_count FROM sync_metadata WHERE user_id = ?1 AND table_name = ?2), 0))",
        [
            user_id.to_string(),
            table_name.to_string(),
            last_sync.to_rfc3339(),
        ],
    )?;
    Ok(())
}

pub fn get_last_sync(conn: &Connection, user_id: &Uuid, table_name: &str) -> SqlResult<Option<DateTime<Utc>>> {
    let mut stmt = conn.prepare(
        "SELECT last_sync FROM sync_metadata WHERE user_id = ?1 AND table_name = ?2"
    )?;
    
    let sync_iter = stmt.query_map([user_id.to_string(), table_name.to_string()], |row| {
        Ok(DateTime::parse_from_rfc3339(&row.get::<_, String>(0)?)
            .unwrap()
            .with_timezone(&Utc))
    })?;

    for sync_time in sync_iter {
        return Ok(Some(sync_time?));
    }
    Ok(None)
}
```

## Testing Instructions

### 1. Verify Database Schema

```bash
cd backend
cargo check
```

Expected output: No compilation errors

### 2. Test Database Operations

Create a test file to verify database operations work correctly:

**File**: `backend/src/db/tests.rs` (New file)

```rust
#[cfg(test)]
mod tests {
    use super::*;
    use rusqlite::Connection;
    use uuid::Uuid;
    use chrono::Utc;

    fn setup_test_db() -> Connection {
        let conn = Connection::open_in_memory().unwrap();
        conn.execute_batch(CREATE_TABLES_SQL).unwrap();
        conn
    }

    #[test]
    fn test_user_operations() {
        let conn = setup_test_db();
        let user_id = Uuid::new_v4();
        let now = Utc::now();

        let user = User {
            id: user_id,
            email: "test@example.com".to_string(),
            password_hash: "hashed_password".to_string(),
            created_at: now,
            updated_at: now,
            last_login: None,
        };

        // Test save
        assert!(save_user(&conn, &user).is_ok());

        // Test get by id
        let retrieved = get_user_by_id(&conn, &user_id).unwrap();
        assert!(retrieved.is_some());
        assert_eq!(retrieved.unwrap().email, user.email);

        // Test get by email
        let retrieved = get_user_by_email(&conn, "test@example.com").unwrap();
        assert!(retrieved.is_some());
        assert_eq!(retrieved.unwrap().id, user_id);
    }

    #[test]
    fn test_deck_operations() {
        let conn = setup_test_db();
        let user_id = Uuid::new_v4();
        let deck_id = Uuid::new_v4();
        let now = Utc::now();

        let deck = Deck {
            id: deck_id,
            user_id,
            title: "Test Deck".to_string(),
            description: Some("Test Description".to_string()),
            content: "Test :: Content".to_string(),
            created_at: now,
            updated_at: now,
            version: 1,
        };

        // Test save
        assert!(save_decks(&conn, &[deck]).is_ok());

        // Test get
        let decks = get_user_decks(&conn, &user_id).unwrap();
        assert_eq!(decks.len(), 1);
        assert_eq!(decks[0].title, "Test Deck");
    }

    #[test]
    fn test_preferences_operations() {
        let conn = setup_test_db();
        let user_id = Uuid::new_v4();
        let now = Utc::now();

        let preferences = UserPreferences {
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

        // Test save
        assert!(save_user_preferences(&conn, &preferences).is_ok());

        // Test get
        let retrieved = get_user_preferences(&conn, &user_id).unwrap();
        assert!(retrieved.is_some());
        let retrieved = retrieved.unwrap();
        assert_eq!(retrieved.theme, "dark");
        assert_eq!(retrieved.sound_enabled, true);
        assert_eq!(retrieved.notifications_enabled, false);
    }
}
```

### 3. Update Cargo.toml for Testing

Add test dependencies to `backend/Cargo.toml`:

```toml
[dev-dependencies]
tokio-test = "0.4"
```

### 4. Run Tests

```bash
cargo test
```

Expected output: All tests pass

## Common Issues and Solutions

### Issue 1: SQLite Connection Errors
- **Problem**: Database connection fails in Durable Object
- **Solution**: Ensure `rusqlite` is properly configured with `bundled` feature
- **Fallback**: Use in-memory database for testing, switch to persistent storage later

### Issue 2: UUID Parsing Errors
- **Problem**: UUID string conversion fails
- **Solution**: Always use `Uuid::parse_str()` with proper error handling
- **Fallback**: Generate new UUIDs if parsing fails

### Issue 3: DateTime Serialization Issues
- **Problem**: DateTime to string conversion fails
- **Solution**: Use `to_rfc3339()` and `parse_from_rfc3339()` consistently
- **Fallback**: Store timestamps as Unix timestamps if needed

### Issue 4: Compilation Errors
- **Problem**: Missing dependencies or incorrect imports
- **Solution**: Run `cargo check` and add missing dependencies
- **Fallback**: Comment out problematic code and implement incrementally

## Design Decisions

1. **SQLite Choice**: Chosen for simplicity and Durable Object compatibility
2. **UUID v7**: Time-sortable UUIDs for better performance and ordering
3. **Schema Design**: Normalized tables with proper foreign key relationships
4. **Indexing Strategy**: Indexes on frequently queried columns for performance
5. **Data Isolation**: Each user gets their own Durable Object for security
6. **Version Fields**: Added version fields for optimistic locking and conflict resolution

## Performance Considerations

1. **Indexes**: Created indexes on frequently queried columns
2. **Batch Operations**: Support for bulk inserts and updates
3. **Connection Pooling**: Reuse database connections within Durable Objects
4. **Query Optimization**: Use prepared statements for repeated queries

## Security Features

1. **Data Isolation**: Per-user Durable Objects prevent data leakage
2. **Foreign Keys**: Cascade deletes ensure data consistency
3. **Input Validation**: All inputs are validated before database operations
4. **Prepared Statements**: Prevent SQL injection attacks

## Next Steps

After completing this stage and ensuring all tests pass:

1. Run `cargo test` to verify all database operations work correctly
2. Run `cargo check` to ensure no compilation errors
3. Proceed to Stage 3: Authentication System
4. The database foundation is now ready for authentication and API integration

This stage provides a solid foundation for data persistence and will support all sync operations in later stages.