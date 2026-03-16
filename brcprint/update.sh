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
    export $(grep -v '^#' .env | xargs)
    echo -e "${GREEN}[1/3] Ambiente .env carregado.${NC}"
else
    echo -e "${RED}Erro: Arquivo .env não encontrado. Execute o setup.sh primeiro.${NC}"
    exit 1
fi

# 2. Rebuild and Restart Containers
echo -e "\n${GREEN}[2/3] Reconstruindo e reiniciando os containers...${NC}"
docker compose -f docker-compose.prod.yml up -d --build

# Clean up unused images to save space
echo "Limpando imagens antigas..."
docker image prune -f

# 3. Handle Database Migrations
echo -e "\n${GREEN}[3/3] Migrações de Banco de Dados${NC}"
echo "Deseja executar algum script SQL de migração da pasta db/? (s/n)"
read -r RUN_MIGRATION

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
