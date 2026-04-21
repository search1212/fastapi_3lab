from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.db.models import User
from app.db.session import get_db_session
from app.schemas.user import UserPublic, UserUpdateMe
from app.services.social_service import SocialService
from app.services.user_service import UserService

router = APIRouter(prefix="/users", tags=["users"])


@router.get("/me", response_model=UserPublic)
async def me(current_user: User = Depends(get_current_user)) -> UserPublic:
    return UserPublic.model_validate(current_user)


@router.patch("/me", response_model=UserPublic)
async def update_me(
    payload: UserUpdateMe,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db_session),
) -> UserPublic:
    user = await UserService(session).update_me(current_user, payload)
    return UserPublic.model_validate(user)


@router.get("/search", response_model=list[UserPublic])
async def search_users(
    q: str = Query(min_length=1, max_length=100),
    session: AsyncSession = Depends(get_db_session),
) -> list[UserPublic]:
    users = await UserService(session).search_users(q)
    return [UserPublic.model_validate(user) for user in users]


@router.get("/{user_id}", response_model=UserPublic)
async def get_user_profile(user_id: int, session: AsyncSession = Depends(get_db_session)) -> UserPublic:
    user = await UserService(session).get_user_or_404(user_id)
    return UserPublic.model_validate(user)


@router.post("/{user_id}/follow", status_code=status.HTTP_204_NO_CONTENT)
async def follow_user(
    user_id: int,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db_session),
) -> None:
    await SocialService(session).follow(current_user, user_id)


@router.delete("/{user_id}/follow", status_code=status.HTTP_204_NO_CONTENT)
async def unfollow_user(
    user_id: int,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db_session),
) -> None:
    await SocialService(session).unfollow(current_user, user_id)


@router.get("/{user_id}/followers", response_model=list[UserPublic])
async def followers(user_id: int, session: AsyncSession = Depends(get_db_session)) -> list[UserPublic]:
    users = await SocialService(session).list_followers(user_id)
    return [UserPublic.model_validate(user) for user in users]


@router.get("/{user_id}/following", response_model=list[UserPublic])
async def following(user_id: int, session: AsyncSession = Depends(get_db_session)) -> list[UserPublic]:
    users = await SocialService(session).list_following(user_id)
    return [UserPublic.model_validate(user) for user in users]

