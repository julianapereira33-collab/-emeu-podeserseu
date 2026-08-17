---
name: project-emeu-integridade-negocio
description: Regras de negócio do "É meu, pode ser seu" que o schema não garante — WhatsApp como chave sem unique, estorno que não reverte comissão/cashback, e a decisão intencional da taxa de 30% da embaixadora
metadata:
  type: project
---

Achados de integridade de negócio da auditoria de 16/08/2026 (`docs/auditoria/dados-2026-08-16.md`)
que **não são deriváveis lendo o schema** — vêm do cruzamento entre blueprint, código e RLS.

**1. `usuarios.whatsapp` é chave de negócio sem ser chave de banco.** É gravado exatamente como
digitado, sem normalização e (provavelmente) sem UNIQUE. Consequências reais: a trava anti-autofraude
do `trg_reservas_before_insert` compara os WhatsApps de compradora e vendedora, então `(11) 99999-9999`
vs `11999999999` fura a trava e a pessoa compra da própria peça; e `promoverPapel` /
`definirRecrutadoPor` (painel admin) buscam por `whatsapp` com `maybeSingle()`, que **erra** com
duplicata. A correção certa é normalizar (só dígitos) + unique index sobre a expressão — **não** um
CHECK de formato, que quebraria cadastro em produção.

**2. O estorno não desfaz o que o pagamento fez.** `confirmar_pagamento_taxa` cria cashback de 10% pra
vendedora, comissão direta de 10% e override de 5%. `estornarTransacao` só marca
`status_pagamento = 'estornado'` e devolve no Mercado Pago — as três continuam válidas e pagáveis.
Agravante: `cashback` **não tem `transacao_id`**, então nem dá pra automatizar a reversão ou auditar
de qual venda veio cada crédito.

**3. Taxa de 30% da embaixadora é INTENCIONAL, não bug.** O `CASE` de `trg_reservas_after_update`
avalia `'embaixadora' = any(papel)` **antes** de `'loja'`, então quem tem os dois papéis paga 30% e
não 20%. Fonte: `blueprint-e-meu-pode-ser-seu.md`, seção de papéis — "Tem loja própria dentro da
plataforma, mas paga a taxa padrão (30%) sobre os produtos dela — não o desconto de loja". Não
"consertar" a ordem do CASE. Casos correlatos que o blueprint **não** cobre e que ninguém confirmou
com a Juliana: loja+parceira (não embaixadora) hoje mantém os 20%, e venda assistida sobrepõe tudo
com 60% mesmo para loja.

**4. Validação de negócio que só existe no React.** `nota` de 1 a 5, período de locação não invertido
e unicidade de avaliação são checados apenas no formulário/action — a API REST do Supabase aceita
tudo direto. Avaliação tem leitura pública (`qual: true`), então N inserts afundam a nota de uma
vendedora na vitrine.

**Why:** produção real com dinheiro real, sem staging, e o schema não tem quase nenhum CHECK/UNIQUE —
a aplicação é tratada como se fosse a única porta de entrada, mas o PostgREST expõe as tabelas
diretamente para qualquer pessoa com o anon key (que está no bundle do site).

**How to apply:** ao propor qualquer regra de negócio nova neste projeto, perguntar "e se chamarem a
API REST direto, sem passar pela tela?" — se a resposta quebra dinheiro ou reputação, a regra tem que
descer para constraint, trigger ou RLS. E antes de criar qualquer CHECK/UNIQUE, rodar a query de
sanidade (Q9 da auditoria): constraint que falha no ALTER em produção é pior que constraint ausente.

Ver também [[project-emeu-riscos-db]] e [[project-schema-source-of-truth]].
