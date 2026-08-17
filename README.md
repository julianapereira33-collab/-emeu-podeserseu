# É meu, pode ser seu

Marketplace de moda circular (venda e aluguel de vestidos de festa em segunda mão). Ver
`blueprint-e-meu-pode-ser-seu.md` para o desenho completo do produto.

Status: **Fases 1, 2, 3 e 4 implementadas**.
- Fase 1: cadastro de peça, curadoria, vitrine pública com filtros, reserva → confirmação de
  disponibilidade (24h) → cobrança da taxa → contato liberado.
- Fase 2: avaliações (peça/vendedora/locadora), exclusividade com aviso/banimento em 2 ocorrências,
  termos de uso com aceite obrigatório por tipo de transação, venda assistida (taxa 60%) e
  atendimento assistido pago (curadoria / prova presencial).
- Fase 3: taxa de loja (20%, já valia desde a Fase 1) e cashback — 10% da taxa para a vendedora a
  cada venda, e cashback fixo para a compradora a cada 5 cliques reais em links de compartilhamento
  (`/r/[id]`), com validade de 90 dias e uso restrito a abater a taxa de uma futura reserva.
- Fase 4: programa de parceiros — cadastro com papel "parceira"; `/painel/parceira` (também usado
  por embaixadoras) com link geral de divulgação, comissões e, para embaixadoras, a rede de lojas
  recrutadas; `/painel/admin` ganhou a seção "Parceiros e embaixadoras" (promover papel, vincular
  loja recrutada a uma embaixadora) e "Comissões pendentes de pagamento". Comissão direta (10% da
  taxa) quando a venda vem de um link de parceira/embaixadora, e override (5%) quando a vendedora
  foi recrutada por uma embaixadora — sempre calculada sobre transação paga, nunca sobre cadastro
  ou recrutamento isolado.

## Stack

- Next.js (App Router) + Tailwind
- Supabase (Postgres + Auth + Storage + RLS) — projeto `emeu-podeserseu` (`sa-east-1`)
- Regras de negócio (piso de proposta, cálculo de taxa, expiração de reserva em 24h) vivem no
  Postgres via triggers/functions, não na aplicação — ver migrations `fase1_*` no projeto Supabase.
- Sugestão de preço por IA (opcional): Anthropic API, configurável via `ANTHROPIC_API_KEY`.

## Rodando localmente

```bash
npm install
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000). As credenciais do Supabase já estão em
`.env.local` (não commitado).

## Como testar o fluxo completo

1. Crie uma conta em `/cadastro` como **vendedora**. O projeto Supabase tem confirmação de e-mail
   habilitada por padrão — confirme o e-mail antes do primeiro login (ou desative a confirmação
   nas configurações de Auth do projeto para testes locais).
2. Para promover um usuário a **admin** (curadoria), rode no SQL editor do Supabase:
   ```sql
   update usuarios set papel = array_append(papel, 'admin') where whatsapp = '<whatsapp da conta>';
   ```
3. Cadastre uma peça em `/painel/vendedora/nova-peca`, aprove em `/painel/admin` (com o usuário
   admin), depois reserve/proponha em `/pecas/[id]` com uma conta **compradora**.
4. Confirme a disponibilidade em `/painel/vendedora`, pague a taxa via Pix em `/painel/compradora`
   (escaneie o QR code ou copie o código — em ambiente de teste do Mercado Pago, use o app do
   comprador de teste) e veja o contato liberado quando o webhook confirmar.
5. Depois do contato liberado, avalie a peça e a vendedora/locadora direto em
   `/painel/compradora`.
6. Para testar exclusividade/banimento: cadastre uma peça marcando "exclusividade", aprove-a, e em
   `/painel/admin` registre uma denúncia contra a vendedora duas vezes — na segunda, ela é banida e
   perde acesso a `/painel/vendedora/nova-peca`.
7. Para venda assistida: marque "venda assistida" ao cadastrar a peça — a taxa da transação sai
   automaticamente em 60% em vez de 30/20%.
8. Para atendimento assistido: solicite em `/painel/vendedora`, defina o valor em `/painel/admin`,
   pague de volta em `/painel/vendedora` via Pix (mesmo fluxo real da taxa).
9. Para cashback: em `/painel/compradora`, gere um link de compartilhamento e abra-o (em outra aba
   ou navegador anônimo) 5 vezes — cada abertura é um "clique real"; a cada 5, R$ 15 de cashback são
   creditados. Ao pagar a taxa de uma próxima reserva, o saldo pode ser usado para abater o valor.
   A vendedora recebe cashback automaticamente (10% da taxa) a cada venda paga.
10. Para parceria/embaixadoras: cadastre uma conta com papel "parceira"; em `/painel/admin`, na
    seção "Parceiros e embaixadoras", promova essa conta a embaixadora se quiser testar o override,
    e vincule uma loja a ela como recrutada. Na conta parceira, gere o link geral em
    `/painel/parceira` (ou compartilhe uma peça específica em `/pecas/[id]`) — uma compradora que
    reservar e pagar a taxa a partir desse link gera comissão direta (10% da taxa) para a parceira;
    se a vendedora da peça foi recrutada por uma embaixadora, a venda também gera override (5%) para
    a embaixadora, mesmo sem link. Marque as comissões como pagas em `/painel/admin`.

## Pagamento da taxa (Pix via Mercado Pago)

O botão "pagar taxa" em `/painel/compradora` gera uma cobrança Pix real pela API do Mercado Pago
(QR code + código copia-e-cola). A confirmação chega por webhook (`/api/webhooks/mercadopago`), que
busca o pagamento direto na API do Mercado Pago (nunca confia no payload da notificação) e só então
chama `confirmar_pagamento_taxa` — a mesma função que já fazia a liberação de contato, cashback da
vendedora e cálculo de comissões. Há também um polling no navegador que confirma na hora se o webhook
demorar.

Variáveis necessárias (ver `.env.local`):
- `MERCADO_PAGO_ACCESS_TOKEN` — comece com o de teste (`TEST-...`) antes de trocar pelo de produção.
- `SUPABASE_SERVICE_ROLE_KEY` — usada só pelo webhook, que roda sem sessão de usuário.

No painel do Mercado Pago, cadastre a notification URL: `https://<seu-domínio>/api/webhooks/mercadopago`.

## Correção de segurança (16/08/2026)

Três funções (`iniciar_pagamento_pix`, `iniciar_pagamento_pix_atendimento`,
`registrar_intencao_pagamento_taxa`) checavam dono da transação com `<>` em vez de `IS DISTINCT FROM`
e estavam liberadas pro papel `anon` — visitante sem login conseguia sobrescrever `mp_payment_id`
(usado pelo estorno do admin) e `usar_cashback_solicitado` de transação alheia. Corrigido no banco:
comparação trocada por `IS DISTINCT FROM` nas três, e `EXECUTE` revogado de `anon` (só `authenticated`
chama agora). Confirmado com teste de bypass antes e depois da correção.

## O que ainda é simulado / falta para produção

- **Notificação de reserva pendente**: **implementada e ativa em produção**, cobrindo os 3 pontos do
  fluxo (nova reserva avisa a vendedora; confirmação/recusa — manual ou pela expiração automática de
  24h via `pg_cron`, `expirar_reservas_vencidas` a cada 15 min — avisa a compradora), por dois canais:
  - **In-app**: sino no menu, tabela `notificacoes`, trigger no banco (migration
    `fase7_notificacoes_inapp`).
  - **WhatsApp real**, via Evolution API self-hosted (instância dedicada `emeu-podeserseu` na VPS
    própria da Juliana — decisão de 05/08/2026 de não usar Z-API/n8n cloud por custo). Disparado
    **direto do Postgres via `pg_net`** (migration `fase7c_whatsapp_via_pg_net`), não pelo Next.js —
    isso é o que permite cobrir também a expiração automática do `pg_cron`, que não passa por nenhuma
    rota da aplicação. Credenciais da Evolution API ficam no Supabase Vault (criptografadas), lidas
    só dentro da função do trigger. Canal auxiliar: se a chamada falhar, a notificação in-app (que já
    aconteceu no mesmo trigger) garante que a pessoa saiba pelo painel mesmo assim.
  - Testado de ponta a ponta em produção (dado sintético, limpo depois) nos dois caminhos —
    manual e automático — confirmando entrega real (HTTP 201 da Evolution API).
  - **Falta**: e-mail e SMS como canais adicionais (precisam de provedor + credenciais).
- ~~**Atendimento assistido**: o pagamento também é simulado~~ — **implementado em 11/08/2026**:
  Pix real via Mercado Pago, mesmo padrão da taxa (`iniciar_pagamento_pix_atendimento` /
  `confirmar_pagamento_atendimento`, webhook único em `/api/webhooks/mercadopago` reconhece taxa e
  atendimento pelo `external_reference`). Testado de ponta a ponta em produção (dado sintético,
  limpo depois): geração de cobrança, confirmação e trava de pagamento duplicado, todos OK.
- ~~**Anti-fraude do cashback por compartilhamento**: só havia throttle de 1 clique a cada 10 min por
  link, sem fingerprint nenhum~~ — **reforçado em 15/08/2026**: geração de link agora é limitada a 1
  por peça por usuária + 1 link geral (antes, cada clique no botão criava um link novo, sem limite —
  dava pra gerar dezenas de links e abrir cada um uma vez via script, sem sessão, pra farmar cashback
  instantaneamente). Cada clique também grava o hash do IP (nunca o IP cru), e o throttle passou a
  considerar "mesmo IP já contou um clique pra essa usuária nas últimas 24h" — não só o mesmo link.
  Trava adicional: no máximo 3 créditos de cashback (R$45) por dia por usuária nessa origem, mesmo que
  as camadas anteriores sejam contornadas (ex.: várias redes/VPN). Ainda não há CAPTCHA nem análise de
  comportamento — suficiente pra MVP, mas revisar de novo se o programa escalar.
- **Auto-serviço de parceria**: ~~hoje só o admin promove uma conta a parceira~~ — **correção
  (16/08/2026): isso está errado, o cadastro já tem "Parceira (divulgo peças por comissão)" como
  opção direta desde sempre** (`/cadastro`), confirmado como intencional. O que de fato só o admin
  faz é promover a **embaixadora** e vincular lojas recrutadas a ela (via WhatsApp, em
  `/painel/admin`) — não há fluxo de auto-cadastro de embaixadora nem de uma loja se "vincular"
  sozinha a uma embaixadora.

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
