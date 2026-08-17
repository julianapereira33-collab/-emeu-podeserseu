---
name: project-schema-source-of-truth
description: Não existem migrations versionadas no repo — o schema real só vive no Supabase de produção (izichohddofqylifppwh); src/types/database.ts é o único proxy local e está parcialmente dessincronizado
metadata:
  type: project
---

O projeto "É meu, pode ser seu" não tem pasta `supabase/` nem migrations no git. Todas as migrations
(`fase1_*`, `fase7_notificacoes_inapp`, `fase7b_pg_net_extension`, `fase7c_whatsapp_via_pg_net`, etc.)
foram aplicadas direto no projeto de produção via MCP do Supabase. A única fonte de verdade do schema
é o banco em produção; `src/types/database.ts` é um proxy mantido à mão.

Dessincronizações já observadas em `src/types/database.ts` (2026-08-12):
- `confirmar_pagamento_taxa` e `iniciar_pagamento_pix` declaram retorno sem
  `estornado_em` / `estornado_por` / `estorno_motivo`, colunas que já existem em `transacoes`
  e aparecem no retorno de `registrar_intencao_pagamento_taxa`.
- Nenhuma função `fn_*` (triggers/WhatsApp) está declarada ali.

**Why:** o time optou por velocidade (MCP direto em prod) em vez de migrations versionadas; isso
significa que qualquer análise local é cega para RLS policies, bodies de funções SECURITY DEFINER,
CHECK constraints e defaults.

O Supabase CLI **não está instalado** nesta máquina e não há MCP do Supabase disponível pra todo
agente — então "vou só consultar o banco" nem sempre é uma opção. O snapshot
`docs/auditoria/snapshot-schema-producao-2026-08-16.md` cobre tabelas/colunas/RLS/grants/storage, mas
**não traz o corpo das funções** (só um resumo em prosa) e **omite pelo menos um trigger** (o da
anti-fraude de cashback por clique). Não tratar o snapshot como completo.

Caminho recomendado pra sair disso sem abandonar o fluxo MCP (auditoria de 16/08, seção 4):
baseline via `npx supabase db dump --db-url ... --schema public` (ou, se exigir Docker, gerado pelas
queries de catálogo) → toda DDL aplicada por MCP vira arquivo em `supabase/migrations/` na mesma
sessão, com bloco `-- ROLLBACK` → `npx supabase gen types typescript --project-id izichohddofqylifppwh`
como script `db:types` (não precisa de Docker) + `git diff --exit-code src/types/database.ts` como
detector de drift → `supabase migration repair --status applied` se/quando o CLI for adotado, pra ele
nunca re-executar o que o MCP já aplicou.

**How to apply:** antes de afirmar qualquer coisa sobre policies, constraints ou corpo de função,
consultar o banco (`pg_policies`, `pg_proc.prosrc`, `pg_constraint`) — nunca inferir a partir do
`database.ts`. E, ao propor correção, entregar SQL idempotente pronto para aplicar em prod, com
rollback, já que não há ambiente de staging. Ver também [[project-emeu-riscos-db]].
