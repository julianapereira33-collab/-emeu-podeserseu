---
name: debito-componentes
description: Métricas de duplicação de UI do "É meu, pode ser seu" em 2026-08-16 — 12 variantes de botão, 5 de campo, 9 de aviso, 3 cópias do gerar-link, 2 do upload
metadata:
  type: project
---

Não existe nenhum componente de UI compartilhado além de `PecaCard`, `SeletorCor` e
`NotificacoesSino`. Tudo é Tailwind inline, e cada tela evoluiu por conta própria. Medido sobre 49
arquivos `.tsx`:

| Padrão | Variantes | Ocorrências |
|---|---|---|
| Botão dourado primário | 7 tamanhos/tipografias | 26 |
| Botão secundário | 3 | 10 |
| Botão destrutivo | 2 | 2 |
| Campo de formulário | 5 | 55 |
| Caixa de aviso/callout | 9 (3 tons do mesmo dourado) | ~15 |
| "Gerar link de compartilhamento" | 2 visuais, lógica idêntica | 3 cópias |
| Upload de foto com marca d'água | 2 implementações divergentes | 2 cópias |
| Card de peça | 3 implementações | 3 |

Dois sintomas que valem mais que os números:
- **Hierarquia invertida:** os botões que movem dinheiro (pagar taxa, confirmar disponibilidade,
  aprovar peça) são `text-xs px-3 py-1.5` (~30px) — menores que o botão da página de erro 404
  (`px-4 py-2`, ~42px).
- **Escala tipográfica de monitor:** 112 usos de `text-xs` (12px) + 132 de `text-sm` (14px) + 13 de
  `text-[10/11px]`, contra **1 uso** de `text-base` (16px). Não há corpo de leitura no produto.

Proposta registrada no relatório: 45 padrões → 9 componentes base (`Botao`, `Campo`, `Aviso`,
`Badge`, `PecaCard` com slot, `CompartilharLink`, `useUploadFoto`, `Marca`, `CampoFoto`) = ~80% de
redução.

**Why:** as correções urgentes de negócio (compartilhamento, upload, tamanho de botão) precisam ser
repetidas de 3 a 12 vezes hoje. Foi assim que `autoComplete` acabou existindo em `/recuperar-senha` e
`/auth/nova-senha` e faltando em `/login` e `/cadastro`.

**How to apply:** não propor a refatoração como projeto isolado — ela se paga como pré-requisito das
correções da Etapa 1 e 2 do relatório. Ao extrair `<Botao>`, embutir `min-h-[44px]`; ao extrair
`<Campo>`, embutir `font-size: 16px` (mata o zoom automático do iOS em todos os formulários de uma
vez). Ver [[fundacao-design]].
