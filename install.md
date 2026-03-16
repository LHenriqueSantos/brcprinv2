# Guia de Instalação e Deploy - BRCPrint

Este guia descreve como realizar o deploy do BRCPrint em um servidor VPS (Ubuntu/Debian).

## 1. Preparação dos Arquivos
Para o deploy, você deve enviar os seguintes arquivos e pastas para o servidor:

-   `src/` (Código fonte do frontend/API)
-   `public/` (Arquivos estáticos, logos, etc.)
-   `db/` (Scripts de inicialização e migração do banco)
-   `slicer-api/` (Módulo do fatiador)
-   `setup.sh` (Script de automação)
-   `docker-compose.prod.yml` (Configuração de produção)
-   `Dockerfile.prod` (Receita do container da aplicação)
-   `package.json` e `package-lock.json`
-   `next.config.js`
-   `tsconfig.json`
-   `.antigravityignore` (Opcional, mas recomendado)

> [!TIP]
> Você pode compactar tudo em um arquivo `.zip` ou `tar.gz` para facilitar o envio via SCP ou FTP.

## 2. Requisitos de Hardware Recomendados

Para uma operação fluida (especialmente para o fatiador 3D), recomendo:

| Recurso | Mínimo | Recomendado |
| :--- | :--- | :--- |
| **CPU** | 1 Core | 2+ Cores |
| **RAM** | 2 GB | 4 GB |
| **SSD** | 20 GB | 40 GB+ |
| **OS** | Ubuntu 22.04 LTS | Ubuntu 22.04 LTS |

> [!NOTE]
> Se você planeja fatiar arquivos STL muito complexos ou ter muitos usuários simultâneos, **4GB de RAM** é o ponto ideal para evitar travamentos do MySQL ou do Slicer.

## 3. Requisitos do Servidor
-   Sistema Operacional: **Ubuntu 22.04 LTS** ou **Debian 11/12**.
-   Acesso **root** ou permissões de **sudo**.
-   Portas **80** e **443** liberadas no firewall para HTTPS (Caddy).
-   Porta **8080** liberada se desejar acessar o phpMyAdmin externamente.

## 3. Passo a Passo do Deploy

1.  **Acesse o servidor via SSH:**
    ```bash
    ssh root@endereco_do_seu_servidor
    ```

2.  **Envie os arquivos:**
    Se estiver usando Linux/Mac localmente, pode usar:
    ```bash
    scp -r ./brcprint root@seu_ip:/root/
    ```

3.  **Entre na pasta e execute o script de setup:**
    ```bash
    cd brcprint
    chmod +x setup.sh
    sudo ./setup.sh
    ```

4.  **Siga as instruções na tela:**
    O script solicitará o **domínio** (ex: `cotacao.meusite.com`) e seu **e-mail** para gerar o certificado SSL automático.

## 4. O que o Script de Setup faz?
-   Instala o Docker e Docker Compose (se não estiverem presentes).
-   Gera senhas de banco de dados e segredos de autenticação aleatórios e seguros.
-   Cria o arquivo `.env` automaticamente.
-   Configura o **Caddy** como servidor web reverso com **SSL (HTTPS) automático**.
-   Sobe todos os containers (App, MySQL, Slicer, phpMyAdmin).
-   Inicializa o banco de dados com todas as tabelas e migrações.

## 5. Pós-Instalação
-   O sistema estará disponível no domínio informado via HTTPS.
-   O phpMyAdmin estará disponível em `http://seu_dominio:8080` (use a senha `root` gerada no arquivo `.env` se precisar).
- [ ] Create Update Script
    - [x] Design `update.sh` workflow
    - [x] Implement `update.sh` script
    - [x] Update `install.md` with update instructions

-   **Configurações Adicionais**: Após o primeiro login no dashboard admin, você pode configurar as chaves do Mercado Pago e WhatsApp diretamente na interface.

## 6. Atualizando o Sistema (Manual)
Sempre que o código for atualizado ou novas migrações de banco forem necessárias, use o script de update:

1. **Suba os novos arquivos para o servidor.**
2. **Execute o script de update:**
   ```bash
   sudo ./update.sh
   ```
3. **Migrações de SQL:** O script perguntará se você deseja rodar algum arquivo `.sql` da pasta `db/`. Digite o nome do arquivo para aplicá-lo ao banco de dados em execução.

## 7. Deploy Contínuo (Automático via GitHub)

O projeto já contém um arquivo pronto para **GitHub Actions** (`.github/workflows/deploy.yml`).
Se você hospedar o código no GitHub, qualquer `push` para a branch `main` atualizará a VPS automaticamente.

### Como configurar:
1. No seu repositório no GitHub, vá em **Settings > Secrets and variables > Actions**.
2. Clique em **New repository secret** e crie os seguintes segredos:
   - `VPS_HOST`: O endereço IP da sua VPS (ex: `147.182.25.10`)
   - `VPS_USER`: O usuário SSH (geralmente `root`)
   - `VPS_PORT`: A porta SSH (geralmente `22`)
   - `VPS_PASSWORD`: A senha de acesso SSH da sua VPS.

Pronto! Ao fazer um *commit* e *push* para a `main`, o GitHub conectará na sua VPS e rodará o `update.sh` automaticamente.

### Solução de Problemas: Erro "No such file or directory" no GitHub Actions
Se o seu deploy falhar indicando que a pasta `/root/brcprint` não existe ou não é um repositório git (o que acontece na primeira vez se você enviou os arquivos manualmente antes de usar o GitHub), você precisa clonar o projeto na VPS.

Acesse sua VPS via SSH e rode:
```bash
# Apague a pasta antiga (se existir)
rm -rf /root/brcprint

# Clone o seu repositório oficial
git clone https://github.com/LHenriqueSantos/brcprintnext.git /root/brcprint

# Restaure o arquivo .env
cd /root/brcprint
cp .env.example .env
nano .env # Edite e coloque as senhas corretas do banco, nextauth, etc.
```

Depois disso, o GitHub Actions funcionará perfeitamente para todos os próximos updates!

## 8. Novo Servidor Nginx com SSL (Importante na Primeira Vez)

Nós substituímos o antigo Caddy pelo **Nginx e Certbot**, que são o padrão ouro da indústria para SSL gratuito. Como o GitHub vai puxar tudo sozinho, e o Nginx precisa dos certificados Let's Encrypt *antes* de ligar de verdade, você precisará rodar um script gerador apenas **1 vez** lá na VPS.

Após finalizar o `git clone` do passo anterior, rode isso na sua conexão SSH da VPS:

```bash
cd /root/brcprint
chmod +x init-letsencrypt.sh
sudo ./init-letsencrypt.sh
```

Esse script conectará com a Let's Encrypt para `brcprint.com.br`, usará o email `naoresponda@brcprint.com.br`, gerará os certificados SSL reais, e ativará o Nginx.

A partir desse momento, as futuras renovações ocorrerão automaticamente por baixo dos panos a cada 12 horas, e os futuros deploys via GitHub não precisarão mexer mais nisso!
