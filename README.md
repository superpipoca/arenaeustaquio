# 3ustaquio – Plataforma Hacker de Tokens de Narrativa

> **“Se você tem nome, você pode ter uma moeda. O resto é jogo.”**

O 3ustaquio é uma **infraestrutura hacker** para criação e negociação de **tokens de narrativa**: moedas de bar, padaria, criador, projeto ou comunidade – com risco alto assumido e transparência brutal.

- Não é banco.
- Não é corretora.
- Não é consultoria de investimento.
- É ferramenta para especulação consciente.

---

## 🔧 Stack Técnica

- **Web App:** Next.js + React (App Router, SPA com páginas críticas server-side)
- **Back / DB:**  
  - Supabase (Auth, Postgres, Functions, Realtime)
- **Pagamentos (taxas, onboarding, cash-in/out):**  
  - Celcoin – PIX + cartão de crédito (gateway / banking as a service)
- **E-mail e notificações:**
  - **E-mail transacional:** [Resend – Email API para developers](https://resend.com)  
    - Integração nativa com Next.js e React Email :contentReference[oaicite:0]{index=0}  
  - **In-app notifications:** via Supabase (Realtime + tabela `notifications`)  
  - **Roadmap:** Web Push (ex.: OneSignal) para alertas opt-in de hype e risco :contentReference[oaicite:1]{index=1}  

---

## 🧩 Conceito de Produto (resumão)

### O que o 3ustaquio é

- Uma **Arena de Narrativas**: ranking de tokens de pessoas, bares, negócios locais e projetos.
- Um **Lab de Moedas**: qualquer criador pode testar uma narrativa em forma de token.
- Uma **Sala de Máquina**: visão avançada para quem quer mexer em parâmetros e contratos.

### O que o 3ustaquio NÃO é

- Não é “investimento seguro”.
- Não promete retorno.
- Não oferece recomendação de investimento.
- Não vende o token como produto financeiro regulado.

---

## 👤 Principais perfis de uso

- **Criador / Influencer / Dono de comunidade**  
  Cria um token próprio, paga taxa, divulga, vê números de narrativa (holders, hype, bolha).

- **Dono de negócio local (bar, padaria, loja)**  
  Transforma o hype do bairro em token de narrativa (experimento assumido, não programa de pontos).

- **Trader / Especulador consciente**  
  Entra na Arena, vê ranking, compra/vende tokens sabendo que é jogo de alto risco.

- **Hacker ético / Builder**  
  Usa a Sala de Máquina para experimentar regras, parâmetros e projetos de token.

---

## 🏗️ Arquitetura em alto nível

### Frontend (Next.js / React)

- `app/` – rotas da aplicação (App Router)
  - `app/(public)/` – landing, manifesto, docs de risco
  - `app/(app)/creator/` – fluxo de criação de token
  - `app/(app)/arena/` – ranking e página de token
  - `app/(app)/dashboard/` – painel de criador / trader
  - `app/api/` – rotas de backend light (e-mail, webhooks, etc.)
- `components/` – UI isolada:
  - cards de token, ranking, alerts de risco, modais de confirmação
- `lib/`
  - `supabaseClient.ts` – client do Supabase
  - `celcoinClient.ts` – client de integração Celcoin
  - `resendClient.ts` – client de e-mail transacional
  - helpers de formatação (preço, zonas de bolha, etc.)

### Backend / Dados (Supabase)

- **Auth:** Supabase Auth (e-mail / OAuth)  
- **Postgres:** tabelas principais (simplificado)
  - `profiles` – usuários (criador, trader, admin)
  - `tokens` – definição de cada token de narrativa
  - `token_stats` – métricas agregadas (hype, volatilidade, zona de mercado)
  - `orders` – ordens de compra/venda (modelo de book/AMM a definir)
  - `trades` – execuções
  - `payments` – registros de cobrança de taxas (Celcoin)
  - `notifications` – notificações in-app e log de e-mail
- **Functions / Edge Functions:**
  - Criação de token + lógica de validação de risco
  - Atualização de `token_stats`
  - Integrações com Celcoin (webhooks) e Resend (logs)

---

## 💸 Pagamentos (Celcoin)

- Usamos **Celcoin** como gateway para:
  - Cobrança de **taxa de criação de token** (PIX / cartão)
  - Futuras operações de entrada/saída (quando aplicável ao modelo)

Pontos-chave:

- Todas as telas de pagamento exibem que:
  - A taxa é **pelo serviço/plataforma**, não compra de “produto financeiro”.
  - O criador assume responsabilidade por usar a ferramenta dentro da lei e com comunicação honesta.

---

## ✉️ E-mail e Notificações

### Por que Resend?

- API focada em dev, integração rápida com Next.js App Router e Server Actions. :contentReference[oaicite:2]{index=2}  
- Permite construir templates em React (ex.: React Email).
- Bom fit com a ideia de **transacional puro**: boas-vindas, confirmação, alertas de risco, etc.

### Tipos de e-mails (exemplos)

- Confirmação de conta / login
- Confirmação de criação de token + resumo do risco aceito
- Alertas de risco do tipo:
  - “Seu token entrou em zona de hype — lembre sua comunidade de que hype não dura pra sempre.”
- Logs de segurança (mudança de senha, atividade suspeita)

### Notificações in-app

- Tabela `notifications` + Supabase Realtime:
  - Alertas de “Zona de bolha”
  - Atualizações de trades relevantes
  - Eventos do criador (token aprovado, taxa processada, etc.)

### Futuro: Web Push (opt-in)

- Planejado uso de **web push** (ex.: OneSignal) para:
  - Avisar “hype/bolha” de tokens favoritos
  - Alertas de risco configuráveis pelo próprio usuário :contentReference[oaicite:3]{index=3}  

---

## ⚙️ Setup de desenvolvimento

### Pré-requisitos

- Node.js >= 20
- pnpm / npm / yarn
- Conta no Supabase
- Conta Celcoin (sandbox)
- Conta Resend (API key)

### 1. Clonar o repositório

```bash
git clone https://github.com/sua-org/3ustaquio.git
cd 3ustaquio
