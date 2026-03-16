from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # App
    APP_NAME: str = "BRCPrint API"
    APP_VERSION: str = "2.0.0"
    DEBUG: bool = False

    # Database MySQL
    DATABASE_URL: str = "mysql+aiomysql://brcprint_user:brcprint_pass123@mysql:3306/brcprint_db"

    # JWT
    JWT_SECRET: str = "change_me_in_production"
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRE_MINUTES: int = 1440  # 24h

    # MinIO
    MINIO_ENDPOINT: str = "minio:9000"
    MINIO_ACCESS_KEY: str = "brcprint_minio"
    MINIO_SECRET_KEY: str = "minio_pass_2024"
    MINIO_SECURE: bool = False
    MINIO_BUCKET_STL: str = "stl-files"
    MINIO_BUCKET_GCODES: str = "gcodes"
    MINIO_BUCKET_IMAGES: str = "images"
    MINIO_BUCKET_AVATARS: str = "avatars"
    MINIO_BUCKET_DOCS: str = "documents"

    # Redis
    REDIS_URL: str = "redis://redis:6379"

    # Evolution API (WhatsApp)
    EVOLUTION_API_URL: str = "http://evolution:8080"
    EVOLUTION_API_KEY: str = ""
    EVOLUTION_INSTANCE: str = "brcprint"

    # SMTP
    SMTP_HOST: str = ""
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASS: str = ""
    SMTP_FROM: str = "noreply@brcprint.com.br"

    # Mercado Pago
    MP_ACCESS_TOKEN: str = ""
    MP_PUBLIC_KEY: str = ""

    # Melhor Envios
    MELHORENVIO_TOKEN: str = ""

    # FocusNFe
    FOCUSNFE_TOKEN: str = ""
    FOCUSNFE_ENV: str = "sandbox"

    # Slicer
    SLICER_API_URL: str = "http://slicer:3005"
    SCAD_API_URL: str = "http://scad:3006"

    # Admin padrão
    ADMIN_USERNAME: str = "admin"
    ADMIN_PASSWORD: str = "admin123"

    class Config:
        env_file = ".env"
        extra = "ignore"


settings = Settings()
