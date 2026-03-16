FROM python:3.12-slim

WORKDIR /app

# ── Dependências de sistema ──────────────────────────────────────────────────
# Bambu Studio requer libs gráficas (usa Qt). Xvfb fornece display virtual.
RUN apt-get update && apt-get install -y \
    wget curl unzip xvfb \
    libgl1 libglib2.0-0 libdbus-1-3 \
    libfontconfig1 libx11-6 libxext6 libxrender1 \
    libxcb1 libxi6 libxkbcommon0 libxkbcommon-x11-0 \
    libssl3 libcurl4 libgomp1 \
    admesh python3-pip \
    && rm -rf /var/lib/apt/lists/*

# ── Bambu Studio CLI ──────────────────────────────────────────────────────────
# Download da versão mais recente. Atualize a URL conforme novas releases.
ARG BAMBU_VERSION=01.10.01.50
RUN wget -q "https://github.com/bambulab/BambuStudio/releases/download/v${BAMBU_VERSION}/BambuStudio_ubuntu_v${BAMBU_VERSION}.AppImage" \
    -O /usr/local/bin/bambu-studio.AppImage \
    && chmod +x /usr/local/bin/bambu-studio.AppImage \
    && /usr/local/bin/bambu-studio.AppImage --appimage-extract \
    && mv squashfs-root /opt/bambu-studio \
    && ln -s /opt/bambu-studio/bambu-studio /usr/local/bin/bambu-studio \
    || echo "Bambu Studio download falhou - usando modo estimativa"

# ── Python deps ───────────────────────────────────────────────────────────────
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Perfis de máquina Bambu
COPY machine_profiles/ /opt/bambu_profiles/

EXPOSE 3005

# Xvfb + uvicorn para suporte ao display virtual do Bambu Studio
CMD ["sh", "-c", "Xvfb :99 -screen 0 1024x768x24 & export DISPLAY=:99 && uvicorn main:app --host 0.0.0.0 --port 3005"]
