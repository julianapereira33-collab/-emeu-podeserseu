# Blueprint — "É meu, pode ser seu" (v2, plataforma completa)

## 1. Objetivo
Plataforma de moda circular (venda e aluguel de vestidos de festa) que nasceu organizando vendas de grupo de WhatsApp. Vendedora cadastra sozinha, curadoria aprova, compradora navega a vitrine e paga uma taxa de pré-venda para desbloquear o contato — só depois de a vendedora confirmar que a peça ainda está disponível. Sobre essa base, uma camada de parceiros (lojas e embaixadoras de cidade) amplia o alcance por comissão, e um sistema de cashback mantém compradoras engajadas dentro da plataforma. Critério de pronto: uma peça percorre cadastro → curadoria → vitrine → reserva → confirmação → pagamento → contato liberado sem nenhuma intervenção manual além da aprovação e, quando aplicável, da mediação de disputa.

## 2. Escopo
**Dentro:** cadastro de vendedora/loja; tratamento de imagem por IA com marca d'água; curadoria com aprovação manual; vitrine pública com filtros (tamanho, cor, tecido, estado, tipo); reserva com confirmação de disponibilidade antes de cobrar; propostas de valor com piso gradativo por tempo em vitrine; taxa diferenciada por tipo de vendedora (pessoa física 30%, loja 20%, venda assistida 60%); atendimento assistido pago (curadoria/prova presencial); programa de parceiros (loja-parceira e embaixadora de cidade) com comissão sobre venda real; cashback para vendedora e compradora, com validade e uso restrito à plataforma; avaliações de peça, vendedora e locadora; exclusividade de anúncio com banimento por violação; termos de uso com aceite obrigatório por tipo de transação.

**Fora (por ora):** custódia do pagamento do valor da peça (continua sendo acertado direto entre as partes, fora da plataforma — decisão deliberada, ver seção 8); logística de entrega; emissão fiscal automatizada além da taxa.

## 3. Atores e permissões
- **Vendedora (pessoa física):** cadastra peça, recebe 100% do valor combinado direto com a compradora. Pode delegar a negociação à curadoria (venda assistida, taxa sobe para 60%).
- **Loja:** mesmo papel da vendedora, mas com taxa de 20% em vez de 30% — incentivo para formalizar parceria.
- **Compradora:** navega vitrine, reserva peça, propõe valor, paga taxa após confirmação, avalia peça/vendedora/locadora após a transação.
- **Parceira/Loja-parceira:** tem link próprio, pode promover qualquer peça aprovada da vitrine (não só as dela), ganha comissão sobre venda real originada por ela.
- **Embaixadora de cidade:** parceira com território, ganha comissão sobre os próprios links **e** um override sobre vendas de lojas que ela recrutou. Tem loja própria dentro da plataforma, mas paga a taxa padrão (30%) sobre os produtos dela — não o desconto de loja.
- **Admin/curadoria:** aprova peças, confirma disponibilidade junto à vendedora, gerencia denúncias e banimentos, dispara atendimento assistido.

## 4. Modelo de dados
- **usuarios**: nome, whatsapp, papel (vendedora/loja/compradora/embaixadora — uma pessoa pode acumular papéis), cidade, recrutadoPor (referência a outra usuária, para embaixadoras), pix.
- **pecas**: donoId, fotos originais/tratadas, descrição, tamanho, cor, tecido, estado, tipo (venda/aluguel), preço anunciado, exclusividade (bool), status (pendente/aprovado/reprovado/reservado/vendido), criadoEm.
- **reservas**: pecaId, compradoraId, valorProposta, valorAceito, status (aguardando_confirmacao/confirmada/recusada/contato_liberado), criadoEm.
- **transacoes**: reservaId, valorBase, percentualTaxa (30/20/60), valorTaxa, statusPagamento, contatoLiberadoEm.
- **comissoes**: parceiraId, transacaoId, tipo (direta/override), percentual, valor, paga (bool).
- **cashback**: usuarioId, origem (venda/compartilhamento), valor, criadoEm, validoAte, usado (bool).
- **avaliacoes**: transacaoId (só quem pagou taxa pode avaliar), tipoAlvo (peça/vendedora/locadora), avaliadorId, nota, comentário.
- **denuncias_banimento**: vendedoraId, motivo, evidência, avisos (contador), banidoEm.

RLS: cada usuária só vê/edita seus próprios registros; comissões e transações completas só visíveis para o admin e para a própria parceira (o dela); avaliação só pode ser criada se existir uma `transacao` com `statusPagamento = pago` ligando avaliador e avaliado.

## 5. Arquitetura
Next.js (Vercel) com áreas: cadastro, vitrine pública, painel da vendedora/loja, painel da embaixadora (rede + comissões), painel admin. Supabase como banco (Postgres + RLS) e Storage real para as fotos (troca o base64 do protótipo por upload de verdade — mais rápido e mais barato). As regras de negócio com timer (confirmação de disponibilidade em 24h, cálculo do piso de proposta por tempo em vitrine) rodam direto no Postgres via `pg_cron`/triggers, sem orquestrador externo. **Decisão (05/08/2026): não usar n8n nem Z-API — trocado por notificação in-app + e-mail + SMS, com WhatsApp via Evolution API (self-hosted) reservado só para quando/se for realmente necessário, evitando o custo por mensagem do Z-API.** Ver seção 7.

## 6. Fluxo de automação
1. Vendedora/loja cadastra peça → IA trata foto e sugere preço → fila de aprovação.
2. Admin aprova → peça na vitrine, divulgação automática nos grupos configurados.
3. Compradora reserva ou propõe valor (proposta respeita o piso gradativo: 90% até 30 dias, 80% até 60, 70% até 90, 60% até 120, piso final 50%).
4. Sistema dispara aviso pra vendedora — notificação dentro do app (badge "você recebeu uma mensagem, responda") + e-mail + SMS: "confirma disponibilidade?" — prazo de 24h.
5. Sem resposta em 24h → peça some da vitrine automaticamente, compradora é avisada, nada foi cobrado.
6. Vendedora confirma (aceita proposta se houver) → cobrança da taxa é liberada, calculada sobre o valor fechado, não o anunciado.
7. Pagamento confirmado → contato liberado, comissões de parceiras envolvidas calculadas e registradas, cashback de 10% da taxa creditado à vendedora.
8. Vendedora e compradora combinam entrega/recebimento fora da plataforma.
9. Após a transação, ambas podem avaliar (peça, vendedora, locadora).
10. Se peça for encontrada à venda em outro grupo durante exclusividade → aviso na primeira ocorrência, banimento na segunda.

## 7. Stack e justificativa
Next.js + Vercel, Supabase (dados + auth + storage + RLS + `pg_cron` para os timers de 24h, sem orquestrador externo), Claude API (tratamento de imagem e sugestão de preço). Pagamento da taxa: Pix via gateway com suporte a valor dinâmico (Mercado Pago, já implementado, já que o valor muda por peça e pode mudar por proposta aceita).

**Notificação (substituindo n8n + Z-API):** notificação in-app (tabela `notificacoes`, badge "você tem uma mensagem" no painel) como canal principal — sempre funciona, custo zero, e o prazo de 24h já expira sozinho no Postgres mesmo sem a vendedora ver o aviso. E-mail transacional (ex.: Resend) e SMS (ex.: Twilio/Zenvia) como canais de alcance, com faixas gratuitas/baixo custo por volume, ao invés do custo por mensagem do Z-API. WhatsApp, se precisar mesmo, via **Evolution API** (open source, self-hosted — sem custo por mensagem de terceiro), nunca mais via Z-API/n8n.

## 8. Riscos conhecidos e mitigação — decisões de segurança tomadas
- **Bypass (maior risco do negócio):** a exclusividade + banimento ataca isso de frente, mas fiscalização inicial é manual (admin e embaixadoras). Formalizar nos termos com linguagem clara de "1 aviso, depois banimento".
- **Faturamento e fiscal:** decisão de **não** custodiar o valor da peça — só a taxa passa pelo caixa da plataforma. Isso é o que protege de virar instituição de pagamento e mantém o regime tributário simples. Não abrir mão disso sem antes falar com um contador.
- **MLM/pirâmide:** toda comissão de embaixadora vem de **venda real**, nunca de recrutamento puro — isso é o que juridicamente separa o modelo de marketing multinível ilegal. Manter essa regra como inegociável.
- **Fraude de avaliação e cashback:** avaliação só liberada com transação paga vinculada; trava de mesmo WhatsApp entre comprador/vendedor bloqueada.
- **Notificação:** timezone `America/Sao_Paulo` explícito no timer de 24h do `pg_cron`. Notificação in-app não pode ser o único canal para algo com prazo (a vendedora pode não abrir o app) — por isso e-mail/SMS acompanham desde o início, não são "fase futura". **Supabase:** service role key nas automações, RLS desenhada desde a modelagem porque há muitos "donos" de dado diferentes.
- **Gargalo humano:** a fila de aprovação e a confirmação de disponibilidade ainda dependem do admin no início — planejar aviso de "peça parada há X dias sem resposta".

## 9. Plano de execução (faseado — não pular etapas)
**Fase 1 — validar a base:** cadastro, curadoria, vitrine, taxa, reserva com confirmação. Sem afiliados, sem cashback ainda. Rodar nos grupos atuais por 60-90 dias.
**Fase 2 — confiança:** avaliações, exclusividade/banimento, termos formalizados, venda assistida, atendimento assistido pago.
**Fase 3 — crescimento:** lojas com taxa de 20%, cashback de vendedora e compradora.
**Fase 4 — escala:** embaixadoras de cidade e sistema de comissão/override.

Só avançar de fase depois que a anterior provar que converte — é o que protege de construir infraestrutura cara para um modelo que ainda não validou.

---

## Prompt pronto para o Claude Code

```
Implemente a plataforma "É meu, pode ser seu" — marketplace de venda e aluguel de vestidos de festa em segunda mão, com o seguinte escopo completo. Construa em fases dentro do mesmo projeto, mas deixe a Fase 1 funcionando primeiro e testável isoladamente antes de ativar as fases seguintes.

STACK: Next.js + Vercel (site com áreas: cadastro, vitrine pública, painel da vendedora/loja, painel da embaixadora, painel admin). Supabase (Postgres + Auth + Storage real para fotos + RLS + pg_cron para timers, sem orquestrador externo). Notificação: tabela in-app (`notificacoes`) como canal principal, e-mail transacional e SMS como canais de alcance — nada de n8n/Z-API (WhatsApp só via Evolution API, self-hosted, se/quando necessário). Claude API (tratamento de imagem e sugestão de preço).

MODELO DE DADOS (Supabase, RLS desde o início):
- usuarios: nome, whatsapp, papel (vendedora/loja/compradora/embaixadora, pode acumular), cidade, recrutado_por (self-reference), pix.
- pecas: dono_id, fotos_originais, fotos_tratadas, descricao, tamanho, cor, tecido, estado, tipo (venda/aluguel), preco_anunciado, exclusividade (bool), status (pendente/aprovado/reprovado/reservado/vendido), criado_em.
- reservas: peca_id, compradora_id, valor_proposta, valor_aceito, status (aguardando_confirmacao/confirmada/recusada/contato_liberado), criado_em.
- transacoes: reserva_id, valor_base, percentual_taxa, valor_taxa, status_pagamento, contato_liberado_em.
- comissoes: parceira_id, transacao_id, tipo (direta/override), percentual, valor, paga (bool).
- cashback: usuario_id, origem, valor, criado_em, valido_ate, usado (bool).
- avaliacoes: transacao_id, tipo_alvo (peca/vendedora/locadora), avaliador_id, nota, comentario.
- denuncias_banimento: vendedora_id, motivo, evidencia, avisos, banido_em.

RLS: cada usuária só acessa seus próprios registros. Comissões e transações completas só visíveis para admin e para a própria parceira dona da comissão. Avaliação só pode ser criada se existir uma transação com status_pagamento = 'pago' ligando avaliador e avaliado.

REGRAS DE NEGÓCIO CRÍTICAS:
1. Taxa de pré-venda: 30% do valor fechado para pessoa física, 20% para loja, 60% para venda assistida (quando a vendedora delega a negociação à curadoria). A taxa é calculada sobre o VALOR FECHADO (se houve proposta aceita), não sobre o valor anunciado.
2. Fluxo de reserva: compradora reserva ou propõe valor → sistema notifica a vendedora (notificação in-app + e-mail + SMS) perguntando se ainda está disponível (e se aceita a proposta, se houver) → prazo de 24h (timezone America/Sao_Paulo) → sem resposta, a peça é automaticamente liberada de volta à vitrine e a reserva marcada como recusada, SEM cobrança de taxa. Só após confirmação da vendedora a cobrança da taxa é liberada à compradora.
3. Proposta de valor com piso gradativo, calculado a partir de criado_em da peça: até 30 dias, proposta mínima 90% do anunciado; 30-60 dias, 80%; 60-90 dias, 70%; 90-120 dias, 60%; acima de 120 dias, 50% (piso final). Proposta abaixo do piso é rejeitada no frontend antes de chegar à vendedora.
4. Comissões: uma parceira ganha comissão direta sobre vendas originadas pelos próprios links, sobre QUALQUER peça aprovada da vitrine (não só as dela). Uma embaixadora de cidade ganha adicionalmente um override sobre vendas de lojas que ela recrutou (rastreado via recrutado_por). A embaixadora tem sua própria loja na plataforma, mas paga a taxa padrão de pessoa física/loja normal sobre os produtos dela — não tem desconto por ser embaixadora. TODA comissão nasce de uma transação com pagamento confirmado — nunca de cadastro ou recrutamento isolado, para não configurar marketing multinível ilegal.
5. Cashback: vendedora recebe 10% da taxa em cashback a cada venda. Compradora cadastrada recebe cashback fixo a cada N links do próprio compartilhamento COM CLIQUE REGISTRADO (não basta compartilhar, precisa de acesso real ao link). Cashback tem validade de 90 dias e só pode ser usado para abater a taxa de uma futura compra ou aluguel na própria plataforma — nunca sacável.
6. Exclusividade: peça marcada como exclusiva tem destaque na vitrine. Se for encontrada à venda em outro canal (grupo de WhatsApp, etc.) durante a exclusividade, a vendedora recebe um aviso registrado em denuncias_banimento; na segunda ocorrência, é banida (bloqueio de novos cadastros).
7. Avaliações: após uma transação com pagamento confirmado, compradora e vendedora podem avaliar peça, vendedora e (no caso de aluguel) locadora. Bloquear avaliação sem transação paga vinculada.
8. Trava de autofraude: bloquear reserva/transação onde compradora e vendedora tenham o mesmo número de WhatsApp.
9. IMPORTANTE — decisão de modelagem de negócio: o valor da peça em si (100%) NUNCA passa pelo caixa da plataforma — é acertado e pago diretamente entre vendedora e compradora, fora do sistema. Apenas a taxa de pré-venda (e a taxa de 60% da venda assistida) constituem faturamento da plataforma. Não implemente nenhum fluxo de custódia do valor total da peça.

RISCOS A MITIGAR NO DESENHO:
- Notificação in-app não pode ser o único canal de algo com prazo (vendedora pode não abrir o app) — sempre disparar e-mail e SMS junto, não só a notificação dentro do app.
- Use a service role key do Supabase nas automações que rodam sem sessão de usuário (webhooks, cron), nunca a anon key.
- O timer de 24h de confirmação de disponibilidade precisa do timezone America/Sao_Paulo configurado explicitamente.
- Nada de n8n ou Z-API neste projeto (decisão de custo) — se WhatsApp for necessário no futuro, usar Evolution API (self-hosted).
- Deixe explícito nos termos de uso, reforçado na comunicação automática: a taxa não é reembolsável, mas SÓ é cobrada depois da vendedora confirmar disponibilidade — isso já resolve a maior fragilidade jurídica do modelo anterior.
- Mantenha sempre a regra de que comissão de embaixadora só nasce de venda real, nunca de recrutamento — é o que a diferencia legalmente de pirâmide financeira.

PLANO DE EXECUÇÃO EM FASES (implemente e valide cada fase antes de ativar a próxima):
FASE 1: cadastro de peça, curadoria com aprovação, vitrine pública com filtros (tamanho/cor/tecido/estado/tipo), fluxo completo de reserva → confirmação de disponibilidade → cobrança de taxa → liberação de contato. Sem afiliados, sem cashback ainda.
FASE 2: avaliações (peça/vendedora/locadora), exclusividade e sistema de aviso/banimento, termos de uso com aceite obrigatório por tipo de transação (venda/aluguel), venda assistida (taxa 60%) e atendimento assistido pago.
FASE 3: taxa diferenciada de loja (20%), sistema de cashback (vendedora 10% da taxa, compradora por compartilhamento com clique real, validade 90 dias, uso restrito à plataforma).
FASE 4: programa de parceiros completo — loja-parceira com link próprio e comissão direta, embaixadora de cidade com override sobre lojas recrutadas, painel de rede e comissões.

Ao final de cada fase, gere um resumo do que foi implementado e o que precisa ser testado manualmente antes de seguir para a próxima.
```
