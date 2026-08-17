---
name: project-emeu-arquitetura
description: Arquitetura do "É meu, pode ser seu" — três camadas de autorização sem contrato único, superfície morta de pagamento e ausência total de rate limiting; padrões que se repetem e onde procurar primeiro
metadata:
  type: project
---

Auditoria completa de arquitetura e segurança em 16/08/2026 →
`docs/auditoria/arquitetura-2026-08-16.md` (2 críticos, 7 altos, 8 médios, 4 baixos).

**O desenho é bom e não precisa de rearquitetura.** Regra de negócio no Postgres (piso de proposta,
taxa, expiração de 24h, cashback/comissão), RLS em todas as tabelas, webhook que nunca confia no
payload, `confirmar_pagamento_*` restrito a `service_role`, WhatsApp via `pg_net` direto do trigger
(cobre o caminho do `pg_cron`, que não passa pela aplicação). Registrar isso importa: auditoria só
com defeito distorce a leitura do projeto.

**Os três padrões de falha recorrentes (é aqui que se procura primeiro):**

1. **Autorização espalhada em três camadas sem contrato único** — server action, RLS policy e
   trigger. Onde as três coincidem, é seguro por acidente feliz; onde só uma cobre, é frágil.
   5 arquivos de server action privilegiada não têm nenhuma checagem de identidade (`painel/admin/*`,
   `painel/vendedora/actions.ts`, `components/notificacoes-actions.ts`) — dependem 100% de RLS ou de
   um único trigger. Caso mais afiado: `promoverPapel` só não permite auto-promoção porque
   `fn_bloqueia_campos_privilegiados_usuarios` existe.
2. **Superfície morta que ninguém desligou.** A migração de Pix direto → Checkout Pro deixou
   `iniciar_pagamento_pix*` sem uso e ainda executáveis, e deixou `mp_payment_id` órfão — nada grava
   esse campo hoje, então **o estorno do admin nunca funciona em produção**. Sempre que um fluxo de
   pagamento for trocado neste projeto, checar o que ficou para trás no banco *e* que campo parou de
   ser preenchido.
3. **Nenhum freio.** Zero rate limiting, webhook do Mercado Pago sem validação de `x-signature`,
   bucket sem limite de tamanho/mime, e uma server action que gasta API paga da Anthropic
   (`sugerirPreco`) **sem exigir login**. O risco maior não é hacker: é flood de reserva disparando
   WhatsApp em massa pelo número oficial da Evolution API e queimando o número.

**Confiança em dado vindo do cliente sem revalidar no servidor** aparece em dois lugares além dos
acima: `avaliado_id`/`tipo_alvo` nas avaliações (a policy valida quem avalia, não contra quem — dá
pra forjar nota 1 em qualquer vendedora) e `fotos_originais`/`video_url` aceitos como string livre
(vira SSRF quando `gerarFotoEditorial` faz `fetch` na URL).

**Resolvido no mesmo dia (16/08/2026):**
- **C2 (estorno quebrado)** — corrigido. Webhook (`api/webhooks/mercadopago/route.ts`) agora grava
  `mp_payment_id` real assim que o pagamento é confirmado, tanto pra `transacoes` quanto pra
  `atendimentos_assistidos`. `transacoes` estava com 0 linhas em produção — nenhuma transação real foi
  afetada, o bug foi pego antes de doer.
- **C1 (papel autodeclarado) — rebaixado de Crítico pra Alto, e fechado como "aceito".** O
  `[A CONFIRMAR]` que sustentava a severidade Crítica (será que `admin`/`embaixadora` passam pelo
  whitelist de `handle_new_auth_user()`?) foi resolvido: **não passam** — a whitelist é só
  `('vendedora','loja','compradora','parceira')`. E a decisão de negócio da Juliana foi **manter como
  está**: autodeclarar loja (20% de taxa) e parceira (elegível a comissão) no cadastro é intencional,
  nenhuma das opções A/B/C do relatório foi adotada. Não confundir isso com bug em auditoria futura.

**Why:** produção real com dinheiro real, sem staging, sem testes, sem migrations versionadas e sem
monitoramento de erro — cada um desses achados fica invisível até uma cliente reclamar no WhatsApp.

**How to apply:**
1. Antes de propor qualquer coisa neste projeto, ler o relatório de auditoria — os "[A CONFIRMAR]"
   têm as consultas somente-leitura prontas no Anexo A.
2. Ao revisar código novo: a autorização está na action **e** na RLS? Se só numa, apontar.
3. Ao trocar integração de pagamento: listar o que ficou órfão (funções, colunas, grants).
4. Recomendação de arquitetura só vale com o gargalo nomeado — a vitrine (`select *` sem paginação,
   `<img>` sem otimização) é o primeiro limite real, por volta de 300 peças; o resto do desenho
   escala 12-24 meses sem mexer.

Ver [[project-emeu-riscos-db]] (o padrão `<>` vs `IS DISTINCT FROM` e a pegadinha de grant),
[[project-schema-source-of-truth]] (schema só existe em produção) e [[user-juliana]].
