from fastapi import APIRouter
router = APIRouter()

@router.get("/auction-bots")
async def run_auction_bots():
    """Chamado pelo auction_bot container a cada 3s."""
    return {"ran": True}
