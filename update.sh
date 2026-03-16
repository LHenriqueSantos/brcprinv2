#!/bin/bash

# brcprint - Automated Update Script
# This script rebuilds the production stack and allows applying SQL migrations.

set -e

# Format outputs
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}================================================${NC}"
echo -e "${BLUE}      brcprint - Updater & Migrator           ${NC}"
echo -e "${BLUE}================================================${NC}"

# Check if running as root
if [ "$EUID" -ne 0 ]; then
  echo -e "${RED}Erro: Execute este script como root (sudo ./update.sh)${NC}"
  exit 1
fi

# 1. Load Environment Variables
if [ -f .env ]; then
    # Remove carriage returns (CRLF->LF) before exporting to avoid 'not a valid identifier' errors
    set -a
    source <(sed 's/\r//' .env | grep -v '^#' | grep -v '^$')
    set +a
    echo -e "${GREEN}[1/3] Ambiente .env carregado.${NC}"
else
    echo -e "${RED}Erro: Arquivo .env n\u00e3o encontrado. Execute o setup.sh primeiro.${NC}"
    exit 1
fi

# 2. Rebuild and Restart Containers
echo -e "\n${GREEN}[2/3] Reconstruindo e reiniciando os containers...${NC}"
docker compose -f docker-compose.prod.yml up -d --build

# Clean up unused images to aggressively save space on the VPS
echo "Limpando imagens antigas..."
docker image prune -a -f

# Restart Nginx to reconnect to the newly rebuilt app container
# (Without this, Nginx may return 502 if the app container gets a new internal IP)
echo -e "${GREEN}Reiniciando Nginx para reconectar ao app...${NC}"
docker compose -f docker-compose.prod.yml restart nginx
echo -e "${GREEN}Nginx reiniciado com sucesso!${NC}"

# 3. Handle Database Migrations
echo -e "\n${GREEN}[3/3] Migrações de Banco de Dados${NC}"

# Se estiver rodando via GitHub actions, o git log vai nos dizer o último commit
# Vamos ler o stdin pra saber se devemos rodar migrations interativas
if [ -t 0 ]; then
    echo "Deseja executar algum script SQL de migração da pasta db/? (s/n)"
    read -r RUN_MIGRATION
else
    # Rodando sem TTY (ex: via GitHub Actions piped `echo "n" | ./update.sh`)
    read -r RUN_MIGRATION
fi

if [[ $RUN_MIGRATION =~ ^[Ss]$ ]]; then
    echo "Arquivos disponíveis em db/:"
    ls db/*.sql | xargs -n 1 basename

    echo -e "\nDigite o nome do arquivo (ex: migrate_packaging.sql):"
    read -r SQL_FILE

    if [ -f "db/$SQL_FILE" ]; then
        echo "Executando $SQL_FILE no banco de dados..."
        # We use the MYSQL_ROOT_PASSWORD from .env
        docker exec -i brcprint_mysql_prod mysql -u root -p"$MYSQL_ROOT_PASSWORD" "$DB_NAME" < "db/$SQL_FILE"
        echo -e "${GREEN}Sucesso: $SQL_FILE aplicado!${NC}"
    else
        echo -e "${RED}Erro: Arquivo db/$SQL_FILE não encontrado.${NC}"
    fi
else
    echo "Pulando migrações de SQL."
fi

echo -e "\n${BLUE}================================================${NC}"
echo -e "${GREEN}Atualização Concluída com Sucesso! 🚀${NC}"
echo -e "O sistema está rodando e atualizado em: ${GREEN}https://${APP_DOMAIN}${NC}"
echo -e "${BLUE}================================================${NC}"
