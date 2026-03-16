from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel
from typing import Optional

from app.database import get_db
from app.auth import get_current_admin
from app.models.printer import Printer

router = APIRouter()


class PrinterOut(BaseModel):
    id: int
    name: str
    model: Optional[str]
    type: str
    api_type: str
    is_online: bool
    active: bool
    current_hours_printed: float
    maintenance_alert_threshold: int
    last_maintenance_hours: float

    class Config:
        from_attributes = True


class PrinterCreate(BaseModel):
    name: str
    model: Optional[str] = None
    type: str = "FDM"
    power_watts: float
    purchase_price: float
    lifespan_hours: int = 2000
    maintenance_reserve_pct: float = 5.0
    api_type: str = "none"
    ip_address: Optional[str] = None
    api_key: Optional[str] = None
    device_serial: Optional[str] = None


@router.get("/", response_model=list[PrinterOut])
async def list_printers(
    db: AsyncSession = Depends(get_db),
    _admin=Depends(get_current_admin),
):
    result = await db.execute(select(Printer).where(Printer.active == True).order_by(Printer.id))
    return result.scalars().all()


@router.post("/", response_model=PrinterOut, status_code=201)
async def create_printer(
    data: PrinterCreate,
    db: AsyncSession = Depends(get_db),
    _admin=Depends(get_current_admin),
):
    printer = Printer(**data.model_dump())
    db.add(printer)
    await db.commit()
    await db.refresh(printer)
    return printer


@router.put("/{printer_id}", response_model=PrinterOut)
async def update_printer(
    printer_id: int,
    data: PrinterCreate,
    db: AsyncSession = Depends(get_db),
    _admin=Depends(get_current_admin),
):
    result = await db.execute(select(Printer).where(Printer.id == printer_id))
    printer = result.scalar_one_or_none()
    if not printer:
        raise HTTPException(status_code=404, detail="Impressora não encontrada")
    for field, value in data.model_dump(exclude_none=True).items():
        setattr(printer, field, value)
    await db.commit()
    await db.refresh(printer)
    return printer


@router.delete("/{printer_id}")
async def delete_printer(
    printer_id: int,
    db: AsyncSession = Depends(get_db),
    _admin=Depends(get_current_admin),
):
    result = await db.execute(select(Printer).where(Printer.id == printer_id))
    printer = result.scalar_one_or_none()
    if not printer:
        raise HTTPException(status_code=404, detail="Impressora não encontrada")
    printer.active = False
    await db.commit()
    return {"success": True}
