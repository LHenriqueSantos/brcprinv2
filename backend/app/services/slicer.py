"""
Serviço Slicer — cliente HTTP para o slicer-api-v2 (Bambu Studio CLI).
"""
import httpx
from typing import BinaryIO, List, Tuple
from app.config import settings


class SlicerResult:
    def __init__(self, weight_g: float, print_time_hours: float, estimated: bool = False, filaments_by_color: dict = None):
        self.weight_g = weight_g
        self.print_time_hours = print_time_hours
        self.estimated = estimated
        self.filaments_by_color = filaments_by_color or {}


async def slice_files(
    files: List[Tuple[str, bytes, str]],  # (filename, content, content_type)
    infill: int = 20,
    quantity: int = 1,
    is_multicolor: bool = False,
) -> SlicerResult:
    """
    Envia arquivos para o slicer-api-v2 e retorna o resultado de fatiamento.
    files: lista de (filename, bytes, content_type)
    """
    async with httpx.AsyncClient(timeout=120.0) as client:
        multipart = []
        for name, content, ctype in files:
            multipart.append(("files", (name, content, ctype)))

        response = await client.post(
            f"{settings.SLICER_API_URL}/slice",
            files=multipart,
            data={"infill": str(infill), "quantity": str(quantity)},
        )
        response.raise_for_status()
        data = response.json()

        return SlicerResult(
            weight_g=data.get("weight_g", 1.0),
            print_time_hours=data.get("print_time_hours", 0.5),
            estimated=data.get("estimated", False),
            filaments_by_color=data.get("filaments_by_color", {}),
        )
