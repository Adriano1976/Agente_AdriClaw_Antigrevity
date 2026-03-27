# Tarefa: Investigar e Corrigir Erro 413 do GroqProvider

O usuário reportou um erro ao interagir com o bot via Telegram. Os logs mostram que o [GroqProvider](../AdriClaw/src/providers/GroqProvider.ts#5-110) atingiu o limite de tokens por minuto (TPM) da API do Groq (8000 tokens), resultando em um erro 413.

## Checkpoints
- [x] Analisar a construção do prompt no [GroqProvider.ts](../AdriClaw/src/providers/GroqProvider.ts) e [AgentLoop.ts](file:///c:/Users/Neide%20Ferreira/3D%20Objects/AdriClaw/src/core/AgentLoop.ts)
- [x] Investigar por que o fallback para o Gemini não foi transparente ou se falhou também
- [x] Implementar gestão de tamanho de contexto para evitar ultrapassar o limite de TPM do Groq
- [x] Validar a correção com testes ou simulação
