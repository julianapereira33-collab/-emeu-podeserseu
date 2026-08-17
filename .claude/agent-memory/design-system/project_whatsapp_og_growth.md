---
name: whatsapp-og-growth
description: O preview de link no WhatsApp é o motor de crescimento do "É meu, pode ser seu" e estava 100% ausente em 2026-08-16 — nenhum og:*, /r/[id] é redirect puro
metadata:
  type: project
---

O produto cresce colando link de peça em grupo de WhatsApp (`/r/[id]` → clique real → cashback e
comissão de parceira). Em 2026-08-16 esse loop estava quebrado nos quatro pontos ao mesmo tempo:

- Existe **um único** `export const metadata` em todo o `src/` (o genérico do `layout.tsx`). Zero
  `generateMetadata`, zero `openGraph`, zero `metadataBase`, zero `opengraph-image`.
- `/r/[id]` é `route.ts` devolvendo `NextResponse.redirect` — não tem HTML, não tem `<head>`.
- `/r/[id]` insere em `cliques_compartilhamento` em **todo GET**, sem filtrar user-agent — a
  pré-visualização do robô do WhatsApp já conta como clique pago.
- O botão de compartilhar só renderiza para usuária logada que **não** é dona da peça, e entrega o
  link como texto cru sem copiar e sem `navigator.share()`.

**Why:** sem `og:image` o link vira uma caixinha cinza no grupo e o vestido — a única coisa que faz
alguém clicar — fica invisível. É o achado de maior retorno de toda a auditoria de design, e não é
questão estética: é aquisição.

**How to apply:** ao mexer em `/pecas/[id]`, `/r/[id]` ou em qualquer coisa de compartilhamento,
tratar o preview como requisito, não como enfeite. A foto certa para o `og:image` é a **tratada**
(com marca d'água) — é para isso que ela existe. Fotos são 3:4 e o card do WhatsApp é ~1.91:1, então
vale gerar imagem OG composta em vez de usar a foto crua. Ao adicionar OG, corrigir junto o filtro de
bot em `/r/[id]`, senão a contaminação da métrica de cliques piora. Ver
[[auditoria-design-2026-08]].
