# Auditoria de arquitetura e segurança — "É meu, pode ser seu"

**Data:** 16/08/2026
**Auditor:** Aria (@architect)
**Escopo:** código da aplicação (`src/`, 6.768 linhas), snapshot do schema de produção
(`docs/auditoria/snapshot-schema-producao-2026-08-16.md`), blueprint de produto e README.
**Ambiente auditado:** produção real com dinheiro real (`emeu-podeserseu.vercel.app`, Supabase
`izichohddofqylifppwh`, Mercado Pago em modo produção — `APP_USR-...` confirmado no `.env.local`).

---

## 0. Como ler este documento

Cada achado tem:

- **Severidade** — Crítico (agir hoje), Alto (esta semana), Médio (este mês), Baixo (backlog).
- **Evidência** — arquivo e linha, ou trecho do snapshot. Nada aqui é suposição sem fonte; onde eu
  não pude confirmar, está escrito **[A CONFIRMAR]** com a consulta exata para tirar a dúvida.
- **Decisão técnica** (eu/o time resolve, sem você precisar escolher nada) vs **Decisão sua**
  (custo, prazo, risco de negócio — com alternativas e trade-off).

**Limite honesto desta auditoria:** nesta sessão eu **não tive acesso ao MCP do Supabase nem a
`psql`**, então não li o corpo real das funções `SECURITY DEFINER` — o snapshot descreve o que cada
função faz, mas não traz o SQL delas (apesar do título dizer "corpo completo", o arquivo tem
resumos). Para o item 1 do escopo (varredura do padrão `<>` vs `IS DISTINCT FROM`) eu entrego:
(a) a lista priorizada de suspeitas deduzida do snapshot + memória do data-engineer, e
(b) **uma consulta SQL somente-leitura que acha o padrão automaticamente em todas as funções**
(seção 11, Anexo A). Rodar essa consulta leva 10 segundos e substitui qualquer palpite meu.

**Nada foi alterado.** Nenhum comando git, nenhuma escrita no banco, nenhum arquivo de aplicação
tocado.

---

## 1. Sumário executivo

O projeto está **muito melhor arquitetado do que o normal para esse estágio**: regra de negócio no
Postgres (não na aplicação), RLS em todas as 13 tabelas, `search_path` fixo em todas as funções,
webhook que nunca confia no payload e sempre reconsulta o Mercado Pago, confirmação de pagamento
restrita a `service_role`, trava de autofraude por WhatsApp, notificação que sobrevive ao caminho
automático do `pg_cron`. Isso não é fachada — é desenho de quem pensou em ataque.

Os problemas que achei se concentram em **três padrões**, não em erros isolados:

1. **A autorização está espalhada em três camadas sem contrato único** (server action, RLS, trigger).
   Onde as três coincidem, está seguro por acidente feliz. Onde só uma cobre, é frágil. Os dois
   incidentes já corrigidos hoje são exatamente isso.
2. **Superfície morta que ninguém desligou.** Funções de pagamento que o app não chama mais
   continuam executáveis por qualquer usuária logada; um helper de Pix virou código morto; a
   migração para Checkout Pro deixou um campo (`mp_payment_id`) órfão que quebrou o estorno.
3. **Ausência total de freio** — nenhum rate limit, nenhuma validação de assinatura de webhook,
   nenhum limite de tamanho/tipo em upload, nenhuma checagem de sessão em uma action que gasta API
   paga. Nada disso é "erro de código": é uma camada inteira que nunca foi construída.

E, atravessando tudo: **o schema só existe em produção**. Hoje isso é um risco de continuidade
(seção 8), não uma falha de segurança — mas é o que transforma qualquer um dos achados abaixo em
"não sei desde quando isso está assim e não consigo reverter com um comando".

### Placar

| Severidade | Qtde | Prazo sugerido |
|---|---|---|
| Crítico | 2 | Hoje |
| Alto | 7 | Esta semana |
| Médio | 8 | Este mês |
| Baixo | 4 | Backlog |

---

## 2. CRÍTICO

### C1 — Qualquer pessoa escolhe o próprio papel no cadastro (loja = taxa 20% em vez de 30%)

**Evidência:** `src/app/cadastro/actions.ts:24`

```ts
const papel = ["loja", "compradora", "parceira"].includes(tipo) ? tipo : "vendedora";
```

O `tipo` vem do `<select>` do formulário, e o papel escolhido vai direto no metadata do
`auth.signUp()` → o trigger `handle_new_auth_user()` grava em `usuarios.papel`. Não existe nenhuma
verificação de que a pessoa realmente é uma loja: CNPJ, comprovante, aprovação da curadoria — nada.

**Impacto direto de receita:** o `trg_reservas_after_update` calcula a taxa pelo papel (20% loja,
30% pessoa física). Qualquer vendedora que se cadastre como "loja" paga 20% para sempre. Numa peça
de R$ 800, são R$ 80 a menos por transação. Não precisa de hack nenhum — é só marcar a opção.
O mesmo vale para `parceira`, que habilita a pessoa a receber comissão de 10% sobre a taxa de
qualquer venda vinda do link dela. O README diz "hoje só o admin promove uma conta a
parceira/embaixadora" — **isso não é verdade no cadastro**; só o *embaixadora* é que exige admin.

**[A CONFIRMAR] — e esta parte é a que faz o achado ser Crítico e não Alto:** não li o corpo de
`handle_new_auth_user()`. O snapshot diz "papel default 'compradora' se não vier um válido no
metadata". Se a lista de "válidos" dentro do trigger incluir `admin` ou `embaixadora`, então
**qualquer pessoa se cadastra como admin** chamando `supabase.auth.signUp()` direto pela anon key
(que é pública, está no bundle) com `options.data.papel = 'admin'` — sem passar pelo formulário.
Admin = aprovar peça, banir vendedora, estornar, marcar comissão como paga, ver WhatsApp de todo
mundo. Verificar isto é a primeira coisa a fazer hoje. Consulta no Anexo A (query 3).

**Decisão técnica (eu resolvo):**
1. Verificar hoje o whitelist do trigger; se `admin`/`embaixadora` passarem, corrigir na hora
   (whitelist explícito `('vendedora','loja','compradora')` no trigger, ignorando o resto).
2. Blindar em profundidade: o trigger é a última linha, mas o `cadastro/actions.ts` deve mandar
   sempre `compradora`/`vendedora` e nada mais.

**Decisão sua (negócio):** o que acontece com quem quer ser loja ou parceira? Três caminhos:

| Opção | Como funciona | Custo | Trade-off |
|---|---|---|---|
| **A. Fila de aprovação** | Pessoa se cadastra como vendedora; pede "quero ser loja" no painel; você aprova em `/painel/admin` | ~4h de dev | Mais atrito, mas o papel vira uma decisão sua. É o que já acontece com embaixadora — só padroniza. |
| **B. Auto-declaração + auditoria** | Continua como está, mas aparece na fila do admin uma lista "contas que se declararam loja" para você conferir | ~2h de dev | Zero atrito para a loja de verdade; você descobre o abuso depois (e a taxa já foi cobrada a menos). |
| **C. Amarrar ao CNPJ** | Campo CNPJ obrigatório para "loja", validado (dígito verificador + consulta pública) | ~1 dia | Barreira real, mas exclui loja informal — e boa parte do seu público de grupo de WhatsApp é informal. |

Minha leitura: **B agora (hoje), A na próxima janela**. B fecha a hemorragia de visibilidade em
duas horas; A resolve de fato. C só faz sentido se você formalizar o programa de lojas.

Quantas contas com papel `loja` ou `parceira` já existem hoje? Vale rodar a query 4 do Anexo A antes
de decidir — se for 3 contas que você conhece pelo nome, é um problema de futuro; se forem 40, é um
problema de agora.

---

**Resolução (16/08/2026, mesmo dia):**
- **[A CONFIRMAR] resolvido — rebaixa de Crítico pra Alto.** Corpo real de `handle_new_auth_user()`
  (eu já tinha `pg_get_functiondef` de antes de acionar o time): `if v_papel is null or v_papel not in
  ('vendedora', 'loja', 'compradora', 'parceira') then v_papel := 'compradora'`. A whitelist **não**
  inclui `admin` nem `embaixadora` — autocadastro como admin **não é possível**. O risco real fica
  restrito a taxa de loja (20% vs 30%) e elegibilidade de comissão de parceira, não a escalada de
  privilégio administrativo.
- **Decisão de negócio da Juliana: manter como está.** Autodeclaração de "loja" e "parceira" no
  cadastro é intencional — nenhuma das opções A/B/C acima foi adotada, nenhum código foi alterado.
  Achado fechado como "aceito", não como "corrigido". Se o volume de abuso virar problema real no
  futuro, revisitar a Opção B (fila de auditoria) primeiro.

---

### C2 — Funções de pagamento mortas continuam executáveis, e o padrão de bug provavelmente ainda está no corpo de duas funções vivas

Este é o **item 1 do seu escopo**. Resposta direta: sim, tem mais candidato, e o mais preocupante é
justamente o que "já foi corrigido" — porque a correção de 13/08 foi feita **na grant, não no
código**.

#### C2.a — `iniciar_pagamento_pix` e `iniciar_pagamento_pix_atendimento` são código morto ainda armado

**Evidência:** `grep` no repositório inteiro — essas duas RPCs **não são chamadas por nenhum lugar
da aplicação**. Só aparecem em `src/types/database.ts` (declaração de tipo). O app migrou para
Checkout Pro (`criarPreferenciaCheckout` + `registrar_intencao_pagamento_taxa`) e ninguém desligou o
caminho antigo. `src/lib/mercadopago/client.ts:42` (`criarPagamentoPix`) também é código morto pela
mesma razão.

Ou seja: as duas funções que você corrigiu hoje às pressas, que escreviam `mp_payment_id` e
`usar_cashback_solicitado` em transação alheia, **continuam com `EXECUTE` para `authenticated` e não
servem para absolutamente nada**. É superfície de ataque com valor operacional zero. E, pela
pegadinha já documentada, um `CREATE OR REPLACE` futuro nelas devolve o acesso ao `PUBLIC`.

**Recomendação (decisão técnica, sem trade-off):** `DROP FUNCTION` nas duas. Não revogar, não
"deixar por garantia" — remover. Se um dia o Pix direto voltar, ele volta versionado numa migration.
Junto: apagar `criarPagamentoPix`/`buscarPagamentoPix` se o webhook não precisar mais (o webhook usa
`buscarPagamentoPix`, então esse fica).

Antes de dropar, confirmar que nada externo chama (query 5 do Anexo A lista chamadas recentes por
`pg_stat_statements`, se a extensão estiver ativa).

#### C2.b — `confirmar_pagamento_taxa` / `confirmar_pagamento_atendimento`: o `<>` provavelmente continua lá

**Evidência:** a memória do data-engineer (`project_emeu_riscos_db.md`) registra que, em 13/08,
essas duas tinham o padrão `<> current_usuario_id()` e a correção foi **"movendo a chamada pro
cliente de service role no Next.js e revogando `EXECUTE` de `authenticated`"** — nada sobre trocar a
comparação. O snapshot confirma que elas ainda têm um caminho de checagem de dono (diz que "pulam a
checagem de dono quando `auth.role() = 'service_role'`", o que só faz sentido se a checagem existir
para os outros casos).

Hoje não é explorável: `EXECUTE` está revogado de `anon` e `authenticated`. Mas é **exatamente o
cenário que você descreveu no escopo** — código incorreto atrás de uma grant, e as grants deste
projeto já se resetaram sozinhas para `PUBLIC` uma vez, comprovadamente. A distância entre
"seguro" e "qualquer visitante libera contato sem pagar" é um `CREATE OR REPLACE FUNCTION` de rotina.

**Recomendação (decisão técnica):** trocar `<>` por `IS DISTINCT FROM` nas duas, mesmo sem
exposição. Custo: 10 minutos. Sem isso, a segurança dessas funções depende de ninguém errar num
deploy futuro — e este projeto não tem migrations para revisar em PR.

#### C2.c — Mapa completo das funções, com veredito

Baseado no snapshot (não no corpo real — por isso as colunas "A CONFIRMAR"):

| Função | Faz checagem de dono? | Veredito | Por quê |
|---|---|---|---|
| `iniciar_pagamento_pix` | Sim | **DROPAR** | Morta. Corrigida hoje, mas sem uso. |
| `iniciar_pagamento_pix_atendimento` | Sim | **DROPAR** | Morta. Idem. |
| `registrar_intencao_pagamento_taxa` | Sim | OK (corrigida hoje, viva) | Única das três ainda em uso (`compradora/actions.ts:80`). |
| `confirmar_pagamento_taxa` | Sim (pula p/ service_role) | **SUSPEITA ALTA** | Correção de 13/08 foi só na grant. |
| `confirmar_pagamento_atendimento` | Sim (idem) | **SUSPEITA ALTA** | Idem. |
| `trg_reservas_before_insert` | Compara WhatsApp compradora × vendedora | **SUSPEITA MÉDIA** | Mesma classe de bug, outra roupa: se a comparação for `whatsA = whatsB` e um dos `SELECT` devolver NULL (usuária apagada, id inválido), o `IF` não dispara e a **trava de autofraude é silenciosamente pulada**. Precisa de `IS NOT DISTINCT FROM` ou `coalesce`. |
| `fn_bloqueia_campos_privilegiados_usuarios` | Sim (bloqueia não-admin) | **SUSPEITA MÉDIA** | Se comparar `new.papel <> old.papel` e `papel` for NULL em alguma linha antiga, o bloqueio não dispara. É a única coisa que impede auto-promoção via `promoverPapel` (ver A7). |
| `registrar_denuncia` | `is_admin()` | OK | `is_admin()` tem `coalesce(..., false)` — seguro contra NULL por construção. |
| `current_usuario_id` | — | OK | Retorna NULL sem sessão. É a origem do padrão, não o bug. |
| `is_admin` | — | OK | `coalesce` correto. |
| `piso_percentual` | — | OK | Pura. |
| `periodos_ocupados` | — | OK | Leitura pública sem dado sensível. |
| `handle_new_auth_user` | Whitelist de papel | **VERIFICAR HOJE** | Ver C1. |
| `expirar_reservas_vencidas` | — | OK | Só cron. |
| `fn_enviar_whatsapp_evolution` | — | **ATENÇÃO ESPECIAL** | Sem checagem nenhuma por design (é helper de trigger). Lê credenciais do Vault e manda mensagem pelo **número oficial do negócio**. Se uma regressão de grant abrir isso para `authenticated`, qualquer usuária dispara WhatsApp em nome da marca (phishing perfeito, com o número certo). Merece uma trava interna própria: `if auth.role() is distinct from 'service_role' and current_user <> <owner> then raise exception`. |
| `fn_notificar_reserva_criada` / `_status_alterado` | — | OK | Triggers. |
| `trg_reservas_after_update` | — | Ver B4 | Ordem do CASE (embaixadora antes de loja). |

**A varredura definitiva é a query 1 do Anexo A** — ela lê `pg_proc.prosrc` de todas as funções e
retorna as que comparam com `current_usuario_id()` sem `IS DISTINCT FROM`. É somente-leitura.

---

## 3. ALTO

### A1 — O estorno está quebrado em produção: `mp_payment_id` nunca é preenchido

**Evidência:**
- `src/app/painel/admin/estorno-actions.ts:41` — bloqueia o estorno se `!transacao.mp_payment_id`.
- O único código que já gravou `mp_payment_id` era `iniciar_pagamento_pix` (agora morta, C2.a).
- O fluxo atual (Checkout Pro) chama `confirmar_pagamento_taxa(p_transacao_id, p_usar_cashback)` —
  `src/app/api/webhooks/mercadopago/route.ts:46` e `compradora/actions.ts:126`. **A assinatura não
  tem parâmetro de payment id** (`src/types/database.ts:695`). O webhook *tem* o
  `paymentId` em mãos (linha 27) e simplesmente não faz nada com ele.

Conclusão: toda transação paga desde a migração para Checkout Pro tem `mp_payment_id = NULL`, e o
botão de estorno do painel admin responde sempre *"Essa transação não tem um pagamento no Mercado
Pago associado"*. O controle de segurança financeira que o código descreve como "exclusivo da
curadoria, auditável, uma vez por transação" **não funciona**.

Não é exploração de atacante — é um caminho de dinheiro sem volta pela plataforma. Numa disputa
(peça não entregue, cobrança indevida, direito de arrependimento), a saída hoje é estornar na mão
pelo painel do Mercado Pago, e aí `transacoes.status_pagamento` fica dessincronizado do MP: a
plataforma acha que está pago, o contato segue liberado, o cashback creditado, a comissão contada.

**Recomendação (decisão técnica, correção barata):** no webhook e no polling, gravar
`mp_payment_id` com o cliente de service role antes de chamar a RPC — não precisa nem mexer no
banco:
```ts
await supabase.from("transacoes")
  .update({ mp_payment_id: pagamento.id })
  .eq("id", pagamento.externalReference);
```
Mesma coisa em `atendimentos_assistidos`. Depois disso, rodar uma reconciliação única
(`buscarPagamentoPorReferencia` para cada transação paga com `mp_payment_id` nulo) para recuperar o
histórico — senão as transações antigas continuam sem estorno.

**Decisão sua:** vale gastar ~1h reconciliando o histórico, ou as transações antigas você estorna
na mão pelo painel do MP mesmo? Depende de quantas já foram pagas (query 6, Anexo A).

---

### A2 — Avaliações podem ser forjadas contra qualquer pessoa

**Evidência:** `src/app/painel/compradora/avaliar-actions.ts:25` insere `avaliado_id` e `tipo_alvo`
**exatamente como vieram do cliente** (`avaliar-form.tsx` recebe por prop, mas o cliente controla a
chamada da action). A policy do banco é:

> `INSERT avaliacoes_insert_transacao_paga` — `avaliador_id = current_usuario_id() AND existe
> transacao paga ligando avaliador à transação`

A policy valida **quem avalia** e **que existe transação paga**. Ela **não valida que `avaliado_id`
é a contraparte daquela transação**. E `SELECT` em `avaliacoes` é público (`qual: true`), e a média
aparece na página da peça (`src/app/pecas/[id]/page.tsx:22`).

Resultado: qualquer usuária que tenha **uma única** transação paga pode postar nota 1 contra
qualquer `usuario_id` do sistema — inclusive contra a vendedora concorrente da cidade dela — e
repetir (não há indício de unicidade em `(transacao_id, tipo_alvo, avaliador_id)`; o app se protege
disso só no front, com `jaAvaliou()`, que é cosmético).

Num marketplace peer-to-peer que veio de grupo de WhatsApp, reputação **é** o produto. Isso é sério.

**Recomendação (decisão técnica):**
1. Endurecer a policy de INSERT para exigir que `avaliado_id` seja a contraparte real da
   `transacao_id` informada (join `transacoes → reservas → pecas.dono_id` / `reservas.compradora_id`).
2. Índice único em `(transacao_id, tipo_alvo, avaliador_id)`.
3. Derivar `avaliado_id` no servidor a partir da transação, em vez de aceitar do cliente.

**[A CONFIRMAR]** se já existe o índice único — não consta do snapshot (que declara não ter
auditado índices).

---

### A3 — `sugerirPreco` gasta API paga sem exigir login; `gerarFotoEditorial` sem limite nenhum

**Evidência:**
- `src/app/painel/vendedora/nova-peca/actions.ts:74` — a action `sugerirPreco` **não chama
  `getCurrentUsuario()`**. Ela lê `ANTHROPIC_API_KEY` e chama a API da Anthropic com texto livre
  vindo do cliente. Server Actions do Next são endpoints HTTP com id no bundle JS: quem descobrir o
  id chama sem sessão, em loop.
- `src/app/painel/vendedora/pecas/[id]/foto-editorial-actions.ts:32` — `gerarFotoEditorial` **tem**
  checagem de dono (bom), mas nenhum limite de frequência, e cada clique é uma geração `gpt-image-1`
  1024×1536 (na casa de US$ 0,15–0,25 por imagem). Uma vendedora entediada (ou um script com uma
  conta válida) gera 500 imagens numa tarde.

Além do custo: o prompt de `sugerirPreco` interpola texto do usuário sem sanitização (injeção de
prompt). Impacto baixo aqui (a resposta é só exibida), mas o padrão é ruim.

**Recomendação (decisão técnica):**
1. `getCurrentUsuario()` no topo de `sugerirPreco` — 2 linhas, resolve 90% do problema.
2. Cota por usuária: N sugestões/dia e M fotos editoriais/mês, contadas numa tabela
   (`uso_ia (usuario_id, recurso, dia, contador)`), não em memória (serverless não tem memória).
3. Configurar **spend limit** nas contas Anthropic e OpenAI. Isso é o cinto de segurança que
   independe de código.

**Decisão sua:** qual a cota? Sugiro 20 sugestões de preço/dia por conta e 3 fotos
editoriais/peça — mas isso é regra de produto, você é quem sabe se uma vendedora legítima precisa de
mais.

---

### A4 — Bucket `pecas-fotos`: sim, merece virar prioridade (item 6 do escopo)

**Evidência (snapshot, seção Storage):** bucket público, `file_size_limit` nulo,
`allowed_mime_types` nulo, e:

```
INSERT pecas_fotos_authenticated_upload  with_check: bucket_id='pecas-fotos' AND auth.role()='authenticated'
```

Qualquer usuária logada escreve **em qualquer caminho** do bucket, com **qualquer tipo** de arquivo,
de **qualquer tamanho**, e o resultado fica com URL pública permanente num domínio `supabase.co`
ligado ao seu projeto.

Minha avaliação: **prioridade Alta, não Crítica** — exige conta autenticada e não dá acesso a dado
de ninguém. Mas os três vetores são reais e nenhum é teórico:

1. **Custo.** O formulário sobe vídeo (`nova-peca-form.tsx:88`) sem limite de tamanho. Storage +
   egress de vídeo é a linha que mais cresce sozinha numa conta Supabase. Sem `file_size_limit`,
   vale só o teto global do projeto.
2. **Hospedagem abusiva.** Alguém sobe arquivo arbitrário (APK, PDF de golpe, conteúdo ilegal) e
   distribui pelo WhatsApp com uma URL que parece sua. Você vira hospedeira, com sua marca no link.
3. **Sobrescrita cruzada.** A policy não amarra o caminho ao dono. Como o `DELETE`/`UPDATE` checam
   `owner`, não dá pra apagar arquivo alheio — mas dá pra **poluir a pasta de outra vendedora** com
   arquivos que ela não consegue remover.

**A boa notícia:** o código **já** usa a convenção certa de caminho — `${user.id}/${uuid}-*.jpg` em
`nova-peca-form.tsx:47`, `editar-peca-form.tsx:46` e `foto-editorial-actions.ts:43`. Ou seja,
apertar a policy é praticamente sem quebra:

```sql
-- with_check do INSERT passa a exigir que a primeira pasta seja o id da própria usuária
(storage.foldername(name))[1] = auth.uid()::text
```

**Uma pegadinha que precisa entrar junto:** `gerarFotoEditorial` sobe em
`${peca.dono_id}/...` **usando o cliente de sessão**, e `podeEditar()` permite que **admin** gere a
foto de peça alheia (`foto-editorial-actions.ts:21`). Com a policy apertada, o upload do admin
passa a falhar. Correção: trocar esse upload específico para o cliente de service role (é servidor,
a autorização já foi feita acima) — 1 linha.

**Decisão técnica:** apertar policy + `allowed_mime_types` (`image/jpeg,image/png,image/webp,
video/mp4,video/quicktime`) + `file_size_limit`.

**Decisão sua:** qual o teto do vídeo? Trade-off direto:

| Limite | Efeito | Custo |
|---|---|---|
| 10 MB | ~30s de vídeo de celular comprimido; algumas vendedoras vão reclamar | Baratíssimo |
| 25 MB | cobre quase todo vídeo curto de celular | Confortável |
| 50 MB | ninguém reclama | Storage cresce ~2× mais rápido |

Sugiro **25 MB para vídeo e 5 MB para foto**, com mensagem clara no formulário. Hoje o form não
avisa nada e um upload de 200 MB no 4G simplesmente trava sem explicação — resolver isso melhora a
experiência da vendedora *e* corta o risco.

---

### A5 — Rate limiting: não existe nada (item 3 do escopo)

Varri o repositório: zero. Sem Upstash, sem middleware de contagem, sem `@vercel/firewall`, sem
tabela de throttle. O `middleware.ts` só renova sessão do Supabase.

Mapa das rotas públicas sensíveis e o que cada uma aguenta hoje:

| Rota | Quem chama | O que acontece sob abuso | Risco real |
|---|---|---|---|
| `GET /r/[id]` | Anônimo | Insert em `cliques_compartilhamento` (RLS: `with_check: true`) por requisição | **Médio-alto.** O anti-fraude de hoje (hash de IP + cap de 3 créditos/dia) limita o *cashback*, mas não impede inflar a tabela de cliques indefinidamente nem falsear a métrica de "cliques reais" que embaixadora usa pra provar trabalho. |
| `POST /api/webhooks/mercadopago` | Anônimo (por design) | Cada POST vira uma chamada à API do MP (`buscarPagamentoPix`, linha 27) **antes** de qualquer validação | **Alto.** Amplificação: um atacante com 50 req/s consome sua cota de API do Mercado Pago e faz **os webhooks legítimos falharem** — pagamento confirmado que não libera contato. Também queima invocação de função na Vercel. |
| `POST /cadastro` (action) | Anônimo | `auth.signUp` em loop → e-mails de confirmação em massa | **Médio.** O Supabase Auth tem rate limit próprio de e-mail (é o que te salva hoje), mas a reputação do domínio de envio é sua. |
| `reservar()` (action) | Autenticado | Insert em `reservas`; trigger dispara notificação in-app **e WhatsApp real** | **Alto.** Cada reserva manda mensagem pelo seu número da Evolution API. Um script com uma conta válida reservando em loop = flood no WhatsApp das vendedoras, pelo seu número. Banimento de número pelo WhatsApp é consequência plausível — e derruba o canal inteiro. |
| `sugerirPreco()` (action) | **Anônimo** (A3) | Queima crédito Anthropic | Alto (já coberto em A3) |

**Isso é aceitável para o estágio atual?** Parcialmente. Enquanto o tráfego vem de grupos de
WhatsApp conhecidos e o volume é baixo, o risco de alguém *querer* atacar é pequeno. Mas dois itens
não são "risco de atacante", são **risco de acidente**: o webhook (que MP pode reenviar em rajada) e
o flood de reserva (que queima seu número de WhatsApp, um ativo que você não recupera com deploy).

Então: **não é urgente contra hacker, é urgente contra você mesma num dia ruim.**

**Decisão sua — três caminhos, com trade-off honesto:**

| Opção | O que é | Custo | Prazo | Trade-off |
|---|---|---|---|---|
| **A. Vercel Firewall** | Regras de rate limit no painel da Vercel, por path/IP. Zero código. | Incluso no plano (regras básicas); rate limiting configurável depende do plano | 30 min | Rápido e reversível, mas cego a "quem" (só IP) — não distingue usuária logada. |
| **B. Upstash Redis + `@upstash/ratelimit`** | Contador distribuído no middleware, por IP e por `usuario_id` | Free tier cobre folgado esse volume | ~3h | O padrão da indústria para Next na Vercel. Vira dependência de mais um fornecedor. |
| **C. Rate limit no Postgres** | Tabela `rate_limit (chave, janela, contador)` + função `SECURITY DEFINER` chamada nas actions | R$ 0 | ~4h | Sem fornecedor novo, coerente com "regra de negócio mora no banco". Mas cada checagem é um round-trip ao banco e você adiciona **mais uma função SECURITY DEFINER** — a mesma superfície que já te mordeu duas vezes. |

Minha recomendação: **A hoje** (é 30 minutos e cobre webhook e `/r/`), **C para a ação de
reserva** (porque ali o limite precisa ser por usuária, não por IP, e o banco já é onde a regra
mora). B só se você quiser um único mecanismo para tudo.

**Independente da opção — decisão técnica, faça já:** validar a assinatura `x-signature` do
Mercado Pago no webhook (M1 abaixo). Isso sozinho corta o vetor de amplificação, porque o request
falso morre antes de virar chamada de API.

---

### A6 — Sem migrations versionadas: o risco e o plano (item 4 do escopo)

**O risco real, sem dramatizar.** Não é "vai cair". Supabase faz backup e o banco não vai evaporar.
O risco é outro, em quatro camadas:

1. **Você não sabe o que mudou nem quando.** Os dois incidentes de hoje foram achados por auditoria
   manual. Com migrations em git, uma linha `<>` num diff de PR é visível. Sem elas, a única forma
   de achar é alguém reler o banco inteiro — que é literalmente o que estamos fazendo agora, de novo.
2. **Não existe rollback.** Corrigir função em produção sem versão anterior salva significa que, se
   a correção quebrar o pagamento às 22h de sábado, não existe "voltar". Existe "reescrever de
   memória".
3. **Não existe staging.** Toda correção é testada em produção, com dinheiro real. Hoje o mitigador
   é o `begin; ... rollback;` com dado sintético (que o data-engineer usou bem) — mas isso testa uma
   função, não uma migração.
4. **A pegadinha do `CREATE OR REPLACE` resetando grant para `PUBLIC` é invisível sem migration.**
   Numa migration versionada, o `revoke ... from public` obrigatório fica no arquivo, revisável.
   Direto no MCP, depende de alguém lembrar. Já falhou uma vez.

Severidade **Alta** e não Crítica porque nada está quebrado *agora* — mas é o multiplicador de
todos os outros achados.

**Plano concreto de remediação — 3 ondas**

**Onda 0 — trazer o schema para o repo (hoje, ~40 min, sem risco):**

```bash
npx supabase login
npx supabase link --project-ref izichohddofqylifppwh
# baseline: dumpa o estado atual como a primeira migration
npx supabase db pull --schema public,storage
# tipos gerados a partir do banco real (mata a dessincronização de database.ts)
npx supabase gen types typescript --linked > src/types/database.ts
```

Isso gera `supabase/migrations/<timestamp>_remote_schema.sql`. Três avisos que economizam uma tarde:

- `db pull` **não traz o schema `auth`** — o trigger `on_auth_user_created` /
  `handle_new_auth_user()` precisa ser escrito à mão numa migration própria. É justamente a função
  do C1: bom motivo para ela ser a primeira a virar arquivo.
- `pg_cron` (`expirar-reservas-vencidas`) e os segredos do **Vault** também não vêm. Documentar em
  `supabase/migrations/README.md` como "estado externo", ou recriar o job via SQL na migration.
- `db pull` pede a senha do banco e conexão direta; em rede que bloqueia a 5432, usar a connection
  string do pooler com `--db-url`.

**Onda 1 — processo daqui pra frente (custo zero, é disciplina):**
- Toda mudança de schema/função vira `npx supabase migration new <nome>` → SQL no arquivo → aplica.
- Se continuar aplicando via MCP (que é mais rápido e você já usa), tudo bem — **mas o mesmo SQL
  tem que ser commitado**. O MCP `apply_migration` registra em `supabase_migrations.schema_migrations`,
  então `db pull` posterior recupera o que escapou.
- **Regra inegociável, dado o histórico deste projeto:** toda migration que contenha
  `CREATE OR REPLACE FUNCTION` termina com `revoke execute on function ... from public;` +
  `grant execute ... to <papel>;`. Sem exceção, mesmo parecendo redundante.

**Onda 2 — rede de proteção (quando der):**
- Segundo projeto Supabase gratuito como **staging**, recriado do zero a partir das migrations
  (`supabase db reset`). É o teste de que o baseline é fiel — se o staging sobe limpo, seu repo
  descreve a produção de verdade.
- Detector de drift: `npx supabase db diff --linked --schema public` deve sair **vazio**. Rodar
  antes de cada deploy (ou num GitHub Action semanal). Se sair sujo, alguém mexeu direto em prod.

**Decisão sua:** o staging exige criar um segundo projeto Supabase (grátis, mas mais uma coisa pra
manter) e alimentar com dado sintético. Vale? Minha leitura: **vale a partir do momento em que
existir outra pessoa mexendo no banco além de você e do agente**. Enquanto for só este fluxo, a
Onda 0 + Onda 1 já entregam 80% do valor.

---

### A7 — Autorização inconsistente: 5 arquivos de actions privilegiadas sem checagem de identidade

**Evidência (grep por `getCurrentUsuario` nos arquivos com `"use server"`):**

| Arquivo | O que faz | Quem impede o abuso hoje |
|---|---|---|
| `painel/admin/actions.ts` | aprova/reprova peça, registra denúncia | RLS `pecas_update_own_pendente_or_admin` + `is_admin()` na RPC |
| `painel/admin/atendimento-actions.ts` | define valor e conclui atendimento | RLS `atendimentos_update_admin` |
| `painel/admin/rede-actions.ts` | **promove papel**, define `recrutado_por`, marca comissão paga | Só o trigger `fn_bloqueia_campos_privilegiados_usuarios` |
| `painel/vendedora/actions.ts` | confirma/recusa reserva | RLS `reservas_update_dono_peca_or_admin` |
| `components/notificacoes-actions.ts` | marca notificação lida (`update` sem filtro de usuária!) | RLS `notificacoes` |

O caso mais afiado é `promoverPapel` (`rede-actions.ts:6`): ele busca a usuária **por WhatsApp** e
dá `update` em `usuarios.papel`. A RLS `usuarios_update_own_or_admin` **permite** que qualquer
pessoa dê update na própria linha. Ou seja: se uma usuária comum chamar essa action passando o
**próprio** WhatsApp, a RLS deixa passar — e **a única coisa que impede a auto-promoção é o trigger
`fn_bloqueia_campos_privilegiados_usuarios`**.

Defesa em profundidade funcionando (ótimo que o trigger exista). Mas é uma trava só, e o trigger
está na lista de "suspeita média" do C2.c justamente por poder ter o mesmo padrão NULL-swallowing.

Da mesma família: `marcarTodasNotificacoesLidas` faz `update(...).eq("lida", false)` **sem nenhum
filtro de usuária** — funciona apenas porque a RLS filtra. Se um dia alguém rodar isso com service
role para "resolver um bug", marca as notificações do site inteiro como lidas.

**Recomendação (decisão técnica, ~2h):** criar `src/lib/auth/guards.ts` com
`requireUsuario()` e `requireAdmin()` (que já joga erro), e usar **em todas** as actions. Não
substitui RLS — soma. O ganho não é só segurança: é que a intenção fica legível no código, em vez de
morar num policy que ninguém vê ao revisar o PR.

---

## 4. MÉDIO

### M1 — Webhook do Mercado Pago sem validação de assinatura

`src/app/api/webhooks/mercadopago/route.ts` aceita qualquer POST e, antes de qualquer validação,
chama a API do MP. O MP envia o header `x-signature` (HMAC com um segredo do painel) — validar isso
é ~15 linhas.

O desenho atual já é bom (nunca confia no status do payload, sempre reconsulta) — o risco não é
confirmação falsa, é **amplificação/exaustão** (ver A5). Fix barato, ganho concreto.

Bônus do mesmo arquivo: quando `error.message` não contém "já processado", devolve 500 e o MP
retenta — correto. Mas ninguém é avisado. Um `console.error` na Vercel só existe se alguém abrir o
log. Ver B3.

### M2 — Cobrança dupla possível: preferência de checkout sem idempotência

`criarPagamentoPix` usa `X-Idempotency-Key` (`client.ts:55`) — mas essa função está morta.
`criarPreferenciaCheckout` (a que roda de verdade, linha 86) **não usa nenhuma chave de
idempotência e não verifica se já existe pagamento pendente/aprovado** para aquele
`external_reference`.

Cenário real: compradora clica "pagar", abre o modal, desiste, volta no dia seguinte e clica de
novo. Duas preferências vivas para a mesma `transacao_id`. Se ela pagar as duas (boleto emitido
antes + Pix agora, por exemplo), o segundo pagamento aprovado bate no guard
`status_pagamento === "pago"` (webhook, linha 42) e é **silenciosamente ignorado** — dinheiro
recebido, não registrado, e ninguém avisado. Só aparece na conciliação do MP.

**Recomendação:** antes de criar a preferência, chamar `buscarPagamentoPorReferencia(transacaoId)`;
se já houver pagamento `pending`/`approved`, reaproveitar ou bloquear. E, quando o webhook receber
um `approved` para transação já paga, **logar/alertar em vez de retornar `ok` mudo** — é dinheiro
que precisa ser devolvido.

### M3 — Corrida de cashback entre o cálculo e a confirmação

`pagarTaxa` (`compradora/actions.ts:49-59`) soma o cashback disponível e cria a cobrança **pelo
valor já abatido**, mas quem consome o cashback é `confirmar_pagamento_taxa`, minutos depois. Entre
os dois momentos, o mesmo saldo pode ser consumido por outra transação da mesma pessoa (duas
reservas confirmadas ao mesmo tempo — cenário normal, não exótico). Aí a compradora pagou o valor
descontado e o desconto não pode mais ser aplicado.

**Recomendação:** reservar o cashback no momento da intenção (`registrar_intencao_pagamento_taxa`
já existe e é o lugar natural — marcar as linhas de cashback como "em uso" com um `transacao_id`), e
liberar se a cobrança expirar. Alternativa mais simples: gravar `cashback_previsto` na transação e
`confirmar_pagamento_taxa` honrar esse valor, mesmo que o saldo tenha sumido (a plataforma absorve o
risco no lugar da compradora, o que é a decisão certa de produto).

**Decisão sua:** quem absorve a diferença quando isso acontece — a plataforma (melhor experiência,
prejuízo pequeno e raro) ou a compradora (cobrança da diferença, atrito garantido)? Recomendo
plataforma.

### M4 — `confirmarReserva` sem guarda de status

`painel/vendedora/actions.ts:19` faz `update({status: "confirmada"})` sem verificar o status atual.
A RLS só checa *quem* (dona da peça), não *de qual estado para qual*. Se a vendedora tiver a aba
antiga aberta e clicar "confirmar" numa reserva **já expirada/recusada** (a expiração automática de
24h roda no `pg_cron`, sem a tela saber), o `trg_reservas_after_update` dispara e cria uma
**transação nova para uma peça que já voltou para a vitrine** — e que pode já estar reservada por
outra compradora.

**Recomendação:** `.eq("status", "aguardando_confirmacao")` no update (2 caracteres de diff) e
mensagem clara quando 0 linhas forem afetadas. O ideal seria uma máquina de estados no banco
(`CHECK` de transição no trigger), mas o filtro no update já mata o caso real.

### M5 — `/r/[id]` conta clique de robô e confia em header manipulável

`src/app/r/[id]/route.ts`:

1. **Preview do WhatsApp/Facebook/Telegram gera clique.** Quando alguém cola o link num grupo, o
   crawler da Meta faz um GET na URL para montar o preview — e isso entra em
   `cliques_compartilhamento` como "clique real". Ou seja: o cashback por compartilhamento tem uma
   fonte automática de cliques que ninguém pediu, exatamente no canal onde o produto vive. Não é
   fraude, é o produto se auto-fraudando. Filtrar por `user-agent` conhecido (`facebookexternalhit`,
   `WhatsApp`, `Twitterbot`, `bot|crawler|spider`) é o mínimo.
2. **`x-forwarded-for` é lido pelo elemento mais à esquerda** (linha 27), que é o valor que o
   *cliente* pode injetar. Todo o anti-fraude de IP construído hoje (hash + janela de 24h) cai com
   um `curl -H "x-forwarded-for: 1.2.3.4"`. Na Vercel, a fonte confiável é
   `request.headers.get("x-real-ip")` (ou `x-vercel-forwarded-for`), que a plataforma escreve.
   O cap diário de 3 créditos ainda segura o prejuízo — por isso é Médio e não Alto.

### M6 — SSRF limitada via `fotos_originais` livre + geração editorial

`cadastrarPeca` (`nova-peca/actions.ts:60`) aceita **qualquer string** em `fotos_originais` /
`fotos_tratadas` / `video_url` — não valida que é URL do seu bucket. Depois,
`gerarFotoEditorialBase64` (`lib/openai/client.ts:19`) faz `fetch(imagemUrl)` **do servidor**.

Encadeando: usuária cadastra peça com `fotos_originais: ["http://algum-host-interno/..."]` e pede a
foto editorial → seu servidor busca essa URL e manda o conteúdo para a OpenAI. Em Vercel/Lambda o
alcance é limitado (não há serviço de metadados explorável e as credenciais estão em env vars), por
isso Médio e não Alto. Mas o mesmo campo livre também significa que **a vitrine pode exibir imagem
hospedada em servidor de terceiro** (rastreamento de quem abriu a peça, troca da imagem depois da
aprovação da curadoria — a foto aprovada não é a foto exibida).

**Recomendação:** validar no servidor que toda URL de foto/vídeo começa com
`${NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/pecas-fotos/`. Vale para cadastro e edição.
Custo: 5 linhas. Fecha SSRF e o problema de curadoria de uma vez.

### M7 — Escalabilidade da vitrine: sem paginação, sem `select` enxuto, sem otimização de imagem

Item 5 do escopo. `src/app/vitrine/page.tsx:23` faz `select("*")` de **todas** as peças aprovadas,
sem `limit`, sem paginação — incluindo os arrays `fotos_originais`, `fotos_tratadas`, `video_url` e
todas as medidas. Renderiza tudo de uma vez.

Combinado com `peca-card` usando `<img>` puro (sem `next/image`, com
`eslint-disable @next/next/no-img-element` explícito em `painel/vendedora/page.tsx:153`), cada visita
à vitrine baixa **as fotos em tamanho original**, direto do Storage. Seu público é mobile, vindo de
WhatsApp, muitas vezes em 4G.

Onde dói, em ordem de chegada:

| Volume | Sintoma |
|---|---|
| ~150 peças | Vitrine já pesa alguns MB de imagem por visita; percepção de "site lento no celular" |
| ~300-500 peças | Payload do server component cresce; TTFB sobe; egress do Storage vira linha visível na fatura |
| ~1.000 peças | Insustentável sem paginação |

**Recomendação (decisão técnica):**
1. `select` com colunas explícitas (a vitrine precisa de ~8 campos, não de 25).
2. Paginação ou scroll infinito com `range()` — 24 por página.
3. Índice composto para o caminho quente: `(status, criado_em desc)`, e índices nos filtros mais
   usados. **[A CONFIRMAR]** quais índices existem — o snapshot declara não ter auditado isso, e
   Postgres **não cria índice automático em chave estrangeira**. Suspeito que faltem em
   `reservas.peca_id`, `reservas.compradora_id`, `pecas.dono_id`, `favoritos.usuario_id`,
   `comissoes.parceira_id`, `avaliacoes.avaliado_id`, `notificacoes.usuario_id` — todos usados em
   filtro nos painéis. Query 7 do Anexo A lista o que existe.

**Decisão sua — imagem:** duas saídas, escolha por custo:

| Opção | Como | Custo | Trade-off |
|---|---|---|---|
| `next/image` + `remotePatterns` | Vercel otimiza e faz cache | Incluso até o limite do plano; acima disso, cobrado por imagem otimizada | Melhor resultado, mas o custo escala com número de imagens distintas |
| Transformação do Supabase Storage | `?width=400` na URL pública | Recurso de plano pago do Supabase | Fica tudo num fornecedor só |
| Gerar thumbnail no upload | O navegador já redimensiona antes de subir (o `watermark.ts` já mexe em canvas) | R$ 0 | Mais código; não conserta as fotos já existentes |

Para o seu estágio, a terceira é a mais barata e você já tem metade do caminho pronto no
`aplicarMarcaDagua`.

### M8 — Polling de pagamento a cada 4 segundos, sem teto

`pagar-botao.tsx:29` e `pagar-atendimento-botao.tsx:26` chamam `verificarPagamento*` **a cada 4s
enquanto a aba estiver aberta**, e cada chamada faz uma consulta à API do Mercado Pago
(`buscarPagamentoPorReferencia`). São 15 requisições/minuto por aba aberta, para sempre — e boleto
pode ficar pendente por dias.

É o mesmo tipo de risco do A5 (cota do MP + invocações na Vercel), só que autoinfligido pelos seus
próprios usuários. **Recomendação:** backoff (4s → 8s → 15s → 30s), teto de ~5 minutos de polling e
parar quando a aba perder o foco (`document.visibilityState`). O webhook é o caminho principal; o
polling é só a rede de proteção dos primeiros segundos.

---

## 5. BAIXO (dívida técnica e higiene)

### B1 — Duplicação e código morto
- `appUrl()` duplicado **idêntico** em `painel/compradora/actions.ts:9` e
  `painel/vendedora/atendimento-actions.ts:9`, enquanto `src/lib/app-url.ts` existe com propósito
  diferente (e bem documentado). Consolidar em `lib/app-url.ts` como `appUrlCanonica()`.
- `criarPagamentoPix` e o fluxo Pix direto: mortos (ver C2.a).
- **`zod` está no `package.json` e não é usado em lugar nenhum.** Toda validação é
  `String(formData.get(...)).trim()` na mão, repetida em 6 actions, com regras sutilmente diferentes
  entre `cadastrarPeca` e `atualizarPeca`. A dependência já está paga — adotar zod nos schemas de
  formulário elimina uma classe inteira de bug de entrada.
- Os fluxos de pagamento de **taxa** e de **atendimento** são quase clones (duas actions de
  iniciar + duas de verificar + dois botões com o mesmo polling + um webhook que descobre qual é
  pelo `external_reference`). Candidato natural a um módulo `lib/pagamentos/` com uma abstração
  "cobrança" — não urgente, mas é onde o próximo bug de pagamento vai nascer em dobro.

### B2 — `src/types/database.ts` mantido à mão e já dessincronizado
Confirmado: `registrar_intencao_pagamento_taxa` declara `estornado_em/estornado_por/estorno_motivo`
no retorno, `confirmar_pagamento_taxa` e `iniciar_pagamento_pix` não — mesmas colunas, mesma tabela.
Nenhuma função `fn_*`/`trg_*` está declarada. Resolvido de graça pelo `supabase gen types` da
Onda 0 (A6).

### B3 — Sem testes, sem CI, sem monitoramento de erro
Nenhum teste no repositório, nenhum workflow de CI, nenhum Sentry. Para um produto com dinheiro real
e regra de negócio no banco, o mínimo defensável são **três testes de fumaça** do caminho crítico
(reserva → confirmação → pagamento → liberação de contato) rodando contra o staging da Onda 2.

O mais barato e de maior retorno imediato: **alerta quando o webhook falhar**. Hoje, se
`confirmar_pagamento_taxa` der erro, a compradora pagou, o contato não liberou, e ninguém fica
sabendo até ela reclamar no WhatsApp. Sentry no plano gratuito + um alerta de erro nessa rota é
~30 min de trabalho e é a diferença entre "descobri em 2 minutos" e "descobri pela cliente irritada".

### B4 — Pontos de regra de negócio a confirmar com você
- **Ordem do `CASE` em `trg_reservas_after_update`**: checa `embaixadora` antes de `loja`, então
  quem acumula os dois papéis paga 30% e não 20%. O blueprint (seção 3) diz que a embaixadora "paga
  a taxa padrão (30%) sobre os produtos dela — não o desconto de loja", então **parece intencional**
  — mas está implícito na ordem de um `CASE`, e não num comentário. Vale confirmar e documentar.
- **A vendedora aprova a própria foto editorial**: `definirAprovacaoFotoEditorial`
  (`foto-editorial-actions.ts:68`) usa `podeEditar()`, que autoriza dona **ou** admin. O comentário
  em `lib/openai/client.ts:12` diz "resultado precisa de revisão humana antes de ir para a vitrine" —
  hoje a revisão humana é a própria dona. Se a intenção era curadoria, é uma linha de mudança.
- **`/painel/parceira` não checa papel**: qualquer conta logada abre a página (vê a própria lista
  vazia de comissões). Sem risco de dado, mas o menu/rota deveriam refletir o papel.
- `usuario!.id` (non-null assertion) em `painel/vendedora/page.tsx`, `compradora/page.tsx`,
  `parceira/page.tsx` — hoje está seguro porque o `layout.tsx` redireciona sem sessão, mas é uma
  garantia por vizinhança. Um `redirect` no próprio page (ou um helper `requireUsuario()`, ver A7)
  torna isso explícito.

---

## 6. Arquitetura geral do código (item 2 do escopo) — o que está certo

Vale registrar, porque auditoria só com defeito distorce a realidade:

- **Fronteira server/client bem traçada.** Nenhum uso de `service_role` em código de cliente.
  `service-role.ts` tem docstring explicando quando pode ser usado, e o uso real respeita: webhook,
  confirmação pós-validação e escritas privilegiadas de foto editorial.
- **A decisão de mover `confirmar_pagamento_*` para service role** (em vez de deixar `authenticated`
  chamar) está certa e bem comentada no código — é a razão de o incidente de 13/08 não ser
  explorável hoje.
- **Regra de negócio no Postgres** (piso de proposta, cálculo de taxa, expiração de 24h,
  cashback/comissão na confirmação) é a escolha certa para este produto: sobrevive a bug de front,
  a aba antiga aberta e ao caminho do `pg_cron` que não passa pela aplicação. `lib/domain/regras.ts`
  duplica o piso no front **e diz explicitamente que é só validação otimista** — duplicação
  consciente e documentada, que é a única forma aceitável.
- **WhatsApp via `pg_net` direto do trigger** é uma decisão de arquitetura acima da média: cobre o
  caminho automático da expiração, com credencial no Vault e falha engolida de propósito para não
  derrubar o fluxo principal.
- **O webhook nunca confia no payload.** É o erro mais comum de integração com gateway e aqui está
  correto, com comentário explicando o porquê.

O ponto de arquitetura a corrigir não é "está bagunçado" — é que **não existe um contrato único de
autorização** (A7). O resto (duplicação, código morto, tipos à mão) é dívida normal de produto que
andou rápido e vai ser resolvida quase toda pela Onda 0 do plano de migrations.

---

## 7. Escalabilidade (item 5 do escopo) — aguenta o crescimento planejado?

**Resposta curta: o banco aguenta bem; a vitrine e o custo de imagem/API são os primeiros a doer; e o
gargalo real do modelo é humano, não técnico.**

| Vetor de crescimento | Aguenta? | Primeiro gargalo |
|---|---|---|
| Mais peças na vitrine | Até ~300 peças, tranquilo | M7 — sem paginação, `select *`, imagem não otimizada. É o **primeiro** limite que você vai encontrar. |
| Mais vendedoras/lojas | Sim | Fila de curadoria: uma pessoa aprovando peça uma a uma. Blueprint já previu ("gargalo humano"). |
| Mais embaixadoras e comissões | Sim, com folga | Cálculo de comissão é O(1) por transação, dentro da confirmação de pagamento. Só faltam índices em `comissoes.parceira_id` e `usuarios.recrutado_por`. |
| Mais volume de transação | Sim | `pg_cron` a cada 15 min varre `reservas` — precisa de índice em `(status, prazo_confirmacao)`. Sem ele, vira seq scan a cada 15 min conforme a tabela cresce. |
| Mais notificações WhatsApp | **Atenção** | O limite não é o Postgres, é a **Evolution API num número só**. Volume alto de mensagens automáticas de um número não-oficial é o caminho clássico para bloqueio pelo WhatsApp. Um flood de reservas (A5) acelera isso. |
| Mais tráfego anônimo (`/r/`, vitrine) | Sim | Sem rate limit (A5); e `cliques_compartilhamento` cresce sem política de retenção. |
| `pg_net` | **[A CONFIRMAR]** | A tabela `net._http_response` acumula uma linha por chamada HTTP e **não é limpa sozinha** em configurações antigas. Com WhatsApp em cada reserva, cresce para sempre. Verificar o tamanho e configurar TTL (query 8, Anexo A). |

**Nada aqui exige rearquitetura.** São ajustes localizados — paginação, índices, retenção. O desenho
(Postgres como cérebro, Next como casca, Vercel como entrega) escala confortavelmente para o
tamanho que este negócio deve ter nos próximos 12-24 meses.

---

## 8. Plano de ação priorizado

### Hoje (2-3h)
1. **[C1]** Rodar a query 3 (whitelist de papel em `handle_new_auth_user`). Se `admin` passar,
   corrigir imediatamente.
2. **[C1]** Rodar a query 4 (quantas contas `loja`/`parceira` existem) e conferir na mão.
3. **[C2]** Rodar a query 1 (varredura do padrão `<>` em todas as funções). Corrigir tudo o que
   aparecer, mesmo sem exposição.
4. **[C2]** `DROP FUNCTION iniciar_pagamento_pix` e `iniciar_pagamento_pix_atendimento`.
5. **[A6]** Onda 0 das migrations: `db pull` + `gen types` + commit. **Faça isso antes das
   correções seguintes**, para que elas já nasçam versionadas.

### Esta semana
6. **[A1]** Gravar `mp_payment_id` no webhook/polling + reconciliar histórico. Devolve o estorno.
7. **[A2]** Endurecer a policy de avaliações + índice único + derivar `avaliado_id` no servidor.
8. **[A3]** `getCurrentUsuario()` em `sugerirPreco` + spend limit nas contas Anthropic/OpenAI.
9. **[A4]** Policy do bucket por prefixo de pasta + mime types + limite de tamanho (com a correção
   do upload de admin junto).
10. **[M1]** Validar `x-signature` do webhook do MP.
11. **[A5]** Rate limit no Vercel Firewall para `/r/` e `/api/webhooks/` (30 min).

### Este mês
12. **[A7]** `lib/auth/guards.ts` + aplicar em todas as actions.
13. **[M2/M3/M4]** Idempotência da preferência, reserva de cashback, guarda de status na confirmação.
14. **[M5/M6]** Filtro de crawler + `x-real-ip` em `/r/`; validação de URL de foto.
15. **[M7]** Paginação da vitrine + índices.
16. **[B3]** Sentry + alerta no webhook.

### Backlog
17. Staging (Onda 2), testes de fumaça, zod, consolidação do módulo de pagamentos, retenção de
    `cliques_compartilhamento` e `net._http_response`.

---

## 9. As decisões que são suas (resumo)

Tudo o que está acima marcado como "decisão técnica" eu ou o @dev resolvemos sem você precisar
escolher nada. Estas seis são suas:

| # | Decisão | Opções | Minha recomendação |
|---|---|---|---|
| 1 | Como alguém vira "loja" (taxa 20%) | Aprovação prévia / auto-declaração + auditoria / CNPJ | Auditoria hoje, aprovação prévia na próxima janela |
| 2 | Cotas de IA (sugestão de preço, foto editorial) | Números por conta/dia | 20 sugestões/dia, 3 fotos/peça |
| 3 | Limite de upload | 10 / 25 / 50 MB para vídeo | 25 MB vídeo, 5 MB foto |
| 4 | Mecanismo de rate limit | Vercel Firewall / Upstash / Postgres | Vercel agora + Postgres na ação de reserva |
| 5 | Quem absorve a diferença numa corrida de cashback | Plataforma / compradora | Plataforma |
| 6 | Criar staging + subir para Supabase Pro (PITR) | ~US$ 25/mês pelo Pro; staging grátis | Staging quando houver mais de uma pessoa mexendo; Pro (PITR) vale a partir do momento em que perder 24h de transações doer de verdade |

---

## 10. O que esta auditoria **não** cobriu

- Corpo real das funções `SECURITY DEFINER` (sem acesso ao banco nesta sessão) — coberto pelo
  Anexo A.
- Índices e planos de execução (idem).
- Configuração do Supabase Auth (política de senha, expiração de token, MFA, rate limit de e-mail).
- Configuração da Vercel (variáveis de ambiente por ambiente, proteção de preview deployments —
  vale checar se os previews expõem o app com as credenciais **de produção**, que é o padrão quando
  as env vars não são separadas por ambiente).
- Segurança da VPS da Evolution API (superfície própria, fora deste repositório).
- LGPD: `usuarios.whatsapp`, `pix` e `cliques_compartilhamento.ip_hash` são dado pessoal. Existe
  política de retenção? Existe caminho para exclusão de conta? Não achei nenhum no código — não é
  achado de segurança, é conformidade, e merece uma conversa própria.

---

## 11. Anexo A — Consultas somente-leitura para fechar os "[A CONFIRMAR]"

Todas são `SELECT`. Nenhuma altera dado. Rodar via MCP do Supabase ou SQL Editor.

**Query 1 — a varredura do item 1 do escopo (o padrão do bug, em todas as funções):**
```sql
select p.proname,
       p.prosecdef as security_definer,
       pg_get_function_identity_arguments(p.oid) as args,
       p.prosrc
  from pg_proc p
  join pg_namespace n on n.oid = p.pronamespace
 where n.nspname = 'public'
   and p.prosrc ilike '%current_usuario_id%'
   and (p.prosrc ~* 'current_usuario_id\s*\(\s*\)\s*(<>|!=|=[^=])'
     or p.prosrc ~* '(<>|!=|[^<>!:=]=[^=])\s*current_usuario_id\s*\(')
 order by p.proname;
```
Qualquer linha retornada é uma função a corrigir para `IS DISTINCT FROM` / `IS NOT DISTINCT FROM`.

**Query 2 — canário de grant (rodar semanalmente; detecta o reset para `PUBLIC`):**
```sql
select p.proname,
       has_function_privilege('anon',          p.oid, 'EXECUTE') as anon_executa,
       has_function_privilege('authenticated', p.oid, 'EXECUTE') as auth_executa,
       p.proacl
  from pg_proc p
  join pg_namespace n on n.oid = p.pronamespace
 where n.nspname = 'public' and p.prosecdef
 order by 2 desc, 3 desc, 1;
```

**Query 3 — o whitelist de papel do C1 (rodar HOJE):**
```sql
select prosrc from pg_proc
 where proname = 'handle_new_auth_user';
```
Procurar a lista de papéis aceitos. Se contiver `admin` ou `embaixadora`, é escalonamento de
privilégio aberto.

**Query 4 — quem já se declarou loja/parceira/embaixadora/admin:**
```sql
select unnest(papel) as papel, count(*) 
  from usuarios group by 1 order by 2 desc;

select id, nome, whatsapp, papel, criado_em
  from usuarios
 where papel && array['loja','parceira','embaixadora','admin']
 order by criado_em desc;
```

**Query 5 — as funções mortas são mesmo mortas?** (requer `pg_stat_statements`)
```sql
select query, calls, max_exec_time
  from pg_stat_statements
 where query ilike '%iniciar_pagamento_pix%'
 order by calls desc;
```

**Query 6 — dimensão do estorno quebrado (A1):**
```sql
select count(*) filter (where mp_payment_id is null)  as sem_payment_id,
       count(*) filter (where mp_payment_id is not null) as com_payment_id
  from transacoes
 where status_pagamento = 'pago';
```

**Query 7 — índices existentes (M7):**
```sql
select tablename, indexname, indexdef
  from pg_indexes
 where schemaname = 'public'
 order by tablename, indexname;
```

**Query 8 — crescimento do `pg_net` (seção 7):**
```sql
select count(*) as respostas_acumuladas,
       pg_size_pretty(pg_total_relation_size('net._http_response')) as tamanho,
       min(created) as mais_antiga
  from net._http_response;
```

---

*Auditoria conduzida sem alteração de código de aplicação, sem escrita no banco e sem operações git,
conforme combinado. Todos os achados são rastreáveis ao arquivo/linha ou à consulta que os confirma.*
