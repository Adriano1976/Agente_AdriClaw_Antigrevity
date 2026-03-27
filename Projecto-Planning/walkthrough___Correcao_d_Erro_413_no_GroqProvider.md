# Walkthrough - Correção do Erro 413 (Rate Limit) no GroqProvider

O erro 413 ("Request too large") ocorria devido ao uso do modelo `gpt-oss-120b`, que possui um limite extremamente restrito de 8000 tokens por minuto (TPM). Como o bot envia o esquema de todas as ferramentas disponíveis em cada requisição, esse limite era ultrapassado rapidamente.

## Mudanças Realizadas

### [GroqProvider.ts](../AdriClaw/src/providers/GroqProvider.ts)

- **Substituição de Modelo**: O modelo padrão foi alterado de `openai/gpt-oss-120b` para `llama-3.3-70b-versatile`.
- **Compatibilidade**: Removido o parâmetro `reasoning_effort` que não é suportado pelo Llama e poderia causar erros secundários.

## Verificação e Testes

### Testes de Integração com Modelos Llama

Executei um script de teste simulando o ambiente real do bot (System Prompt + Ferramentas + Histórico).

```bash
npx tsx src/test_groq.ts
```

**Resultados:**
- **Teste 1 (Simples)**: O modelo respondeu instantaneamente sem erros de limite.
- **Teste 2 (Múltiplas Ferramentas)**: Simulei um payload com 4 ferramentas complexas. O modelo respondeu com sucesso, demonstrando que o novo TPM é suficiente para o uso do AdriClaw.

### Logs de Resposta do Novo Modelo

```json
{
  "content": "Não tenho uma versão específica, sou um modelo de linguagem treinado por máquina...",
  "toolCalls": []
}
```

## Conclusão

A troca para o `llama-3.3-70b-versatile` no Groq resolve o problema de interrupção do serviço (Rate Limit) e torna o bot mais responsivo. O fallback para o Gemini continua ativo como segurança adicional.
