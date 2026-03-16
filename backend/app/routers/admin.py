from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from pydantic import BaseModel
from datetime import datetime, timedelta

from app.database import get_db
from app.auth import get_current_admin
from app.models.admin import Admin
from app.models.quote import Quote
from app.models.filament import Filament
from app.models.printer import Printer

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
    """Aggregated stats + chart data for admin dashboard."""
    now = datetime.utcnow()
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)

    # --- Summary cards ---
    today_q = await db.execute(
        select(func.count()).select_from(Quote).where(Quote.created_at >= today_start)
    )
    pending_q = await db.execute(
        select(func.count()).select_from(Quote).where(Quote.status.in_(["pending", "quoted"]))
    )
    printing_q = await db.execute(
        select(func.count()).select_from(Quote).where(Quote.status == "in_production")
    )
    delivered_q = await db.execute(
        select(func.count()).select_from(Quote).where(
            Quote.status == "delivered",
            Quote.created_at >= month_start,
        )
    )
    revenue_q = await db.execute(
        select(func.sum(Quote.final_price)).where(
            Quote.is_paid == True,
            Quote.created_at >= month_start,
        )
    )

    # --- 14-day quotes chart ---
    chart_quotes = []
    for i in range(13, -1, -1):
        day_start = (today_start - timedelta(days=i))
        day_end = day_start + timedelta(days=1)
        cnt = await db.execute(
            select(func.count()).select_from(Quote).where(
                Quote.created_at >= day_start,
                Quote.created_at < day_end,
            )
        )
        chart_quotes.append({
            "date": day_start.strftime("%d/%m"),
            "count": cnt.scalar() or 0,
        })

    # --- 6-month revenue chart ---
    chart_revenue = []
    for i in range(5, -1, -1):
        first_of_month = (now.replace(day=1) - timedelta(days=i * 28)).replace(day=1)
        next_month = (first_of_month.replace(day=28) + timedelta(days=4)).replace(day=1)
        rev = await db.execute(
            select(func.sum(Quote.final_price)).where(
                Quote.is_paid == True,
                Quote.created_at >= first_of_month,
                Quote.created_at < next_month,
            )
        )
        chart_revenue.append({
            "month": first_of_month.strftime("%b/%y"),
            "revenue": float(rev.scalar() or 0),
        })

    # --- Alerts ---
    low_stock_q = await db.execute(
        select(Filament.name, Filament.current_weight_g, Filament.min_stock_warning).where(
            Filament.active == True,
            Filament.current_weight_g <= Filament.min_stock_warning,
        )
    )
    low_stock = [{"name": r[0], "stock": float(r[1]), "min": float(r[2])} for r in low_stock_q.all()]

    return {
        "today_quotes": today_q.scalar() or 0,
        "pending_quotes": pending_q.scalar() or 0,
        "printing_quotes": printing_q.scalar() or 0,
        "delivered_this_month": delivered_q.scalar() or 0,
        "revenue_this_month": float(revenue_q.scalar() or 0),
        "chart_quotes_14d": chart_quotes,
        "chart_revenue_6m": chart_revenue,
        "alerts": {
            "low_stock_filaments": low_stock,
        },
    }
