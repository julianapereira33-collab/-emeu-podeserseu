---
name: fundacao-design
description: Como a base visual do "É meu, pode ser seu" está montada — 3 tokens dourados, Playfair só no menu, Arial vencendo Geist, Tailwind v4 sem tailwind.config
metadata:
  type: project
---

A fundação visual do produto é intencionalmente mínima e tem duas armadilhas herdadas do template
inicial do Next.

**O que existe de decisão de marca real:**
- 3 tokens dourados em `src/app/globals.css`: `--gold-light: #e8d9a0`, `--gold: #b8973f`,
  `--gold-dark: #8a7025`. Consistentes em todas as telas — é a única coisa que unifica a identidade.
- O "logo estilizado" do nome do site é **Playfair Display 600** em `src/components/nav.tsx`
  (importado localmente no componente, não no layout). Aparece em **um único lugar do produto**.
- Tailwind v4 via `@tailwindcss/postcss`, **sem `tailwind.config.js`** — a configuração vive no
  bloco `@theme inline` do `globals.css`.

**As duas armadilhas (ambas do boilerplate, nenhuma é decisão de design):**
1. `body { font-family: Arial, Helvetica, sans-serif }` no `globals.css`. Como essa regra está fora
   de qualquer `@layer` e as utilities do Tailwind v4 ficam em `@layer utilities`, ela vence — o
   site inteiro renderiza em Arial. Geist e Geist Mono são baixadas em toda visita e **nunca usadas**
   (`font-sans` não aparece em nenhum arquivo).
2. `@media (prefers-color-scheme: dark)` trocando `--background`/`--foreground`, pelo mesmo motivo de
   cascata, provavelmente vence o `bg-white text-neutral-900` do `<body>`. Não existe uma única
   classe `dark:` no projeto, então não há tema escuro de verdade — só o risco de quebrar.

**Why:** entender que Arial e o modo escuro **não são escolhas da Juliana** evita "respeitar" um
padrão que ninguém decidiu. Remover os dois é correção, não mudança de direção.

**How to apply:** qualquer trabalho de tipografia começa por apagar o `font-family` do `body`.
Qualquer token novo vai no `@theme` do `globals.css` (não criar `tailwind.config.js`). Ver
[[debito-componentes]] para os tokens semânticos que faltam.
