from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models import Post, User
from app.repositories.post_repository import PostRepository
from app.schemas.post import PostCreate, PostUpdate


class PostService:
    def __init__(self, session: AsyncSession) -> None:
        self._db = session
        self._posts = PostRepository(session)

    async def create_post(self, current_user: User, payload: PostCreate) -> Post:
        entry = await self._posts.create(author_id=current_user.id, content=payload.content)
        await self._db.commit()
        return entry

    async def edit_post(self, current_user: User, post_id: int, payload: PostUpdate) -> Post:
        entry = await self._posts.get_by_id(post_id)
        if entry is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Post not found")
        if entry.author_id != current_user.id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not enough permissions")

        entry.content = payload.content
        entry.is_edited = True
        await self._db.commit()
        await self._db.refresh(entry)
        return entry

    async def my_posts(self, current_user: User) -> list[Post]:
        return await self._posts.list_by_author(current_user.id)

    async def global_feed(self) -> list[Post]:
        return await self._posts.list_global()

    async def following_feed(self, current_user: User) -> list[Post]:
        return await self._posts.list_following(current_user.id)
