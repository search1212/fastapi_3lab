from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models import User
from app.repositories.user_repository import UserRepository
from app.schemas.user import UserUpdateMe


class UserService:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session
        self.user_repo = UserRepository(session)

    async def get_user_or_404(self, user_id: int) -> User:
        user = await self.user_repo.get_by_id(user_id)
        if user is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
        return user

    async def update_me(self, current_user: User, payload: UserUpdateMe) -> User:
        if payload.username and payload.username != current_user.username:
            if await self.user_repo.get_by_username(payload.username):
                raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Username already taken")
            current_user.username = payload.username
        if payload.bio is not None:
            current_user.bio = payload.bio
        if payload.avatar_url is not None:
            current_user.avatar_url = payload.avatar_url
        await self.session.commit()
        await self.session.refresh(current_user)
        return current_user

    async def search_users(self, query: str) -> list[User]:
        return await self.user_repo.search(query)

