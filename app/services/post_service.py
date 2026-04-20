import uuid

from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models import Post, User
from app.repositories.post_repository import PostRepository
from app.schemas.post import PostCreate, PostUpdate


class PostService:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session
        self.post_repo = PostRepository(session)

    async def create_post(self, current_user: User, payload: PostCreate) -> Post:
        post = await self.post_repo.create(author_id=current_user.id, content=payload.content)
        await self.session.commit()
        return post

    async def edit_post(self, current_user: User, post_id: uuid.UUID, payload: PostUpdate) -> Post:
        post = await self.post_repo.get_by_id(post_id)
        if post is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Post not found")
        if post.author_id != current_user.id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not enough permissions")
        post.content = payload.content
        post.is_edited = True
        await self.session.commit()
        await self.session.refresh(post)
        return post

    async def my_posts(self, current_user: User) -> list[Post]:
        return await self.post_repo.list_by_author(current_user.id)

    async def global_feed(self) -> list[Post]:
        return await self.post_repo.list_global()

    async def following_feed(self, current_user: User) -> list[Post]:
        return await self.post_repo.list_following(current_user.id)

