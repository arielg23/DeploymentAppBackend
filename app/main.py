import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from api import auth, site, technician, upload, validation
from admin.routes import router as admin_router
from core.config import settings
from core.database import engine, Base

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    await _seed_admin()
    yield


async def _seed_admin():
    from sqlalchemy import select
    from core.database import AsyncSessionLocal
    from core.security import hash_password
    from models.technician import Technician

    async with AsyncSessionLocal() as db:
        result = await db.execute(select(Technician).where(Technician.email == settings.admin_email))
        if not result.scalar_one_or_none():
            admin = Technician(
                email=settings.admin_email,
                password_hash=hash_password(settings.admin_password),
                active=True,
            )
            db.add(admin)
            await db.commit()
            logger.info("Admin user seeded: %s", settings.admin_email)


app = FastAPI(
    title="Smart Lock Deployment API",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(technician.router)
app.include_router(site.router)
app.include_router(upload.router)
app.include_router(validation.router)
app.include_router(admin_router)


@app.get("/health")
async def health():
    from sqlalchemy import text
    from core.database import AsyncSessionLocal
    try:
        async with AsyncSessionLocal() as db:
            await db.execute(text("SELECT 1"))
        return {"status": "ok", "db": "ok"}
    except Exception as e:
        return {"status": "error", "db": str(e)}
