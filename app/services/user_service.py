from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models import User
from app.repositories.user_repository import UserRepository
from app.schemas.user import UserUpdateMe


class UserService:
    def __init__(self, session: AsyncSession) -> None:
        self._db = session
        self._users = UserRepository(session)

    async def get_user_or_404(self, user_id: int) -> User:
        account = await self._users.get_by_id(user_id)
        if account is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
        return account

    async def search_users(self, query: str) -> list[User]:
        return await self._users.search(query)

    async def update_me(self, current_user: User, payload: UserUpdateMe) -> User:
        if payload.username and payload.username != current_user.username:
            clash = await self._users.get_by_username(payload.username)
            if clash:
                raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Username already taken")
            current_user.username = payload.username

        if payload.bio is not None:
            current_user.bio = payload.bio
        if payload.avatar_url is not None:
            current_user.avatar_url = payload.avatar_url

        await self._db.commit()
        await self._db.refresh(current_user)
        return current_user
