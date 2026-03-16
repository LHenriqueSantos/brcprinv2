from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from pydantic import BaseModel
from typing import Optional
import math

from app.database import get_db
from app.auth import get_current_client, get_current_admin
from app.models.client import Client

router = APIRouter()


class ClientOut(BaseModel):
    id: int
    name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    document: Optional[str] = None
    client_type: str
    credit_balance: float = 0.0
    available_hours_balance: float = 0.0
    available_grams_balance: float = 0.0
    subscription_status: str
    city: Optional[str] = None
    state: Optional[str] = None

    class Config:
        from_attributes = True


class ClientUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    zipcode: Optional[str] = None
    address: Optional[str] = None
    address_number: Optional[str] = None
    address_comp: Optional[str] = None
    neighborhood: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    document: Optional[str] = None


@router.get("/me", response_model=ClientOut)
async def get_me(current_client: Client = Depends(get_current_client)):
    return current_client


@router.put("/me", response_model=ClientOut)
async def update_me(
    data: ClientUpdate,
    current_client: Client = Depends(get_current_client),
    db: AsyncSession = Depends(get_db),
):
    for field, value in data.model_dump(exclude_none=True).items():
        setattr(current_client, field, value)
    await db.commit()
    await db.refresh(current_client)
    return current_client


# ── Admin endpoints ────────────────────────────────────────────────────────────

@router.get("/", response_model=dict)
async def list_clients(
    page: int = Query(1, ge=1),
    limit: int = Query(20, le=100),
    search: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    _admin=Depends(get_current_admin),
):
    query = select(Client)
    if search:
        query = query.where(
            Client.name.ilike(f"%{search}%") |
            Client.email.ilike(f"%{search}%") |
            Client.phone.ilike(f"%{search}%")
        )
    total_result = await db.execute(select(func.count()).select_from(query.subquery()))
    total = total_result.scalar()

    result = await db.execute(query.offset((page - 1) * limit).limit(limit))
    clients = result.scalars().all()

    return {
        "items": [ClientOut.model_validate(c) for c in clients],
        "total": total,
        "page": page,
        "pages": math.ceil(total / limit),
    }


@router.get("/{client_id}", response_model=ClientOut)
async def get_client(
    client_id: int,
    db: AsyncSession = Depends(get_db),
    _admin=Depends(get_current_admin),
):
    result = await db.execute(select(Client).where(Client.id == client_id))
    client = result.scalar_one_or_none()
    if not client:
        raise HTTPException(status_code=404, detail="Cliente não encontrado")
    return client
