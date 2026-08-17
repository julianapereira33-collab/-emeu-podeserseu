---
name: project-bypass-pagamento
description: Correção do bypass de pagamento (RPCs de confirmação) — concluída dos dois lados (app em 13/08, revogação no Postgres confirmada em 15/08/2026)
metadata:
  type: project
---

Correção do bypass de pagamento **concluída** dos dois lados. Lado da aplicação (2026-08-13): as
chamadas a `confirmar_pagamento_taxa` e `confirmar_pagamento_atendimento` passaram a usar o cliente de
service role (`src/lib/supabase/service-role.ts`), com checagem explícita de dono feita antes, com o
cliente de sessão. Lado do banco (verificado em 2026-08-15 via `has_function_privilege`): `EXECUTE`
dessas duas funções já está revogado do papel `authenticated`. `registrar_intencao_pagamento_taxa`
continua liberada para `authenticated`, como deveria — essa é chamada com o cliente de sessão.

**Segunda falha relacionada, achada e corrigida em 2026-08-16:** `iniciar_pagamento_pix`,
`iniciar_pagamento_pix_atendimento` e `registrar_intencao_pagamento_taxa` tinham a checagem de dono
escrita como `if x <> current_usuario_id() then raise exception` — e essas três estavam liberadas pro
papel `anon` (visitante sem login). Sem sessão, `current_usuario_id()` retorna NULL, e `NULL <> NULL`
também é NULL, que em PL/pgSQL faz o `IF` não disparar — ou seja, **qualquer visitante anônimo
conseguia sobrescrever `mp_payment_id`/`usar_cashback_solicitado` de transações de outras pessoas**,
provado com um teste sintético em transação com rollback (nada persistiu). Isso importa porque
`estorno-actions.ts` usa `mp_payment_id` pra decidir qual pagamento reembolsar no Mercado Pago — dava
pra desviar um estorno futuro. Corrigido trocando a comparação por `IS DISTINCT FROM` (trata NULL
certo) nas três funções, e revogando `EXECUTE` de `anon`.

**Pegadinha descoberta no processo:** `CREATE OR REPLACE FUNCTION` neste projeto Supabase **reseta as
grants pra PUBLIC** (comportamento padrão do Postgres pra funções, diferente de tabelas). Revogar só
de `anon` ou `authenticated` não basta se a função foi recriada — o `PUBLIC` ainda libera geral. Testei
isso na prática: revoguei de `anon` e a chamada anônima ainda passava, porque vinha via `PUBLIC`. A
correção certa é sempre `revoke execute ... from public` e depois `grant execute ... to <papel
específico>` explicitamente, toda vez que uma função sensível for recriada.

**Why:** a função Postgres só exigia `status_pagamento = 'pendente'` e não verificava o Mercado Pago;
com `EXECUTE` liberado para `authenticated`, uma compradora podia chamar a RPC direto via REST e
liberar contato, cashback e comissões sem pagar. Auditoria de segurança confirmou em produção.

**How to apply:** antes de mexer em qualquer fluxo de pagamento, confirmar se a revogação no banco já
aconteceu — se sim, qualquer chamada nova a essas RPCs com cliente de sessão vai falhar em produção e
precisa usar service role. Este projeto roda em produção real (Vercel + Supabase + Mercado Pago com
dinheiro de verdade), então erros no fluxo de pagamento têm custo imediato.
