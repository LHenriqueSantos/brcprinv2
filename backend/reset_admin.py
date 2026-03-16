"""One-off script: reset admin password."""
import asyncio
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text
from app.config import settings
from app.auth import hash_password

NEW_PASS = "admin123"
USERNAME = "admin"

async def main():
    eng = create_async_engine(settings.DATABASE_URL)
    h = hash_password(NEW_PASS)
    print(f"Hash ({len(h)} chars): {h[:20]}...")
    async with eng.begin() as conn:
        await conn.execute(
            text("UPDATE admins SET password_hash=:h WHERE username=:u"),
            {"h": h, "u": USERNAME},
        )
    print("Done. Password reset for", USERNAME)
    await eng.dispose()

asyncio.run(main())
