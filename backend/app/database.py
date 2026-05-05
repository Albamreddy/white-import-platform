import os
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase

_default_db = "sqlite+aiosqlite:////data/app.db" if os.path.isdir("/data") else "sqlite+aiosqlite:///./courses.db"
DATABASE_URL = os.getenv("DATABASE_URL", _default_db)

engine = create_async_engine(DATABASE_URL, echo=False)
async_session = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


class Base(DeclarativeBase):
    pass


async def get_db():
    async with async_session() as session:
        yield session


async def init_db():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with engine.begin() as conn:
        migrations = [
            ("enrollments", "last_watched_at", "ALTER TABLE enrollments ADD COLUMN last_watched_at DATETIME"),
            ("enrollments", "completed_lessons", "ALTER TABLE enrollments ADD COLUMN completed_lessons TEXT DEFAULT ''"),
        ]
        for table, column, sql in migrations:
            try:
                result = await conn.execute(text(f"SELECT {column} FROM {table} LIMIT 1"))
            except Exception:
                await conn.execute(text(sql))
