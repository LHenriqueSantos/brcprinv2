import os
import uuid
import asyncio
import subprocess
import zipfile
import json
import re
from pathlib import Path
from typing import Optional

UPLOAD_DIR = Path("/tmp/slicer-uploads")
OUTPUT_DIR = Path("/app/outputs")
BAMBU_PROFILES_DIR = Path("/opt/bambu_profiles")
BAMBU_BIN = "/usr/local/bin/bambu-studio"

UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)


async def run_cmd(cmd: list[str], timeout: int = 180) -> tuple[str, str, int]:
    """Executa um comando de forma assíncrona."""
    proc = await asyncio.create_subprocess_exec(
        *cmd,
        stdout=asyncio.subprocess.PIPE,
        stderr=asyncio.subprocess.PIPE,
        env={**os.environ, "DISPLAY": ":99"},
    )
    try:
        stdout, stderr = await asyncio.wait_for(proc.communicate(), timeout=timeout)
        return stdout.decode(), stderr.decode(), proc.returncode
    except asyncio.TimeoutError:
        proc.kill()
        return "", "Timeout", -1


def parse_bambu_gcode_3mf(gcode_3mf_path: Path) -> dict:
    """
    Extrai metadados de um .gcode.3mf gerado pelo Bambu Studio.
    O arquivo é um ZIP contendo Metadata/slice_info.config e o gcode.
    Retorna: weight_g, print_time_hours, filaments_by_color
    """
    result = {
        "weight_g": 0.0,
        "print_time_hours": 0.5,
        "filaments_by_color": {},
        "estimated": False,
    }
    try:
        with zipfile.ZipFile(gcode_3mf_path, "r") as z:
            # Lê slice_info.config (JSON/XML com estatísticas)
            names = z.namelist()

            # Tenta ler Metadata/slice_info.config
            if "Metadata/slice_info.config" in names:
                with z.open("Metadata/slice_info.config") as f:
                    content = f.read().decode("utf-8", errors="ignore")
                    _parse_slice_info(content, result)

            # Fallback: lê gcode diretamente em busca de comentários
            gcode_files = [n for n in names if n.endswith(".gcode")]
            if result["weight_g"] < 0.1 and gcode_files:
                with z.open(gcode_files[0]) as f:
                    gcode_text = f.read(50000).decode("utf-8", errors="ignore")
                    _parse_gcode_comments(gcode_text, result)

    except Exception as e:
        print(f"[SLICER] Erro ao parsear .gcode.3mf: {e}")
        result["estimated"] = True

    if result["weight_g"] < 0.1:
        result["weight_g"] = 1.0
        result["estimated"] = True

    return result


def _parse_slice_info(content: str, result: dict):
    """Parseia slice_info.config do Bambu Studio (formato XML simplificado)."""
    # Tempo total estimado
    time_match = re.search(r'<predict_time_normal_mode[^>]*>(\d+)</predict_time_normal_mode>', content)
    if time_match:
        seconds = int(time_match.group(1))
        result["print_time_hours"] = round(seconds / 3600, 2)

    # Peso por filamento (AMS slots)
    filament_pattern = re.finditer(
        r'<filament[^>]*color="([^"]*)"[^>]*used_m="([^"]*)"[^>]*used_g="([^"]*)"', content
    )
    total_weight = 0.0
    for m in filament_pattern:
        color = m.group(1)
        weight_g = float(m.group(3) or 0)
        total_weight += weight_g
        result["filaments_by_color"][color] = round(weight_g, 2)

    if total_weight > 0:
        result["weight_g"] = round(total_weight, 2)


def _parse_gcode_comments(gcode: str, result: dict):
    """Fallback: parseia comentários G-code estilo Bambu."""
    # Bambu usa: ; filament used [g] = X ou ; total filament used [g] = X
    wm = re.search(r'; total filament used \[g\] = ([0-9.]+)', gcode)
    if not wm:
        wm = re.search(r'; filament used \[g\] = ([0-9.]+)', gcode)
    if wm:
        result["weight_g"] = float(wm.group(1))

    # Tempo: ; estimated printing time = Xh Ym Zs
    tm = re.search(r'; estimated printing time = (.+)', gcode)
    if tm:
        s = tm.group(1)
        h = re.search(r'(\d+)h', s)
        m = re.search(r'(\d+)m', s)
        sc = re.search(r'(\d+)s', s)
        hours = (int(h.group(1)) if h else 0) + (int(m.group(1)) / 60 if m else 0) + (int(sc.group(1)) / 3600 if sc else 0)
        result["print_time_hours"] = round(hours, 2)


def estimate_from_size(file_path: Path, quantity: int = 1) -> dict:
    """Estimativa pelo tamanho do arquivo (último recurso)."""
    try:
        mb = file_path.stat().st_size / (1024 * 1024)
        weight_g = round(max(1, mb * 12 * quantity), 2)
        time_hours = round(max(0.5, mb * 0.6 * quantity), 2)
    except Exception:
        weight_g, time_hours = 5.0 * quantity, 1.0 * quantity
    return {"weight_g": weight_g, "print_time_hours": time_hours, "filaments_by_color": {}, "estimated": True}


async def slice_with_bambu(
    input_path: Path,
    output_dir: Path,
    infill: int = 20,
    machine_profile: str = "Bambu Lab X1 Carbon 0.4 nozzle",
) -> Optional[Path]:
    """
    Invoca Bambu Studio CLI para fatiar um arquivo.
    Retorna o caminho do .gcode.3mf gerado, ou None em caso de falha.
    """
    if not Path(BAMBU_BIN).exists():
        return None

    cmd = [
        BAMBU_BIN,
        "--slice", "0",               # fatia todas as plates
        "--outputdir", str(output_dir),
        str(input_path),
    ]
    print(f"[SLICER] Bambu CLI: {' '.join(cmd)}")
    stdout, stderr, code = await run_cmd(cmd, timeout=180)
    print(f"[SLICER] Bambu exit={code} stdout={stdout[:200]} err={stderr[:200]}")

    if code == 0:
        # Encontra o .gcode.3mf gerado
        outputs = list(output_dir.glob("*.gcode.3mf"))
        if outputs:
            return outputs[0]
    return None
