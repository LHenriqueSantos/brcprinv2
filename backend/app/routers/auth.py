from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel
from datetime import timedelta

from app.database import get_db
from app.auth import verify_password, create_access_token, hash_password
from app.models.client import Client
from app.models.admin import Admin
from app.config import settings

router = APIRouter()


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_type: str
    user_id: int
    name: str


class ClientRegister(BaseModel):
    name: str
    email: str
    password: str
    phone: str | None = None
    document: str | None = None


@router.post("/token", response_model=TokenResponse)
async def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: AsyncSession = Depends(get_db),
):
    # Tenta admin primeiro
    result = await db.execute(select(Admin).where(Admin.username == form_data.username))
    admin = result.scalar_one_or_none()
    if admin and verify_password(form_data.password, admin.password_hash):
        token = create_access_token({"sub": str(admin.id), "type": "admin"})
        return TokenResponse(access_token=token, user_type="admin", user_id=admin.id, name=admin.name or admin.username)

    # Tenta cliente por email
    result = await db.execute(select(Client).where(Client.email == form_data.username))
    client = result.scalar_one_or_none()
    if client and client.password_hash and verify_password(form_data.password, client.password_hash):
        token = create_access_token({"sub": str(client.id), "type": "client"})
        return TokenResponse(access_token=token, user_type="client", user_id=client.id, name=client.name)

    raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Credenciais inválidas")


@router.post("/admin/token", response_model=TokenResponse)
async def admin_login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: AsyncSession = Depends(get_db),
):
    """Admin-only login endpoint — only returns token if the user is an admin."""
    result = await db.execute(select(Admin).where(Admin.username == form_data.username))
    admin = result.scalar_one_or_none()
    if admin and verify_password(form_data.password, admin.password_hash):
        token = create_access_token({"sub": str(admin.id), "type": "admin"})
        return TokenResponse(access_token=token, user_type="admin", user_id=admin.id, name=admin.name or admin.username)
    raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Credenciais de administrador inválidas")


@router.post("/register", response_model=TokenResponse, status_code=201)
async def register(data: ClientRegister, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Client).where(Client.email == data.email))
    if result.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Email já cadastrado")

    client = Client(
        name=data.name,
        email=data.email,
        phone=data.phone,
        document=data.document,
        password_hash=hash_password(data.password),
    )
    db.add(client)
    await db.commit()
    await db.refresh(client)

    token = create_access_token({"sub": str(client.id), "type": "client"})
    return TokenResponse(access_token=token, user_type="client", user_id=client.id, name=client.name)


@router.post("/forgot-password")
async def forgot_password(body: dict, db: AsyncSession = Depends(get_db)):
    """Request password reset link via e-mail. Currently a stub."""
    email = body.get("email", "")
    # In production: generate reset token, store it, send email
    # For now, always return success (don't leak whether email exists)
    return {"success": True, "message": "Se o e-mail existir, você receberá as instruções em breve."}
