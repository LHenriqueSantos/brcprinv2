from fastapi import APIRouter, Depends
from app.auth import get_current_admin
from app.models.order import CartOrder

router = APIRouter()


@router.get("/")
async def list_orders(_admin=Depends(get_current_admin)):
    return {"message": "TODO: listar cart_orders"}
