---
name: project-emeu-lacunas-juridicas
description: Lacunas jurídicas encontradas na auditoria de 2026-08-16 do "É meu, pode ser seu" — verificar se já foram corrigidas antes de repetir o diagnóstico
metadata:
  type: project
---

Estado em **2026-08-16** (auditoria completa em `docs/auditoria/juridico-2026-08-16.md`). Verificar
no código antes de citar — podem ter sido corrigidas.

**Why:** produto está em produção real com pagamento real; essas lacunas são o que geraria uma
reclamação de Procon/ANPD antes de qualquer outra coisa.
**How to apply:** em qualquer trabalho jurídico futuro neste projeto, checar primeiro se estes itens
saíram da lista antes de propor coisa nova.

Lacunas de nível ALTO no momento da auditoria:
- Não existia **Política de Privacidade** nem página `/privacidade` — busca por "privacidade"/"LGPD"
  em `src/` retornava zero. Também não havia rodapé (`layout.tsx` sem footer) e `/termos` não estava
  na navegação.
- **Valor da taxa não era exibido** antes da compradora se comprometer (`src/app/pecas/[id]/page.tsx`
  mostra só o preço da peça). Link "Como funciona" era `hidden sm:inline` — sumia no celular, onde
  está todo o público.
- **Vendedora/locadora nunca aceitava termos** — `termos_aceitos`/`termos_versao` só existem em
  `reservas`, preenchidos pela compradora. Banimento e exclusividade sem base contratual.
- **Sem verificação de idade** no cadastro, num produto de vestido de formatura/15 anos, com
  contrato de aluguel que impõe multa e indenização.

Correções de premissa que valem lembrar:
- As colunas `medida_busto_cm`/`cintura`/`quadril`/`comprimento` em `pecas` são **medidas da peça de
  roupa**, não do corpo de ninguém. Não são dado pessoal nem sensível. Não repetir esse erro.
- O `PEPPER` do hash de IP em `src/app/r/[id]/route.ts` estava **em texto puro no código** — o
  comentário do arquivo afirma que não precisa ser segredo, o que não se sustenta (SHA-256 sobre o
  espaço IPv4 é reversível em minutos com o pepper conhecido).

Ver [[project-emeu-decisoes-juridicas]] e [[user-juliana]].
