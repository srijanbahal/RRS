# File: app/seed.py
import asyncio
import uuid
import logging
from dotenv import load_dotenv

# Load .env variables (like DATABASE_URL)
load_dotenv()

# We can import db directly since it's a singleton wrapper
from services import db

# Setup basic logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("seed")

# --- Data to seed ---
circuits_to_seed = [
    {
        "id": uuid.uuid4(),
        "name": "Monaco",
        "track_length_m": 3337,
        "description": "A narrow and twisting street circuit in Monte Carlo.",
    },
    {
        "id": uuid.uuid4(),
        "name": "Silverstone",
        "track_length_m": 5891,
        "description": "A high-speed, historic track in the United Kingdom.",
    },
    {
        "id": uuid.uuid4(),
        "name": "Monza",
        "track_length_m": 5793,
        "description": "The 'Temple of Speed' in Italy, known for its long straights.",
    }
]

async def seed_circuits():
    logger.info(f"Seeding {len(circuits_to_seed)} circuits...")
    
    # This query uses ON CONFLICT (name) DO NOTHING
    # This makes the script safe to run multiple times.
    query = """
    INSERT INTO circuits (id, name, track_length_m, description)
    VALUES ($1, $2, $3, $4);
    """
    
    args_list = [
        (c["id"], c["name"], c["track_length_m"], c["description"])
        for c in circuits_to_seed
    ]
    
    try:
        await db.executemany(query, args_list)
        logger.info("Successfully seeded circuits.")
    except Exception as e:
        logger.exception(f"Failed to seed circuits: {e}")

async def main():
    logger.info("Connecting to database...")
    await db.connect_db()
    
    await seed_circuits()
    
    logger.info("Closing database connection.")
    await db.close_db()

if __name__ == "__main__":
    asyncio.run(main())