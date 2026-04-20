import os
from pathlib import Path

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy import delete

os.environ["DATABASE_URL"] = "sqlite+aiosqlite:///./test.db"
os.environ["JWT_SECRET_KEY"] = "test-secret-key"

from app.db.models import AuthSession, Post, Reaction, Subscription, User
from app.db.init_db import init_db
from app.db.session import AsyncSessionLocal
from app.main import app


@pytest_asyncio.fixture(autouse=True)
async def clean_db():
    await init_db()
    async with AsyncSessionLocal() as session:
        await session.execute(delete(Reaction))
        await session.execute(delete(Subscription))
        await session.execute(delete(AuthSession))
        await session.execute(delete(Post))
        await session.execute(delete(User))
        await session.commit()
    yield


@pytest_asyncio.fixture
async def client():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://testserver") as ac:
        yield ac


async def register_and_login(client: AsyncClient, email: str, username: str, password: str) -> dict:
    register_response = await client.post(
        "/auth/register",
        json={"email": email, "username": username, "password": password},
    )
    assert register_response.status_code == 201

    login_response = await client.post("/auth/login", json={"email": email, "password": password})
    assert login_response.status_code == 200
    return login_response.json()


@pytest.mark.asyncio
async def test_auth_refresh_logout_flow(client: AsyncClient):
    auth = await register_and_login(client, "alice@example.com", "alice", "password123")
    assert auth["token_type"] == "bearer"
    assert auth["access_token"]
    assert auth["refresh_token"]

    refresh_response = await client.post("/auth/refresh", json={"refresh_token": auth["refresh_token"]})
    assert refresh_response.status_code == 200
    refreshed_auth = refresh_response.json()
    assert refreshed_auth["refresh_token"] != auth["refresh_token"]

    logout_response = await client.post("/auth/logout", json={"refresh_token": refreshed_auth["refresh_token"]})
    assert logout_response.status_code == 204

    refresh_again_response = await client.post("/auth/refresh", json={"refresh_token": refreshed_auth["refresh_token"]})
    assert refresh_again_response.status_code == 401


@pytest.mark.asyncio
async def test_post_edit_requires_owner_permissions(client: AsyncClient):
    author_auth = await register_and_login(client, "author@example.com", "author", "password123")
    reader_auth = await register_and_login(client, "reader@example.com", "reader", "password123")

    create_response = await client.post(
        "/posts",
        headers={"Authorization": f"Bearer {author_auth['access_token']}"},
        json={"content": "First post"},
    )
    assert create_response.status_code == 201
    post_id = create_response.json()["id"]

    forbidden_edit_response = await client.patch(
        f"/posts/{post_id}",
        headers={"Authorization": f"Bearer {reader_auth['access_token']}"},
        json={"content": "Hacked"},
    )
    assert forbidden_edit_response.status_code == 403

    owner_edit_response = await client.patch(
        f"/posts/{post_id}",
        headers={"Authorization": f"Bearer {author_auth['access_token']}"},
        json={"content": "Updated by owner"},
    )
    assert owner_edit_response.status_code == 200
    assert owner_edit_response.json()["is_edited"] is True


def teardown_module():
    test_db = Path("test.db")
    if test_db.exists():
        test_db.unlink()

