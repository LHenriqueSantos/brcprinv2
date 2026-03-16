from fastapi import APIRouter
from app.config import settings

router = APIRouter()


@router.get("/public")
async def public_config():
    """
    Returns non-sensitive configuration for the frontend
    (pricing defaults, feature flags, etc.)
    """
    return {
        "currency_code": getattr(settings, "CURRENCY_CODE", "BRL"),
        "filament_cost_per_gram": getattr(settings, "FILAMENT_COST_PER_GRAM", 0.12),
        "energy_kwh_price": getattr(settings, "ENERGY_KWH_PRICE", 0.85),
        "labor_hourly_rate": getattr(settings, "LABOR_HOURLY_RATE", 25.0),
        "default_profit_margin_pct": getattr(settings, "DEFAULT_PROFIT_MARGIN_PCT", 30),
        "default_loss_pct": getattr(settings, "DEFAULT_LOSS_PCT", 5),
        "enable_multicolor": getattr(settings, "ENABLE_MULTICOLOR", True),
        "enable_auctions": getattr(settings, "ENABLE_AUCTIONS", True),
        "enable_catalog": getattr(settings, "ENABLE_CATALOG", True),
        "min_order_value": getattr(settings, "MIN_ORDER_VALUE", 15.0),
        "whatsapp_number": getattr(settings, "WHATSAPP_ADMIN_NUMBER", ""),
        "contact_email": getattr(settings, "CONTACT_EMAIL", "contato@brcprint.com.br"),
    }
