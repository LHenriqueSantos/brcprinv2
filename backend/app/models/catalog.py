from sqlalchemy import Column, Integer, String, Boolean, DateTime, Numeric, Text, JSON
from sqlalchemy.sql import func
from app.database import Base


class CatalogItem(Base):
    __tablename__ = "catalog_items"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(200), nullable=False)
    description = Column(Text)
    category = Column(String(100))
    material = Column(String(100))       # PLA, PETG, ABS...
    color = Column(String(100))
    base_price = Column(Numeric(10, 2))
    image_url = Column(Text)
    file_url = Column(Text)              # STL/3MF stored in MinIO
    infill_default = Column(Integer, default=20)
    quantity_min = Column(Integer, default=1)
    active = Column(Boolean, default=True)
    featured = Column(Boolean, default=False)
    weight_g = Column(Numeric(10, 2))    # pre-sliced weight estimate
    print_time_h = Column(Numeric(8, 2))
    tags = Column(JSON)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, onupdate=func.now())


class Auction(Base):
    __tablename__ = "auctions"

    id = Column(Integer, primary_key=True, autoincrement=True)
    title = Column(String(200), nullable=False)
    description = Column(Text)
    image_url = Column(Text)
    catalog_item_id = Column(Integer)
    start_bid = Column(Numeric(10, 2), nullable=False, default=0)
    current_bid = Column(Numeric(10, 2), default=0)
    min_increment = Column(Numeric(10, 2), default=1)
    total_bids = Column(Integer, default=0)
    winner_client_id = Column(Integer)
    status = Column(String(50), default="active")   # active, ended, cancelled
    ends_at = Column(DateTime)
    created_at = Column(DateTime, server_default=func.now())


class AuctionBid(Base):
    __tablename__ = "auction_bids"

    id = Column(Integer, primary_key=True, autoincrement=True)
    auction_id = Column(Integer, nullable=False)
    client_id = Column(Integer)
    bidder_name = Column(String(150))
    amount = Column(Numeric(10, 2), nullable=False)
    created_at = Column(DateTime, server_default=func.now())


class ContactMessage(Base):
    __tablename__ = "contact_messages"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(150), nullable=False)
    email = Column(String(150), nullable=False)
    phone = Column(String(30))
    subject = Column(String(200))
    message = Column(Text, nullable=False)
    replied = Column(Boolean, default=False)
    created_at = Column(DateTime, server_default=func.now())
