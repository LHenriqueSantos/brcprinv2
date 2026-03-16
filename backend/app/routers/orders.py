from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from pydantic import BaseModel
from typing import Optional
from datetime import datetime

from app.database import get_db
from app.auth import get_current_admin
from app.models.order import CartOrder, CartOrderItem

router = APIRouter()


class OrderItemOut(BaseModel):
    id: int
    type: str
    title: str
    price: float
    quantity: int
    color: Optional[str] = None

    class Config:
        from_attributes = True


class OrderOut(BaseModel):
    id: int
    public_token: str
    status: str
    client_name: Optional[str] = None
    client_email: Optional[str] = None
    client_phone: Optional[str] = None
    delivery_method: Optional[str] = None
    subtotal: float
    shipping_cost: float
    discount_value: float
    total: float
    shipping_tracking_code: Optional[str] = None
    mp_status: Optional[str] = None
    notes: Optional[str] = None
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class OrderStatusUpdate(BaseModel):
    status: str
    tracking_code: Optional[str] = None
    notes: Optional[str] = None


VALID_STATUSES = {"pending_payment", "paid", "processing", "shipped", "delivered", "cancelled"}


@router.get("/")
async def list_orders(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    status: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
    _admin=Depends(get_current_admin),
):
    query = select(CartOrder)
    if status:
        query = query.where(CartOrder.status == status)
    if search:
        pattern = f"%{search}%"
        from sqlalchemy import or_
        query = query.where(
            or_(
                CartOrder.client_name.ilike(pattern),
                CartOrder.client_email.ilike(pattern),
                CartOrder.public_token.ilike(pattern),
            )
        )
    total_q = await db.execute(select(func.count()).select_from(query.subquery()))
    total = total_q.scalar() or 0

    query = query.order_by(CartOrder.created_at.desc()).offset((page - 1) * limit).limit(limit)
    result = await db.execute(query)
    items = result.scalars().all()

    return {
        "total": total,
        "page": page,
        "pages": max(1, (total + limit - 1) // limit),
        "items": [OrderOut.model_validate(o) for o in items],
    }


@router.get("/{order_id}")
async def get_order(
    order_id: int,
    db: AsyncSession = Depends(get_db),
    _admin=Depends(get_current_admin),
):
    result = await db.execute(select(CartOrder).where(CartOrder.id == order_id))
    order = result.scalar_one_or_none()
    if not order:
        raise HTTPException(status_code=404, detail="Pedido não encontrado")

    items_q = await db.execute(
        select(CartOrderItem).where(CartOrderItem.order_id == order_id)
    )
    items = items_q.scalars().all()

    return {
        **OrderOut.model_validate(order).model_dump(),
        "items": [OrderItemOut.model_validate(i).model_dump() for i in items],
        "client_zipcode": order.client_zipcode,
        "client_address": order.client_address,
        "client_number": order.client_number,
        "client_city": order.client_city,
        "client_state": order.client_state,
        "shipping_service": order.shipping_service,
        "mp_payment_id": str(order.mp_payment_id) if order.mp_payment_id else None,
    }


STATUS_MESSAGES = {
    "paid": "✅ *Pedido #{id} Confirmado!*\nSeu pagamento foi recebido e seu pedido está em fila de produção.\n\n📦 BRCPrint — Impressão 3D",
    "processing": "🖨️ *Pedido #{id} em Produção!*\nSua peça está sendo impressa agora. Te avisaremos quando sair para entrega.\n\n📦 BRCPrint — Impressão 3D",
    "shipped": "🚀 *Pedido #{id} Enviado!*\nSeu pedido saiu para entrega!\n📬 Código de rastreio: *{tracking}*\n\n📦 BRCPrint — Impressão 3D",
    "delivered": "🎉 *Pedido #{id} Entregue!*\nEsperamos que tenha gostado! Qualquer dúvida, estamos aqui.\n\n📦 BRCPrint — Impressão 3D",
    "cancelled": "❌ *Pedido #{id} Cancelado*\nSeu pedido foi cancelado. Entre em contato se tiver dúvidas.\n\n📦 BRCPrint — Impressão 3D",
}


@router.patch("/{order_id}/status")
async def update_order_status(
    order_id: int,
    data: OrderStatusUpdate,
    db: AsyncSession = Depends(get_db),
    _admin=Depends(get_current_admin),
):
    if data.status not in VALID_STATUSES:
        raise HTTPException(status_code=400, detail=f"Status inválido. Use um de: {VALID_STATUSES}")

    result = await db.execute(select(CartOrder).where(CartOrder.id == order_id))
    order = result.scalar_one_or_none()
    if not order:
        raise HTTPException(status_code=404, detail="Pedido não encontrado")

    order.status = data.status
    if data.tracking_code:
        order.shipping_tracking_code = data.tracking_code
    if data.notes:
        order.notes = data.notes
    await db.commit()

    # Send WhatsApp notification (non-blocking)
    if order.client_phone and data.status in STATUS_MESSAGES:
        import asyncio
        from app.routers.whatsapp import send_whatsapp
        tracking = data.tracking_code or order.shipping_tracking_code or "—"
        msg = STATUS_MESSAGES[data.status].format(id=order_id, tracking=tracking)
        asyncio.create_task(send_whatsapp(order.client_phone, msg))

    return {"success": True, "status": order.status}
