# Health OS — Setup Online (Supabase + Vercel)

## Stack usada
- **Supabase** — banco PostgreSQL + autenticação (grátis até 500MB + 50k usuários/mês)
- **Vercel** — hospedagem do React (grátis ilimitado para projetos pessoais)

---

## Passo 1 — Criar projeto no Supabase

1. Acesse **supabase.com** → "Start your project" → faça login com GitHub
2. Clique **"New project"**
3. Preencha:
   - **Name**: health-os
   - **Database Password**: anote uma senha forte
   - **Region**: South America (São Paulo)
4. Aguarde ~2 minutos para criar

---

## Passo 2 — Criar o banco de dados

1. No painel do Supabase, vá em **SQL Editor** (ícone de banco no menu lateral)
2. Clique **"New query"**
3. Copie TODO o conteúdo do arquivo `schema.sql` e cole lá
4. Clique **"Run"** (Ctrl+Enter)
5. Deve aparecer "Success" — tabelas criadas ✓

---

## Passo 3 — Pegar as chaves do Supabase

1. No menu lateral, vá em **Settings → API**
2. Copie dois valores:
   - **Project URL** → algo como `https://abcxyz.supabase.co`
   - **anon public** (em "Project API keys")

---

## Passo 4 — Configurar as variáveis de ambiente

Crie um arquivo `.env` na raiz do projeto (mesma pasta do `package.json`):

```
VITE_SUPABASE_URL=https://SEU_ID.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJI...sua_chave_aqui
```

⚠️ O arquivo `.env` está no `.gitignore` — nunca suba ele para o GitHub.

---

## Passo 5 — Testar localmente

```bash
npm install
npm run dev
```

Abra http://localhost:5173 — deve aparecer a tela de login.

---

## Passo 6 — Subir para o GitHub

```bash
git init
git add .
git commit -m "Health OS v2"
git branch -M main
git remote add origin https://github.com/SEU_USER/health-os.git
git push -u origin main
```

---

## Passo 7 — Deploy na Vercel

1. Acesse **vercel.com** → "Continue with GitHub"
2. Clique **"Add New Project"**
3. Importe o repositório `health-os`
4. Em **"Environment Variables"**, adicione:
   - `VITE_SUPABASE_URL` = sua URL
   - `VITE_SUPABASE_ANON_KEY` = sua chave anon
5. Clique **"Deploy"**

Em ~1 minuto você terá uma URL pública como:
`https://health-os-seu-usuario.vercel.app`

---

## Segurança implementada

| Ameaça | Proteção |
|---|---|
| SQL Injection | Supabase usa prepared statements — impossível injetar |
| Acesso a dados de outros usuários | Row Level Security (RLS) — políticas no banco |
| Senhas em texto plano | Supabase usa bcrypt automaticamente |
| Tráfego interceptado | HTTPS obrigatório na Vercel |
| Token roubado | JWT com expiração automática + refresh |
| Força bruta | Rate limiting nativo do Supabase Auth |
| XSS | React escapa HTML por padrão |

---

## Após o deploy — configurar email no Supabase

1. Vá em **Supabase → Authentication → Email Templates**
2. Personalize o e-mail de confirmação de conta
3. Em **Authentication → URL Configuration**, adicione:
   - Site URL: `https://sua-url.vercel.app`
