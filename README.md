# 🩺 Health OS

> Plataforma SaaS de monitoramento de saúde e fitness com IA Personal Trainer — construída com React + Supabase

![Health OS](https://img.shields.io/badge/status-active-dc2626?style=flat-square)
![React](https://img.shields.io/badge/React-18-61dafb?style=flat-square&logo=react)
![Supabase](https://img.shields.io/badge/Supabase-backend-3ecf8e?style=flat-square&logo=supabase)
![Vercel](https://img.shields.io/badge/deploy-Vercel-000?style=flat-square&logo=vercel)
![Claude AI](https://img.shields.io/badge/AI-Claude%20Sonnet-dc2626?style=flat-square)
![Mercado Pago](https://img.shields.io/badge/pagamento-Mercado%20Pago-009ee3?style=flat-square)

---

## 📋 Sobre

O **Health OS** é uma aplicação web progressiva (PWA) e plataforma SaaS de acompanhamento biométrico pessoal. Com design minimalista em preto e vermelho e experiência próxima a um app nativo, oferece rastreamento completo de saúde, treinos e nutrição — com um **Personal Trainer com IA** integrado que conhece seu perfil atlético completo.

O modelo de negócio é freemium: funcionalidades básicas gratuitas e plano **Pro** com acesso ilimitado à IA por R$ 19,90/mês via Mercado Pago (cartão ou Pix).

---

## ✨ Funcionalidades

### 🆓 Gratuito para todos

| Módulo | Descrição |
|---|---|
| 📊 **Dashboard** | Painel central com IMC, TDEE, passos, sono, calorias e gráficos semanais |
| 🏋️ **Treinos** | Programas completos por tipo de local (academia, casa, rua, CrossFit) |
| 📅 **Calendário** | Registro e visualização de treinos, sono e composição corporal |
| 🍽️ **Calorias** | Controle alimentar por refeição com banco de alimentos e planos de refeição |
| 💧 **Hidratação** | Controle de copos de água com histórico e metas diárias |
| ⚖️ **IMC** | Cálculo e categorização do Índice de Massa Corporal |
| ❤️ **Cardio** | Registro de sessões com zonas de frequência cardíaca (Z1–Z5) |
| 👟 **Passos** | Contador de passos com metas e milestones de progressão |
| 👤 **Perfil** | Dados biométricos, perfil de fitness (radar chart) e configurações |
| 📖 **Glossário** | Mais de 30 termos técnicos de fitness com explicações completas |

### 🤖 IA Personal Trainer (Pro)

| Recurso | Descrição |
|---|---|
| 💬 **Chat com IA** | Personal trainer powered by Claude Sonnet com contexto do seu perfil |
| 🧬 **Perfil injetado** | A IA recebe seus dados biométricos, objetivo, programa, histórico e composição |
| 🏋️ **Fichas por IA** | A IA cria e salva exercícios personalizados diretamente no seu treino |
| 🔄 **Sync em tempo real** | Exercícios criados pela IA sincronizam automaticamente com a página de treino |
| 🚨 **Detecção de lesão** | A IA identifica relatos de dor ou lesão e sugere cuidados e consulta médica |
| ⚖️ **Disclaimer legal** | Sistema com termos de uso, aviso médico e limitações claras da IA |
| 📊 **Contador de uso** | Controle de uso diário armazenado no Supabase (à prova de manipulação) |

### 💳 Planos e Pagamentos

| Plano | Preço | Recursos |
|---|---|---|
| **Free** | Gratuito | Rastreamento completo de saúde, treinos, calorias, 3 perguntas/dia para a IA |
| **Pro** | R$ 19,90/mês | IA ilimitada, respostas prioritárias, suporte premium |

- **Mercado Pago** — assinatura recorrente via cartão de crédito
- **Pix** — pagamento único (acesso por 30 dias)
- **Cupons de influencer** — sistema com código de desconto e rastreamento de comissão

---

## 🏋️ Tipos de Treino Suportados

- 🏋️ **Academia Completa** — Upper/Lower 5x, PPL 6x, Arnold Split 6x
- 💪 **Academia Básica** — Full Body 3x, Upper/Lower 4x com halteres
- 🏠 **Em Casa** — Calistenia Full Body 3x, HIIT + Força 4x
- 🌳 **Ao Ar Livre** — Street Workout 4x
- ⚡ **CrossFit / Funcional** — CrossFit Style 5x, Funcional 4x
- 🎯 **Ficha Personalizada** — Monte seus próprios dias e exercícios

---

## 🛠️ Stack

- **Frontend** — React 18 + Vite
- **Backend / Auth / DB** — Supabase (PostgreSQL + Row Level Security + Edge Functions)
- **IA** — Claude Sonnet 4 via API Anthropic (com contexto do atleta injetado)
- **Pagamentos** — Mercado Pago (assinatura recorrente + Pix)
- **Gráficos** — Recharts
- **Analytics** — Vercel Web Analytics
- **Deploy** — Vercel
- **Fonte** — Space Mono (Google Fonts)

---

## 🚀 Como rodar localmente

### Pré-requisitos
- Node.js 18+
- Conta no [Supabase](https://supabase.com)
- Chave da API Anthropic (para IA)
- Conta no Mercado Pago (para pagamentos)

### 1. Clone o repositório
```bash
git clone https://github.com/cauacreis/health-os.git
cd health-os
```

### 2. Instale as dependências
```bash
npm install
```

### 3. Configure as variáveis de ambiente
```bash
cp .env.example .env
```

Edite o `.env` com suas chaves:
```env
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-anonima
VITE_ANTHROPIC_API_KEY=sk-ant-...
VITE_MP_PUBLIC_KEY=APP_USR-...
```

### 4. Configure o banco de dados
Execute o arquivo `schema.sql` no SQL Editor do Supabase.

### 5. Rode o projeto
```bash
npm run dev
```

Acesse `http://localhost:5173`

---

## 📁 Estrutura do Projeto

```
src/
├── components/
│   ├── UI.jsx              # Componentes reutilizáveis (Modal, Card, ProgressBar...)
│   ├── Sidebar.jsx         # Navegação desktop
│   ├── MoreMenu.jsx        # Menu mobile
│   ├── Onboarding.jsx      # Fluxo de cadastro inicial
│   └── AiChat.jsx          # Chat com Personal Trainer IA
├── pages/
│   ├── Dashboard.jsx
│   ├── WorkoutProgram.jsx
│   ├── Calories.jsx
│   ├── Profile.jsx
│   ├── Calendar.jsx
│   ├── Auth.jsx
│   ├── Subscription.jsx    # Página de planos e pagamento
│   └── OtherPages.jsx      # Water, BMI, Cardio, Steps
├── data/
│   ├── workouts.js         # Todos os programas de treino
│   ├── nutrition.js        # Zonas cardíacas e dados nutricionais
│   ├── glossary.js         # Glossário de termos fitness
│   └── funfacts.js         # Fatos curiosos sobre saúde
├── lib/
│   ├── db.js               # Funções de acesso ao Supabase
│   └── supabase.js         # Cliente Supabase
└── styles/
    └── global.css          # Estilos globais e tema
```

---

## 🗄️ Banco de Dados

Tabelas principais no Supabase:

| Tabela | Descrição |
|---|---|
| `profiles` | Dados do usuário (peso, altura, objetivo, programa, is_pro...) |
| `bio_log` | Histórico de bioimpedância |
| `sleep_log` | Registro de sono |
| `food_log` | Alimentos consumidos por refeição |
| `meal_plans` | Planos de refeição configurados |
| `meal_log` | Check-ins diários de refeições |
| `cardio_log` | Sessões de cardio |
| `workout_logs` | Treinos realizados com séries e cargas |
| `custom_exercises` | Exercícios personalizados por usuário |
| `steps_log` | Histórico diário de passos |
| `water_log` | Histórico diário de hidratação |
| `ai_usage` | Contador de uso da IA por usuário (à prova de bypass) |
| `subscriptions` | Assinaturas ativas e status de pagamento |
| `coupons` | Cupons de influencer com desconto e rastreamento |

Todas as tabelas possuem **Row Level Security (RLS)** ativado.

---

## 🤖 Como funciona a IA

A IA Personal Trainer usa Claude Sonnet 4 com o perfil completo do atleta injetado no system prompt:

- **Dados biométricos**: peso, altura, idade, sexo, IMC, TMB, TDEE
- **Objetivos e programa**: ganho muscular, perda de peso, programa de treino atual
- **Composição corporal**: última medição de bioimpedância disponível
- **Planos de refeição**: refeições cadastradas e calorias
- **Nível de atividade**: sedentário, moderado, muito ativo etc.

A IA pode criar exercícios personalizados que são salvos automaticamente no Supabase e sincronizados via evento customizado com a página de treino em tempo real.

---

## 💰 Sistema de Pagamento

O pagamento é processado pelo Mercado Pago com duas opções:

**Assinatura mensal (cartão):** Cria um plano de pré-aprovação recorrente no Mercado Pago. O usuário é redirecionado para o checkout do MP e retorna com `is_pro = true` no perfil após confirmação via webhook.

**Pix (pagamento único):** Gera um código Pix de R$ 19,90 válido por 30 dias. Confirmado via webhook que atualiza `is_pro` e registra a data de expiração.

**Cupons de influencer:** Influencers recebem um código único que dá desconto ao comprador e registra a comissão na tabela `coupons`.

---

## 📱 PWA / Mobile

O app funciona como PWA e é totalmente responsivo:
- Navegação inferior no mobile
- Sidebar fixa no desktop
- Suporte a `safe-area-inset` para iPhones com notch
- Instalável na tela inicial

---

## 🔐 Autenticação e Segurança

- Login e cadastro por e-mail com confirmação obrigatória
- Recuperação de senha via e-mail (Supabase Auth)
- Sessão persistente com JWT + refresh automático
- Contador de uso da IA armazenado no Supabase (não manipulável pelo cliente)
- RLS ativo em todas as tabelas — cada usuário acessa só seus dados
- Headers de segurança configurados no Vercel
- Policies de trigger hardening para evitar SQL injection via metadados

---

## 🛡️ Segurança implementada

| Ameaça | Proteção |
|---|---|
| SQL Injection | Supabase usa prepared statements |
| Acesso cruzado de dados | Row Level Security (RLS) em todas as tabelas |
| Bypass do limite de IA | Contador armazenado no Supabase, não no cliente |
| Senhas em texto plano | Supabase usa bcrypt automaticamente |
| Tráfego interceptado | HTTPS obrigatório na Vercel |
| Token roubado | JWT com expiração automática + refresh |
| Força bruta | Rate limiting nativo do Supabase Auth |
| XSS | React escapa HTML por padrão |
| Trigger abuse | Security Definer + validação no banco |

---

## 📊 Analytics

O projeto usa **Vercel Web Analytics** para rastrear visitas e comportamento de usuários de forma anônima e sem cookies.

---

## 📄 Licença

Copyright © 2026 Cauã Reis. Todos os direitos reservados.

Este software é proprietário e confidencial. É expressamente proibido:
- Copiar, modificar ou distribuir o código-fonte
- Usar o projeto como base para outros produtos
- Comercializar qualquer parte desta aplicação sem autorização prévia por escrito do autor

Para licenciamento comercial ou parcerias, entre em contato através do GitHub.

---

<div align="center">
  Feito por <a href="https://github.com/cauacreis">cauacreis</a>
</div>
