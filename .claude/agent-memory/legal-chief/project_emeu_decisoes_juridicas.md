---
name: project-emeu-decisoes-juridicas
description: Decisões jurídicas deliberadas do "É meu, pode ser seu" (não custodiar valor, comissão só sobre venda paga, cashback não sacável) e por que são inegociáveis
metadata:
  type: project
---

Três regras do produto são **decisões jurídicas deliberadas**, não acidentes de implementação. Nunca
sugerir mudá-las sem alertar a consequência.

1. **O valor da peça (100%) nunca passa pelo caixa da plataforma** — só a taxa de intermediação
   (30% PF / 20% loja / 60% venda assistida, paga pela compradora).
   **Why:** protege de virar instituição de pagamento (Resolução BCB nº 80/2021) e mantém o regime
   tributário simples.
   **How to apply:** qualquer proposta de custódia, escrow ou split do valor da peça exige alerta
   regulatório + conversa com contador antes.
   ⚠️ Não protege de responsabilidade consumerista — são coisas distintas, e o blueprint mistura as
   duas. A plataforma se comporta como marketplace **ativo** (curadoria, controle do contato,
   comissão sobre a transação, banimento), então responsabilidade solidária pelo CDC é risco real.

2. **Comissão de parceria (10% direta + 5% override) só nasce de transação com pagamento
   confirmado** — nunca de cadastro ou recrutamento.
   **Why:** é o que separa juridicamente o modelo de pirâmide financeira (art. 2º, IX da Lei
   1.521/1951 — crime contra a economia popular). Auditoria de 2026-08-16 deu risco **BAIXO** para
   esse ponto.
   **How to apply:** gatilhos que viram o jogo — cobrar para entrar no programa, 3º nível de
   override, bônus por meta de recrutamento, ou território exclusivo + marca + contraprestação
   (isso viraria franquia sob a Lei 13.966/2019, que revogou a 8.955/1994).

3. **Cashback nunca é sacável nem transferível** — só abate taxa de reserva futura, validade 90 dias.
   **Why:** mantém o cashback como desconto comercial em vez de moeda eletrônica, o que traria o
   Banco Central para a conversa.
   **How to apply:** rejeitar qualquer pedido de "sacar o cashback" ou "transferir para uma amiga".

Relatório completo: `docs/auditoria/juridico-2026-08-16.md`. Ver também
[[project-emeu-lacunas-juridicas]].
