from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.enums import ReactionType
from app.db.models import Post, Reaction, User
from app.repositories.post_repository import PostRepository
from app.repositories.social_repository import SocialRepository
from app.repositories.user_repository import UserRepository


class SocialService:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session
        self.social_repo = SocialRepository(session)
        self.user_repo = UserRepository(session)
        self.post_repo = PostRepository(session)

    async def follow(self, current_user: User, target_user_id: int) -> None:
        if current_user.id == target_user_id:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cannot follow yourself")
        target = await self.user_repo.get_by_id(target_user_id)
        if target is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
        await self.social_repo.follow(current_user.id, target_user_id)
        await self.session.commit()

    async def unfollow(self, current_user: User, target_user_id: int) -> None:
        await self.social_repo.unfollow(current_user.id, target_user_id)
        await self.session.commit()

    async def list_followers(self, user_id: int) -> list[User]:
        return await self.social_repo.list_followers(user_id)

    async def list_following(self, user_id: int) -> list[User]:
        return await self.social_repo.list_following(user_id)

    async def set_reaction(self, current_user: User, post_id: int, reaction_type: ReactionType) -> None:
        post: Post | None = await self.post_repo.get_by_id(post_id)
        if post is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Post not found")
        await self.social_repo.set_reaction(current_user.id, post_id, reaction_type)
        await self.session.commit()

    async def delete_reaction(self, current_user: User, post_id: int) -> None:
        await self.social_repo.remove_reaction(current_user.id, post_id)
        await self.session.commit()

    async def list_user_reactions(self, current_user: User) -> list[Reaction]:
        return await self.social_repo.list_user_reactions(current_user.id)

    async def get_reaction_counts(self, post_ids: list[int]) -> dict[int, dict[ReactionType, int]]:
        return await self.social_repo.get_reaction_counts(post_ids)

