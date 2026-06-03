# YES! CRM — Guia Completo de Configuração e Deploy

CRM web multi-tenant para escolas YES! Idiomas com pipeline Kanban, integração WhatsApp Business API e isolamento total por escola.

---

## Índice

1. [Pré-requisitos](#1-pré-requisitos)
2. [Criar o Projeto no Supabase](#2-criar-o-projeto-no-supabase)
3. [Configurar o Banco de Dados](#3-configurar-o-banco-de-dados)
4. [Configurar WhatsApp Business API (Meta)](#4-configurar-whatsapp-business-api-meta)
5. [Rodar Localmente](#5-rodar-localmente)
6. [Deploy na Vercel (gratuito)](#6-deploy-na-vercel-gratuito)
7. [Criar Primeira Escola e Usuário](#7-criar-primeira-escola-e-usuário)
8. [Configurar Webhook do WhatsApp](#8-configurar-webhook-do-whatsapp)
9. [Usar o CRM](#9-usar-o-crm)
10. [Solução de Problemas](#10-solução-de-problemas)

---

## 1. Pré-requisitos

Antes de começar, instale:

- **Node.js 18+**: baixe em [nodejs.org](https://nodejs.org) (clique em "LTS")
- **Git**: baixe em [git-scm.com](https://git-scm.com)
- Uma conta gratuita no **[Supabase](https://supabase.com)**
- Uma conta no **[Vercel](https://vercel.com)** (pode criar com conta GitHub)
- Uma conta **Meta Developer** com WhatsApp Business API (opcional para começar)

---

## 2. Criar o Projeto no Supabase

1. Acesse [supabase.com](https://supabase.com) e clique em **"Start your project"**
2. Faça login com GitHub ou Google
3. Clique em **"New Project"**
4. Preencha:
   - **Name**: `yes-crm`
   - **Database Password**: crie uma senha forte e **anote ela**
   - **Region**: South America (São Paulo)
5. Clique em **"Create new project"** e aguarde ~2 minutos

### Obter as chaves do Supabase

1. No painel do projeto, clique em **"Project Settings"** (ícone de engrenagem)
2. Clique em **"API"** no menu lateral
3. Copie e anote:
   - **Project URL** → vai para `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** (em "Project API Keys") → vai para `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role** (em "Project API Keys", clique em "Reveal") → vai para `SUPABASE_SERVICE_ROLE_KEY`

> ⚠️ **NUNCA** exponha a `service_role` key publicamente. Ela tem acesso total ao banco.

---

## 3. Configurar o Banco de Dados

### Executar o Schema

1. No painel do Supabase, clique em **"SQL Editor"** (ícone de banco de dados)
2. Clique em **"New query"**
3. Abra o arquivo `supabase/schema.sql` deste projeto
4. Copie todo o conteúdo e cole no editor SQL
5. Clique em **"Run"** (ou pressione Ctrl+Enter)
6. Você deve ver: `Success. No rows returned`

### Executar o Seed (dados de exemplo)

1. Crie uma nova query no SQL Editor
2. Abra o arquivo `supabase/seed.sql`
3. Copie e cole no editor
4. Clique em **"Run"**

Isso cria:
- Escola "YES! Centro"
- Usuário admin: `admin@yes-centro.com.br` / senha: `YesCRM@2024!`
- 5 leads de exemplo no pipeline

---

## 4. Configurar WhatsApp Business API (Meta)

> Esta etapa é necessária apenas para receber/enviar mensagens reais do WhatsApp.
> Você pode pular esta etapa para testar o CRM com leads manuais primeiro.

### Criar App no Meta Developer

1. Acesse [developers.facebook.com](https://developers.facebook.com)
2. Clique em **"Meus Apps"** → **"Criar App"**
3. Selecione **"Business"** como tipo
4. Preencha nome (ex: "YES CRM") e email
5. Clique em **"Criar App"**

### Adicionar WhatsApp ao App

1. No painel do app, clique em **"Adicionar Produto"**
2. Encontre **"WhatsApp"** e clique em **"Configurar"**
3. Conecte sua **Meta Business Account** (crie uma se não tiver)

### Obter as Credenciais

No painel do WhatsApp:
1. **Token de Acesso Temporário**: visível na seção "Início rápido da API"
   - Para produção: gere um token permanente em **System User** do Business Manager
2. **Phone Number ID**: número de teste fornecido automaticamente

### Criar Token Permanente (produção)

1. No [Meta Business Manager](https://business.facebook.com):
   - Settings → Users → System Users
   - Crie um System User com papel "Admin"
   - Gere um token com permissões: `whatsapp_business_messaging`, `whatsapp_business_management`
2. Atribua o número de telefone ao System User

---

## 5. Rodar Localmente

### Instalar dependências

Abra o terminal na pasta do projeto e execute:

```bash
npm install
```

### Configurar variáveis de ambiente

1. Copie o arquivo de exemplo:
   ```bash
   cp .env.example .env.local
   ```
   (No Windows PowerShell: `Copy-Item .env.example .env.local`)

2. Abra `.env.local` em qualquer editor de texto e preencha:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://SEU-PROJETO.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-anon-key-aqui
   SUPABASE_SERVICE_ROLE_KEY=sua-service-role-key-aqui

   WHATSAPP_VERIFY_TOKEN=escolha-uma-palavra-secreta
   WHATSAPP_APP_SECRET=app-secret-do-meta
   WHATSAPP_ACCESS_TOKEN=token-de-acesso-do-meta
   WHATSAPP_PHONE_NUMBER_ID=id-do-numero-do-meta

   NEXTAUTH_URL=http://localhost:3000
   ```

### Copiar o logo

```bash
# O logo já está na raiz — copie para a pasta public:
cp yes-logo.jpeg public/yes-logo.jpeg
```
(No Windows PowerShell: `Copy-Item yes-logo.jpeg public\yes-logo.jpeg`)

### Iniciar o servidor de desenvolvimento

```bash
npm run dev
```

Acesse: [http://localhost:3000](http://localhost:3000)

Login com:
- Email: `admin@yes-centro.com.br`
- Senha: `YesCRM@2024!`

---

## 6. Deploy na Vercel (gratuito)

### Opção A: Deploy via GitHub (recomendado)

1. Crie um repositório no [GitHub](https://github.com/new)
2. Faça push do código:
   ```bash
   git init
   git add .
   git commit -m "feat: YES CRM inicial"
   git remote add origin https://github.com/SEU-USUARIO/yes-crm.git
   git push -u origin main
   ```
3. Acesse [vercel.com](https://vercel.com) → **"Add New Project"**
4. Importe o repositório do GitHub
5. Configure as variáveis de ambiente (próximo passo)
6. Clique em **"Deploy"**

### Opção B: Deploy via Vercel CLI

```bash
npm install -g vercel
vercel login
vercel --prod
```

### Configurar Variáveis de Ambiente na Vercel

1. No painel do projeto na Vercel, clique em **"Settings"** → **"Environment Variables"**
2. Adicione cada variável do `.env.example` com os valores reais:

| Nome | Valor |
|------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | URL do Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Anon Key do Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | Service Role Key |
| `WHATSAPP_VERIFY_TOKEN` | Sua palavra secreta |
| `WHATSAPP_APP_SECRET` | App Secret do Meta |
| `WHATSAPP_ACCESS_TOKEN` | Token do Meta |
| `WHATSAPP_PHONE_NUMBER_ID` | Phone Number ID |
| `NEXTAUTH_URL` | URL da Vercel (ex: `https://yes-crm.vercel.app`) |

3. Após adicionar todas, vá em **"Deployments"** → clique nos 3 pontinhos → **"Redeploy"**

---

## 7. Criar Primeira Escola e Usuário

### Criar uma Nova Escola

1. No Supabase Studio, vá em **"Table Editor"** → tabela `schools`
2. Clique em **"Insert Row"** e preencha:
   - `name`: Nome da escola (ex: "YES! Zona Sul")
   - `slug`: identificador único (ex: `yes-zona-sul`)
   - `whatsapp_phone_id`: (deixe em branco por enquanto)
3. Salve e copie o `id` gerado (UUID)

### Criar Usuário via SQL

1. No SQL Editor do Supabase, execute:
   ```sql
   SELECT auth.sign_up(
     'email-do-usuario@escola.com.br',
     'SenhaForte@123',
     '{"name": "Nome do Usuário", "school_id": "UUID-DA-ESCOLA-AQUI", "role": "admin"}'::jsonb
   );
   ```
   Substitua:
   - O email e senha
   - `UUID-DA-ESCOLA-AQUI` pelo UUID da escola criada no passo anterior

2. O usuário já pode fazer login no CRM!

### Criar Usuário pela Interface (alternativa)

1. No Supabase Studio → **"Authentication"** → **"Users"** → **"Add user"**
2. Preencha email e senha
3. Após criar, vá em **"SQL Editor"** e execute:
   ```sql
   INSERT INTO public.users (id, school_id, name, role)
   VALUES (
     'UUID-DO-AUTH-USER',  -- copie da tela de Auth
     'UUID-DA-ESCOLA',
     'Nome do Usuário',
     'admin'  -- ou 'agent'
   );
   ```

---

## 8. Configurar Webhook do WhatsApp

Após fazer o deploy na Vercel, a URL do webhook será:
```
https://SEU-PROJETO.vercel.app/api/webhooks/whatsapp
```

### Configurar no Meta Developer

1. No painel do seu app Meta → **WhatsApp** → **Configuração**
2. Na seção **"Webhooks"**, clique em **"Configurar"**
3. Preencha:
   - **URL de Callback**: `https://SEU-PROJETO.vercel.app/api/webhooks/whatsapp`
   - **Token de Verificação**: o valor que você definiu em `WHATSAPP_VERIFY_TOKEN`
4. Clique em **"Verificar e Salvar"**
5. Na lista de **"Campos do Webhook"**, ative: **`messages`**

### Associar Número ao Webhook

1. Em **WhatsApp** → **Configuração**, seção **"Número de Telefone"**
2. Certifique que o número está configurado com o Phone Number ID correto
3. Na tabela `schools` do Supabase, atualize o campo `whatsapp_phone_id` com o ID do número

### Testar o Webhook

Envie uma mensagem de teste para o número:
1. No painel Meta → **WhatsApp** → **Início Rápido da API**
2. Use o formulário "Enviar e receber mensagens" para simular
3. Verifique se o lead apareceu no CRM em "Novos Leads"

---

## 9. Usar o CRM

### Pipeline Kanban

O pipeline tem 5 colunas fixas:
1. **Novos Leads** — leads que chegam via WhatsApp ou são criados manualmente
2. **Sem Resposta** — leads que não responderam após contato
3. **Em Negociação** — leads em processo de decisão
4. **Aguardando Pagamento** — leads que aceitaram e precisam pagar
5. **Matriculou** — conversões realizadas

**Mover um lead**: arraste o card de uma coluna para outra. A posição é salva automaticamente.

### Criar Lead Manual

Clique no botão **"+ Novo Lead"** no topo do board e preencha nome, WhatsApp e email (opcional).

### Ver Histórico de um Lead

Clique em qualquer card para abrir o painel lateral com:
- **WhatsApp**: histórico completo de mensagens + campo para responder
- **Notas**: anotações internas visíveis apenas para sua equipe
- **Dados**: editar nome e email do lead

### Receber Leads Automaticamente

Configure o webhook (seção 8) e todos os leads que enviarem mensagem para o número do WhatsApp Business da escola entrarão automaticamente em **"Novos Leads"** em tempo real.

---

## 10. Solução de Problemas

### "Erro ao fazer login"
- Verifique se o usuário existe em Supabase → Authentication → Users
- Confirme que o registro existe na tabela `public.users`
- Verifique se `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY` estão corretos

### "Lead não aparece no board"
- Verifique no Supabase se o `school_id` do usuário coincide com o `school_id` do lead
- Confirme que as RLS policies foram criadas corretamente (seção 3)

### "Webhook retorna 401"
- Verifique se `WHATSAPP_APP_SECRET` está correto (é o App Secret do Meta, não o Access Token)
- Confirme que `WHATSAPP_VERIFY_TOKEN` coincide com o token configurado no Meta

### "Webhook retorna 403 na verificação"
- Confirme que `WHATSAPP_VERIFY_TOKEN` é exatamente igual ao configurado no Meta Developer

### "Leads do WhatsApp não aparecem"
- Verifique se o `whatsapp_phone_id` na tabela `schools` coincide com o Phone Number ID do Meta
- Veja os logs da Vercel: Dashboard → seu projeto → "Deployments" → "View Function Logs"

### "npm install" falha
- Certifique que Node.js 18+ está instalado: `node --version`
- Tente: `npm install --legacy-peer-deps`

---

## Estrutura do Projeto

```
yes-crm/
├── app/                    # Next.js App Router
│   ├── actions/leads.ts    # Server Actions (CRUD)
│   ├── api/
│   │   ├── send-message/   # Enviar mensagem WhatsApp
│   │   └── webhooks/
│   │       └── whatsapp/   # Receber mensagens (webhook)
│   ├── board/              # Página principal (Kanban)
│   └── login/              # Tela de login
├── components/
│   ├── kanban/             # KanbanBoard, KanbanColumn, LeadCard
│   ├── lead/               # LeadPanel, ConversationHistory, NoteForm
│   ├── shared/             # Header, AddLeadModal, LoginForm
│   └── ui/                 # Componentes base (Button, Input, etc.)
├── hooks/
│   └── useLeads.ts         # Realtime subscription + estado do Kanban
├── lib/
│   ├── supabase/           # Clients server e browser
│   ├── types.ts            # Tipos TypeScript globais
│   ├── utils.ts            # Utilitários (cn, timeAgo, formatPhone)
│   └── whatsapp.ts         # Helpers da Meta Cloud API
├── supabase/
│   ├── schema.sql          # Tabelas + RLS + triggers
│   └── seed.sql            # Dados de exemplo
├── public/
│   └── yes-logo.jpeg       # Logo YES! Idiomas
├── middleware.ts           # Auth guard + refresh de sessão
├── .env.example            # Variáveis de ambiente necessárias
└── README.md               # Este guia
```

---

## Tecnologias Utilizadas

- **[Next.js 14](https://nextjs.org)** — Framework React com App Router
- **[Supabase](https://supabase.com)** — Auth + PostgreSQL + Realtime
- **[Tailwind CSS](https://tailwindcss.com)** — Estilização utility-first
- **[@dnd-kit](https://dndkit.com)** — Drag-and-drop acessível
- **[Meta Cloud API](https://developers.facebook.com/docs/whatsapp/cloud-api)** — WhatsApp Business

---

Feito com ❤️ para YES! Idiomas
