from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel
from typing import Optional

from app.database import get_db
from app.auth import get_current_admin
from app.models.filament import Filament

router = APIRouter()


class FilamentOut(BaseModel):
    id: int
    name: str
    brand: Optional[str]
    type: str
    color: Optional[str]
    cost_per_kg: float
    current_weight_g: float
    min_stock_warning: float
    active: bool

    class Config:
        from_attributes = True


class FilamentCreate(BaseModel):
    name: str
    brand: Optional[str] = None
    type: str
    color: Optional[str] = None
    cost_per_kg: float
    density_g_cm3: float = 1.24
    initial_weight_g: float = 1000.0
    min_stock_warning: float = 100.0


@router.get("/", response_model=list[FilamentOut])
async def list_filaments(
    active_only: bool = True,
    db: AsyncSession = Depends(get_db),
):
    query = select(Filament)
    if active_only:
        query = query.where(Filament.active == True)
    result = await db.execute(query.order_by(Filament.name))
    return result.scalars().all()


@router.post("/", response_model=FilamentOut, status_code=201)
async def create_filament(
    data: FilamentCreate,
    db: AsyncSession = Depends(get_db),
    _admin=Depends(get_current_admin),
):
    filament = Filament(**data.model_dump(), current_weight_g=data.initial_weight_g)
    db.add(filament)
    await db.commit()
    await db.refresh(filament)
    return filament


@router.put("/{filament_id}", response_model=FilamentOut)
async def update_filament(
    filament_id: int,
    data: FilamentCreate,
    db: AsyncSession = Depends(get_db),
    _admin=Depends(get_current_admin),
):
    result = await db.execute(select(Filament).where(Filament.id == filament_id))
    filament = result.scalar_one_or_none()
    if not filament:
        raise HTTPException(status_code=404, detail="Filamento não encontrado")
    for k, v in data.model_dump(exclude_none=True).items():
        setattr(filament, k, v)
    await db.commit()
    await db.refresh(filament)
    return filament
