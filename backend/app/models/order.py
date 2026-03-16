from sqlalchemy import Column, Integer, String, Boolean, DateTime, Enum, Numeric, Text, JSON, ForeignKey, BigInteger
from sqlalchemy.sql import func
from app.database import Base


class CartOrder(Base):
    __tablename__ = "cart_orders"

    id = Column(Integer, primary_key=True, autoincrement=True)
    public_token = Column(String(36), unique=True, nullable=False)
    client_id = Column(Integer, ForeignKey("clients.id", ondelete="SET NULL"))
    status = Column(
        Enum("pending_payment", "paid", "processing", "shipped", "delivered", "cancelled"),
        default="pending_payment",
    )
    subtotal = Column(Numeric(10, 2), default=0.00)
    shipping_cost = Column(Numeric(10, 2), default=0.00)
    discount_value = Column(Numeric(10, 2), default=0.00)
    total = Column(Numeric(10, 2), default=0.00)
    coupon_id = Column(Integer)
    delivery_method = Column(Enum("shipping", "pickup"), default="shipping")
    client_name = Column(String(255))
    client_document = Column(String(50))
    client_email = Column(String(255))
    client_phone = Column(String(50))
    client_zipcode = Column(String(20))
    client_address = Column(String(255))
    client_number = Column(String(20))
    client_complement = Column(String(100))
    client_neighborhood = Column(String(100))
    client_city = Column(String(100))
    client_state = Column(String(20))
    shipping_service = Column(String(100))
    shipping_service_id = Column(Integer)
    melhorenvio_order_id = Column(String(255))
    shipping_tracking_code = Column(String(255))
    mp_preference_id = Column(String(255))
    mp_payment_id = Column(BigInteger)
    mp_status = Column(String(50))
    notes = Column(Text)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())


class CartOrderItem(Base):
    __tablename__ = "cart_order_items"

    id = Column(Integer, primary_key=True, autoincrement=True)
    order_id = Column(Integer, ForeignKey("cart_orders.id", ondelete="CASCADE"), nullable=False)
    type = Column(Enum("digital", "ready_stock", "custom_pod"), nullable=False)
    catalog_item_id = Column(Integer)
    title = Column(String(255), nullable=False)
    price = Column(Numeric(10, 2), nullable=False)
    quantity = Column(Integer, default=1)
    color = Column(String(100))
    stl_file_url = Column(Text)
    extras = Column(JSON)
    created_at = Column(DateTime, server_default=func.now())
