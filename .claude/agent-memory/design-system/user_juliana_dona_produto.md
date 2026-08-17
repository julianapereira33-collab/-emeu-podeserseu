---
name: juliana-dona-produto
description: Juliana é a dona do "É meu, pode ser seu" — não é designer nem desenvolvedora, quer avaliação técnica real traduzida em impacto de negócio, em português
metadata:
  type: user
---

Juliana é a dona do produto. Não é designer nem desenvolvedora, mas **não quer avaliação
simplificada nem genérica** — pediu explicitamente análise real, com referência a arquivo e linha, e
com separação clara entre **o que é urgente pro negócio** (ex.: preview quebrado no WhatsApp = perde
crescimento) e **o que é polish estético**.

Como colaborar bem com ela em design:
- Responder em **português brasileiro**.
- Traduzir cada achado técnico em consequência de negócio ("a vendedora desiste no meio", "o link
  morre no grupo"), nunca só em jargão de acessibilidade ou performance.
- Manter os números (contagens, contrastes calculados, tamanhos de arquivo) — ela leva a sério
  evidência medida, mas ela precisa vir acompanhada da explicação do que significa.
- Priorizar por impacto, não por severidade técnica. Um `aria-label` faltando não compete com um
  upload de 100 MB no 4G.

**Why:** o contexto obrigatório de avaliação que ela definiu é que o público real (vendedoras e
compradoras) vem de grupos de WhatsApp, usa celular e não é tech-savvy — ver
`.claude/agent-memory/aiox-ux/project_publico_mobile_whatsapp.md`. Ela decide com base em
"isso me faz perder venda?", não em "isso viola WCAG".

**How to apply:** em qualquer entrega de design aqui, abrir com um resumo executivo do tipo "os N
que custam dinheiro" antes de qualquer detalhamento técnico, e fechar com uma ordem de execução por
etapas com estimativa de esforço. Ver [[auditoria-sem-browser]].
