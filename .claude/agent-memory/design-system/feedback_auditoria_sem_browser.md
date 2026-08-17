---
name: auditoria-sem-browser
description: Em auditorias de design neste projeto, separar explicitamente fato-de-código de dedução e nunca afirmar ter visto a tela rodando
metadata:
  type: feedback
---

Ao auditar design/layout sem acesso a navegador, marcar cada achado como **fato de código**
(provável abrindo o arquivo) ou **precisa verificação visual** — e listar os itens visuais num anexo
curto no fim do relatório.

**Why:** pedido explícito da Juliana ao encomendar a auditoria de 2026-08-16 — o agente não tem
browser e ela não quer conclusão inventada sobre "como a tela realmente renderiza". Vários achados
importantes (modo escuro, zoom do iOS, slots de foto espremidos) são deduções de cascata CSS com
alta probabilidade, mas só um celular na mão confirma o tamanho do estrago.

**How to apply:** vale para qualquer auditoria futura aqui. Escrever a seção "como isso foi feito e o
que não foi visto" no começo, usar um marcador visível (👁) nos itens deduzidos, e fechar com o anexo
de verificação visual em ordem de impacto. Também evita que um item deduzido vire tarefa de
desenvolvimento antes de 30 segundos de checagem. Ver [[auditoria-design-2026-08]] e
[[juliana-dona-produto]].
