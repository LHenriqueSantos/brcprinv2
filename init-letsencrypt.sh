#!/bin/bash

# Este script gera os certificados SSL pela primeira vez.
# Baseado na recomendação oficial do certbot-docker (Philipp Heckel e outros).

if ! [ -x "$(command -v docker)" ]; then
  echo 'Erro: docker não está instalado.' >&2
  exit 1
fi

domains=(brcprint.com.br www.brcprint.com.br)
rsa_key_size=4096
data_path="./certbot"
email="naoresponda@brcprint.com.br" # Email usado para registros do Let's Encrypt
staging=0 # Mude para 1 se você estiver testando para evitar limite da API do Let's Encrypt

if [ -d "$data_path" ]; then
  read -p "Já existem dados de certificado. Deseja substituí-los? (y/N) " decision
  if [ "$decision" != "Y" ] && [ "$decision" != "y" ]; then
    exit
  fi
fi

echo "### Baixando parâmetros TLS recomendados ..."
mkdir -p "$data_path/conf"
curl -s https://raw.githubusercontent.com/certbot/certbot/master/certbot-nginx/certbot_nginx/_internal/tls_configs/options-ssl-nginx.conf > "$data_path/conf/options-ssl-nginx.conf"
curl -s https://raw.githubusercontent.com/certbot/certbot/master/certbot/certbot/ssl-dhparams.pem > "$data_path/conf/ssl-dhparams.pem"
echo

echo "### Criando certificado temporário DUMMY para $domains ..."
path="/etc/letsencrypt/live/$domains"
mkdir -p "$data_path/conf/live/$domains"
docker compose -f docker-compose.prod.yml run --rm --entrypoint "\
  openssl req -x509 -nodes -newkey rsa:$rsa_key_size -days 1\
    -keyout '$path/privkey.pem' \
    -out '$path/fullchain.pem' \
    -subj '/CN=localhost'" certbot
echo

echo "### Iniciando o Nginx ..."
docker compose -f docker-compose.prod.yml up --force-recreate -d nginx
echo

echo "### Deletando certificado temporário DUMMY para $domains ..."
docker compose -f docker-compose.prod.yml run --rm --entrypoint "\
  rm -Rf /etc/letsencrypt/live/$domains && \
  rm -Rf /etc/letsencrypt/archive/$domains && \
  rm -Rf /etc/letsencrypt/renewal/$domains.conf" certbot
echo

echo "### Solicitando o certificado real para o Let's Encrypt ..."
# Juntar nomes de domínio no formato do certbot -d
domain_args=""
for domain in "${domains[@]}"; do
  domain_args="$domain_args -d $domain"
done

# Setar email
case "$email" in
  "") email_arg="--register-unsafely-without-email" ;;
  *) email_arg="--email $email" ;;
esac

# Ativar ambiente de staging (teste)
if [ $staging != "0" ]; then staging_arg="--staging"; fi

docker compose -f docker-compose.prod.yml run --rm --entrypoint "\
  certbot certonly --webroot -w /var/www/certbot \
    $staging_arg \
    $email_arg \
    $domain_args \
    --rsa-key-size $rsa_key_size \
    --agree-tos \
    --force-renewal" certbot
echo

echo "### Reiniciando Nginx ..."
docker compose -f docker-compose.prod.yml exec nginx nginx -s reload
echo -e "\n=== Certificados Gerados com Sucesso! O HTTPS agora está ativo no Nginx. ==="
