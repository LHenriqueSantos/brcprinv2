from sqlalchemy import Column, Integer, String, Boolean, DateTime, Enum
from sqlalchemy.sql import func
from app.database import Base


class Admin(Base):
    __tablename__ = "admins"

    id = Column(Integer, primary_key=True, autoincrement=True)
    username = Column(String(100), unique=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    name = Column(String(100))
    email = Column(String(200), nullable=True)
    active = Column(Boolean, default=True)
    role = Column(Enum("admin", "vendedor", "operador"), default="operador")
    created_at = Column(DateTime, server_default=func.now())
