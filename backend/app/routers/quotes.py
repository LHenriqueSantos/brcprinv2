from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File, Form
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from pydantic import BaseModel
from typing import Optional, List
import math
import uuid

from app.database import get_db
from app.auth import get_current_client, get_current_admin
from app.models.quote import Quote
from app.models.client import Client
from app.services.pricing import calculate_quote
from app.services.minio import upload_file
from app.services.slicer import slice_files
from app.config import settings

router = APIRouter()


class QuoteOut(BaseModel):
    id: int
    public_token: Optional[str]
    title: Optional[str]
    status: str
    final_price: float
    quantity: int
    print_time_hours: float
    filament_used_g: float
    is_multicolor: bool
    request_type: str
    created_at: str

    class Config:
        from_attributes = True


@router.get("/", response_model=dict)
async def list_quotes(
    page: int = Query(1, ge=1),
    limit: int = Query(20, le=100),
    status: Optional[str] = None,
    search: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    _admin=Depends(get_current_admin),
):
    query = select(Quote)
    if status:
        query = query.where(Quote.status == status)
    if search:
        query = query.where(
            Quote.title.ilike(f"%{search}%") |
            Quote.client_name.ilike(f"%{search}%") |
            Quote.client_email.ilike(f"%{search}%")
        )
    query = query.order_by(Quote.created_at.desc())

    total_result = await db.execute(select(func.count()).select_from(query.subquery()))
    total = total_result.scalar()

    result = await db.execute(query.offset((page - 1) * limit).limit(limit))
    quotes = result.scalars().all()

    return {
        "items": [QuoteOut.model_validate(q) for q in quotes],
        "total": total,
        "page": page,
        "pages": math.ceil(total / limit),
    }


@router.get("/my", response_model=dict)
async def my_quotes(
    page: int = Query(1, ge=1),
    limit: int = Query(10, le=50),
    db: AsyncSession = Depends(get_db),
    current_client: Client = Depends(get_current_client),
):
    query = select(Quote).where(Quote.client_id == current_client.id).order_by(Quote.created_at.desc())
    total_result = await db.execute(select(func.count()).select_from(query.subquery()))
    total = total_result.scalar()
    result = await db.execute(query.offset((page - 1) * limit).limit(limit))
    quotes = result.scalars().all()
    return {
        "items": [QuoteOut.model_validate(q) for q in quotes],
        "total": total,
        "page": page,
        "pages": math.ceil(total / limit),
    }


@router.get("/{token}")
async def get_quote_by_token(token: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Quote).where(Quote.public_token == token))
    quote = result.scalar_one_or_none()
    if not quote:
        raise HTTPException(status_code=404, detail="Cotação não encontrada")
    return quote


@router.post("/{quote_id}/approve")
async def approve_quote(
    quote_id: int,
    db: AsyncSession = Depends(get_db),
    _admin=Depends(get_current_admin),
):
    result = await db.execute(select(Quote).where(Quote.id == quote_id))
    quote = result.scalar_one_or_none()
    if not quote:
        raise HTTPException(status_code=404, detail="Cotação não encontrada")
    quote.status = "approved"
    await db.commit()
    return {"success": True, "status": "approved"}


@router.post("/{quote_id}/status")
async def update_quote_status(
    quote_id: int,
    body: dict,
    db: AsyncSession = Depends(get_db),
    _admin=Depends(get_current_admin),
):
    result = await db.execute(select(Quote).where(Quote.id == quote_id))
    quote = result.scalar_one_or_none()
    if not quote:
        raise HTTPException(status_code=404, detail="Cotação não encontrada")
    quote.status = body.get("status", quote.status)
    if body.get("notes"):
        quote.notes = body["notes"]
    await db.commit()
    return {"success": True, "status": quote.status}
