import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models import Post, Subscription


class PostRepository:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def create(self, *, author_id: uuid.UUID, content: str) -> Post:
        post = Post(author_id=author_id, content=content)
        self.session.add(post)
        await self.session.flush()
        await self.session.refresh(post)
        return post

    async def get_by_id(self, post_id: uuid.UUID) -> Post | None:
        result = await self.session.execute(select(Post).where(Post.id == post_id))
        return result.scalar_one_or_none()

    async def list_by_author(self, author_id: uuid.UUID, limit: int = 50) -> list[Post]:
        result = await self.session.execute(
            select(Post).where(Post.author_id == author_id).order_by(Post.created_at.desc()).limit(limit)
        )
        return list(result.scalars().all())

    async def list_global(self, limit: int = 50) -> list[Post]:
        result = await self.session.execute(select(Post).order_by(Post.created_at.desc()).limit(limit))
        return list(result.scalars().all())

    async def list_following(self, user_id: uuid.UUID, limit: int = 50) -> list[Post]:
        result = await self.session.execute(
            select(Post)
            .join(Subscription, Subscription.followed_id == Post.author_id)
            .where(Subscription.follower_id == user_id)
            .order_by(Post.created_at.desc())
            .limit(limit)
        )
        return list(result.scalars().all())

