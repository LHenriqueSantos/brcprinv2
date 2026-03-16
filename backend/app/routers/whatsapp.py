"""
Router WhatsApp — integração com Evolution API para notificações.
"""
import httpx
from fastapi import APIRouter, Depends, HTTPException, Request
from app.config import settings
from app.auth import get_current_admin

router = APIRouter()


async def send_whatsapp(phone: str, message: str) -> bool:
    """Envia mensagem WhatsApp via Evolution API."""
    # Normaliza número (remove não-dígitos, adiciona 55 se necessário)
    number = "".join(filter(str.isdigit, phone))
    if not number.startswith("55"):
        number = "55" + number
    if len(number) == 12:  # sem dígito 9
        number = number[:4] + "9" + number[4:]

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.post(
                f"{settings.EVOLUTION_API_URL}/message/sendText/{settings.EVOLUTION_INSTANCE}",
                json={"number": f"{number}@s.whatsapp.net", "text": message},
                headers={"apikey": settings.EVOLUTION_API_KEY},
            )
            return resp.status_code == 201
    except Exception:
        return False


@router.post("/send")
async def send_message(
    body: dict,
    _admin=Depends(get_current_admin),
):
    """Endpoint admin para envio manual de mensagem WhatsApp."""
    phone = body.get("phone")
    message = body.get("message")
    if not phone or not message:
        raise HTTPException(status_code=400, detail="phone e message são obrigatórios")
    success = await send_whatsapp(phone, message)
    return {"success": success}


@router.post("/webhook")
async def evolution_webhook(request: Request):
    """Webhook recebido da Evolution API (mensagens recebidas, status etc.)."""
    payload = await request.json()
    event = payload.get("event", "")
    # TODO: processar eventos de mensagens recebidas, status de entrega, etc.
    return {"received": True, "event": event}


@router.get("/status")
async def evolution_status(_admin=Depends(get_current_admin)):
    """Verifica status da conexão WhatsApp."""
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            resp = await client.get(
                f"{settings.EVOLUTION_API_URL}/instance/fetchInstances",
                headers={"apikey": settings.EVOLUTION_API_KEY},
            )
            return resp.json()
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"Evolution API indisponível: {str(e)}")
