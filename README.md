# 🩺 Health OS

> Plataforma pessoal de monitoramento de saúde e fitness — construída com React + Supabase

![Health OS](https://img.shields.io/badge/status-active-dc2626?style=flat-square)
![React](https://img.shields.io/badge/React-18-61dafb?style=flat-square&logo=react)
![Supabase](https://img.shields.io/badge/Supabase-backend-3ecf8e?style=flat-square&logo=supabase)
![Vercel](https://img.shields.io/badge/deploy-Vercel-000?style=flat-square&logo=vercel)

---

## 📋 Sobre

O **Health OS** é uma aplicação web progressiva (PWA) focada em rastreamento completo de saúde e performance física. Desenvolvida com design minimalista em preto e vermelho, oferece uma experiência próxima a um app nativo tanto no desktop quanto no mobile.

---

## ✨ Funcionalidades

| Módulo | Descrição |
|---|---|
| 📊 **Dashboard** | Painel central com IMC, TDEE, passos, sono, calorias e gráficos semanais |
| 🏋️ **Treinos** | Programas completos por tipo de local (academia, casa, rua, CrossFit) |
| 📅 **Calendário** | Registro e visualização de treinos realizados |
| 🍽️ **Calorias** | Controle alimentar por refeição com banco de alimentos |
| 💧 **Hidratação** | Controle de copos de água e refeições diárias |
| ⚖️ **IMC** | Cálculo e categorização do Índice de Massa Corporal |
| ❤️ **Cardio** | Registro de sessões com zonas de frequência cardíaca (Z1–Z5) |
| 👟 **Passos** | Contador de passos com metas e milestones |
| 👤 **Perfil** | Dados biométricos, histórico de bioimpedância e sono |
| 📖 **Glossário** | Mais de 30 termos técnicos de fitness com explicações |

---

## 🏋️ Tipos de Treino Suportados

- 🏋️ **Academia Completa** — Upper/Lower 5x, PPL 6x, Arnold Split 6x
- 💪 **Academia Básica** — Full Body 3x, Upper/Lower 4x com halteres
- 🏠 **Em Casa** — Calistenia Full Body 3x, HIIT + Força 4x
- 🌳 **Ao Ar Livre** — Street Workout 4x
- ⚡ **CrossFit / Funcional** — CrossFit Style 5x, Funcional 4x

---

## 🛠️ Stack

- **Frontend** — React 18 + Vite
- **Backend / Auth / DB** — Supabase (PostgreSQL + Row Level Security)
- **Gráficos** — Recharts
- **Deploy** — Vercel
- **Fonte** — Space Mono (Google Fonts)

---

## 🚀 Como rodar localmente

### Pré-requisitos
- Node.js 18+
- Conta no [Supabase](https://supabase.com)

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

Edite o `.env` com suas chaves do Supabase:
```env
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-anonima
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
│   ├── UI.jsx          # Componentes reutilizáveis (Modal, Card, ProgressBar...)
│   ├── Sidebar.jsx     # Navegação desktop
│   ├── MoreMenu.jsx    # Menu mobile
│   └── Onboarding.jsx  # Fluxo de cadastro inicial
├── pages/
│   ├── Dashboard.jsx
│   ├── WorkoutProgram.jsx
│   ├── Calories.jsx
│   ├── Profile.jsx
│   ├── Calendar.jsx
│   ├── Auth.jsx
│   └── OtherPages.jsx  # Water, BMI, Cardio, Steps
├── data/
│   ├── workouts.js     # Todos os programas de treino
│   ├── nutrition.js    # Zonas cardíacas e dados nutricionais
│   ├── glossary.js     # Glossário de termos fitness
│   └── funfacts.js     # Fatos curiosos sobre saúde
├── lib/
│   ├── db.js           # Funções de acesso ao Supabase
│   └── supabase.js     # Cliente Supabase
└── styles/
    └── global.css      # Estilos globais e tema
```

---

## 🗄️ Banco de Dados

Tabelas principais no Supabase:

| Tabela | Descrição |
|---|---|
| `profiles` | Dados do usuário (peso, altura, objetivo, programa...) |
| `bio_entries` | Histórico de bioimpedância |
| `sleep_entries` | Registro de sono |
| `food_entries` | Alimentos consumidos por refeição |
| `cardio_entries` | Sessões de cardio |
| `workout_logs` | Treinos realizados |

Todas as tabelas possuem **Row Level Security (RLS)** ativado — cada usuário só acessa seus próprios dados.

---

## 📱 PWA / Mobile

O app funciona como PWA e é totalmente responsivo:
- Navegação inferior no mobile
- Sidebar fixa no desktop
- Suporte a `safe-area-inset` para iPhones com notch

---

## 🔐 Autenticação

- Login e cadastro por e-mail
- Recuperação de senha via e-mail (Supabase Auth)
- Sessão persistente com JWT

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
