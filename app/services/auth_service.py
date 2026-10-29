import hashlib
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

_settings = get_settings()


def hash_refresh_token(token: str) -> str:
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


class AuthService:
    def __init__(self, session: AsyncSession) -> None:
        self._db = session
        self._users = UserRepository(session)
        self._sessions = AuthSessionRepository(session)

    async def is_email_available(self, email: str) -> bool:
        return await self._users.get_by_email(email) is None

    async def is_username_available(self, username: str) -> bool:
        return await self._users.get_by_username(username) is None

    async def register(self, payload: RegisterRequest) -> User:
        if await self._users.get_by_email(payload.email):
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already registered")
        if await self._users.get_by_username(payload.username):
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Username already taken")

        account = await self._users.create(
            email=payload.email,
            username=payload.username,
            password_hash=hash_password(payload.password),
        )
        await self._db.commit()
        return account

    async def login(
        self,
        payload: LoginRequest,
        *,
        user_agent: str | None,
        ip_address: str | None,
    ) -> AuthResponse:
        account = await self._users.get_by_email(payload.email)
        if account is None or not verify_password(payload.password, account.password_hash):
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")

        tokens = await self._create_token_pair(account.id, user_agent=user_agent, ip_address=ip_address)
        await self._db.commit()
        return tokens

    async def refresh(
        self,
        refresh_token: str,
        *,
        user_agent: str | None,
        ip_address: str | None,
    ) -> AuthResponse:
        try:
            claims = decode_token(refresh_token)
        except ValueError as error:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid refresh token") from error

        if claims.get("type") != "refresh":
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token type")

        digest = hash_refresh_token(refresh_token)
        moment = datetime.now(UTC)
        active_session = await self._sessions.get_active_by_hash(digest, moment)
        if active_session is None:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Refresh session not found")

        await self._sessions.revoke(active_session, revoked_at=moment)
        tokens = await self._create_token_pair(active_session.user_id, user_agent=user_agent, ip_address=ip_address)
        await self._db.commit()
        return tokens

    async def logout(self, refresh_token: str) -> None:
        try:
            claims = decode_token(refresh_token)
        except ValueError as error:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid refresh token") from error

        if claims.get("type") != "refresh":
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token type")

        digest = hash_refresh_token(refresh_token)
        active_session = await self._sessions.get_active_by_hash(digest, datetime.now(UTC))
        if active_session:
            await self._sessions.revoke(active_session, revoked_at=datetime.now(UTC))
            await self._db.commit()

    async def _create_token_pair(
        self,
        user_id: int,
        *,
        user_agent: str | None,
        ip_address: str | None,
    ) -> AuthResponse:
        access = create_access_token(user_id)
        refresh = create_refresh_token(user_id)
        expires = datetime.now(UTC) + timedelta(days=_settings.refresh_token_ttl_days)
        await self._sessions.create(
            user_id=user_id,
            refresh_token_hash=hash_refresh_token(refresh),
            expires_at=expires,
            user_agent=user_agent,
            ip_address=ip_address,
        )
        return AuthResponse(access_token=access, refresh_token=refresh)
