from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from pydantic import BaseModel
from typing import Optional, List, Any
import math

from app.database import get_db
from app.auth import get_current_admin
from app.models.catalog import CatalogItem

router = APIRouter()


# ---------- Schemas ----------

class CatalogItemCreate(BaseModel):
    name: str
    description: Optional[str] = None
    category: Optional[str] = None
    material: Optional[str] = None
    color: Optional[str] = None
    base_price: Optional[float] = None
    image_url: Optional[str] = None
    file_url: Optional[str] = None
    infill_default: int = 20
    quantity_min: int = 1
    active: bool = True
    featured: bool = False
    weight_g: Optional[float] = None
    print_time_h: Optional[float] = None
    tags: Optional[List[str]] = None


class CatalogItemOut(BaseModel):
    id: int
    name: str
    description: Optional[str]
    category: Optional[str]
    material: Optional[str]
    color: Optional[str]
    base_price: Optional[float]
    image_url: Optional[str]
    file_url: Optional[str]
    infill_default: int
    quantity_min: int
    active: bool
    featured: bool
    weight_g: Optional[float]
    print_time_h: Optional[float]
    tags: Optional[Any]

    class Config:
        from_attributes = True


# ---------- Public endpoints ----------

@router.get("/", response_model=List[CatalogItemOut])
async def list_catalog(
    category: Optional[str] = None,
    featured: Optional[bool] = None,
    search: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
):
    """Public catalog listing — no auth required."""
    query = select(CatalogItem).where(CatalogItem.active == True)
    if category:
        query = query.where(CatalogItem.category == category)
    if featured is not None:
        query = query.where(CatalogItem.featured == featured)
    if search:
        query = query.where(CatalogItem.name.ilike(f"%{search}%"))
    query = query.order_by(CatalogItem.featured.desc(), CatalogItem.id.desc())
    result = await db.execute(query)
    items = result.scalars().all()
    return [CatalogItemOut.model_validate(i) for i in items]


@router.get("/{item_id}", response_model=CatalogItemOut)
async def get_catalog_item(item_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(CatalogItem).where(CatalogItem.id == item_id))
    item = result.scalar_one_or_none()
    if not item:
        raise HTTPException(status_code=404, detail="Item não encontrado")
    return CatalogItemOut.model_validate(item)


# ---------- Admin CRUD ----------

@router.post("/", response_model=CatalogItemOut)
async def create_catalog_item(
    body: CatalogItemCreate,
    db: AsyncSession = Depends(get_db),
    _admin=Depends(get_current_admin),
):
    item = CatalogItem(**body.model_dump())
    db.add(item)
    await db.commit()
    await db.refresh(item)
    return CatalogItemOut.model_validate(item)


@router.patch("/{item_id}", response_model=CatalogItemOut)
async def update_catalog_item(
    item_id: int,
    body: dict,
    db: AsyncSession = Depends(get_db),
    _admin=Depends(get_current_admin),
):
    result = await db.execute(select(CatalogItem).where(CatalogItem.id == item_id))
    item = result.scalar_one_or_none()
    if not item:
        raise HTTPException(status_code=404, detail="Item não encontrado")
    for k, v in body.items():
        if hasattr(item, k) and v is not None:
            setattr(item, k, v)
    await db.commit()
    await db.refresh(item)
    return CatalogItemOut.model_validate(item)


@router.delete("/{item_id}")
async def delete_catalog_item(
    item_id: int,
    db: AsyncSession = Depends(get_db),
    _admin=Depends(get_current_admin),
):
    result = await db.execute(select(CatalogItem).where(CatalogItem.id == item_id))
    item = result.scalar_one_or_none()
    if not item:
        raise HTTPException(status_code=404, detail="Item não encontrado")
    await db.delete(item)
    await db.commit()
    return {"success": True}
