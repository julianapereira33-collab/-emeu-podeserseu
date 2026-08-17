# Memory Index

- [Schema: fonte de verdade](project_schema_source_of_truth.md) — sem migrations no repo; schema só existe em prod, `database.ts` é proxy parcialmente dessincronizado
- [Riscos de segurança no DB](project_emeu_riscos_db.md) — padrão de bug em checagem de dono (`<>` vs `IS DISTINCT FROM`), pegadinha de GRANT em CREATE OR REPLACE, e as superfícies ainda não confirmadas
- [Integridade de negócio](project_emeu_integridade_negocio.md) — WhatsApp sem unique fura a trava anti-autofraude, estorno não reverte comissão/cashback, taxa de 30% da embaixadora é intencional
