from fastapi import APIRouter, Depends, Query, Request, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db_session
from app.schemas.auth import AvailabilityResponse, AuthResponse, LoginRequest, RefreshRequest, RegisterRequest
from app.schemas.user import UserPublic
from app.services.auth_service import AuthService

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=UserPublic, status_code=status.HTTP_201_CREATED)
async def register(payload: RegisterRequest, session: AsyncSession = Depends(get_db_session)) -> UserPublic:
    user = await AuthService(session).register(payload)
    return UserPublic.model_validate(user)


@router.post("/login", response_model=AuthResponse)
async def login(
    payload: LoginRequest,
    request: Request,
    session: AsyncSession = Depends(get_db_session),
) -> AuthResponse:
    auth = await AuthService(session).login(
        payload,
        user_agent=request.headers.get("user-agent"),
        ip_address=request.client.host if request.client else None,
    )
    return auth


@router.post("/refresh", response_model=AuthResponse)
async def refresh(
    payload: RefreshRequest,
    request: Request,
    session: AsyncSession = Depends(get_db_session),
) -> AuthResponse:
    auth = await AuthService(session).refresh(
        payload.refresh_token,
        user_agent=request.headers.get("user-agent"),
        ip_address=request.client.host if request.client else None,
    )
    return auth


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
async def logout(payload: RefreshRequest, session: AsyncSession = Depends(get_db_session)) -> None:
    await AuthService(session).logout(payload.refresh_token)


@router.get("/check-email", response_model=AvailabilityResponse)
async def check_email(
    email: str = Query(min_length=3, max_length=320),
    session: AsyncSession = Depends(get_db_session),
) -> AvailabilityResponse:
    available = await AuthService(session).is_email_available(email)
    return AvailabilityResponse(field="email", value=email, available=available)


@router.get("/check-username", response_model=AvailabilityResponse)
async def check_username(
    username: str = Query(min_length=3, max_length=50),
    session: AsyncSession = Depends(get_db_session),
) -> AvailabilityResponse:
    available = await AuthService(session).is_username_available(username)
    return AvailabilityResponse(field="username", value=username, available=available)

