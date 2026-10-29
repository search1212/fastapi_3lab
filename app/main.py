import sys
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse

if __package__ in {None, ""}:
    sys.path.append(str(Path(__file__).resolve().parents[1]))

from app.api.auth import router as auth_router
from app.api.posts import router as posts_router
from app.api.users import router as users_router
from app.core.config import get_settings
from app.db.init_db import init_db

_settings = get_settings()


@asynccontextmanager
async def lifespan(_: FastAPI):
    await init_db()
    yield


app = FastAPI(title=_settings.app_name, debug=_settings.debug, lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(auth_router)
app.include_router(users_router)
app.include_router(posts_router)


@app.get("/", response_class=HTMLResponse, tags=["system"])
async def home() -> str:
    return """
    <html>
      <head><title>Sfera API</title></head>
      <body>
        <h1>Sfera API</h1>
        <p>API is running.</p>
        <p>Health check: <a href="/health">/health</a></p>
        <p>Swagger: <a href="/docs">/docs</a></p>
      </body>
    </html>
    """


@app.get("/health", tags=["system"])
async def healthcheck() -> dict[str, str]:
    return {"status": "ok"}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("app.main:app", host="127.0.0.1", port=8000, reload=True)
