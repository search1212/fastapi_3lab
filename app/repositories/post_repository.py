from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models import Post, Subscription


class PostRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._db = session

    async def get_by_id(self, post_id: int) -> Post | None:
        rows = await self._db.execute(select(Post).where(Post.id == post_id))
        return rows.scalar_one_or_none()

    async def create(self, *, author_id: int, content: str) -> Post:
        entry = Post(author_id=author_id, content=content)
        self._db.add(entry)
        await self._db.flush()
        await self._db.refresh(entry)
        return entry

    async def list_by_author(self, author_id: int, limit: int = 50) -> list[Post]:
        rows = await self._db.execute(
            select(Post).where(Post.author_id == author_id).order_by(Post.created_at.desc()).limit(limit)
        )
        return list(rows.scalars().all())

    async def list_global(self, limit: int = 50) -> list[Post]:
        rows = await self._db.execute(select(Post).order_by(Post.created_at.desc()).limit(limit))
        return list(rows.scalars().all())

    async def list_following(self, user_id: int, limit: int = 50) -> list[Post]:
        rows = await self._db.execute(
            select(Post)
            .join(Subscription, Subscription.followed_id == Post.author_id)
            .where(Subscription.follower_id == user_id)
            .order_by(Post.created_at.desc())
            .limit(limit)
        )
        return list(rows.scalars().all())
