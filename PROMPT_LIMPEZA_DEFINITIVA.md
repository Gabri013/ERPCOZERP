PROMPT DEFINITIVO — LIMPEZA REAL DA RAIZ
================================================================

OBJETIVO: Reduzir a raiz para ≤22 arquivos, mantendo apenas o essencial.

REPOSITÓRIO: https://github.com/Gabri013/ERPCOZERP
BRANCH: main
ESTADO: 19 arquivos na raiz (commit adc9769)

ETAPA 1 — DIAGNÓSTICO GitHub Languages
- Acesse a página do repo
- Barra lateral 'Languages': anote % TypeScript vs JavaScript

ETAPA 2 — AÇÃO (se necessário)
- Remover da raiz: ts-errors*.txt (se existirem)
- NÃO tocar: prettier.config.mjs (único .mjs legítimo)
- NÃO tocar: apps/, scripts/, tests/ (subdirs)

ETAPA 3 — COMMIT
git add -A
git commit -m 'chore: final root cleanup — remove diagnostic artifacts'
git push origin main

ETAPA 4 — VERIFICAÇÃO
GitHub Languages: TypeScript >60%, JavaScript <10%

CRITÉRIOS:
✅ ≤22 arquivos na raiz
✅ zero .ps1/.bat/.cjs na raiz
✅ prettier.config.mjs é o ÚNICO .mjs na raiz
✅ Build/lint funcionam
