# Plano de Implementação - Correção de Erro 413 no GroqProvider

O objetivo é substituir o modelo atual do Groq, que possui limites de tokens excessivamente baixos, por um modelo mais robusto e com limites maiores, garantindo que o bot consiga processar o contexto de ferramentas e histórico sem falhas.

## Mudanças Propostas

### Provedores de LLM

#### [MODIFY] [GroqProvider.ts](../AdriClaw/src/providers/GroqProvider.ts)

- Alterar o modelo de `openai/gpt-oss-120b` para `llama-3.3-70b-versatile`.
- Remover o campo `reasoning_effort: "medium"`, que é específico para modelos o1 da OpenAI e pode causar erros em modelos Llama.
- Ajustar configurações de stream e payload para compatibilidade total.

## Plano de Verificação

### Testes Automatizados
- Criar um script de teste em [/tmp/test_groq.ts](file:///tmp/test_groq.ts) que instancia o [GroqProvider](../AdriClaw/src/providers/GroqProvider.ts#5-111) e realiza uma chamada com um prompt simulando ferramentas e histórico.
- Executar via `npx tsx /tmp/test_groq.ts`.

### Verificação Manual
- Reiniciar o bot e enviar a pergunta "Qual é a versão do seu modelo?" via Telegram.
- Verificar nos logs se a resposta foi gerada pelo Groq (provedor primário) sem erros 413.
