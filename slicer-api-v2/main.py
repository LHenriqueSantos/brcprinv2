import os
import uuid
import shutil
from pathlib import Path
from fastapi import FastAPI, UploadFile, File, Form
from fastapi.responses import JSONResponse
from typing import Optional

from slicer import (
    UPLOAD_DIR, OUTPUT_DIR,
    slice_with_bambu, parse_bambu_gcode_3mf, estimate_from_size,
)

app = FastAPI(title="BRCPrint Slicer API v2", version="2.0.0")


@app.get("/health")
async def health():
    from pathlib import Path
    bambu_ok = Path("/usr/local/bin/bambu-studio").exists()
    return {"status": "ok", "bambu_studio": bambu_ok}


@app.post("/slice")
async def slice_endpoint(
    files: list[UploadFile] = File(...),
    infill: int = Form(20),
    quantity: int = Form(1),
):
    """
    Fatiamento headless via Bambu Studio CLI.
    Aceita STL, 3MF, OBJ, AMF.
    Retorna: weight_g, print_time_hours, filaments_by_color (para multicolor).
    """
    allowed_exts = {".stl", ".3mf", ".obj", ".amf"}
    session_id = uuid.uuid4().hex
    session_dir = UPLOAD_DIR / session_id
    out_dir = OUTPUT_DIR / session_id
    session_dir.mkdir(parents=True, exist_ok=True)
    out_dir.mkdir(parents=True, exist_ok=True)

    total_weight = 0.0
    total_time = 0.0
    merged_colors: dict = {}
    has_estimate = False

    try:
        for upload in files:
            ext = Path(upload.filename).suffix.lower()
            if ext not in allowed_exts:
                ext = ".stl"

            saved_path = session_dir / f"{uuid.uuid4().hex}{ext}"
            content = await upload.read()
            saved_path.write_bytes(content)

            print(f"[SLICER] Recebido: {upload.filename} → {saved_path}")

            # Tenta Bambu Studio CLI
            gcode_3mf = await slice_with_bambu(saved_path, out_dir, infill=infill)

            if gcode_3mf and gcode_3mf.exists():
                parsed = parse_bambu_gcode_3mf(gcode_3mf)
                total_weight += parsed["weight_g"] * quantity
                total_time += parsed["print_time_hours"] * quantity
                if parsed.get("estimated"):
                    has_estimate = True
                for color, grams in parsed.get("filaments_by_color", {}).items():
                    merged_colors[color] = merged_colors.get(color, 0) + grams * quantity
                print(f"[SLICER] Bambu result: {parsed['weight_g']}g / {parsed['print_time_hours']}h")
            else:
                # Fallback: estimativa por tamanho
                est = estimate_from_size(saved_path, quantity)
                total_weight += est["weight_g"]
                total_time += est["print_time_hours"]
                has_estimate = True
                print(f"[SLICER] Fallback estimate: {est['weight_g']}g / {est['print_time_hours']}h")

        if total_weight < 0.1:
            total_weight = 1.0

        return {
            "success": True,
            "weight_g": round(total_weight, 2),
            "print_time_hours": round(total_time, 2),
            "filaments_by_color": merged_colors,
            "estimated": has_estimate,
        }

    except Exception as e:
        return JSONResponse(status_code=500, content={"error": str(e)})

    finally:
        shutil.rmtree(session_dir, ignore_errors=True)
        shutil.rmtree(out_dir, ignore_errors=True)


@app.post("/render-scad")
async def render_scad(
    scad_file: UploadFile = File(...),
    parameters: Optional[str] = Form(None),
):
    """Renderiza arquivo OpenSCAD com parâmetros (mantido do v1)."""
    import json
    import asyncio
    session_id = uuid.uuid4().hex
    scad_path = UPLOAD_DIR / f"{session_id}.scad"
    out_path = OUTPUT_DIR / f"{session_id}.stl"

    content = await scad_file.read()
    scad_path.write_bytes(content)

    params = {}
    if parameters:
        try:
            params = json.loads(parameters)
        except Exception:
            pass

    d_args = []
    for k, v in params.items():
        if isinstance(v, str):
            d_args += ["-D", f'{k}="{v}"']
        else:
            d_args += ["-D", f"{k}={v}"]

    cmd = ["openscad", "-o", str(out_path)] + d_args + [str(scad_path)]
    proc = await asyncio.create_subprocess_exec(*cmd, stdout=asyncio.subprocess.PIPE, stderr=asyncio.subprocess.PIPE)
    await proc.communicate()

    if out_path.exists() and out_path.stat().st_size > 0:
        from fastapi.responses import FileResponse
        return FileResponse(str(out_path), filename="custom_model.stl", media_type="application/octet-stream")

    scad_path.unlink(missing_ok=True)
    return JSONResponse(status_code=500, content={"error": "OpenSCAD falhou ao gerar STL"})
