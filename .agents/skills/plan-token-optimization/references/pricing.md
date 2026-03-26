# Preços de LLMs para Cálculo de Custo

> Última atualização referenciada: Q1 2025  
> **Sempre verifique preços atuais em:** https://www.anthropic.com/pricing e https://openai.com/pricing

---

## Anthropic Claude

| Modelo | Input (por 1M tokens) | Output (por 1M tokens) |
|--------|----------------------|------------------------|
| Claude Opus 4 | $15.00 | $75.00 |
| Claude Sonnet 4 | $3.00 | $15.00 |
| Claude Haiku 3.5 | $0.80 | $4.00 |

**Modelo padrão para estimativas da skill:** Claude Sonnet 4
- Input: $0.000003 por token ($3/1M)
- Output: $0.000015 por token ($15/1M)

---

## OpenAI

| Modelo | Input (por 1M tokens) | Output (por 1M tokens) |
|--------|----------------------|------------------------|
| GPT-4o | $2.50 | $10.00 |
| GPT-4o mini | $0.15 | $0.60 |
| o1 | $15.00 | $60.00 |
| o3-mini | $1.10 | $4.40 |

---

## Google Gemini

| Modelo | Input (por 1M tokens) | Output (por 1M tokens) |
|--------|----------------------|------------------------|
| Gemini 1.5 Pro | $1.25 | $5.00 |
| Gemini 1.5 Flash | $0.075 | $0.30 |
| Gemini 2.0 Flash | $0.10 | $0.40 |

---

## Fórmula de Cálculo

```
# Para uma sessão típica de desenvolvimento

tokens_input_por_op = linhas_arquivo × 15
tokens_output_por_op = tokens_input × 0.25  (estimativa resposta)

custo_por_operação = (tokens_input × preco_input) + (tokens_output × preco_output)
custo_sessao_diaria = custo_por_operação × operacoes_por_dia

# Exemplo com Claude Sonnet 4, arquivo de 600 linhas, 20 operações/dia:
tokens_input = 600 × 15 = 9.000
tokens_output = 9.000 × 0.25 = 2.250

custo_por_op = (9.000 × $0.000003) + (2.250 × $0.000015)
             = $0.027 + $0.034
             = $0.061 por operação

custo_diario = $0.061 × 20 = $1.22/dia
custo_mensal = $1.22 × 22 = $26.84/mês

# Após dividir em módulos de ~100 linhas:
tokens_input_depois = 100 × 15 = 1.500
custo_por_op_depois = (1.500 × $0.000003) + (375 × $0.000015) = $0.0045 + $0.0056 = $0.010

custo_diario_depois = $0.010 × 20 = $0.20/dia
custo_mensal_depois = $0.20 × 22 = $4.40/mês

economia_mensal = $26.84 - $4.40 = $22.44/mês (83% de economia)
```

---

## Notas de Cálculo

- **Proporção input/output assumida:** 80% input, 20% output para tarefas de edição de código
- **Multiplicador de sessão:** 20 operações/dia = sessão intensa de desenvolvimento
- **Conversão linhas→tokens:** 15 tokens/linha para TS/TSX (inclui indentação, imports, tipos)
- Os preços variam com cache, batch processing e planos enterprise — estes são preços on-demand
