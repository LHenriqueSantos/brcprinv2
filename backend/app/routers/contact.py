from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel, EmailStr
from typing import Optional

from app.database import get_db
from app.config import settings
from app.models.catalog import ContactMessage

router = APIRouter()


class ContactCreate(BaseModel):
    name: str
    email: str
    phone: Optional[str] = None
    subject: Optional[str] = None
    message: str


@router.post("/")
async def submit_contact(body: ContactCreate, db: AsyncSession = Depends(get_db)):
    msg = ContactMessage(
        name=body.name,
        email=body.email,
        phone=body.phone,
        subject=body.subject,
        message=body.message,
    )
    db.add(msg)
    await db.commit()

    # Try to send WhatsApp notification (non-critical)
    try:
        import httpx
        wa_msg = (
            f"📩 *Novo contato via site*\n"
            f"*Nome:* {body.name}\n"
            f"*E-mail:* {body.email}\n"
            f"*Tel:* {body.phone or '-'}\n"
            f"*Assunto:* {body.subject or '-'}\n\n"
            f"{body.message}"
        )
        async with httpx.AsyncClient(timeout=5) as client:
            if hasattr(settings, 'WHATSAPP_ADMIN_NUMBER') and settings.WHATSAPP_ADMIN_NUMBER:
                await client.post(
                    f"{settings.EVOLUTION_API_BASE_URL}/message/sendText/{settings.EVOLUTION_INSTANCE}",
                    headers={"apikey": settings.EVOLUTION_API_KEY},
                    json={"number": settings.WHATSAPP_ADMIN_NUMBER, "text": wa_msg},
                )
    except Exception:
        pass  # Non-critical

    return {"success": True, "message": "Mensagem recebida com sucesso!"}
