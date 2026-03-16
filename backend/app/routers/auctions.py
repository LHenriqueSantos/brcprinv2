from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

from app.database import get_db
from app.auth import get_current_client, get_current_admin
from app.models.catalog import Auction, AuctionBid
from app.models.client import Client

router = APIRouter()


class BidCreate(BaseModel):
    amount: float


class AuctionOut(BaseModel):
    id: int
    title: str
    description: Optional[str]
    image_url: Optional[str]
    start_bid: float
    current_bid: float
    min_increment: float
    total_bids: int
    status: str
    ends_at: Optional[str]

    class Config:
        from_attributes = True


class BidOut(BaseModel):
    id: int
    auction_id: int
    bidder_name: str
    amount: float
    created_at: str

    class Config:
        from_attributes = True


@router.get("/", response_model=List[AuctionOut])
async def list_auctions(
    status: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
):
    query = select(Auction)
    if status:
        query = query.where(Auction.status == status)
    query = query.order_by(Auction.ends_at.asc())
    result = await db.execute(query)
    auctions = result.scalars().all()
    return [AuctionOut.model_validate(a) for a in auctions]


@router.get("/{auction_id}", response_model=AuctionOut)
async def get_auction(auction_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Auction).where(Auction.id == auction_id))
    a = result.scalar_one_or_none()
    if not a:
        raise HTTPException(status_code=404, detail="Leilão não encontrado")
    return AuctionOut.model_validate(a)


@router.get("/{auction_id}/bids", response_model=List[BidOut])
async def get_auction_bids(
    auction_id: int,
    limit: int = 10,
    db: AsyncSession = Depends(get_db),
):
    query = (
        select(AuctionBid)
        .where(AuctionBid.auction_id == auction_id)
        .order_by(AuctionBid.amount.desc())
        .limit(limit)
    )
    result = await db.execute(query)
    bids = result.scalars().all()
    return [BidOut.model_validate(b) for b in bids]


@router.post("/{auction_id}/bids", response_model=BidOut)
async def place_bid(
    auction_id: int,
    body: BidCreate,
    db: AsyncSession = Depends(get_db),
    current_client: Client = Depends(get_current_client),
):
    result = await db.execute(select(Auction).where(Auction.id == auction_id))
    auction = result.scalar_one_or_none()
    if not auction:
        raise HTTPException(status_code=404, detail="Leilão não encontrado")
    if auction.status != "active":
        raise HTTPException(status_code=400, detail="Leilão não está ativo")
    if auction.ends_at and datetime.utcnow() > auction.ends_at:
        raise HTTPException(status_code=400, detail="Leilão encerrado")
    min_bid = float(auction.current_bid or auction.start_bid) + float(auction.min_increment)
    if body.amount < min_bid:
        raise HTTPException(
            status_code=400,
            detail=f"Lance mínimo é R$ {min_bid:.2f}"
        )

    bid = AuctionBid(
        auction_id=auction_id,
        client_id=current_client.id,
        bidder_name=current_client.name or current_client.email,
        amount=body.amount,
    )
    db.add(bid)
    auction.current_bid = body.amount
    auction.total_bids = (auction.total_bids or 0) + 1
    await db.commit()
    await db.refresh(bid)
    return BidOut.model_validate(bid)


# Admin: create/manage auctions
@router.post("/")
async def create_auction(
    body: dict,
    db: AsyncSession = Depends(get_db),
    _admin=Depends(get_current_admin),
):
    auction = Auction(**{k: v for k, v in body.items() if hasattr(Auction, k)})
    db.add(auction)
    await db.commit()
    await db.refresh(auction)
    return AuctionOut.model_validate(auction)


@router.patch("/{auction_id}")
async def update_auction(
    auction_id: int,
    body: dict,
    db: AsyncSession = Depends(get_db),
    _admin=Depends(get_current_admin),
):
    result = await db.execute(select(Auction).where(Auction.id == auction_id))
    auction = result.scalar_one_or_none()
    if not auction:
        raise HTTPException(status_code=404, detail="Leilão não encontrado")
    for k, v in body.items():
        if hasattr(auction, k):
            setattr(auction, k, v)
    await db.commit()
    return {"success": True}
