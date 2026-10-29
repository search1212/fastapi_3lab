from datetime import datetime

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models import AuthSession


class AuthSessionRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._db = session

    async def create(
        self,
        *,
        user_id: int,
        refresh_token_hash: str,
        expires_at: datetime,
        user_agent: str | None,
        ip_address: str | None,
    ) -> AuthSession:
        record = AuthSession(
            user_id=user_id,
            refresh_token_hash=refresh_token_hash,
            expires_at=expires_at,
            user_agent=user_agent,
            ip_address=ip_address,
        )
        self._db.add(record)
        await self._db.flush()
        return record

    async def get_active_by_hash(self, refresh_token_hash: str, now: datetime) -> AuthSession | None:
        rows = await self._db.execute(
            select(AuthSession).where(
                AuthSession.refresh_token_hash == refresh_token_hash,
                AuthSession.revoked_at.is_(None),
                AuthSession.expires_at > now,
            )
        )
        return rows.scalar_one_or_none()

    async def revoke(self, auth_session: AuthSession, revoked_at: datetime) -> None:
        auth_session.revoked_at = revoked_at
        await self._db.flush()
