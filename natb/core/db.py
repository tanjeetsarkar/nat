from typing import Annotated, AsyncGenerator
from fastapi import Depends
from sqlalchemy import create_engine
from sqlalchemy.orm import Session
from core.config import settings
from sqlalchemy.ext.asyncio import (
    AsyncSession,
    create_async_engine,
    async_sessionmaker
)


SQLLITE_DB = settings.LOCAL_DB

ASYNC_DATABASE_URL = f"sqlite+aiosqlite:///{SQLLITE_DB}"
DATABASE_URL = f"sqlite:///{SQLLITE_DB}"


engine = create_engine(DATABASE_URL)

async_engine = create_async_engine(
    ASYNC_DATABASE_URL,
    echo=True,  # Set to False in production
    future=True,
    connect_args={"check_same_thread": False}
)

AsyncSessionLocal = async_sessionmaker(
    async_engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False
)


async def get_async_db() -> AsyncGenerator[AsyncSession, None]:
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()


SessionDep = Annotated[Session, Depends(get_async_db)]