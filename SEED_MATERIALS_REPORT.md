# SEED_MATERIALS_REPORT

Gerado em: **2026-05-02T00:14:05.958Z**

## Parâmetros

| Campo | Valor |
|-------|--------|
| Arquivo TSV | `C:\Users\Gabriel Costa\Documents\GitHub\ERPCOZERP\scripts\materials-catalog.tsv` |
| Linhas de dados (parseadas) | 106 |
| Fornecedor padrão | `COZINCA INOX` |

## Resultado

| Métrica | Quantidade |
|---------|------------|
| **Novos registros** (insert) | 0 |
| **Atualizados** (dados diferentes) | 0 |
| **Sem alteração** (já igual) | 106 |
| **Erros** | 0 |



## Observações

- Script idempotente: reexecução não duplica linhas (`code` único).
- Campos preenchidos: `code`, `name`, `material_code`, `material_type`, `unit`, `thickness` (quando houver), `supplier_default`.
