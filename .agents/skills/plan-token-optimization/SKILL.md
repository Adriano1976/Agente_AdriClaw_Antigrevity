---
name: plan-token-optimization
description: >
  Realiza auditoria estratégica completa de codebases para otimização de tokens em contextos de IA — sem alterar nenhum arquivo. Gera um `implementation_plan.md` detalhado com roadmap priorizado e um dashboard HTML visual premium com métricas reais de custo e velocidade. Use esta skill SEMPRE que o usuário quiser: planejar uma refatoração antes de executar, entender o impacto de tokens de um projeto inteiro, receber um relatório visual de qualidade de codebase, estimar economias em dólares por uso de IA, criar um plano de ação para modularização, ou quando disser "auditoria", "diagnóstico", "relatório de tokens", "planejamento de refatoração", "quanto custa meu projeto em tokens", "visão geral do código" ou "antes de refatorar". Acione também para projetos complexos onde a execução direta seria arriscada sem um plano.
---

# Plan Token Optimization

Skill de **auditoria estratégica** — analisa sem tocar, planeja com precisão, entrega visibilidade total.

> Esta skill **nunca modifica arquivos**. Só lê, analisa e produz dois artefatos: `implementation_plan.md` e `dashboard.html`.

---

## Dois Artefatos Produzidos

| Artefato | Formato | Propósito |
|----------|---------|-----------|
| `implementation_plan.md` | Markdown | Roadmap técnico detalhado para a equipe |
| `token-audit-dashboard.html` | HTML standalone | Visual premium para apresentação e decisão |

---

## Fase 1 — Coleta de Dados (somente leitura)

### 1.1 Inventário completo

```bash
# Mapa de tamanho de todos os arquivos de código
find . -type f \( -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" -o -name "*.vue" -o -name "*.py" \) \
  ! -path "*/node_modules/*" ! -path "*/.next/*" ! -path "*/dist/*" ! -path "*/.git/*" ! -path "*/build/*" \
  | xargs wc -l 2>/dev/null | sort -rn | head -50

# Estrutura de pastas (2 níveis)
find . -type d ! -path "*/node_modules/*" ! -path "*/.next/*" ! -path "*/dist/*" ! -path "*/.git/*" \
  | head -40 | sed 's/[^/]*\//  /g'

# Contagem total por extensão
find . -type f ! -path "*/node_modules/*" ! -path "*/.next/*" ! -path "*/dist/*" \
  \( -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" \) \
  | sed 's/.*\.//' | sort | uniq -c | sort -rn
```

### 1.2 Análise de responsabilidades mistas

Para cada arquivo > 200 linhas, verificar:

```bash
# Detectar arquivos com JSX + hooks + lógica juntos (React)
grep -rl "useEffect\|useState\|fetch\|axios" . \
  --include="*.tsx" --include="*.jsx" \
  ! -path "*/node_modules/*" 2>/dev/null | head -20

# Detectar tipos inline em componentes
grep -rn "^interface \|^type " . \
  --include="*.tsx" --include="*.ts" \
  ! -path "*/node_modules/*" 2>/dev/null | wc -l
```

### 1.3 Classificação de severidade

Para cada arquivo identificado, classifique:

| Nível | Critério | Ação no Plano |
|-------|---------|---------------|
| 🔴 **P0 — Crítico** | > 500 linhas OU múltiplas responsabilidades misturadas | Dividir imediatamente |
| 🟠 **P1 — Alto** | 300–500 linhas OU tipos não extraídos | Dividir na próxima sprint |
| 🟡 **P2 — Médio** | 150–300 linhas com 2 responsabilidades | Avaliar caso a caso |
| 🟢 **P3 — Baixo** | < 150 linhas, responsabilidade única | Monitorar |
| ⚪ **OK** | < 100 linhas, bem isolado | Sem ação |

---

## Fase 2 — Cálculos de Custo Real

### 2.1 Estimativa de tokens

```
Tokens por arquivo = linhas × 15  (média TypeScript/TSX)
Tokens por arquivo = linhas × 12  (JavaScript puro)
Tokens por arquivo = linhas × 10  (CSS/JSON/config)

Custo de input (Claude Sonnet) = tokens × $0.000003 por token
Custo de output (Claude Sonnet) = tokens × $0.000015 por token
```

### 2.2 Cenário de sessão típica de desenvolvimento

```
Sessão típica = 20 operações de edição/dia
Proporção input/output = 80% input, 20% output

Custo diário ANTES = soma(arquivo_inteiro × 15) × 20 × custo_médio
Custo diário DEPOIS = soma(módulo_relevante × 15) × 20 × custo_médio

Economia diária = Custo diário ANTES − Custo diário DEPOIS
Economia mensal = Economia diária × 22 dias úteis
Economia anual = Economia mensal × 12
```

### 2.3 Ganho de velocidade (latência)

```
Latência estimada por operação:
  < 2.000 tokens de input:    ~1.5s de espera
  2.000–8.000 tokens:         ~3–6s de espera
  8.000–32.000 tokens:        ~8–15s de espera
  > 32.000 tokens:            ~20–45s de espera

Velocidade relativa = latência_antes / latência_depois
```

Para os valores atualizados de preço, leia `references/pricing.md`.

---

## Fase 3 — Geração do `implementation_plan.md`

Salvar em `./implementation_plan.md` no projeto do usuário (ou apresentar como artefato).

### Estrutura obrigatória do plano:

```markdown
# Implementation Plan — Token Optimization
> Gerado em: [data]  
> Projeto: [nome do projeto]  
> Auditado por: plan-token-optimization skill

---

## Executive Summary

| Métrica | Valor |
|---------|-------|
| Arquivos auditados | N |
| Arquivos críticos (P0) | N |
| Linhas totais de código | N |
| Tokens estimados (sessão atual) | N |
| Custo estimado diário atual | $X.XX |
| Custo estimado após otimização | $X.XX |
| Economia projetada (mensal) | $XX.XX |
| Ganho de velocidade estimado | Xx mais rápido |

---

## Arquivos por Prioridade

### 🔴 P0 — Críticos (ação imediata)
[Para cada arquivo P0:]
#### `caminho/do/arquivo.tsx` — NNN linhas
**Problema:** [descrição do problema específico]
**Divisão proposta:**
- `caminho/componente.tsx` (~XX linhas) — [responsabilidade]
- `caminho/hooks/useX.ts` (~XX linhas) — [responsabilidade]
- `caminho/types/X.types.ts` (~XX linhas) — [responsabilidade]

**Economia estimada:** XX% (~N.NNN tokens por operação)
**Esforço estimado:** N horas / N dias

### 🟠 P1 — Alta Prioridade
[mesma estrutura]

### 🟡 P2 — Média Prioridade
[mesma estrutura]

---

## Roadmap de Execução

### Sprint 1 (Semana 1–2): Arquivos P0
[lista de tarefas com estimativa]

### Sprint 2 (Semana 3–4): Arquivos P1
[lista de tarefas]

### Sprint 3 (Semana 5–6): Arquivos P2 + Extração de tipos
[lista de tarefas]

---

## Estrutura Alvo Pós-Refatoração

[árvore de diretórios proposta]

---

## Riscos e Mitigações

| Risco | Probabilidade | Impacto | Mitigação |
|-------|--------------|---------|-----------|
| Quebra de imports | Alta | Alto | Rodar `tsc --noEmit` após cada módulo |
| Regressão de comportamento | Média | Alto | Testes antes de refatorar |
| Conflitos de merge | Média | Médio | Branch por arquivo refatorado |

---

## Próximos Passos

1. Revisar este plano com a equipe
2. Criar branch `refactor/token-optimization`
3. Executar Sprint 1 usando a skill `optimize-for-tokens`
4. Validar com `tsc --noEmit` e testes após cada arquivo
```

---

## Fase 4 — Geração do Dashboard HTML Visual

Gere o arquivo `token-audit-dashboard.html` usando o template de `assets/dashboard-template.html`.

**Instruções de preenchimento:**
1. Leia o template em `assets/dashboard-template.html`
2. Substitua todos os placeholders `{{VARIAVEL}}` com os dados reais da auditoria
3. Injete o array `FILES_DATA` com os objetos de cada arquivo auditado
4. Injete o array `TIMELINE_DATA` com as sprints do roadmap
5. Salve como `token-audit-dashboard.html` na raiz do projeto

**Variáveis obrigatórias a substituir:**

```
{{PROJECT_NAME}}         → nome do projeto
{{AUDIT_DATE}}           → data da auditoria
{{TOTAL_FILES}}          → total de arquivos auditados
{{CRITICAL_FILES}}       → arquivos P0
{{TOTAL_LINES}}          → linhas totais
{{TOTAL_TOKENS}}         → tokens estimados totais
{{DAILY_COST_BEFORE}}    → custo diário atual em $
{{DAILY_COST_AFTER}}     → custo diário após otimização em $
{{MONTHLY_SAVINGS}}      → economia mensal em $
{{SPEED_GAIN}}           → ganho de velocidade (ex: "3.2x")
{{P0_COUNT}}             → número de arquivos P0
{{P1_COUNT}}             → número de arquivos P1
{{P2_COUNT}}             → número de arquivos P2
{{OK_COUNT}}             → número de arquivos OK
```

---

## Referências Adicionais

- `references/pricing.md` — Preços atualizados das principais LLMs para cálculo de custo
- `assets/dashboard-template.html` — Template HTML completo do dashboard (leia antes de gerar)
