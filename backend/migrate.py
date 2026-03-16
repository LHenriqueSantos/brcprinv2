"""Migration: syncronize quotes table columns with the ORM model."""
import asyncio
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text, inspect
from app.config import settings


# Columns that should exist but might be missing - with their DDL
MIGRATIONS = [
    "ALTER TABLE quotes ADD COLUMN filament_deducted BOOLEAN DEFAULT FALSE",
    "ALTER TABLE quotes ADD COLUMN filament_lot_id INT NULL",
    "ALTER TABLE quotes ADD COLUMN project_id INT NULL",
    "ALTER TABLE quotes ADD COLUMN credits_used DECIMAL(10,2) DEFAULT 0.00",
    "ALTER TABLE quotes ADD COLUMN gcode_url VARCHAR(500) NULL",
    "ALTER TABLE quotes ADD COLUMN counter_offer_price DECIMAL(10,2) NULL",
    "ALTER TABLE quotes ADD COLUMN counter_offer_notes TEXT NULL",
    "ALTER TABLE quotes ADD COLUMN is_multicolor BOOLEAN DEFAULT FALSE",
    "ALTER TABLE quotes ADD COLUMN infill_percentage INT DEFAULT 20",
    "ALTER TABLE quotes ADD COLUMN request_type ENUM('stl','manual') DEFAULT 'stl'",
    "ALTER TABLE quotes ADD COLUMN nfe_status VARCHAR(50) NULL",
    "ALTER TABLE quotes ADD COLUMN nfe_url VARCHAR(500) NULL",
    "ALTER TABLE quotes ADD COLUMN melhorenvio_order_id VARCHAR(100) NULL",
    "ALTER TABLE quotes ADD COLUMN items JSON NULL",
    "ALTER TABLE quotes ADD COLUMN extras_json JSON NULL",
    "ALTER TABLE quotes ADD COLUMN reference_images JSON NULL",
    "ALTER TABLE quotes ADD COLUMN file_urls JSON NULL",
    "ALTER TABLE quotes ADD COLUMN result_photo_url TEXT NULL",
    "ALTER TABLE quotes ADD COLUMN platter_id INT NULL",
    "ALTER TABLE quotes ADD COLUMN coupon_id INT NULL",
    "ALTER TABLE admins ADD COLUMN email VARCHAR(200) NULL",
]


async def main():
    eng = create_async_engine(settings.DATABASE_URL)
    success, failed = 0, 0
    async with eng.begin() as conn:
        for sql in MIGRATIONS:
            try:
                await conn.execute(text(sql))
                print(f"✅ {sql[:60]}...")
                success += 1
            except Exception as e:
                err = str(e)
                if "Duplicate column" in err or "1060" in err:
                    print(f"⚠️  Already exists: {sql[:40]}...")
                else:
                    print(f"❌ Failed: {sql[:40]}... — {err[:80]}")
                    failed += 1
    print(f"\nDone. {success} applied, {failed} failures.")
    await eng.dispose()


asyncio.run(main())
