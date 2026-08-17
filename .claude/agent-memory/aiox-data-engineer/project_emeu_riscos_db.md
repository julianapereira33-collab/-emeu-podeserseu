---
name: project-emeu-riscos-db
description: Riscos de segurança já achados no schema de produção do "É meu, pode ser seu" — padrão de bug recorrente em checagem de dono e pegadinha de GRANT em CREATE OR REPLACE FUNCTION
metadata:
  type: project
---

Dois incidentes de segurança reais (não teóricos) já confirmados e corrigidos direto em produção
(projeto Supabase `izichohddofqylifppwh`), ambos no mesmo padrão: funções `SECURITY DEFINER` que
checam dono comparando com `current_usuario_id()` usando `<>` em vez de `IS DISTINCT FROM`.

**Padrão do bug:** `current_usuario_id()` retorna `NULL` quando não há sessão (`auth.uid()` NULL). Em
PL/pgSQL, `qualquer_coisa <> NULL` avalia pra `NULL`, e `IF NULL THEN` **não executa o bloco** — ou
seja, a checagem de permissão é silenciosamente pulada pra quem chama sem estar logado. Isso só é
explorável se a função também estiver liberada (`EXECUTE`) pro papel `anon`.

- 13/08/2026: `confirmar_pagamento_taxa` / `confirmar_pagamento_atendimento` tinham esse padrão e
  estavam liberadas pra `authenticated` — corrigido movendo a chamada pro cliente de service role no
  Next.js e revogando `EXECUTE` de `authenticated` no banco. Ver [[project-bypass-pagamento]].
- 16/08/2026: mesmo padrão achado em `iniciar_pagamento_pix`, `iniciar_pagamento_pix_atendimento` e
  `registrar_intencao_pagamento_taxa` — só que essas estavam liberadas pro papel **`anon`**
  (visitante sem login nenhum), então qualquer um conseguia sobrescrever `mp_payment_id` (usado pelo
  fluxo de estorno do admin) ou `usar_cashback_solicitado` de transação alheia, sem autenticação.
  Provado com teste sintético em transação com rollback antes de corrigir. Fix: trocar `<>` por
  `IS DISTINCT FROM` nas três, e revogar `EXECUTE` de `anon`.

**Superfícies do MESMO padrão — hipóteses do @data-engineer (16/08/2026,
`docs/auditoria/dados-2026-08-16.md`), cruzadas e resolvidas no mesmo dia com o corpo real das funções
(eu já tinha `pg_get_functiondef` de tudo, coletado antes de acionar o time — o snapshot só resumiu em
prosa, não colou o SQL bruto, por isso o data-engineer não tinha como confirmar sozinho):**

- ✅ **`fn_bloqueia_campos_privilegiados_usuarios()` — FALSO POSITIVO, já está correta.** Corpo real:
  `if new.papel is distinct from old.papel or new.recrutado_por is distinct from old.recrutado_por or
  new.banido_em is distinct from old.banido_em or new.auth_user_id is distinct from old.auth_user_id
  then raise exception`. Já usa `IS DISTINCT FROM` em tudo — os cenários de auto-desbanimento/
  auto-vínculo levantados como hipótese **não se aplicam**. Confirmado, não precisa de ação.
- ⚠️ **`confirmar_pagamento_taxa` / `confirmar_pagamento_atendimento` — hipótese CONFIRMADA, mas não
  explorável hoje.** O corpo real tem mesmo `auth.role() <> 'service_role' and
  v_x.usuario_id <> current_usuario_id()`. Só que `EXECUTE` dessas duas já está revogado de `anon` E
  `authenticated` (confirmado com `has_function_privilege`, 15/08) — só `service_role` chama, e
  `auth.role() <> 'service_role'` sempre avalia pra `false` (não NULL) quando quem chama é `service_role`
  ou `anon`/`authenticated` via API (o JWT sempre carrega `role` explícito). Ou seja: hoje protegido só
  pelo GRANT, que é exatamente a camada que a pegadinha do `CREATE OR REPLACE` abaixo já provou ser
  volátil. Vale o hardening (`IS DISTINCT FROM` nas duas comparações) na próxima rodada de correção,
  mesmo sem exploração ativa — é troca sem risco (não muda comportamento pra `service_role`, que já
  sai pelo curto-circuito do `AND`).
- ✅ **`fn_enviar_whatsapp_evolution` — FALSO POSITIVO, já confirmado fora de alcance.** `EXECUTE` já
  tinha sido checado antes de acionar o time: `anon_pode: false, authenticated_pode: false`. Não é
  chamável via RPC por ninguém fora de `service_role`/dono. `has_function_privilege` já resolve isso
  corretamente (contabiliza `PUBLIC` por baixo dos panos) — não precisa checar `proacl` à parte.
- ➖ **Anti-fraude de cashback por clique — não é o mesmo bug.** `trg_cliques_before_insert` (a função
  que faltou no snapshot, escrita e aplicada nesta mesma sessão) já guarda com
  `new.ip_hash is not null and exists (...)` antes de comparar — quando `ip_hash` vem NULL, a camada de
  IP é pulada de propósito (fallback), não é um bypass por comparação NULL. Se a extração de IP em
  `route.ts` (`x-forwarded-for`) falhar sistematicamente, a única rede de proteção que resta é o cap
  diário de 3 créditos/dia — vale monitorar em produção se `ip_hash` está vindo populado na prática,
  mas não é o padrão de bug documentado aqui.

**Pegadinha de GRANT descoberta ao corrigir o segundo incidente:** `CREATE OR REPLACE FUNCTION` neste
projeto **reseta as grants pra `PUBLIC`** (comportamento padrão do Postgres pra funções — diferente de
tabelas, que não fazem isso). Depois de recriar `iniciar_pagamento_pix`, um `revoke execute ... from
anon` sozinho não bastou — a chamada anônima continuava passando porque vinha via `PUBLIC`. Só parou
de funcionar depois de `revoke execute ... from public` seguido de `grant execute ... to
authenticated` explícito.

**Why:** produção real, dinheiro real (Mercado Pago), sem staging — qualquer função `SECURITY DEFINER`
nova ou recriada é superfície de ataque até provar o contrário.

**How to apply:**
1. Toda função `SECURITY DEFINER` que compara `usuario_id`/`dono_id`/`compradora_id` contra
   `current_usuario_id()` deve usar `IS DISTINCT FROM`, nunca `<>` ou `=`/`!=` puro — checar isso é o
   primeiro passo de qualquer revisão de segurança neste projeto.
2. Antes de confiar em `has_function_privilege`, checar também se a função foi recriada recentemente
   (`CREATE OR REPLACE`) — se sim, reconfirmar que `PUBLIC` não reabriu acesso.
3. Depois de qualquer `CREATE OR REPLACE FUNCTION` numa função sensível, sempre fechar com
   `revoke execute ... from public` + `grant execute ... to <papel específico>` explícito, mesmo que
   pareça redundante.
4. Checar `pg_proc.proacl IS NULL` na varredura de permissões — ACL nula **não** é "ninguém pode",
   é "EXECUTE liberado pra PUBLIC" (padrão do Postgres). `has_function_privilege` sozinho esconde a
   origem do acesso. Alvo de alto valor se exposto: `fn_enviar_whatsapp_evolution` (manda mensagem
   arbitrária pelo WhatsApp da marca, lendo credencial do Vault, e engole erros).
5. Testar bypass de verdade (não só ler o código): `begin; set local role anon; set local
   "request.jwt.claims" to '{"role":"anon"}'; ...chamada...; rollback;` — simula uma chamada sem sessão
   de forma segura, sem persistir nada.

Ver também [[project-schema-source-of-truth]].
