from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from pydantic import BaseModel

from app.database import get_db
from app.auth import get_current_admin
from app.models.admin import Admin
from app.models.quote import Quote

router = APIRouter()


class AdminOut(BaseModel):
    id: int
    username: str
    name: str | None
    email: str | None

    class Config:
        from_attributes = True


@router.get("/me", response_model=AdminOut)
async def admin_me(current_admin: Admin = Depends(get_current_admin)):
    return AdminOut.model_validate(current_admin)


@router.get("/dashboard")
async def dashboard(
    db: AsyncSession = Depends(get_db),
    _admin: Admin = Depends(get_current_admin),
):
    """Aggregated stats for admin dashboard."""
    from datetime import datetime, timedelta
    today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    month_start = datetime.utcnow().replace(day=1, hour=0, minute=0, second=0, microsecond=0)

    # Today's quotes
    today_q = await db.execute(
        select(func.count()).select_from(Quote).where(Quote.created_at >= today_start)
    )
    # Pending/quoted
    pending_q = await db.execute(
        select(func.count()).select_from(Quote).where(Quote.status.in_(["pending", "quoted"]))
    )
    # In production
    printing_q = await db.execute(
        select(func.count()).select_from(Quote).where(Quote.status == "in_production")
    )
    # Delivered this month
    delivered_q = await db.execute(
        select(func.count()).select_from(Quote).where(
            Quote.status == "delivered",
            Quote.created_at >= month_start,
        )
    )
    # Revenue this month
    revenue_q = await db.execute(
        select(func.sum(Quote.final_price)).where(
            Quote.is_paid == True,
            Quote.created_at >= month_start,
        )
    )

    return {
        "today_quotes": today_q.scalar() or 0,
        "pending_quotes": pending_q.scalar() or 0,
        "printing_quotes": printing_q.scalar() or 0,
        "delivered_this_month": delivered_q.scalar() or 0,
        "revenue_this_month": float(revenue_q.scalar() or 0),
    }
