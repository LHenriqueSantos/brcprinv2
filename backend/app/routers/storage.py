from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from app.auth import get_current_client, get_current_admin
from app.services.minio import upload_file, get_presigned_url, get_public_url
from app.config import settings
import uuid, os

router = APIRouter()


@router.post("/upload/stl")
async def upload_stl(
    file: UploadFile = File(...),
    current_client=Depends(get_current_client),
):
    """Upload de arquivo STL/3MF pelo cliente."""
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in [".stl", ".3mf", ".obj", ".amf"]:
        raise HTTPException(status_code=400, detail="Formato não suportado. Use STL, 3MF, OBJ ou AMF.")
    content = await file.read()
    object_name = f"client_{current_client.id}/{uuid.uuid4()}{ext}"
    await upload_file(content, object_name, settings.MINIO_BUCKET_STL, file.content_type or "application/octet-stream")
    url = get_presigned_url(settings.MINIO_BUCKET_STL, object_name, expires_hours=72)
    return {"object_name": object_name, "url": url}


@router.post("/upload/image")
async def upload_image(
    file: UploadFile = File(...),
    _admin=Depends(get_current_admin),
):
    """Upload de imagem de produto (admin)."""
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in [".jpg", ".jpeg", ".png", ".webp"]:
        raise HTTPException(status_code=400, detail="Formato não suportado. Use JPG, PNG ou WebP.")
    content = await file.read()
    object_name = f"products/{uuid.uuid4()}{ext}"
    await upload_file(content, object_name, settings.MINIO_BUCKET_IMAGES, file.content_type or "image/jpeg")
    url = get_public_url(settings.MINIO_BUCKET_IMAGES, object_name)
    return {"object_name": object_name, "url": url}


@router.get("/presign/{bucket}/{object_name:path}")
async def presign_url(bucket: str, object_name: str, hours: int = 24):
    """Gera URL presigned de acesso temporário a qualquer objeto."""
    url = get_presigned_url(bucket, object_name, expires_hours=hours)
    return {"url": url}
