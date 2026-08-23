# Vértice Create — Sistema Interno de Gestão

Sistema interno (100% uso da equipe) para organizar projetos, tarefas, prazos e
carga de trabalho da Vértice Create. Separado do CRM de clientes e do SaaS
Trelvo.

## Stack

- Next.js 14 (App Router) + TypeScript
- Prisma ORM + PostgreSQL (Neon)
- Auth.js (NextAuth v5) — Credentials, papéis `ADMIN` / `MEMBER`
- Tailwind CSS + shadcn/ui (componentes em `components/ui`)
- dnd-kit (Kanban — próxima etapa)
- Recharts (gráficos do dashboard)

## Setup local

1. Instale as dependências:

```bash
npm install
```

2. Copie o `.env.example` para `.env` e preencha:
   - `DATABASE_URL`: connection string do seu banco Neon (Postgres)
   - `AUTH_SECRET`: gere com `npx auth secret`

3. Rode as migrations e o seed (cria um admin e um membro de teste):

```bash
npx prisma migrate dev --name init
npm run prisma:seed
```

4. Suba o servidor:

```bash
npm run dev
```

5. Acesse `http://localhost:3000` — você será redirecionado para `/login`.

### Credenciais de teste (via seed)

| Papel  | E-mail                       | Senha    |
| ------ | ----------------------------- | -------- |
| ADMIN  | admin@verticecreate.com       | senha123 |
| MEMBER | camila@verticecreate.com      | senha123 |

## Estrutura de pastas (App Router)

```
app/
  login/                      # página de login (pública)
  (app)/                      # grupo de rotas autenticadas (sidebar + layout)
    layout.tsx                 # valida sessão, renderiza Sidebar
    dashboard/                 # tela inicial pós-login
    clientes/                  # CRUD de clientes
      [id]/                     # detalhe do cliente + projetos
    projetos/                  # lista de projetos (filtro cliente/status)
      [id]/                     # Kanban de tarefas do projeto
    calendario/                # calendário mensal de prazos
    equipe/                    # carga de trabalho por pessoa
  api/auth/[...nextauth]/      # rota de handlers do Auth.js
components/
  ui/                          # componentes base estilo shadcn/ui
  dashboard/                   # gráficos e widgets do dashboard
  sidebar.tsx
lib/
  prisma.ts                    # client singleton do Prisma
  utils.ts                     # helper cn()
  mock-data.ts                 # dados mockados do dashboard (MVP visual)
prisma/
  schema.prisma
  seed.ts
auth.ts / auth.config.ts       # configuração do Auth.js
middleware.ts                  # protege rotas autenticadas
```

## Regras de negócio implementadas/planejadas

- **ADMIN**: vê todos os clientes, projetos e tarefas.
- **MEMBER**: vê apenas projetos/tarefas atribuídas a ele (Kanban completo dos
  projetos em que está incluído). *A query com esse filtro será implementada
  junto das páginas de Projetos/Kanban, na próxima etapa.*
- Tarefa com `dueDate` no passado e `status !== DONE` é destacada em vermelho
  (regra já usada no card "Tarefas atrasadas" do dashboard; será replicada no
  Kanban e no Calendário).
- Dashboard é a tela inicial após login (`app/page.tsx` redireciona para
  `/dashboard`; `middleware.ts` redireciona não-autenticados para `/login`).

## Fora do escopo do MVP (pontos de extensão comentados no código)

- Faturamento / emissão de nota fiscal
- Portal de aprovação para clientes externos
- Integrações externas (Slack, WhatsApp, Google Calendar) — ver comentários
  `// Ponto de extensão futuro` em `auth.ts`, `schema.prisma` e
  `app/(app)/calendario/page.tsx`

## Status atual

✅ Schema do Prisma completo
✅ Estrutura de pastas do App Router
✅ Autenticação com Auth.js (Credentials + papéis)
✅ Dashboard ligado ao banco real (Prisma), com filtro por papel
✅ CRUD de Clientes (`/clientes`, `/clientes/[id]`)
✅ Lista de Projetos com filtro por cliente/status (`/projetos`)
✅ Kanban de tarefas com drag-and-drop, criação rápida e modal de detalhe
   (descrição, responsável, prazo, prioridade, comentários) — `/projetos/[id]`
✅ Calendário mensal com filtro por cliente/responsável — `/calendario`
✅ Carga de trabalho da equipe — `/equipe`
✅ Tema escuro por padrão

Tudo já consulta o Postgres via Prisma — não há mais dados mockados.
