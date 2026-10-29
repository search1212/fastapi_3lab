import os
from pathlib import Path

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy import delete

os.environ["DATABASE_URL"] = "sqlite+aiosqlite:///./test.db"
os.environ["JWT_SECRET_KEY"] = "test-secret-key"

from app.db.init_db import init_db
from app.db.models import AuthSession, Post, Reaction, Subscription, User
from app.db.session import AsyncSessionLocal
from app.main import app


@pytest_asyncio.fixture(autouse=True)
async def clean_db():
    await init_db()
    async with AsyncSessionLocal() as db:
        await db.execute(delete(Reaction))
        await db.execute(delete(Subscription))
        await db.execute(delete(AuthSession))
        await db.execute(delete(Post))
        await db.execute(delete(User))
        await db.commit()
    yield


@pytest_asyncio.fixture
async def client():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://testserver") as http:
        yield http


async def register_and_login(client: AsyncClient, email: str, username: str, password: str) -> dict:
    created = await client.post(
        "/auth/register",
        json={"email": email, "username": username, "password": password},
    )
    assert created.status_code == 201

    signed_in = await client.post("/auth/login", json={"email": email, "password": password})
    assert signed_in.status_code == 200
    return signed_in.json()


@pytest.mark.asyncio
async def test_auth_refresh_logout_flow(client: AsyncClient):
    auth = await register_and_login(client, "alice@example.com", "alice", "password123")
    assert auth["token_type"] == "bearer"
    assert auth["access_token"]
    assert auth["refresh_token"]

    refreshed = await client.post("/auth/refresh", json={"refresh_token": auth["refresh_token"]})
    assert refreshed.status_code == 200
    new_auth = refreshed.json()
    assert new_auth["refresh_token"] != auth["refresh_token"]

    logged_out = await client.post("/auth/logout", json={"refresh_token": new_auth["refresh_token"]})
    assert logged_out.status_code == 204

    reused = await client.post("/auth/refresh", json={"refresh_token": new_auth["refresh_token"]})
    assert reused.status_code == 401


@pytest.mark.asyncio
async def test_post_edit_requires_owner_permissions(client: AsyncClient):
    author = await register_and_login(client, "author@example.com", "author", "password123")
    reader = await register_and_login(client, "reader@example.com", "reader", "password123")

    created = await client.post(
        "/posts",
        headers={"Authorization": f"Bearer {author['access_token']}"},
        json={"content": "First post"},
    )
    assert created.status_code == 201
    post_id = created.json()["id"]

    forbidden = await client.patch(
        f"/posts/{post_id}",
        headers={"Authorization": f"Bearer {reader['access_token']}"},
        json={"content": "Hacked"},
    )
    assert forbidden.status_code == 403

    allowed = await client.patch(
        f"/posts/{post_id}",
        headers={"Authorization": f"Bearer {author['access_token']}"},
        json={"content": "Updated by owner"},
    )
    assert allowed.status_code == 200
    assert allowed.json()["is_edited"] is True


@pytest.mark.asyncio
async def test_login_rejects_bad_password_with_russian_message(client: AsyncClient):
    await register_and_login(client, "bob@example.com", "bob", "password123")
    failed = await client.post("/auth/login", json={"email": "bob@example.com", "password": "wrongpass"})
    assert failed.status_code == 401
    assert failed.json()["detail"] == "Неверный логин или пароль"


@pytest.mark.asyncio
async def test_cannot_react_to_own_post(client: AsyncClient):
    author = await register_and_login(client, "owner@example.com", "owner", "password123")
    created = await client.post(
        "/posts",
        headers={"Authorization": f"Bearer {author['access_token']}"},
        json={"content": "Own post"},
    )
    assert created.status_code == 201
    post_id = created.json()["id"]

    reaction = await client.put(
        f"/posts/{post_id}/reaction",
        headers={"Authorization": f"Bearer {author['access_token']}"},
        json={"reaction_type": "like"},
    )
    assert reaction.status_code == 400
    assert "собственн" in reaction.json()["detail"].lower()


def teardown_module():
    db_file = Path("test.db")
    try:
        if db_file.exists():
            db_file.unlink()
    except PermissionError:
        pass
