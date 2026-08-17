---
name: auditoria-design-2026-08
description: Auditoria de design/layout/marca do "É meu, pode ser seu" feita em 2026-08-16 por leitura de código — escopo, achados urgentes e onde está o relatório
metadata:
  type: project
---

Relatório em `docs/auditoria/design-2026-08-16.md`. Feito **só por leitura de código** (49 arquivos
`.tsx`, `globals.css`, `layout.tsx`, `next.config.ts`, `public/`), sem navegador. Nenhum arquivo do
produto foi alterado.

Os 8 achados classificados como urgentes pro negócio (em oposição a polish estético):

1. Nenhuma meta tag Open Graph existe no projeto — link no WhatsApp sai sem foto do vestido.
2. `/r/[id]` conta a pré-visualização do robô do WhatsApp como "clique real" de cashback.
3. A vendedora não tem botão para compartilhar a própria peça (só o ramo `!ehDona` renderiza).
4. O link gerado é texto cru sem copiar/enviar — 6 passos para a ação que sustenta o crescimento.
5. `@media (prefers-color-scheme: dark)` herdado do template do Next provavelmente deixa o site
   ilegível no celular com tema escuro (regra fora de layer vence utility do Tailwind v4).
6. Vitrine sem `.limit()` + `<img>` sem lazy + `icon.png` de 1,49 MB = página impossível no 4G.
7. Cadastro de peça sobe ~2× o tamanho original de cada foto + vídeo cru, sem progresso nem rascunho.
8. Sem menu no celular (`hidden sm:inline`) e sem rodapé — /quem-somos, /como-funciona e /termos
   ficam inalcançáveis justamente para quem chegou de grupo de WhatsApp.

**Why:** Juliana pediu avaliação real e priorizada por impacto de negócio, não checklist genérico de
design. Os itens 1-4 são todos a mesma coisa (o loop de crescimento por link em grupo) e estão
quebrados ao mesmo tempo.

**How to apply:** antes de propor qualquer trabalho de design neste projeto, checar se o item já foi
resolvido — o relatório é uma foto de 2026-08-16. Se for retomar, a Etapa 0 do relatório são 5
correções de meia hora com retorno desproporcional. Ver [[whatsapp-og-growth]],
[[debito-componentes]], [[fundacao-design]].
