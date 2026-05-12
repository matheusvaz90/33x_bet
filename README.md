# Bolão Copa do Mundo 2026

Sistema web para um bolão da Copa do Mundo 2026 entre colegas.
**Stack:** Next.js 15 (App Router) + TypeScript + Tailwind v4 + Prisma + **Supabase (Postgres + Auth)**.

## Setup

```bash
cp .env.example .env
# preencha os valores (veja a seção abaixo)

npm install
npx prisma migrate dev --name init
npm run db:seed
npm run dev
```

Abra http://localhost:3000.

## Variáveis de ambiente

```env
# Banco Postgres do Supabase (conexão direta)
DATABASE_URL="postgresql://postgres:<SENHA>@db.<PROJECT_REF>.supabase.co:5432/postgres?sslmode=require"
DIRECT_URL="postgresql://postgres:<SENHA>@db.<PROJECT_REF>.supabase.co:5432/postgres?sslmode=require"

# Supabase Auth / API
NEXT_PUBLIC_SUPABASE_URL="https://<PROJECT_REF>.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="sb_publishable_..."
SUPABASE_SERVICE_ROLE_KEY="sb_secret_..."   # nunca expor no client

# Admin inicial (criado pelo seed via Admin API)
ADMIN_EMAIL="admin@bolao.local"
ADMIN_PASSWORD="admin123"
```

Onde achar no painel Supabase:

- `DATABASE_URL` / `DIRECT_URL` → **Project Settings → Database → Connection string**
- `NEXT_PUBLIC_SUPABASE_URL` → **Project Settings → Data API → Project URL**
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` → **Project Settings → API Keys → Publishable key**
- `SUPABASE_SERVICE_ROLE_KEY` → **Project Settings → API Keys → Secret key**

> **Importante**: desligue a confirmação de email em **Authentication → Providers → Email → "Confirm email"**, pois o app cria usuários com `email_confirm=true` via Admin API e espera login imediato.

## Acesso inicial

- O seed cria um admin no Supabase Auth: **`admin@bolao.local`** (ou o valor de `ADMIN_EMAIL`) com senha **`admin123`** (ou `ADMIN_PASSWORD`).
- `/register` cria via **Admin API** (`auth.admin.createUser` com `email_confirm=true`) — sem clicar em link de confirmação.
- **Quem é admin?** Quem tem email = `ADMIN_EMAIL`, ou é o primeiro usuário cadastrado. A flag `isAdmin` fica na tabela `User` (espelho do `auth.users` pelo UUID).

## Arquitetura de auth

- Não usamos NextAuth. Usamos `@supabase/ssr` que mantém a sessão em cookies httpOnly.
- O `src/middleware.ts` faz refresh do token a cada request.
- `src/lib/auth.ts` expõe `getSession`, `requireSession`, `requireAdmin` — lê `auth.getUser()` do Supabase e cruza com a tabela `User` do Prisma (cria espelho automático na 1ª chamada se não existir).
- O service_role só é usado server-side: em `/api/auth/register` (criar user com email confirmado) e no seed.

## Regra de pontuação

- **Placar exato** → 10 pts (base)
- **Vencedor + saldo de gols igual** → 7 pts (base)
- **Só o vencedor certo** (ou empate sem placar exato) → 5 pts (base)
- **Errou** → 0

Multiplicadores por fase:

| Fase           | Multiplicador |
| -------------- | ------------- |
| Grupos         | ×1            |
| Oitavas (R16)  | ×1.5          |
| Quartas (QF)   | ×2            |
| Semifinal (SF) | ×2.5          |
| Disputa 3º     | ×3            |
| Final          | ×3            |

Resultado final = `Math.round(base * multiplicador)`.

Desempate: **pontos → placares exatos (cravadas) → vencedores acertados**.

## Bloqueio de palpites

Cada palpite só pode ser salvo/editado enquanto `kickoff > agora`. Após o kickoff a interface mostra 🔒 e a API bloqueia o `POST /api/palpites`.

## Admin

Em `/admin` o admin pode:

1. Renomear `homeTeam` / `awayTeam` e ajustar `kickoff` de cada jogo (o seed coloca placeholders `A1`..`L4`).
2. Salvar o placar final → repontua todos os palpites daquele jogo automaticamente.
3. Limpar resultado → zera os pontos.

## Scripts

- `npm run dev` — dev server
- `npm run build` — `prisma generate && prisma migrate deploy && next build`
- `npm start` — produção
- `npm run db:push` — `prisma db push` (sem migration)
- `npm run db:seed` — roda `prisma/seed.ts`
- `npm run db:reset` — `prisma migrate reset --force` (⚠️ apaga dados)

## Sincronizar jogos reais (football-data.org)

A seed inicial (`npm run db:seed`) cria 72 partidas com nomes placeholder (`A1`..`L4`). Para puxar os jogos reais da Copa do Mundo 2026 (grupos + mata-mata, com times e horários oficiais):

1. Crie conta grátis em https://www.football-data.org/client/register
2. Copie o **X-Auth-Token** do painel
3. Adicione no `.env`:
   ```
   FOOTBALL_DATA_TOKEN="seu-token-aqui"
   ```
4. Rode:
   ```bash
   npm run db:sync
   ```

O script ([prisma/seedFromApi.ts](prisma/seedFromApi.ts)):

- Busca todas as partidas do `competition WC` (FIFA World Cup) na API.
- Mapeia os stages: `GROUP_STAGE→GROUP`, `LAST_16→R16`, `QUARTER_FINALS→QF`, `SEMI_FINALS→SF`, `THIRD_PLACE→TP`, `FINAL→FINAL`.
- Substitui os placeholders `A1`/`A2`/... do grupo correto pelos times reais retornados pela API (preserva os IDs dos jogos, então palpites existentes continuam válidos).
- Cria as 32 partidas do mata-mata.
- Se uma partida já estiver `FINISHED` na API, importa o placar também (mas não recalcula pontos — use o `/admin` para finalizar e disparar a repontuação).
- É **idempotente**: pode rodar várias vezes; só atualiza kickoffs/times.

**Limite gratuito:** 10 req/min, 100 req/dia. O sync usa só 1 request.

## Estrutura

```
prisma/
  schema.prisma           # provider postgresql, User.id é UUID (espelho de auth.users)
  seed.ts                 # cria admin via Admin API + espelha no User + 72 partidas
src/
  middleware.ts           # refresh do cookie de sessão Supabase
  lib/
    db.ts                 # singleton PrismaClient
    auth.ts               # getSession/requireSession/requireAdmin (lê Supabase + Prisma)
    scoring.ts            # calcPoints + multiplicadores
    supabase/
      server.ts           # createServerClient (App Router)
      client.ts           # createBrowserClient
      admin.ts            # service_role (NUNCA importar no client)
  app/
    layout.tsx
    globals.css
    page.tsx
    login/page.tsx        # POST /api/auth/login
    register/page.tsx     # POST /api/auth/register
    (app)/
      layout.tsx          # exige sessão; header com nav + logout
      ranking/page.tsx
      jogos/page.tsx
      palpites/page.tsx + PalpitesForm.tsx
      admin/page.tsx + AdminMatches.tsx
    api/
      auth/login/route.ts
      auth/register/route.ts
      auth/logout/route.ts
      palpites/route.ts
      admin/match/route.ts
      admin/resultado/route.ts
```
