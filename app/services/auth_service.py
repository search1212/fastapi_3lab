import hashlib
import uuid
from datetime import UTC, datetime, timedelta

from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.db.models import User
from app.repositories.auth_session_repository import AuthSessionRepository
from app.repositories.user_repository import UserRepository
from app.schemas.auth import AuthResponse, LoginRequest, RegisterRequest
from app.services.password import hash_password, verify_password
from app.services.tokens import create_access_token, create_refresh_token, decode_token

settings = get_settings()


def hash_refresh_token(token: str) -> str:
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


class AuthService:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session
        self.user_repo = UserRepository(session)
        self.auth_session_repo = AuthSessionRepository(session)

    async def register(self, payload: RegisterRequest) -> User:
        if await self.user_repo.get_by_email(payload.email):
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already registered")
        if await self.user_repo.get_by_username(payload.username):
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Username already taken")
        user = await self.user_repo.create(
            email=payload.email,
            username=payload.username,
            password_hash=hash_password(payload.password),
        )
        await self.session.commit()
        return user

    async def login(
        self,
        payload: LoginRequest,
        *,
        user_agent: str | None,
        ip_address: str | None,
    ) -> AuthResponse:
        user = await self.user_repo.get_by_email(payload.email)
        if user is None or not verify_password(payload.password, user.password_hash):
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")

        auth = await self._issue_tokens(user.id, user_agent=user_agent, ip_address=ip_address)
        await self.session.commit()
        return auth

    async def refresh(
        self,
        refresh_token: str,
        *,
        user_agent: str | None,
        ip_address: str | None,
    ) -> AuthResponse:
        try:
            payload = decode_token(refresh_token)
        except ValueError as exc:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid refresh token") from exc
        if payload.get("type") != "refresh":
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token type")

        token_hash = hash_refresh_token(refresh_token)
        now = datetime.now(UTC)
        auth_session = await self.auth_session_repo.get_active_by_hash(token_hash, now)
        if auth_session is None:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Refresh session not found")

        await self.auth_session_repo.revoke(auth_session, revoked_at=now)
        auth = await self._issue_tokens(auth_session.user_id, user_agent=user_agent, ip_address=ip_address)
        await self.session.commit()
        return auth

    async def logout(self, refresh_token: str) -> None:
        try:
            payload = decode_token(refresh_token)
        except ValueError as exc:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid refresh token") from exc
        if payload.get("type") != "refresh":
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token type")
        token_hash = hash_refresh_token(refresh_token)
        auth_session = await self.auth_session_repo.get_active_by_hash(token_hash, datetime.now(UTC))
        if auth_session:
            await self.auth_session_repo.revoke(auth_session, revoked_at=datetime.now(UTC))
            await self.session.commit()

    async def _issue_tokens(self, user_id: uuid.UUID, *, user_agent: str | None, ip_address: str | None) -> AuthResponse:
        access_token = create_access_token(user_id)
        refresh_token = create_refresh_token(user_id)
        refresh_expires_at = datetime.now(UTC) + timedelta(days=settings.refresh_token_ttl_days)
        await self.auth_session_repo.create(
            user_id=user_id,
            refresh_token_hash=hash_refresh_token(refresh_token),
            expires_at=refresh_expires_at,
            user_agent=user_agent,
            ip_address=ip_address,
        )
        return AuthResponse(access_token=access_token, refresh_token=refresh_token)

