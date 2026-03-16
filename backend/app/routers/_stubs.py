"""
Routers stub para: orders, catalog, admin, cron.
Implementação completa será expandida progressivamente.
"""
from fastapi import APIRouter, Depends
from app.auth import get_current_admin

# ── Orders ────────────────────────────────────────────────────────────────────
router_orders = APIRouter()

@router_orders.get("/")
async def list_orders(_admin=Depends(get_current_admin)):
    return {"message": "TODO: listar cart_orders"}

# ── Catalog ───────────────────────────────────────────────────────────────────
router_catalog = APIRouter()

@router_catalog.get("/")
async def list_catalog():
    return {"message": "TODO: listar catalog_items"}

# ── Admin ─────────────────────────────────────────────────────────────────────
router_admin = APIRouter()

@router_admin.get("/dashboard")
async def dashboard(_admin=Depends(get_current_admin)):
    return {"message": "TODO: estatísticas dashboard"}

# ── Cron ──────────────────────────────────────────────────────────────────────
router_cron = APIRouter()

@router_cron.get("/auction-bots")
async def run_auction_bots():
    """Chamado pelo auction_bot container a cada 3s."""
    # TODO: lógica do leilão de centavos
    return {"ran": True}
