from sqlalchemy import Column, Integer, String, Boolean, DateTime, Enum, Numeric, Float, Text
from sqlalchemy.sql import func
from app.database import Base


class Printer(Base):
    __tablename__ = "printers"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(100), nullable=False)
    model = Column(String(100))
    type = Column(String(50), default="FDM")
    power_watts = Column(Numeric(8, 2), nullable=False)
    purchase_price = Column(Numeric(10, 2), nullable=False)
    lifespan_hours = Column(Integer, default=2000)
    maintenance_reserve_pct = Column(Numeric(5, 2), default=5.00)
    maintenance_alert_threshold = Column(Integer, default=200)
    current_hours_printed = Column(Float, default=0)
    last_maintenance_hours = Column(Float, default=0)
    api_type = Column(Enum("octoprint", "moonraker", "bambu", "none"), default="none")
    ip_address = Column(String(255))
    api_key = Column(String(255))
    device_serial = Column(String(64))
    is_online = Column(Boolean, default=False)
    active = Column(Boolean, default=True)
    created_at = Column(DateTime, server_default=func.now())


class Platter(Base):
    __tablename__ = "platters"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(255), nullable=False)
    printer_id = Column(Integer)
    status = Column(Enum("pending", "in_production", "delivered"), default="pending")
    start_time = Column(DateTime)
    end_time = Column(DateTime)
    created_at = Column(DateTime, server_default=func.now())
