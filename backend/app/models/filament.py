from sqlalchemy import Column, Integer, String, Boolean, DateTime, Numeric
from sqlalchemy.sql import func
from app.database import Base


class Filament(Base):
    __tablename__ = "filaments"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(100), nullable=False)
    brand = Column(String(100))
    type = Column(String(50), nullable=False)
    color = Column(String(50))
    cost_per_kg = Column(Numeric(10, 2), nullable=False)
    density_g_cm3 = Column(Numeric(6, 4), default=1.2400)
    active = Column(Boolean, default=True)
    lot_number = Column(String(100))
    roll_number = Column(String(100))
    purchase_date = Column(DateTime)
    initial_weight_g = Column(Numeric(10, 2), default=1000.00)
    current_weight_g = Column(Numeric(10, 2), default=1000.00)
    min_stock_warning = Column(Numeric(10, 2), default=100.00)
    total_purchased_g = Column(Numeric(10, 2), default=1000.00)
    created_at = Column(DateTime, server_default=func.now())
