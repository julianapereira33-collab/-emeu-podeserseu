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
4. Confirme a disponibilidade em `/painel/vendedora`, pague a taxa (simulada) em
   `/painel/compradora` e veja o contato liberado.
5. Depois do contato liberado, avalie a peça e a vendedora/locadora direto em
   `/painel/compradora`.
6. Para testar exclusividade/banimento: cadastre uma peça marcando "exclusividade", aprove-a, e em
   `/painel/admin` registre uma denúncia contra a vendedora duas vezes — na segunda, ela é banida e
   perde acesso a `/painel/vendedora/nova-peca`.
7. Para venda assistida: marque "venda assistida" ao cadastrar a peça — a taxa da transação sai
   automaticamente em 60% em vez de 30/20%.
8. Para atendimento assistido: solicite em `/painel/vendedora`, defina o valor em `/painel/admin`,
   pague de volta em `/painel/vendedora`.
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

## O que ainda é simulado / falta para produção

- **Pagamento da taxa**: o botão "pagar taxa" chama diretamente a função `confirmar_pagamento_taxa`
  no banco — não há integração real com gateway Pix (Mercado Pago) ainda.
- **Notificação via WhatsApp (Z-API)**: a expiração de reserva em 24h roda inteiramente no Postgres
  via `pg_cron` (`expirar_reservas_vencidas`, a cada 15 min) — funciona, mas ninguém é avisado por
  WhatsApp ainda. Isso substitui o timer do n8n descrito no blueprint; o disparo de mensagem via
  Z-API (pedir confirmação à vendedora, lembrete, etc.) ainda não está implementado.
- **Atendimento assistido**: o pagamento também é simulado, mesmo padrão da taxa.
- **Anti-fraude do cashback por compartilhamento**: a mitigação atual é só um throttle de 1 clique
  contabilizado a cada 10 min por link (evita F5 repetido) — não há fingerprint de IP/dispositivo.
  Suficiente para MVP, mas revisar antes de escalar o programa.
- **Auto-serviço de parceria**: hoje só o admin promove uma conta a parceira/embaixadora e vincula
  lojas recrutadas (via WhatsApp, em `/painel/admin`). Não há fluxo de auto-cadastro de embaixadora
  nem de uma loja se "vincular" sozinha a uma embaixadora.

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
