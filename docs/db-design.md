# Database Design (Social App MVP, SQLite)

## Scope

MVP includes:
- registration / authorization / authentication
- profile view and profile data update
- post create and edit
- follow/unfollow users
- feeds: global, own posts, followed users posts
- reactions to posts
- user search and profile view

## Database Choice

- Primary DB for this lab: `SQLite` with async driver `aiosqlite`.
- Models use SQLAlchemy cross-database types (for example `Uuid`) so migration to PostgreSQL later stays simple.

## Core Entities

### users
- `id` (PK, UUID)
- `email` (unique, indexed)
- `username` (unique, indexed)
- `password_hash`
- `is_active`
- `bio`
- `avatar_url`
- `created_at`
- `updated_at`

Notes:
- Profile fields are kept in `users` for MVP simplicity.
- Can be moved to a separate `profiles` table later.

### auth_sessions
- `id` (PK, UUID)
- `user_id` (FK -> users.id, indexed)
- `refresh_token_hash` (unique)
- `user_agent`
- `ip_address`
- `expires_at` (indexed)
- `created_at`
- `revoked_at` (nullable)

Notes:
- Enables refresh token rotation and logout from devices.

### posts
- `id` (PK, UUID)
- `author_id` (FK -> users.id, indexed)
- `content` (text)
- `is_edited`
- `created_at` (indexed)
- `updated_at`

Notes:
- Feed queries use `(author_id, created_at)` and `created_at`.

### subscriptions
- `follower_id` (FK -> users.id)
- `followed_id` (FK -> users.id)
- `created_at`

Constraints:
- Composite PK: (`follower_id`, `followed_id`)
- Check: follower cannot follow self

### reactions
- `user_id` (FK -> users.id)
- `post_id` (FK -> posts.id)
- `reaction_type` (enum: like, fire, heart, laugh)
- `created_at`

Constraints:
- Composite PK: (`user_id`, `post_id`)
- One reaction per user per post for MVP (can be changed later).

## Relations

- `users 1 -> N posts`
- `users N <-> N users` through `subscriptions`
- `users N <-> N posts` through `reactions`
- `users 1 -> N auth_sessions`

## Key Indexes

- `users(email)` unique
- `users(username)` unique
- `posts(created_at desc)`
- `posts(author_id, created_at desc)`
- `subscriptions(followed_id, follower_id)`
- `reactions(post_id, reaction_type)`
- `auth_sessions(user_id, expires_at)`

## File Split Proposal

```text
app/
  db/
    base.py
    enums.py
    models/
      __init__.py
      user.py
      auth_session.py
      post.py
      subscription.py
      reaction.py
```

## Next Step

Create Alembic migration from these models (SQLite URL) and then implement:
1. auth module
2. user/profile module
3. posts module
4. subscriptions/feed module
5. reactions/search module

## Current App Wiring

- Default `DATABASE_URL`: `sqlite+aiosqlite:///./app.db`
- SQLAlchemy async engine/session is configured in `app/db/session.py`.
- Tables are created on app startup by `app/db/init_db.py` (`Base.metadata.create_all`).
- FastAPI entrypoint: `app/main.py` with `/health` endpoint.
