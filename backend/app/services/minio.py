"""
Serviço MinIO — upload, download e geração de presigned URLs.
"""
import io
from minio import Minio
from minio.error import S3Error
from app.config import settings

_client = None


def get_minio_client() -> Minio:
    global _client
    if _client is None:
        _client = Minio(
            settings.MINIO_ENDPOINT,
            access_key=settings.MINIO_ACCESS_KEY,
            secret_key=settings.MINIO_SECRET_KEY,
            secure=settings.MINIO_SECURE,
        )
    return _client


async def upload_file(
    data: bytes,
    filename: str,
    bucket: str,
    content_type: str = "application/octet-stream",
) -> str:
    """Faz upload para o MinIO e retorna o nome do objeto."""
    client = get_minio_client()
    try:
        client.put_object(
            bucket,
            filename,
            io.BytesIO(data),
            length=len(data),
            content_type=content_type,
        )
        return filename
    except S3Error as e:
        raise RuntimeError(f"MinIO upload error: {e}")


def get_presigned_url(bucket: str, object_name: str, expires_hours: int = 24) -> str:
    """Gera URL presigned para acesso temporário ao objeto."""
    from datetime import timedelta
    client = get_minio_client()
    return client.presigned_get_object(bucket, object_name, expires=timedelta(hours=expires_hours))


def get_public_url(bucket: str, object_name: str) -> str:
    """Gera URL estática (para buckets públicos como images, avatars)."""
    scheme = "https" if settings.MINIO_SECURE else "http"
    return f"{scheme}://{settings.MINIO_ENDPOINT}/{bucket}/{object_name}"
