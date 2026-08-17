# Snapshot do schema de produção — 2026-08-16

Projeto Supabase: `izichohddofqylifppwh` (`emeu-podeserseu`, sa-east-1). Extraído via MCP do Supabase
porque **não há migrations versionadas no repo** — este arquivo é o substituto (estático, tira uma
foto do momento) até isso ser resolvido. Se você tem acesso ao Supabase MCP, prefira consultar ao vivo
para qualquer coisa crítica; este arquivo é ponto de partida pra quem não tem.

## Tabelas com RLS habilitado

Todas as 13 tabelas do schema `public` têm `relrowsecurity = true`. Nenhuma usa `FORCE ROW LEVEL
SECURITY` (`relforcerowsecurity = false` em todas) — isso significa que **o dono da tabela** (o role
usado pelas funções `SECURITY DEFINER`, e por extensão a service role) sempre ignora RLS, que é o
comportamento esperado aqui.

Tabelas: `atendimentos_assistidos`, `avaliacoes`, `cashback`, `cliques_compartilhamento`, `comissoes`,
`compartilhamentos`, `denuncias_banimento`, `favoritos`, `notificacoes`, `pecas`, `reservas`,
`transacoes`, `usuarios`.

## Colunas por tabela

```
atendimentos_assistidos: id uuid, usuario_id uuid, peca_id uuid?, tipo text, status text default 'solicitado',
  valor numeric?, status_pagamento text default 'pendente', observacoes text?, criado_em timestamptz,
  mp_payment_id text?

avaliacoes: id uuid, transacao_id uuid, tipo_alvo text, avaliador_id uuid, avaliado_id uuid?, nota int,
  comentario text?, criado_em timestamptz

cashback: id uuid, usuario_id uuid, origem text, valor numeric, criado_em timestamptz, valido_ate timestamptz,
  usado bool default false

cliques_compartilhamento: id uuid, compartilhamento_id uuid, criado_em timestamptz, ip_hash text?
  (ip_hash adicionado em 16/08/2026, ver correção de anti-fraude de cashback)

comissoes: id uuid, parceira_id uuid, transacao_id uuid, tipo text, percentual numeric, valor numeric,
  paga bool default false, criado_em timestamptz

compartilhamentos: id uuid, usuario_id uuid, peca_id uuid?, criado_em timestamptz
  (índices únicos compartilhamentos_unico_por_peca e compartilhamentos_unico_geral adicionados em 16/08/2026)

denuncias_banimento: id uuid, vendedora_id uuid, motivo text, evidencia text?, avisos int default 1,
  banido_em timestamptz?, criado_em timestamptz

favoritos: id uuid, usuario_id uuid, peca_id uuid, criado_em timestamptz

notificacoes: id uuid, usuario_id uuid, tipo text, titulo text, mensagem text, link text?, reserva_id uuid?,
  lida bool default false, criado_em timestamptz

pecas: id uuid, dono_id uuid, fotos_originais text[] default '{}', fotos_tratadas text[] default '{}',
  descricao text, tamanho text, cor text, tecido text?, estado text, tipo text, preco_anunciado numeric,
  exclusividade bool default false, status text default 'pendente', motivo_reprovacao text?,
  criado_em timestamptz, venda_assistida bool default false, video_url text?, foto_editorial_url text?,
  foto_editorial_aprovada bool default false, medida_busto_cm numeric?, medida_cintura_cm numeric?,
  medida_quadril_cm numeric?, medida_comprimento_cm numeric?

reservas: id uuid, peca_id uuid, compradora_id uuid, valor_proposta numeric?, valor_aceito numeric?,
  status text default 'aguardando_confirmacao', prazo_confirmacao timestamptz default now()+24h,
  criado_em timestamptz, termos_aceitos bool default false, compartilhamento_id uuid?,
  locacao_inicio date?, locacao_fim date?, termos_versao text?

transacoes: id uuid, reserva_id uuid, valor_base numeric, percentual_taxa numeric, valor_taxa numeric,
  status_pagamento text default 'pendente', contato_liberado_em timestamptz?, criado_em timestamptz,
  cashback_utilizado numeric default 0, mp_payment_id text?, usar_cashback_solicitado bool default false,
  estorno_motivo text?, estornado_por uuid?, estornado_em timestamptz?

usuarios: id uuid, auth_user_id uuid?, nome text, whatsapp text, papel text[] default '{}', cidade text?,
  recrutado_por uuid?, pix text?, banido_em timestamptz?, criado_em timestamptz
```

## RLS policies (todas)

```
atendimentos_assistidos
  INSERT atendimentos_insert_own           with_check: usuario_id = current_usuario_id()
  SELECT atendimentos_select_own_or_admin  qual: usuario_id = current_usuario_id() OR is_admin()
  UPDATE atendimentos_update_admin         qual: is_admin()

avaliacoes
  INSERT avaliacoes_insert_transacao_paga  with_check: avaliador_id = current_usuario_id() AND existe
    transacao paga (status_pagamento='pago') ligando avaliador (compradora ou dono da peça) à transação
  SELECT avaliacoes_select_public          qual: true (avaliações são públicas)

cashback
  SELECT cashback_select_dono_or_admin     qual: usuario_id = current_usuario_id() OR is_admin()
  (sem INSERT/UPDATE/DELETE via RLS — só as funções SECURITY DEFINER escrevem aqui)

cliques_compartilhamento
  INSERT cliques_insert_publico            with_check: true (qualquer um, inclusive anon — é a rota /r/[id])
  SELECT cliques_select_dono_ou_admin      qual: is_admin() OR dono do compartilhamento

comissoes
  SELECT comissoes_select_dona_or_admin    qual: parceira_id = current_usuario_id() OR is_admin()
  UPDATE comissoes_update_admin            qual: is_admin()

compartilhamentos
  INSERT compartilhamentos_insert_own      with_check: usuario_id = current_usuario_id()
  SELECT compartilhamentos_select_own_or_admin qual: usuario_id = current_usuario_id() OR is_admin()

denuncias_banimento
  INSERT/SELECT/UPDATE — todas is_admin() apenas

favoritos
  INSERT/SELECT/DELETE — todas usuario_id = current_usuario_id()

notificacoes
  SELECT "usuaria ve as proprias notificacoes"        qual: usuario_id = current_usuario_id()
  UPDATE "usuaria marca as proprias notificacoes..."  qual+check: usuario_id = current_usuario_id()

pecas
  INSERT pecas_insert_own                  with_check: dono_id = current_usuario_id() AND dono não banido
  SELECT pecas_select_public_aprovadas     qual: status = 'aprovado' (vitrine pública)
  SELECT pecas_select_own_or_admin         qual: dono_id = current_usuario_id() OR is_admin()
  UPDATE pecas_update_own_pendente_or_admin qual: (dono_id = current_usuario_id() AND status IN
    ('pendente','reprovado')) OR is_admin()

reservas
  INSERT reservas_insert_compradora        with_check: compradora_id = current_usuario_id()
  SELECT reservas_select_participantes_or_admin  qual: compradora, dona da peça, ou admin
  UPDATE reservas_update_dono_peca_or_admin      qual: dona da peça ou admin

transacoes
  SELECT transacoes_select_participantes_or_admin  qual: compradora, dona da peça, ou admin
  (sem INSERT/UPDATE via RLS — só trigger/funções SECURITY DEFINER escrevem aqui)

usuarios
  INSERT usuarios_insert_self              with_check: auth_user_id = auth.uid()
  SELECT usuarios_select_apos_contato_liberado  qual: existe transação paga ligando as duas partes
    (é o que libera ver o whatsapp da outra pessoa só depois do pagamento)
  SELECT usuarios_select_own_or_admin      qual: auth_user_id = auth.uid() OR is_admin()
  UPDATE usuarios_update_own_or_admin      qual: auth_user_id = auth.uid() OR is_admin()
```

## Funções (todas do schema public, com corpo completo)

Todas `SECURITY DEFINER` exceto `piso_percentual` (que é pura/imutável, sem necessidade). `search_path`
fixado em `'public'` em todas — bom, evita hijack de search_path.

- `current_usuario_id()` — `select id from usuarios where auth_user_id = auth.uid()`. Retorna NULL sem
  sessão. **Toda checagem de dono no projeto depende desta função e do padrão `IS DISTINCT FROM`.**
- `is_admin()` — `coalesce((select 'admin' = any(papel) from usuarios where auth_user_id = auth.uid()),
  false)`. Seguro por padrão (coalesce cobre o NULL).
- `piso_percentual(criado_em)` — calcula o piso de proposta gradativo (90/80/70/60/50% conforme idade
  da peça). Pura, sem risco.
- `handle_new_auth_user()` — trigger em `auth.users`, cria linha em `usuarios` no signup. Papel default
  'compradora' se não vier um válido no metadata.
- `fn_bloqueia_campos_privilegiados_usuarios()` — trigger BEFORE UPDATE em `usuarios`, impede que
  quem não é admin altere `papel`, `recrutado_por`, `banido_em`, `auth_user_id` mesmo via UPDATE
  liberado por RLS própria. Boa camada de defesa em profundidade.
- `trg_reservas_before_insert()` — valida: peça existe, compradora existe, compradora≠vendedora por
  whatsapp (trava autofraude), proposta respeita o piso, marca peça como 'reservado' atomicamente
  (`update ... where status='aprovado'`, erro se 0 linhas — evita corrida de duas reservas na mesma peça).
- `trg_reservas_after_update()` — quando status vira 'confirmada', cria a `transacao` (taxa 60% venda
  assistida / 30% embaixadora-ou-padrão / 20% loja — **nota: checa 'embaixadora' antes de 'loja' no
  CASE, então uma usuária com os dois papéis paga 30%, não 20%** — confirmar se é intencional, README
  diz "não tem desconto por ser embaixadora" o que sugere que É intencional, mas vale checar com a Juliana).
  Quando status vira 'recusada', libera a peça de volta pra 'aprovado'.
- `expirar_reservas_vencidas()` — chamada pelo pg_cron a cada 15 min, marca 'recusada' quem passou do
  prazo. Sem parâmetro de usuário, sem risco de RLS bypass malicioso (só o cron chama).
- `registrar_denuncia(vendedora_id, motivo, evidencia)` — só admin (`is_admin()` checado antes de
  qualquer coisa, sem depender do padrão NULL-comparável). Bane na 2ª ocorrência.
- `fn_enviar_whatsapp_evolution(whatsapp, mensagem)` — lê credenciais do Supabase Vault
  (`evolution_api_url/key/instance`), chama `net.http_post`. Falha é engolida (`exception when others
  then null`) de propósito — canal auxiliar, não pode derrubar o fluxo principal.
- `fn_notificar_reserva_criada()` / `fn_notificar_reserva_status_alterado()` — triggers que criam
  notificação in-app e chamam o WhatsApp acima nos 3 pontos do fluxo (nova reserva, confirmada, recusada).
- `periodos_ocupados(peca_id)` — retorna períodos ocupados de uma peça de aluguel (reservas ativas).
  Leitura pública, sem dado sensível.
- **`iniciar_pagamento_pix`, `iniciar_pagamento_pix_atendimento`, `registrar_intencao_pagamento_taxa`**
  — corrigidas em 16/08/2026 (ver `.claude/agent-memory/aiox-data-engineer/project_emeu_riscos_db.md`).
  Agora usam `IS DISTINCT FROM` e `EXECUTE` restrito a `authenticated`.
- **`confirmar_pagamento_taxa`, `confirmar_pagamento_atendimento`** — só `service_role` chama (EXECUTE
  revogado de `anon` e `authenticated`); pulam a checagem de dono quando `auth.role() = 'service_role'`
  de propósito (é o webhook do Mercado Pago chamando via service role, já validado contra a API do MP
  antes). `confirmar_pagamento_taxa` também: aplica cashback disponível se solicitado, credita 10% de
  cashback pra vendedora, gera comissão direta (10%) se veio de link de parceira/embaixadora, gera
  override (5%) se a vendedora foi recrutada por uma embaixadora — tudo condicionado a
  `status_pagamento` virar 'pago' primeiro (nunca de cadastro/recrutamento isolado).

## EXECUTE grants (estado em 16/08/2026, depois das correções)

```
current_usuario_id, is_admin, piso_percentual, periodos_ocupados  -> anon + authenticated (leitura/cálculo, sem risco)
handle_new_auth_user, expirar_reservas_vencidas, fn_*, trg_*      -> ninguém direto (triggers ou só cron)
registrar_denuncia                                                -> authenticated only (checa is_admin() internamente)
iniciar_pagamento_pix, iniciar_pagamento_pix_atendimento,
registrar_intencao_pagamento_taxa                                 -> authenticated only (corrigido 16/08)
confirmar_pagamento_taxa, confirmar_pagamento_atendimento          -> ninguém (só service_role, sem grant RLS-visível)
```

⚠️ **Pegadinha confirmada na prática:** `CREATE OR REPLACE FUNCTION` reseta grants pra `PUBLIC` neste
projeto. Qualquer função sensível recriada precisa de `revoke execute ... from public` explícito depois,
ou volta a ficar acessível geral mesmo com um `revoke ... from anon` isolado.

## pg_cron

```
expirar-reservas-vencidas | */15 * * * * | select public.expirar_reservas_vencidas() | active
```

## Extensões relevantes em uso

- `pg_cron` (timer de 24h de confirmação de disponibilidade)
- `pg_net` (dispara WhatsApp via Evolution API direto do Postgres, sem depender do Next.js)
- Supabase Vault (`vault.decrypted_secrets`) guarda credenciais da Evolution API

## Storage

Bucket único: `pecas-fotos` — **público**, sem `file_size_limit`, sem `allowed_mime_types` (aceita
qualquer tipo/tamanho de arquivo).

```
INSERT pecas_fotos_authenticated_upload  with_check: bucket_id='pecas-fotos' AND auth.role()='authenticated'
DELETE pecas_fotos_owner_delete          qual: bucket_id='pecas-fotos' AND owner=auth.uid()
UPDATE pecas_fotos_owner_update          qual: bucket_id='pecas-fotos' AND owner=auth.uid()
SELECT pecas_fotos_public_read           qual: bucket_id='pecas-fotos' (leitura pública, esperado — são fotos de vitrine)
```

⚠️ **Não auditado a fundo, sinalizando pro time:** a policy de INSERT libera upload pra **qualquer**
usuária autenticada (não só a dona da peça, não restrita a nenhum path/prefixo), sem limite de tamanho
nem de mime type no bucket. Não é o mesmo padrão de bug já corrigido (não depende de NULL/anon — exige
estar logada), mas é superfície de abuso de storage (upload de arquivo grande ou de tipo arbitrário,
servido depois por URL pública do domínio do Supabase). Vale o architect/data-engineer decidirem se
merece correção agora ou fica pra depois.

## O que este snapshot NÃO cobre

- Índices (além dos únicos citados) e planos de query — não auditado ainda.
- Constraints CHECK além do que aparece nos triggers.
- Qualquer coisa criada em produção depois de 2026-08-16.
