---
name: publico-mobile-whatsapp
description: Público real do "É meu, pode ser seu" são vendedoras/compradoras vindas de grupos de WhatsApp, majoritariamente mobile e pouco tech-savvy — isso é o critério de decisão em UX
metadata:
  type: project
---

O produto nasceu organizando vendas em grupo de WhatsApp. O público real (vendedoras e compradoras)
acessa quase tudo pelo celular e não é tech-savvy. O loop de crescimento é colar link de peça em
grupo de WhatsApp (`/r/[id]` → cashback por clique real → comissão de parceira).

**Why:** definido pela dona do produto como contexto obrigatório de avaliação de UX — não está escrito
no código nem no README, mas muda toda a priorização (mobile-first, linguagem simples, menos passos,
preview de link no WhatsApp, compartilhamento nativo, recuperação de senha, uploads leves em 4G).

**How to apply:** ao avaliar ou projetar qualquer tela, priorizar (1) o que funciona em celular com
conexão ruim, (2) o que reduz passos/atrito em formulário (o cadastro de peça exige 3 fotos + vídeo +
4 medidas), (3) copy sem jargão técnico, (4) tudo que é compartilhado no WhatsApp precisa de preview
e botão de copiar/enviar. Recursos "desktop-first" (painel admin denso, filtros laterais) são de
prioridade menor.
