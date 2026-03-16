# BRCPrint - ERP & CRM para Fazendas de Impressão 3D

O **BRCPrint** é um ecossistema completo para proprietários de impressoras 3D, Makers e Farm Managers. Ele consolida todo o fluxo de trabalho: desde o upload do arquivo pelo cliente até o fatiamento em nuvem, pagamento automático, gestão de produção via Gantt, IoT e métricas financeiras.

## 🌟 Funcionalidades de Elite

### 💼 B2B & Banco VIP (Assinaturas)
- **Planos de Assinatura:** Ofereça pacotes mensais B2B com franquia de **Horas de Máquina** e **Gramas de Filamento**.
- **Checkout Híbrido:** Clientes VIP podem pagar pedidos usando seu saldo do Banco VIP (deduzindo horas de impressão e peso do material) ou via métodos tradicionais.
- **Dedução Automática:** Cálculo automático e inteligente da precificação baseado nas regras do plano B2B do cliente.

### ⚙️ Engenharia e Auto-Fatiamento (Cloud Slicer)
- **Slicer API Integrada:** Utiliza **PrusaSlicer CLI** com rotinas isoladas em container para cálculos automáticos de tempo, peso e custo (superando parsers estáticos de STL).
- **Suporte a 3MF e Multi-Objeto:** Processa montagens complexas, identificando volumes individuais e permitindo orçamentos de projetos inteiros em um único upload.
- **AMS/Multicolor:** Suporte avançado a trocas de cor, calculando peso da torre de purga (waste) e tempo adicional de setup do sistema AMS.
- **Auto-Repair (Cura de STL):** Correção automática de malhas abertas e invertidas via `admesh` antes do fatiamento.

### ⏱️ Chão de Fábrica e Produção
- **Motor de Fila (Gantt):** Planejamento visual de produção. Aloque cotações em uma linha do tempo (Gantt) separada por máquina para evitar ociosidade.
- **Kanban de Status:** Fluxo visual e prático de `Orçado` → `Aprovado` → `Produzindo` → `Entregue`.
- **Rastreabilidade de Lotes:** Controle rígido da validade e peso de **Lotes de Filamento**, rastreando exatamente qual carretel foi usado em cada peça para auditoria e controle de estoque de gramas de alta precisão.
- **Horário de Ponta (Bandeira Branca):** Inteligência de cálculo de Custo de Energia que considera horários de pico (ex: 18h-21h) para aplicar tarifas dinâmicas (KWh) e amortizar custo no valor da cotação com base nas horas prováveis de término de impressão.

### 🤖 Inteligência Artificial
- **BRCPrint Assistant:** Widget de chat inteligente no portal do cliente (OpenAI) que tem contexto do seu banco de dados para responder dúvidas sobre status de pedidos, dar recomendações de materiais (PLA vs PETG) e explicar políticas da fazenda em tempo real.

### 💰 Pagamentos, Vendas e Marketing
- **Checkout Checkout (PIX/Cartão):** Integração total com **MercadoPago (PIX)** e **Stripe (Global)**.
- **Cupons e Fidelidade:** Sistema de cupons promocionais e **Cashback Automático** acumulado na conta do cliente a cada compra.
- **Marketplace Digital:** Venda seus arquivos STL/3MF diretamente pelo catálogo com entrega de link digital seguro gerado após o pagamento.
- **Sistema de Afiliados:** Gerencie parceiros, influencers e afiliados que geram indicações e ganham comissão automática percentual.
- **Review Automático (UGC):** Solicitação automática de feedback UGC com foto via WhatsApp após a entrega.

## 🚀 Como Instalar (Docker)

O sistema utiliza arquitetura de microserviços (containers) otimizada e portável:
- **App:** Next.js (Frontend e Backend API)
- **MySQL:** Banco de Dados Relacional
- **Slicer-API:** Worker Ubuntu com utilitários 3D CLI para fatiamento seguro.

1. Clone o repositório.
2. Crie e configure o arquivo `.env` seguindo os exemplos para MercadoPago, Stripe e OpenAI.
3. Suba o ecossistema e construa os containers:
   ```bash
   docker-compose up -d --build
   ```

## ⚙️ Configurando Automações (CRON)

O sistema depende de gatilhos temporais via CRON Jobs para as automações:
- **/api/cron/abandoned-quotes:** Envia lembretes de carrinhos abandonados (intervalo de 6h).
- **/api/cron/reviews:** Dispara pedidos de avaliação e prova social (intervalo de 12h).
- Limpeza periódica de arquivos temporários 3D no container de fatiamento.

## 🛠️ Stack Tecnológico
- **Fullstack UI/API:** Next.js 15+ (App Router) + React 19 + TypeScript.
- **Computação Gráfica:** Three.js (Visualizador 3D interativo nativo acelerado por hardware no browser).
- **Backend de Dados:** Node.js, NextAuth v5 (Auth.js), MySQL 8.
- **Integrações Nativas:** OpenAI API, MercadoPago PIX, Stripe Billing, WhatsApp Webhook.
- **Design System:** Vanilla CSS / NextUI / Framer Motion (Glassmorphism, Painel de Administração Dinâmico com Gráficos Recharts e Micro-animações premium).
