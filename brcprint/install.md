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

## 6. Atualizando o Sistema
Sempre que o código for atualizado ou novas migrações de banco forem necessárias, use o script de update:

1. **Suba os novos arquivos para o servidor.**
2. **Execute o script de update:**
   ```bash
   sudo ./update.sh
   ```
3. **Migrações de SQL:** O script perguntará se você deseja rodar algum arquivo `.sql` da pasta `db/`. Digite o nome do arquivo para aplicá-lo ao banco de dados em execução.
