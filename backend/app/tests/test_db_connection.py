import asyncio
import asyncpg
import os
from dotenv import load_dotenv

load_dotenv()

async def main():
    db_url = os.getenv("DATABASE_URL")
    print("Connecting to:", db_url.split('@')[-1])  # hide credentials
    try:
        conn = await asyncpg.connect(db_url)
        val = await conn.fetchval("SELECT current_database();")
        print("✅ Connected successfully to:", val)
        await conn.close()
    except Exception as e:
        print("❌ Connection failed:", e)

asyncio.run(main())
