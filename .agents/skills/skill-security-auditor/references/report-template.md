# Template de Relatório de Segurança

Use este template para estruturar o relatório de auditoria. Preencha cada seção com base nos achados.

---

```
╔══════════════════════════════════════════════════════════════╗
║          RELATÓRIO DE AUDITORIA DE SEGURANÇA — SKILL         ║
╠══════════════════════════════════════════════════════════════╣
║  Skill auditada : [nome da skill]                            ║
║  Caminho        : [caminho da pasta]                         ║
║  Data           : [data da auditoria]                        ║
║  Arquivos lidos : [lista dos arquivos analisados]            ║
╚══════════════════════════════════════════════════════════════╝
```

---

## 🔍 Resumo Executivo

> Breve parágrafo (3-5 linhas) descrevendo o propósito da skill auditada,
> o escopo da auditoria e a impressão geral de segurança.

**Total de achados:**

| Severidade  | Quantidade |
|-------------|-----------|
| 🔴 CRÍTICA  | X         |
| 🟠 ALTA     | X         |
| 🟡 MÉDIA    | X         |
| 🔵 BAIXA    | X         |
| ℹ️ INFORMATIVA | X      |
| **TOTAL**   | **X**     |

---

## 🎯 Pontuação de Risco Geral

```
[ SEGURA ]  — Nenhum achado crítico ou alto. Skill bem estruturada.
[ ATENÇÃO ] — Achados de média/baixa severidade presentes. Revisar antes de produção.
[ VULNERÁVEL ] — Um ou mais achados ALTOS presentes. Correção recomendada antes do uso.
[ CRÍTICA ]  — Um ou mais achados CRÍTICOS presentes. NÃO usar em produção.
```

**Pontuação**: `[INSERIR]`

---

## 📋 Achados Detalhados

> Repita o bloco abaixo para cada achado encontrado, ordenados por severidade (CRÍTICA primeiro).

---

### Achado #[N] — [Título curto do problema]

| Campo         | Valor                          |
|---------------|-------------------------------|
| **Categoria** | CAT-XX · [Nome da categoria]  |
| **Severidade**| 🔴 CRÍTICA / 🟠 ALTA / 🟡 MÉDIA / 🔵 BAIXA / ℹ️ INFORMATIVA |
| **Arquivo**   | `[nome-do-arquivo.md]`         |
| **Linha(s)**  | [número(s) de linha]           |

**Evidência** (trecho exato do arquivo):
```
[cole aqui o trecho relevante do arquivo auditado]
```

**Descrição do risco**:
> Explique em linguagem clara o que este trecho representa como risco de segurança
> e como poderia ser explorado ou causar vazamento.

**Recomendação**:
> Descreva o que deve ser modificado, removido ou adicionado para mitigar este risco.
> Seja específico — o desenvolvedor da skill deve conseguir agir diretamente com base nesta recomendação.

---

## ✅ Pontos Positivos

> Liste práticas de segurança que a skill já adota corretamente.
> Reconhecer boas práticas ajuda o desenvolvedor a saber o que manter.

- [Ponto positivo 1]
- [Ponto positivo 2]

---

## 🗺️ Superfície de Ataque Mapeada

> Diagrama textual simples da superfície de ataque identificada:
> quais são as entradas da skill, o que ela acessa, e onde os riscos se concentram.

```
Entrada do usuário
      │
      ▼
  [SKILL.md]
      │
      ├──► Acessa filesystem? [SIM/NÃO] → [caminho(s)]
      ├──► Executa scripts?   [SIM/NÃO] → [script(s)]
      ├──► Chama APIs?        [SIM/NÃO] → [endpoint(s)]
      └──► Lê arquivos externos? [SIM/NÃO] → [arquivo(s)]
```

---

## 📌 Próximos Passos Recomendados

> Lista priorizada de ações a tomar, ordenada por urgência:

1. **[URGENTE]** ...
2. **[IMPORTANTE]** ...
3. **[SUGERIDO]** ...
