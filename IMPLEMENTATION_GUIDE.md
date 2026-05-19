# BOLÃO COPA DO MUNDO 2026 — GUIA COMPLETO DE IMPLEMENTAÇÃO

> **Versão:** 1.0 | **Data:** Maio 2026  
> Este documento foi gerado comparando a especificação funcional (`Bolao_Copa_Especificacao_Completa.docx`) com o código atual do projeto. É um script exato para que uma IA possa ler e implementar tudo com o mínimo de erros.

---

## ÍNDICE

1. [Stack Tecnológica](#1-stack-tecnológica)
2. [Estado Atual do Projeto](#2-estado-atual-do-projeto)
3. [Análise Comparativa — Spec vs Implementado](#3-análise-comparativa--spec-vs-implementado)
4. [Funcionalidades Já Implementadas e Funcionais](#4-funcionalidades-já-implementadas-e-funcionais)
5. [Funcionalidades a Implementar (Backlog Priorizado)](#5-funcionalidades-a-implementar-backlog-priorizado)
6. [SCRIPT DE IMPLEMENTAÇÃO DETALHADO](#6-script-de-implementação-detalhado)
   - [F1 — Palpite de Ouro (Campeão)](#f1--palpite-de-ouro-campeão)
   - [F2 — Módulo Financeiro](#f2--módulo-financeiro)
   - [F3 — Página de Perfil do Usuário](#f3--página-de-perfil-do-usuário)
   - [F4 — OAuth GitLab + Google Sign-In](#f4--oauth-gitlab--google-sign-in)
   - [F5 — Status de Partida (3 Estados)](#f5--status-de-partida-3-estados)
   - [F6 — Trava 30 Minutos Antes](#f6--trava-30-minutos-antes)
   - [F7 — Sync Automático via Cron](#f7--sync-automático-via-cron)
   - [F8 — Notificações de Falha de API](#f8--notificações-de-falha-de-api)
7. [Modelo de Dados Final Completo](#7-modelo-de-dados-final-completo)
8. [Regras de Negócio Consolidadas](#8-regras-de-negócio-consolidadas)
9. [Arquitetura de Arquivos — Onde Criar Cada Coisa](#9-arquitetura-de-arquivos--onde-criar-cada-coisa)

---

## 1. STACK TECNOLÓGICA

```
Framework:        Next.js 15.5 (App Router, TypeScript)
Runtime:          Node.js 20+
UI:               React 19 + Tailwind CSS 4
ORM:              Prisma 6 (PostgreSQL via Supabase)
Auth:             Supabase Auth (@supabase/ssr)
JWT:              jose 5
Database:         PostgreSQL (Supabase, cloud)
API externa:      football-data.org (token via FOOTBALL_DATA_TOKEN)
Package manager:  npm (package-lock.json presente)
Deploy target:    Vercel (ou qualquer Node server)
```

### Variáveis de Ambiente necessárias (`.env.local`)

```env
# Supabase
DATABASE_URL=postgresql://...        # Transaction pooler porta 6543
DIRECT_URL=postgresql://...          # Session pooler porta 5432
NEXT_PUBLIC_SUPABASE_URL=https://...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...        # NUNCA expor ao cliente

# Admin inicial
ADMIN_EMAIL=admin@bolao.local
ADMIN_PASSWORD=senha_forte_aqui

# API Futebol (para sincronizar partidas)
FOOTBALL_DATA_TOKEN=...              # football-data.org token gratuito

# Financeiro (novo)
ENTRY_FEE=50                         # Valor de inscrição em R$ (padrão 50)
PRIZE_1ST_PCT=50                     # % do pool para 1º lugar (padrão 50)
PRIZE_2ND_PCT=30                     # % do pool para 2º lugar (padrão 30)
PRIZE_3RD_PCT=20                     # % do pool para 3º lugar (padrão 20)

# GitLab OAuth (novo - F4)
GITLAB_CLIENT_ID=...
GITLAB_CLIENT_SECRET=...
GITLAB_REDIRECT_URI=https://seudominio.com/api/auth/callback/gitlab

# Google OAuth (novo - F4)
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
```

---

## 2. ESTADO ATUAL DO PROJETO

### Estrutura de Pastas Atual

```
33x_bet/
├── prisma/
│   ├── schema.prisma          ← Schema do banco de dados
│   ├── seed.ts                ← Seed inicial (cria admin + partidas exemplo)
│   └── seedFromApi.ts         ← Sync manual com football-data.org
├── scripts/
│   └── stats.ts               ← Script de estatísticas CLI
├── src/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── globals.css
│   │   ├── page.tsx           ← Redireciona para /login ou /ranking
│   │   ├── login/page.tsx     ← Tela de login (email/senha)
│   │   ├── register/page.tsx  ← Tela de cadastro
│   │   └── (app)/             ← Rotas protegidas (requer sessão)
│   │       ├── layout.tsx     ← Layout com nav + header
│   │       ├── ranking/page.tsx
│   │       ├── jogos/page.tsx
│   │       ├── times/page.tsx
│   │       ├── palpites/
│   │       │   ├── page.tsx
│   │       │   └── PalpitesForm.tsx
│   │       └── admin/
│   │           ├── page.tsx
│   │           └── AdminMatches.tsx
│   ├── api/
│   │   ├── auth/
│   │   │   ├── login/route.ts
│   │   │   ├── register/route.ts
│   │   │   └── logout/route.ts
│   │   ├── palpites/route.ts
│   │   └── admin/
│   │       ├── match/route.ts
│   │       └── resultado/route.ts
│   ├── lib/
│   │   ├── auth.ts            ← getSession(), requireSession(), requireAdmin()
│   │   ├── db.ts              ← Singleton do Prisma
│   │   ├── scoring.ts         ← Motor de cálculo de pontos
│   │   ├── stages.ts          ← Badges e labels de fase
│   │   ├── teams.ts           ← Dados dos 32 times (flag, cor, nome PT)
│   │   └── supabase/
│   │       ├── server.ts
│   │       ├── client.ts
│   │       └── admin.ts
│   └── middleware.ts          ← Refresh de token em todas as rotas
├── .env.local
├── package.json
├── next.config.ts
├── tailwind.config.ts
└── tsconfig.json
```

---

## 3. ANÁLISE COMPARATIVA — SPEC vs IMPLEMENTADO

| Funcionalidade | Especificação (doc) | Implementado Atual | Status |
|---|---|---|---|
| Login Email/Senha | Alternativo | ✅ Funcional | OK |
| Login GitLab OAuth | Principal/Obrigatório | ❌ Ausente | IMPLEMENTAR |
| Login Google | Alternativo | ❌ Ausente | IMPLEMENTAR |
| Cadastro de usuário | Sim | ✅ Funcional | OK |
| Pontuação Acerto Cheio (placar exato) | 10 pts | ✅ 10 pts | OK |
| Pontuação Acerto Parcial (só vencedor) | 5 pts | ✅ 3 pts (market winner) | DIVERGÊNCIA* |
| Mercado Gols Totais | Não mencionado | ✅ 5/3/1 pts | EXTRA (manter) |
| Mercado Faltas | Não mencionado | ✅ 5/3/1 pts | EXTRA (manter) |
| Multiplicadores por fase | Não mencionado | ✅ ×1 a ×3 | EXTRA (manter) |
| Palpite de Ouro (campeão) | Obrigatório | ❌ Ausente | IMPLEMENTAR |
| Trava de horário | 30 min antes | ✅ Na hora exata | AJUSTAR |
| Status de partida (3 estados) | agendado/em_progresso/finalizado | ✅ Boolean (2 estados) | AJUSTAR |
| Módulo Financeiro (admin) | Obrigatório | ❌ Ausente | IMPLEMENTAR |
| Distribuição de prêmios | 1º/2º/3º | ❌ Ausente | IMPLEMENTAR |
| Perfil do usuário | Dashboard pessoal | ❌ Ausente | IMPLEMENTAR |
| Sync automático (cron) | A cada 15-30 min | ✅ Script manual apenas | IMPLEMENTAR |
| Ranking / Leaderboard | Obrigatório | ✅ Funcional | OK |
| Classificação de grupos | Não mencionado | ✅ Funcional | EXTRA (manter) |
| Painel admin | Obrigatório | ✅ Funcional | OK |
| Notificação falha API | Sim | ❌ Ausente | IMPLEMENTAR |

> *DIVERGÊNCIA: A spec usa 10/5/0. O sistema atual usa 10 pts (placar exato) + 3 pts (só vencedor), mais granular e melhor. **Manter o sistema atual** que é superior. O que o spec chama de "parcial" equivale ao `winnerPoints` (3 pts) do sistema atual.

---

## 4. FUNCIONALIDADES JÁ IMPLEMENTADAS E FUNCIONAIS

### 4.1 Autenticação (Email/Senha)
- **Arquivos:** `src/app/login/page.tsx`, `src/app/register/page.tsx`, `src/app/api/auth/login/route.ts`, `src/app/api/auth/register/route.ts`, `src/app/api/auth/logout/route.ts`
- **Como funciona:** Supabase Auth com cookie httpOnly. Middleware (`src/middleware.ts`) renova token em cada request. Usuário criado via Admin API (auto-confirmado).
- **Lib:** `src/lib/auth.ts` exporta `getSession()`, `requireSession()`, `requireAdmin()`.

### 4.2 Sistema de Palpites (4 Mercados)
- **Arquivos:** `src/app/(app)/palpites/page.tsx`, `src/app/(app)/palpites/PalpitesForm.tsx`, `src/app/api/palpites/route.ts`
- **Como funciona:** Usuário escolhe placar exato, vencedor, gols totais e faltas para cada partida. Salvo via POST `/api/palpites`. Bloqueado no horário exato do kickoff.
- **Mercados:** 4 mercados independentes, todos opcionais.

### 4.3 Motor de Pontuação
- **Arquivo:** `src/lib/scoring.ts`
- **Regras:** Ver seção 8 (Regras de Negócio) para detalhes completos.
- **Ativação:** Admin chama POST `/api/admin/resultado` com placar → sistema recalcula todos os palpites da partida.

### 4.4 Painel Admin
- **Arquivos:** `src/app/(app)/admin/page.tsx`, `src/app/(app)/admin/AdminMatches.tsx`, `src/app/api/admin/match/route.ts`, `src/app/api/admin/resultado/route.ts`
- **Como funciona:** Somente usuários com `isAdmin: true` acessam. Permite editar times/horário e registrar resultado final.

### 4.5 Ranking / Leaderboard
- **Arquivo:** `src/app/(app)/ranking/page.tsx`
- **Como funciona:** Server component que agrega pontos de todos os usuários via Prisma. Ordena por: pontos totais → cravadas (placar exato) → acertos (vencedor correto).

### 4.6 Classificação de Grupos
- **Arquivo:** `src/app/(app)/times/page.tsx`
- **Como funciona:** Calcula W/D/L/GF/GA de cada seleção na fase de grupos a partir dos resultados registrados.

### 4.7 Lista de Jogos
- **Arquivo:** `src/app/(app)/jogos/page.tsx`
- **Como funciona:** Lista todas as partidas agrupadas por data. Mostra palpite do usuário atual. Indicador "🔴 Ao vivo" entre kickoff e kickoff + 2.5h.

### 4.8 Sincronização Manual com API
- **Arquivo:** `prisma/seedFromApi.ts`
- **Como usar:** `npm run db:sync` — busca partidas reais da Copa 2026 em football-data.org.

---

## 5. FUNCIONALIDADES A IMPLEMENTAR (BACKLOG PRIORIZADO)

| Prioridade | ID | Funcionalidade | Complexidade | Estimativa |
|---|---|---|---|---|
| 🔴 CRÍTICO | F1 | Palpite de Ouro (Campeão) | Alta | 2-3 dias |
| 🔴 CRÍTICO | F2 | Módulo Financeiro (Admin) | Alta | 2-3 dias |
| 🟡 ALTA | F3 | Perfil do Usuário | Média | 1 dia |
| 🟡 ALTA | F4 | OAuth GitLab + Google | Média | 1-2 dias |
| 🟡 ALTA | F5 | Status de Partida (3 estados) | Baixa | 4h |
| 🟡 ALTA | F6 | Trava 30 Min Antes | Baixa | 1h |
| 🟢 MÉDIA | F7 | Sync Automático via Cron | Média | 4h |
| 🟢 MÉDIA | F8 | Notificação Falha de API | Baixa | 2h |

---

## 6. SCRIPT DE IMPLEMENTAÇÃO DETALHADO

---

### F1 — PALPITE DE OURO (CAMPEÃO)

#### O que é
Sistema onde cada usuário aposta em qual seleção será campeã da Copa. A pontuação é **dinâmica e inversamente proporcional** ao número de apostadores naquela seleção. Quem apostar em um time com menos apostadores, ganha mais pontos se ele vencer.

#### Regras de Negócio

```
1. O usuário pode fazer o Palpite de Ouro apenas 1 vez.
2. O prazo para apostar é ANTES do encerramento da fase de grupos.
   → Defina como: antes do kickoff do último jogo da fase GROUP.
3. Após esse prazo, o palpite fica travado (não pode editar ou criar).
4. Cada seleção tem um `pesoPalpiteOuro` (peso fixo, padrão 50 pts).
5. Se o usuário acertar o campeão, ganha:
   PONTOS = pesoPalpiteOuro ÷ totalApostadoresNessaSeleção
   → Exemplo: Brasil com peso 50 e 2 apostadores → 25 pts cada
   → Exemplo: França com peso 50 e 5 apostadores → 10 pts cada
6. Se errar o campeão: 0 pontos.
7. Os pontos do Palpite de Ouro somam ao total geral do ranking.
8. O admin determina o campeão via painel (campo "campeoId").
9. Ao definir o campeão, o sistema recalcula PalpiteOuro para todos.
```

#### Mudanças no Schema Prisma

**Arquivo:** `prisma/schema.prisma`

Adicionar ao final do arquivo:

```prisma
model Selecao {
  id              String         @id @default(cuid())
  nome            String         @unique   // "Brasil", "França", etc.
  pais            String                   // nome em inglês para API match
  bandeira        String?                  // emoji ou URL da bandeira
  pesoPalpiteOuro Int            @default(50)
  palpitesOuro    PalpiteOuro[]
  createdAt       DateTime       @default(now())
}

model PalpiteOuro {
  id              String    @id @default(cuid())
  userId          String    @db.Uuid
  selecaoId       String
  pontosObtidos   Int       @default(0)   // 0 até o campeão ser definido
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  user            User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  selecao         Selecao   @relation(fields: [selecaoId], references: [id])

  @@unique([userId])  // Cada usuário só pode ter 1 palpite ouro
}
```

Adicionar no model `User` existente:
```prisma
  palpiteOuro     PalpiteOuro?
```

**ATENÇÃO:** Após editar o schema, rodar:
```bash
npx prisma migrate dev --name add_palpite_ouro
```

#### Seed das Seleções

**Arquivo:** `prisma/seed.ts` — adicionar ao final da função `main()`:

```typescript
// Seed das 32 seleções com peso padrão 50
const selecoes = [
  { nome: "Brasil", pais: "Brazil" },
  { nome: "Argentina", pais: "Argentina" },
  { nome: "França", pais: "France" },
  { nome: "Alemanha", pais: "Germany" },
  { nome: "Espanha", pais: "Spain" },
  { nome: "Inglaterra", pais: "England" },
  { nome: "Portugal", pais: "Portugal" },
  { nome: "Países Baixos", pais: "Netherlands" },
  { nome: "Bélgica", pais: "Belgium" },
  { nome: "Croácia", pais: "Croatia" },
  { nome: "Uruguai", pais: "Uruguay" },
  { nome: "México", pais: "Mexico" },
  { nome: "Estados Unidos", pais: "USA" },
  { nome: "Japão", pais: "Japan" },
  { nome: "Senegal", pais: "Senegal" },
  { nome: "Marrocos", pais: "Morocco" },
  // ... completar com todas as 32 seleções classificadas
];

for (const s of selecoes) {
  await prisma.selecao.upsert({
    where: { nome: s.nome },
    update: {},
    create: { nome: s.nome, pais: s.pais, pesoPalpiteOuro: 50 },
  });
}
```

#### API Route — Salvar Palpite de Ouro

**Arquivo a criar:** `src/app/api/palpite-ouro/route.ts`

```typescript
import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { db } from "@/lib/db";

// Retorna o palpite ouro do usuário logado + lista de seleções com apostadores
export async function GET(req: NextRequest) {
  const session = await requireSession();
  
  const [selecoes, meuPalpite] = await Promise.all([
    db.selecao.findMany({
      include: {
        _count: { select: { palpitesOuro: true } },
      },
      orderBy: { nome: "asc" },
    }),
    db.palpiteOuro.findUnique({
      where: { userId: session.sub },
      include: { selecao: true },
    }),
  ]);

  // Calcular odds estimadas (pontos que o usuário receberia SE acertar)
  const selecoesComOdds = selecoes.map((s) => ({
    ...s,
    totalApostadores: s._count.palpitesOuro,
    pontosEstimados: s.pesoPalpiteOuro / Math.max(s._count.palpitesOuro + 1, 1),
  }));

  return NextResponse.json({ selecoes: selecoesComOdds, meuPalpite });
}

// Registra ou atualiza o palpite ouro do usuário
export async function POST(req: NextRequest) {
  const session = await requireSession();
  const { selecaoId } = await req.json();

  // Verificar prazo: buscar último jogo da fase de grupos
  const ultimoJogoGrupos = await db.match.findFirst({
    where: { stage: "GROUP" },
    orderBy: { kickoff: "desc" },
  });

  if (!ultimoJogoGrupos) {
    return NextResponse.json({ error: "Partidas não cadastradas" }, { status: 400 });
  }

  const agora = new Date();
  if (agora >= ultimoJogoGrupos.kickoff) {
    return NextResponse.json(
      { error: "Prazo encerrado. Fase de grupos já iniciou." },
      { status: 403 }
    );
  }

  // Verificar se seleção existe
  const selecao = await db.selecao.findUnique({ where: { id: selecaoId } });
  if (!selecao) {
    return NextResponse.json({ error: "Seleção não encontrada" }, { status: 404 });
  }

  // Upsert: cria ou atualiza (usuário pode trocar de seleção antes do prazo)
  const palpite = await db.palpiteOuro.upsert({
    where: { userId: session.sub },
    update: { selecaoId, pontosObtidos: 0 },
    create: { userId: session.sub, selecaoId, pontosObtidos: 0 },
    include: { selecao: true },
  });

  return NextResponse.json({ palpite });
}
```

#### API Route — Admin Define o Campeão

**Arquivo:** `src/app/api/admin/campeo/route.ts` (criar novo)

```typescript
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  await requireAdmin();
  const { selecaoId } = await req.json();

  const selecao = await db.selecao.findUnique({ where: { id: selecaoId } });
  if (!selecao) {
    return NextResponse.json({ error: "Seleção não encontrada" }, { status: 404 });
  }

  // Buscar todos os palpites para essa seleção
  const palpitesVencedores = await db.palpiteOuro.findMany({
    where: { selecaoId },
  });

  const totalApostadores = palpitesVencedores.length;
  const pontosParaCada =
    totalApostadores > 0
      ? Math.round(selecao.pesoPalpiteOuro / totalApostadores)
      : 0;

  // Zerar pontos de todos → atribuir pontos apenas para acertadores
  await db.$transaction([
    // Zera todos
    db.palpiteOuro.updateMany({
      data: { pontosObtidos: 0 },
    }),
    // Atribui pontos aos vencedores
    db.palpiteOuro.updateMany({
      where: { selecaoId },
      data: { pontosObtidos: pontosParaCada },
    }),
  ]);

  // Recalcular pontuação total de todos os usuários com palpite ouro
  // (pontos regulares + pontos do palpite ouro)
  // NOTA: os pontos regulares ficam em Palpite.points, os do ouro em PalpiteOuro.pontosObtidos
  // O ranking deve somar ambos — ver seção de Ranking atualizado.

  return NextResponse.json({
    message: `Campeão definido: ${selecao.nome}. ${totalApostadores} apostador(es) recebem ${pontosParaCada} pts cada.`,
    selecao: selecao.nome,
    totalApostadores,
    pontosParaCada,
  });
}
```

#### Página — Palpite de Ouro

**Arquivo a criar:** `src/app/(app)/palpite-ouro/page.tsx`

```typescript
// Server Component que carrega dados e renderiza o formulário de palpite ouro
// Mostrar:
// 1. Se prazo encerrado: exibir o palpite atual do usuário (somente leitura)
// 2. Se prazo aberto:
//    - Lista de seleções com bandeira, nome, total de apostadores e pontos estimados
//    - Botão de seleção (radio/card clicável)
//    - Botão "Confirmar Meu Palpite de Ouro"
// 3. Exibir aviso: "Prazo: até o início da fase de grupos"

// Props visuais sugeridos para cada card de seleção:
// - Bandeira emoji grande (da lib src/lib/teams.ts)
// - Nome da seleção em português
// - "X apostadores" (número atual)
// - "Pontos estimados: Y pts" (peso ÷ (apostadores + 1))
// - Destacar a seleção atualmente escolhida pelo usuário
```

Criar também o componente cliente:
**Arquivo a criar:** `src/app/(app)/palpite-ouro/PalpiteOuroForm.tsx`

```typescript
"use client";
// Componente interativo para seleção do campeão
// Props: selecoes[], meuPalpiteAtual, prazoEncerrado
// Estado: selecaoSelecionada
// Ao submeter: POST /api/palpite-ouro com { selecaoId }
// Feedback: toast de sucesso/erro
```

#### Atualizar o Ranking para incluir Palpite de Ouro

**Arquivo:** `src/app/(app)/ranking/page.tsx`

No query do ranking, a pontuação total = soma de `Palpite.points` + `PalpiteOuro.pontosObtidos`:

```typescript
// Na query do ranking, incluir palpiteOuro:
const usuarios = await db.user.findMany({
  include: {
    palpites: { select: { points: true, scorePoints: true, winnerPoints: true } },
    palpiteOuro: { select: { pontosObtidos: true } },
  },
});

// Calcular totais:
const ranking = usuarios.map((u) => {
  const pontosRegulares = u.palpites.reduce((s, p) => s + p.points, 0);
  const pontosOuro = u.palpiteOuro?.pontosObtidos ?? 0;
  const total = pontosRegulares + pontosOuro;
  const cravadas = u.palpites.filter((p) => p.scorePoints > 0).length;
  const acertos = u.palpites.filter((p) => p.winnerPoints > 0).length;
  return { ...u, total, pontosOuro, cravadas, acertos };
}).sort((a, b) => b.total - a.total || b.cravadas - a.cravadas || b.acertos - a.acertos);
```

#### Adicionar link "Palpite de Ouro" na navegação

**Arquivo:** `src/app/(app)/layout.tsx`

Adicionar item no menu de navegação:
```tsx
<Link href="/palpite-ouro">🏆 Palpite de Ouro</Link>
```

---

### F2 — MÓDULO FINANCEIRO

#### O que é
Painel administrativo para gestão das inscrições dos participantes. Controla quem pagou, calcula o pool total e distribui os prêmios.

#### Regras de Negócio

```
1. Cada usuário tem um status de inscrição: PENDENTE | CONFIRMADA | RECUSADA
2. O valor de inscrição é definido via env: ENTRY_FEE (padrão R$ 50)
3. Somente admin pode confirmar/recusar inscrições.
4. Pool Total = quantidade de inscrições CONFIRMADAS × ENTRY_FEE
5. Distribuição (percentuais via env):
   - 1º lugar: PRIZE_1ST_PCT % do pool (padrão 50%)
   - 2º lugar: PRIZE_2ND_PCT % do pool (padrão 30%)
   - 3º lugar: PRIZE_3RD_PCT % do pool (padrão 20%)
6. A soma dos percentuais DEVE ser 100 (validar ao inicializar).
7. Os nomes dos premiados são determinados pelo ranking no momento da consulta.
8. O admin pode exportar a lista de inscrições (CSV ou tabela impressa).
```

#### Mudanças no Schema Prisma

**Arquivo:** `prisma/schema.prisma`

Adicionar enum e campo em `User`:

```prisma
enum StatusInscricao {
  PENDENTE
  CONFIRMADA
  RECUSADA
}

// No model User, adicionar:
  statusInscricao StatusInscricao @default(PENDENTE)
  valorInscricao  Float           @default(50)
  observacaoAdmin String?         // Nota interna do admin
```

Após editar:
```bash
npx prisma migrate dev --name add_financeiro
```

#### API Routes — Financeiro

**Arquivo a criar:** `src/app/api/admin/financeiro/route.ts`

```typescript
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";

// GET: retorna resumo financeiro
export async function GET() {
  await requireAdmin();

  const usuarios = await db.user.findMany({
    select: {
      id: true, name: true, email: true,
      statusInscricao: true, valorInscricao: true, observacaoAdmin: true,
      createdAt: true,
    },
    orderBy: { createdAt: "asc" },
  });

  const confirmados = usuarios.filter((u) => u.statusInscricao === "CONFIRMADA");
  const poolTotal = confirmados.reduce((s, u) => s + u.valorInscricao, 0);

  const pct1 = Number(process.env.PRIZE_1ST_PCT ?? 50) / 100;
  const pct2 = Number(process.env.PRIZE_2ND_PCT ?? 30) / 100;
  const pct3 = Number(process.env.PRIZE_3RD_PCT ?? 20) / 100;

  return NextResponse.json({
    usuarios,
    resumo: {
      total: usuarios.length,
      confirmados: confirmados.length,
      pendentes: usuarios.filter((u) => u.statusInscricao === "PENDENTE").length,
      recusados: usuarios.filter((u) => u.statusInscricao === "RECUSADA").length,
      poolTotal,
      premios: {
        primeiro: poolTotal * pct1,
        segundo: poolTotal * pct2,
        terceiro: poolTotal * pct3,
      },
    },
  });
}

// PATCH: atualiza status de inscrição de um usuário
export async function PATCH(req: NextRequest) {
  await requireAdmin();
  const { userId, status, observacao } = await req.json();

  if (!["PENDENTE", "CONFIRMADA", "RECUSADA"].includes(status)) {
    return NextResponse.json({ error: "Status inválido" }, { status: 400 });
  }

  const user = await db.user.update({
    where: { id: userId },
    data: { statusInscricao: status, observacaoAdmin: observacao ?? null },
  });

  return NextResponse.json({ user });
}
```

#### Página Admin — Financeiro

**Arquivo a criar:** `src/app/(app)/admin/financeiro/page.tsx`

```typescript
// Server Component — requer requireAdmin()
// Exibir:
// 1. Cards de resumo:
//    - Total de participantes | Confirmados | Pendentes | Recusados
//    - Pool Total: R$ X.XXX,00
//    - Premiação estimada: 1º R$XX | 2º R$XX | 3º R$XX
//    (com nomes do ranking atual)
// 2. Tabela de usuários:
//    Colunas: Nome | Email | Status | Valor | Data Inscrição | Observação | Ações
//    Ações: botões [Confirmar] [Recusar] com modal de confirmação
// 3. Botão "Exportar CSV"
```

Criar componente cliente para as ações:
**Arquivo a criar:** `src/app/(app)/admin/financeiro/FinanceiroTable.tsx`

```typescript
"use client";
// Props: usuarios[], onUpdate(userId, status, obs)
// Estado: modal aberto, usuário selecionado
// Ao confirmar/recusar: PATCH /api/admin/financeiro
// Re-renderiza tabela após ação
// Exportar CSV: gera arquivo client-side com os dados da tabela
```

Adicionar link no painel admin existente (`src/app/(app)/admin/page.tsx`):
```tsx
<Link href="/admin/financeiro">💰 Gestão Financeira</Link>
```

---

### F3 — PÁGINA DE PERFIL DO USUÁRIO

#### O que é
Dashboard pessoal do usuário mostrando suas estatísticas, histórico de palpites e status de inscrição.

#### Arquivo a criar: `src/app/(app)/perfil/page.tsx`

```typescript
// Server Component — requer requireSession()
// Buscar:
//   - Dados do usuário (name, email, statusInscricao, valorInscricao)
//   - Todos os palpites com dados da partida
//   - PalpiteOuro do usuário

// Exibir:
// 1. Cabeçalho: nome, email, avatar (inicial do nome)
// 2. Card de Inscrição:
//    - Status: PENDENTE (amarelo) | CONFIRMADA (verde) | RECUSADA (vermelho)
//    - Valor: R$ XX,00
// 3. Cards de estatísticas:
//    - Pontuação Total (regulares + ouro)
//    - Cravadas (placar exato)
//    - Acertos (vencedor correto)
//    - Palpites realizados / total de partidas
//    - Posição no ranking
// 4. Palpite de Ouro: qual seleção escolheu + pontos estimados/obtidos
// 5. Tabela de Palpites:
//    Colunas: Fase | Partida | Meu Palpite | Resultado | Pontos
//    Ordenar: por data (mais recentes primeiro)
//    Filtros: Fase / Status (finalizado/pendente)
```

**Adicionar link no menu de navegação** (`src/app/(app)/layout.tsx`):
```tsx
<Link href="/perfil">👤 Meu Perfil</Link>
```

---

### F4 — OAUTH GITLAB + GOOGLE SIGN-IN

#### O que é
Autenticação adicional via OAuth para GitLab (obrigatório por spec) e Google (opcional mas recomendado).

#### Estratégia
Usar o Supabase Auth que já suporta GitLab e Google como providers OAuth nativos. Não é necessário implementar OAuth manualmente.

#### Configurar no Dashboard Supabase

1. Acesse: https://supabase.com/dashboard → seu projeto → Authentication → Providers
2. **GitLab:**
   - Enable GitLab provider
   - Callback URL: `https://[SEU_PROJECT_REF].supabase.co/auth/v1/callback`
   - Copiar Client ID e Secret do app GitLab OAuth
3. **Google:**
   - Enable Google provider  
   - Criar credenciais em Google Cloud Console (OAuth 2.0)
   - Callback URL: `https://[SEU_PROJECT_REF].supabase.co/auth/v1/callback`

#### Modificar a Página de Login

**Arquivo:** `src/app/login/page.tsx`

Adicionar botões de OAuth:

```typescript
// Adicionar ao formulário de login, acima ou abaixo do form email/senha:
<div className="flex flex-col gap-2">
  <button
    onClick={() => loginWithOAuth("gitlab")}
    className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded"
  >
    <GitLabIcon /> Entrar com GitLab
  </button>
  <button
    onClick={() => loginWithOAuth("google")}
    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded"
  >
    <GoogleIcon /> Entrar com Google
  </button>
</div>
```

#### Função de Login OAuth (client-side)

```typescript
// src/app/login/page.tsx ou src/lib/supabase/auth-actions.ts
"use client";
import { createClient } from "@/lib/supabase/client";

async function loginWithOAuth(provider: "gitlab" | "google") {
  const supabase = createClient();
  const { error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: `${window.location.origin}/api/auth/callback`,
    },
  });
  if (error) console.error(error);
}
```

#### Callback Route (necessária para OAuth)

**Arquivo a criar:** `src/app/api/auth/callback/route.ts`

```typescript
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  const { searchParams, origin } = new URL(req.url);
  const code = searchParams.get("code");

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    
    if (!error && data.user) {
      // Garantir que o usuário existe no banco Prisma
      await db.user.upsert({
        where: { id: data.user.id },
        update: {},
        create: {
          id: data.user.id,
          email: data.user.email!,
          name: data.user.user_metadata?.name ?? data.user.email!.split("@")[0],
          isAdmin: false,
        },
      });
      return NextResponse.redirect(`${origin}/ranking`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=oauth_failed`);
}
```

---

### F5 — STATUS DE PARTIDA (3 ESTADOS)

#### O que é
Substituir o campo `finished: Boolean` por um enum `status` com 3 estados para melhor controle.

#### Regras de Negócio

```
SCHEDULED     → Partida agendada, ainda não iniciou
IN_PROGRESS   → Entre kickoff e kickoff + 2.5 horas
FINISHED      → Resultado registrado pelo admin
```

#### Mudanças no Schema Prisma

**Arquivo:** `prisma/schema.prisma`

```prisma
enum MatchStatus {
  SCHEDULED
  IN_PROGRESS
  FINISHED
}

// No model Match, substituir:
//   finished   Boolean   @default(false)
// Por:
  status     MatchStatus @default(SCHEDULED)
```

**CUIDADO com migração:** O campo `finished` é usado em vários lugares. Ao migrar:
1. Criar migration com `prisma migrate dev --name add_match_status`
2. Atualizar todos os registros existentes: `UPDATE "Match" SET status = 'FINISHED' WHERE finished = true`
3. Remover coluna `finished` após validação

#### Atualizar referências no código

Substituir `match.finished` por `match.status === "FINISHED"` em:
- `src/app/(app)/jogos/page.tsx`
- `src/app/(app)/palpites/PalpitesForm.tsx`
- `src/app/(app)/admin/AdminMatches.tsx`
- `src/app/api/admin/resultado/route.ts`

Substituir `finished: true` por `status: "FINISHED"` em:
- `src/app/api/admin/resultado/route.ts` (ao salvar resultado)

#### Indicador "Ao Vivo" — Atualizar lógica

**Arquivo:** `src/app/(app)/jogos/page.tsx`

```typescript
// Atual (calcular na hora):
const agora = new Date();
const aoVivo = agora >= match.kickoff && 
               agora <= new Date(match.kickoff.getTime() + 2.5 * 60 * 60 * 1000);

// Novo: usar status IN_PROGRESS (mais confiável, admin pode marcar)
// OU manter o cálculo automático + usar status
const aoVivo = match.status === "IN_PROGRESS" || (
  match.status === "SCHEDULED" &&
  agora >= match.kickoff && 
  agora <= new Date(match.kickoff.getTime() + 2.5 * 60 * 60 * 1000)
);
```

---

### F6 — TRAVA 30 MINUTOS ANTES DO KICKOFF

#### O que é
Atualmente o sistema bloqueia palpites no horário exato do kickoff. A especificação pede que o bloqueio seja 30 minutos antes.

#### Onde modificar

**Arquivo:** `src/app/api/palpites/route.ts`

```typescript
// Localizar a verificação de horário e substituir:

// ANTES:
if (new Date() >= match.kickoff) {
  return NextResponse.json({ error: "Partida já iniciou" }, { status: 403 });
}

// DEPOIS:
const LOCK_MINUTES = 30;
const lockTime = new Date(match.kickoff.getTime() - LOCK_MINUTES * 60 * 1000);
if (new Date() >= lockTime) {
  return NextResponse.json({ 
    error: `Palpites encerrados. Bloqueio 30 min antes do kickoff.` 
  }, { status: 403 });
}
```

**Arquivo:** `src/app/(app)/palpites/PalpitesForm.tsx`

Atualizar a lógica client-side de exibição do estado "bloqueado":

```typescript
// Calcular lockTime no cliente também para mostrar o countdown correto
const lockTime = new Date(match.kickoff.getTime() - 30 * 60 * 1000);
const bloqueado = new Date() >= lockTime;
```

**Arquivo:** `src/app/(app)/jogos/page.tsx`

Mostrar indicador "Palpites encerram em X min" quando faltarem menos de 30 min:

```typescript
const minutosRestantes = Math.floor((lockTime.getTime() - Date.now()) / 60000);
if (minutosRestantes > 0 && minutosRestantes <= 30) {
  // Exibir: "⏰ Palpites encerram em {minutosRestantes} min"
}
```

---

### F7 — SYNC AUTOMÁTICO VIA CRON

#### O que é
Automatizar a sincronização com a API football-data.org para rodar a cada 15-30 minutos durante o torneio.

#### Estratégia — Vercel Cron Jobs

**Arquivo a criar:** `src/app/api/cron/sync-matches/route.ts`

```typescript
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// Proteger a rota de cron (apenas chamadas internas ou com token)
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const resultado = await syncMatchesFromAPI();
    return NextResponse.json({ success: true, ...resultado });
  } catch (error) {
    console.error("Cron sync failed:", error);
    // Enviar notificação (F8)
    await notificarFalha(String(error));
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

async function syncMatchesFromAPI() {
  const token = process.env.FOOTBALL_DATA_TOKEN;
  if (!token) throw new Error("FOOTBALL_DATA_TOKEN não configurado");

  const res = await fetch(
    "https://api.football-data.org/v4/competitions/WC/matches",
    { headers: { "X-Auth-Token": token } }
  );

  if (!res.ok) throw new Error(`API error: ${res.status}`);
  
  const data = await res.json();
  let atualizados = 0;

  for (const match of data.matches) {
    // Atualizar apenas partidas finalizadas (status FINISHED na API)
    if (match.status === "FINISHED") {
      const existing = await db.match.findFirst({
        where: {
          homeTeam: { contains: match.homeTeam.name },
          awayTeam: { contains: match.awayTeam.name },
        },
      });

      if (existing && existing.status !== "FINISHED") {
        await db.match.update({
          where: { id: existing.id },
          data: {
            homeScore: match.score.fullTime.home,
            awayScore: match.score.fullTime.away,
            status: "FINISHED",
          },
        });
        // Recalcular pontos dos palpites desta partida
        await recalcularPontosDaPartida(existing.id);
        atualizados++;
      }
    }
  }

  return { atualizados, timestamp: new Date().toISOString() };
}
```

**Adicionar variável de ambiente:**
```env
CRON_SECRET=um_token_aleatorio_seguro_aqui
```

**Arquivo:** `vercel.json` (criar na raiz se não existir)

```json
{
  "crons": [
    {
      "path": "/api/cron/sync-matches",
      "schedule": "*/20 * * * *"
    }
  ]
}
```

> **NOTA:** Vercel Cron Jobs requerem plano Pro ou superior. Para plano gratuito, usar um serviço externo como cron-job.org para chamar a URL a cada 20 minutos.

---

### F8 — NOTIFICAÇÕES DE FALHA DE API

#### O que é
Alertar o admin quando a sincronização automática falhar.

#### Estratégia simples — Log no banco de dados

**Adicionar ao schema:**

```prisma
model CronLog {
  id        String   @id @default(cuid())
  tipo      String   // "sync_matches", "calc_pontos", etc.
  status    String   // "success" | "error"
  mensagem  String?
  createdAt DateTime @default(now())
}
```

**No cron handler:**

```typescript
async function notificarFalha(erro: string) {
  await db.cronLog.create({
    data: { tipo: "sync_matches", status: "error", mensagem: erro },
  });
  // Opcional: enviar email via Supabase (se configurado)
  // Opcional: enviar webhook Slack/Discord
}
```

**Exibir logs no painel admin:**

```typescript
// src/app/(app)/admin/page.tsx — adicionar seção:
const logsRecentes = await db.cronLog.findMany({
  orderBy: { createdAt: "desc" },
  take: 10,
});
// Exibir com badge vermelho se algum erro nas últimas 2 horas
```

---

## 7. MODELO DE DADOS FINAL COMPLETO

Após todas as implementações, o schema Prisma completo deverá ser:

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}

// ─────────────────────────────────────────────
// ENUMS
// ─────────────────────────────────────────────

enum MatchStatus {
  SCHEDULED
  IN_PROGRESS
  FINISHED
}

enum StatusInscricao {
  PENDENTE
  CONFIRMADA
  RECUSADA
}

// ─────────────────────────────────────────────
// USUÁRIO
// ─────────────────────────────────────────────

model User {
  id              String          @id @db.Uuid
  email           String          @unique
  name            String
  isAdmin         Boolean         @default(false)
  statusInscricao StatusInscricao @default(PENDENTE)
  valorInscricao  Float           @default(50)
  observacaoAdmin String?
  createdAt       DateTime        @default(now())
  palpites        Palpite[]
  palpiteOuro     PalpiteOuro?
}

// ─────────────────────────────────────────────
// PARTIDAS
// ─────────────────────────────────────────────

model Match {
  id         String      @id @default(cuid())
  stage      String      // GROUP | R32 | R16 | QF | SF | TP | FINAL
  group      String?     // A, B, C... (apenas GROUP stage)
  homeTeam   String
  awayTeam   String
  kickoff    DateTime
  homeScore  Int?
  awayScore  Int?
  totalFouls Int?
  status     MatchStatus @default(SCHEDULED)
  palpites   Palpite[]
}

// ─────────────────────────────────────────────
// PALPITES (apostas regulares)
// ─────────────────────────────────────────────

model Palpite {
  id            String   @id @default(cuid())
  userId        String   @db.Uuid
  matchId       String
  homeScore     Int?     // Mercado 1: placar exato (casa)
  awayScore     Int?     // Mercado 1: placar exato (visitante)
  winnerGuess   String?  // Mercado 2: HOME | DRAW | AWAY
  totalGoals    Int?     // Mercado 3: total de gols
  totalFouls    Int?     // Mercado 4: total de faltas
  scorePoints   Int      @default(0)
  winnerPoints  Int      @default(0)
  goalsPoints   Int      @default(0)
  foulsPoints   Int      @default(0)
  points        Int      @default(0)  // soma de todos os mercados × multiplicador da fase
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  user          User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  match         Match    @relation(fields: [matchId], references: [id], onDelete: Cascade)

  @@unique([userId, matchId])
}

// ─────────────────────────────────────────────
// SELEÇÕES (para Palpite de Ouro)
// ─────────────────────────────────────────────

model Selecao {
  id              String        @id @default(cuid())
  nome            String        @unique  // "Brasil", "França"...
  pais            String                 // "Brazil", "France"... (nome inglês da API)
  bandeira        String?                // emoji ou URL
  pesoPalpiteOuro Int           @default(50)
  palpitesOuro    PalpiteOuro[]
  createdAt       DateTime      @default(now())
}

// ─────────────────────────────────────────────
// PALPITE DE OURO (aposta no campeão)
// ─────────────────────────────────────────────

model PalpiteOuro {
  id            String   @id @default(cuid())
  userId        String   @db.Uuid
  selecaoId     String
  pontosObtidos Int      @default(0)
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  user          User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  selecao       Selecao  @relation(fields: [selecaoId], references: [id])

  @@unique([userId])
}

// ─────────────────────────────────────────────
// LOGS DO CRON
// ─────────────────────────────────────────────

model CronLog {
  id        String   @id @default(cuid())
  tipo      String
  status    String   // "success" | "error"
  mensagem  String?
  createdAt DateTime @default(now())
}
```

---

## 8. REGRAS DE NEGÓCIO CONSOLIDADAS

### 8.1 Pontuação Regular (Palpites por Jogo)

#### Mercado 1 — Placar Exato (`scorePoints`)

| Condição | Pontos |
|---|---|
| Placar exato correto (ex: 2×1 = 2×1) | **10 pts** |
| Margem de ±1 gol em cada time, vencedor correto | **7 pts** |
| Margem de ±2 gols em cada time, vencedor correto | **5 pts** |
| Errou o vencedor ou diferença > 2 | **0 pts** |

#### Mercado 2 — Vencedor (`winnerPoints`)

| Condição | Pontos |
|---|---|
| Acertou vencedor/empate | **3 pts** |
| Errou | **0 pts** |

#### Mercado 3 — Total de Gols (`goalsPoints`)

| Condição | Pontos |
|---|---|
| Total exato de gols | **5 pts** |
| ±1 gol do total | **3 pts** |
| ±2 gols do total | **1 pt** |
| Diferença > 2 | **0 pts** |

#### Mercado 4 — Total de Faltas (`foulsPoints`)

| Condição | Pontos |
|---|---|
| Total exato de faltas | **5 pts** |
| ±2 faltas | **3 pts** |
| ±5 faltas | **1 pt** |
| Diferença > 5 | **0 pts** |

#### Multiplicadores por Fase

| Fase | Código | Multiplicador |
|---|---|---|
| Fase de Grupos | GROUP | ×1.0 |
| Rodada de 32 | R32 | ×1.25 |
| Oitavas | R16 | ×1.5 |
| Quartas | QF | ×2.0 |
| Semifinal | SF | ×2.5 |
| 3º Lugar | TP | ×3.0 |
| Final | FINAL | ×3.0 |

**Fórmula total:**
```
points = Math.round((scorePoints + winnerPoints + goalsPoints + foulsPoints) × multiplicador)
```

### 8.2 Palpite de Ouro

```
pontosObtidos = Math.round(selecao.pesoPalpiteOuro / totalApostadoresNessaSelecao)
              → Somente se a seleção for campeã
              → Calculado quando admin registrar o campeão
              → 0 se errou
```

### 8.3 Pontuação Total no Ranking

```
total = Σ(Palpite.points) + PalpiteOuro.pontosObtidos
```

### 8.4 Critérios de Desempate (em ordem)

1. Maior pontuação total
2. Maior número de cravadas (placar exato: `scorePoints > 0`)
3. Maior número de acertos de vencedor (`winnerPoints > 0`)

### 8.5 Regras de Tempo

| Evento | Regra |
|---|---|
| Palpite regular | Permitido até 30 min antes do kickoff |
| Palpite de Ouro | Permitido até o kickoff do último jogo da fase de grupos |
| Admin: registrar resultado | A qualquer momento, mesmo antes do jogo (admin é responsável) |

### 8.6 Módulo Financeiro

```
Pool Total = count(statusInscricao = CONFIRMADA) × ENTRY_FEE
Premio 1º  = Pool Total × (PRIZE_1ST_PCT / 100)
Premio 2º  = Pool Total × (PRIZE_2ND_PCT / 100)
Premio 3º  = Pool Total × (PRIZE_3RD_PCT / 100)

Invariante: PRIZE_1ST_PCT + PRIZE_2ND_PCT + PRIZE_3RD_PCT = 100
```

---

## 9. ARQUITETURA DE ARQUIVOS — ONDE CRIAR CADA COISA

### Novos Arquivos a Criar

```
src/
├── app/
│   ├── (app)/
│   │   ├── palpite-ouro/
│   │   │   ├── page.tsx                    ← F1: Página Palpite de Ouro
│   │   │   └── PalpiteOuroForm.tsx         ← F1: Componente cliente
│   │   ├── perfil/
│   │   │   └── page.tsx                    ← F3: Página de Perfil
│   │   └── admin/
│   │       └── financeiro/
│   │           ├── page.tsx                ← F2: Painel Financeiro Admin
│   │           └── FinanceiroTable.tsx     ← F2: Tabela com ações cliente
│   └── api/
│       ├── auth/
│       │   └── callback/
│       │       └── route.ts                ← F4: Callback OAuth
│       ├── palpite-ouro/
│       │   └── route.ts                    ← F1: API Palpite de Ouro
│       ├── admin/
│       │   └── campeo/
│       │       └── route.ts                ← F1: Admin define campeão
│       │   └── financeiro/
│       │       └── route.ts                ← F2: API Financeiro
│       └── cron/
│           └── sync-matches/
│               └── route.ts                ← F7: Cron sync automático
├── vercel.json                             ← F7: Config Vercel Cron
prisma/
└── schema.prisma                           ← MODIFICAR: novos models/enums
```

### Arquivos Existentes a Modificar

| Arquivo | O que mudar | Feature |
|---|---|---|
| `prisma/schema.prisma` | Adicionar Selecao, PalpiteOuro, CronLog; enum MatchStatus, StatusInscricao; campos em User e Match | F1, F2, F5 |
| `prisma/seed.ts` | Seed das seleções | F1 |
| `src/app/(app)/layout.tsx` | Links: Palpite de Ouro, Perfil | F1, F3 |
| `src/app/(app)/ranking/page.tsx` | Incluir pontosOuro no total | F1 |
| `src/app/(app)/admin/page.tsx` | Links: Financeiro, Logs | F2, F8 |
| `src/app/api/palpites/route.ts` | Trava 30 min antes | F6 |
| `src/app/(app)/palpites/PalpitesForm.tsx` | Atualizar lógica de lockTime | F6 |
| `src/app/(app)/jogos/page.tsx` | Usar status ao invés de finished | F5 |
| `src/app/api/admin/resultado/route.ts` | Salvar status FINISHED ao invés de finished=true | F5 |
| `src/app/login/page.tsx` | Botões GitLab + Google OAuth | F4 |

---

## ORDEM DE IMPLEMENTAÇÃO RECOMENDADA

Siga esta sequência para evitar dependências quebradas:

```
Passo 1: Schema Prisma
   → Adicionar todos os novos models (Selecao, PalpiteOuro, CronLog)
   → Adicionar enums (MatchStatus, StatusInscricao)
   → Modificar User e Match
   → npx prisma migrate dev --name full_update
   → Atualizar seed.ts com seleções
   → npm run db:seed

Passo 2: F5 — Status de Partida (baixo risco, sem dependências)
   → Atualizar referências de `finished` para `status`
   → Testar admin de resultados

Passo 3: F6 — Trava 30 Minutos (trivial, 1 linha)
   → Modificar route.ts e PalpitesForm.tsx

Passo 4: F1 — Palpite de Ouro (depende do schema)
   → API routes (GET/POST /api/palpite-ouro)
   → API admin campeão (/api/admin/campeo)
   → Páginas e componentes
   → Atualizar ranking

Passo 5: F2 — Módulo Financeiro (depende do schema User)
   → API route /api/admin/financeiro
   → Páginas admin/financeiro

Passo 6: F3 — Perfil do Usuário (depende de F1 e F2)
   → Página /perfil

Passo 7: F4 — OAuth GitLab + Google
   → Configurar no Supabase Dashboard primeiro
   → Criar callback route
   → Modificar login page

Passo 8: F7 + F8 — Cron + Notificações
   → Criar route do cron
   → Adicionar vercel.json
   → Testar manualmente antes de ativar schedule
```

---

## CHECKLIST FINAL PARA O DESENVOLVEDOR

Antes de considerar o projeto completo, verificar:

- [ ] `npx prisma migrate deploy` roda sem erros em produção
- [ ] `npm run build` compila sem erros de TypeScript
- [ ] Usuário consegue fazer login com email/senha
- [ ] Usuário consegue fazer login com GitLab OAuth
- [ ] Usuário consegue fazer login com Google OAuth
- [ ] Palpite regular bloqueia 30 min antes do kickoff
- [ ] Palpite de Ouro bloqueia após último jogo da fase de grupos
- [ ] Admin consegue registrar resultado e pontos são recalculados
- [ ] Admin consegue definir campeão e Palpite de Ouro é calculado
- [ ] Ranking exibe pontos regulares + palpite ouro corretamente
- [ ] Desempate por cravadas e acertos funciona
- [ ] Painel financeiro exibe pool e premiação corretos
- [ ] Admin consegue confirmar/recusar inscrições
- [ ] Cron roda e atualiza partidas automaticamente
- [ ] Falhas do cron são logadas no banco
- [ ] Todas as rotas admin rejeitam usuários sem `isAdmin: true`
- [ ] SUPABASE_SERVICE_ROLE_KEY nunca é exposto ao cliente
- [ ] Variáveis de ambiente de OAuth não estão hard-coded
