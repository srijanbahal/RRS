# app/services/db.py
import os
import asyncio
import asyncpg
from typing import Any, Dict, List, Optional
import logging
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger("db")

DATABASE_URL = os.getenv("DATABASE_URL")
# If using Supabase, use the full Postgres connection string (service_role key), e.g.
# postgres://postgres:password@db.supabase.co:5432/postgres

_pool: Optional[asyncpg.pool.Pool] = None

async def connect_db():
    global _pool
    if _pool is None:
        _pool = await asyncpg.create_pool(DATABASE_URL, min_size=1, max_size=5)
        logger.info("Connected to Postgres")
    return _pool

async def close_db():
    global _pool
    if _pool:
        await _pool.close()
        _pool = None

async def fetchrow(query: str, *args) -> Optional[asyncpg.Record]:
    pool = await connect_db()
    async with pool.acquire() as conn:
        return await conn.fetchrow(query, *args)

async def fetch(query: str, *args) -> List[asyncpg.Record]:
    pool = await connect_db()
    async with pool.acquire() as conn:
        return await conn.fetch(query, *args)

async def execute(query: str, *args) -> str:
    pool = await connect_db()
    async with pool.acquire() as conn:
        return await conn.execute(query, *args)

async def executemany(query: str, args_list: List[tuple]):
    pool = await connect_db()
    async with pool.acquire() as conn:
        async with conn.transaction():
            for args in args_list:
                await conn.execute(query, *args)



# --- ADD THIS ALIAS AT THE END ---
class _DBWrapper:
    fetch = staticmethod(fetch)
    fetchrow = staticmethod(fetchrow)
    execute = staticmethod(execute)
    executemany = staticmethod(executemany)
    connect = staticmethod(connect_db)
    close = staticmethod(close_db)

db = _DBWrapper()
