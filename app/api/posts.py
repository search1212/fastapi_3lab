from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.db.enums import ReactionType
from app.db.models import User
from app.db.session import get_db_session
from app.schemas.post import PostCreate, PostRead, PostUpdate
from app.schemas.reaction import ReactionCountRead, ReactionRead, ReactionUpdate
from app.services.post_service import PostService
from app.services.social_service import SocialService

router = APIRouter(prefix="/posts", tags=["posts"])


@router.post("", response_model=PostRead, status_code=status.HTTP_201_CREATED)
async def create_post(
    payload: PostCreate,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db_session),
) -> PostRead:
    entry = await PostService(session).create_post(current_user, payload)
    return PostRead.model_validate(entry)


@router.patch("/{post_id}", response_model=PostRead)
async def update_post(
    post_id: int,
    payload: PostUpdate,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db_session),
) -> PostRead:
    entry = await PostService(session).edit_post(current_user, post_id, payload)
    return PostRead.model_validate(entry)


@router.get("/me", response_model=list[PostRead])
async def my_posts(
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db_session),
) -> list[PostRead]:
    entries = await PostService(session).my_posts(current_user)
    return [PostRead.model_validate(entry) for entry in entries]


@router.get("/feed/global", response_model=list[PostRead])
async def global_feed(session: AsyncSession = Depends(get_db_session)) -> list[PostRead]:
    entries = await PostService(session).global_feed()
    return [PostRead.model_validate(entry) for entry in entries]


@router.get("/feed/following", response_model=list[PostRead])
async def following_feed(
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db_session),
) -> list[PostRead]:
    entries = await PostService(session).following_feed(current_user)
    return [PostRead.model_validate(entry) for entry in entries]


@router.get("/reactions/me", response_model=list[ReactionRead])
async def my_reactions(
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db_session),
) -> list[ReactionRead]:
    items = await SocialService(session).list_user_reactions(current_user)
    return [ReactionRead(post_id=item.post_id, reaction_type=item.reaction_type) for item in items]


@router.get("/reactions/counts", response_model=list[ReactionCountRead])
async def reaction_counts(
    post_ids: list[int] = Query(default=[]),
    session: AsyncSession = Depends(get_db_session),
) -> list[ReactionCountRead]:
    totals = await SocialService(session).get_reaction_counts(post_ids)
    output: list[ReactionCountRead] = []
    for post_id in post_ids:
        per_post = totals.get(post_id, {})
        output.append(
            ReactionCountRead(
                post_id=post_id,
                like=per_post.get(ReactionType.LIKE, 0),
                heart=per_post.get(ReactionType.HEART, 0),
                fire=per_post.get(ReactionType.FIRE, 0),
                laugh=per_post.get(ReactionType.LAUGH, 0),
            )
        )
    return output


@router.put("/{post_id}/reaction", status_code=status.HTTP_204_NO_CONTENT)
async def put_reaction(
    post_id: int,
    payload: ReactionUpdate,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db_session),
) -> None:
    await SocialService(session).set_reaction(current_user, post_id, payload.reaction_type)


@router.delete("/{post_id}/reaction", status_code=status.HTTP_204_NO_CONTENT)
async def delete_reaction(
    post_id: int,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db_session),
) -> None:
    await SocialService(session).delete_reaction(current_user, post_id)
