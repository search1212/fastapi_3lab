from sqlalchemy import or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models import User


class UserRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._db = session

    async def get_by_id(self, user_id: int) -> User | None:
        rows = await self._db.execute(select(User).where(User.id == user_id))
        return rows.scalar_one_or_none()

    async def get_by_email(self, email: str) -> User | None:
        rows = await self._db.execute(select(User).where(User.email == email))
        return rows.scalar_one_or_none()

    async def get_by_username(self, username: str) -> User | None:
        rows = await self._db.execute(select(User).where(User.username == username))
        return rows.scalar_one_or_none()

    async def create(self, *, email: str, username: str, password_hash: str) -> User:
        account = User(email=email, username=username, password_hash=password_hash)
        self._db.add(account)
        await self._db.flush()
        await self._db.refresh(account)
        return account

    async def search(self, query: str, limit: int = 20) -> list[User]:
        mask = f"%{query}%"
        rows = await self._db.execute(
            select(User)
            .where(or_(User.username.ilike(mask), User.email.ilike(mask)))
            .order_by(User.created_at.desc())
            .limit(limit)
        )
        return list(rows.scalars().all())
