from sqlalchemy import Column, Integer, String, Boolean, DateTime, Enum, Text, Numeric, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


class Client(Base):
    __tablename__ = "clients"

    id = Column(Integer, primary_key=True, autoincrement=True)
    client_type = Column(Enum("individual", "company"), default="individual")
    name = Column(String(150), nullable=False)
    company = Column(String(150))
    document = Column(String(30))
    email = Column(String(150))
    phone = Column(String(30))
    password_hash = Column(String(255))
    discount_margin_pct = Column(Numeric(5, 2), default=0.00)
    zipcode = Column(String(20))
    address = Column(String(255))
    address_number = Column(String(20))
    address_comp = Column(String(100))
    neighborhood = Column(String(100))
    city = Column(String(100))
    state = Column(String(10))
    referred_by = Column(Integer)
    notes = Column(Text)
    auth_provider = Column(String(50))
    auth_provider_id = Column(String(255))
    credit_balance = Column(Numeric(10, 2), default=0.00)
    available_hours_balance = Column(Numeric(8, 2), default=0.00)
    available_grams_balance = Column(Numeric(10, 2), default=0.00)
    subscription_status = Column(Enum("inactive", "active", "suspended"), default="inactive")
    subscription_plan_id = Column(Integer)
    total_cashback_earned = Column(Numeric(10, 2), default=0.00)
    created_at = Column(DateTime, server_default=func.now())
