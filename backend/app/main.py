from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.database import engine, Base
from app.routers import (
    auth,
    clients,
    quotes,
    orders,
    printers,
    filaments,
    catalog,
    admin,
    whatsapp,
    storage,
    cron,
    auctions,
    contact,
    config as config_router,
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    # Shutdown
    await engine.dispose()


app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers com prefixo /api/v1
API_PREFIX = "/api/v1"

app.include_router(auth.router, prefix=API_PREFIX + "/auth", tags=["Auth"])
app.include_router(clients.router, prefix=API_PREFIX + "/clients", tags=["Clients"])
app.include_router(quotes.router, prefix=API_PREFIX + "/quotes", tags=["Quotes"])
app.include_router(orders.router, prefix=API_PREFIX + "/orders", tags=["Orders"])
app.include_router(printers.router, prefix=API_PREFIX + "/printers", tags=["Printers"])
app.include_router(filaments.router, prefix=API_PREFIX + "/filaments", tags=["Filaments"])
app.include_router(catalog.router, prefix=API_PREFIX + "/catalog", tags=["Catalog"])
app.include_router(auctions.router, prefix=API_PREFIX + "/auctions", tags=["Auctions"])
app.include_router(contact.router, prefix=API_PREFIX + "/contact", tags=["Contact"])
app.include_router(config_router.router, prefix=API_PREFIX + "/config", tags=["Config"])
app.include_router(admin.router, prefix=API_PREFIX + "/admin", tags=["Admin"])
app.include_router(whatsapp.router, prefix=API_PREFIX + "/whatsapp", tags=["WhatsApp"])
app.include_router(storage.router, prefix=API_PREFIX + "/storage", tags=["Storage"])
app.include_router(cron.router, prefix=API_PREFIX + "/cron", tags=["Cron"])


@app.get("/api/v1/health", tags=["Health"])
async def health():
    return {"status": "ok", "version": settings.APP_VERSION}
