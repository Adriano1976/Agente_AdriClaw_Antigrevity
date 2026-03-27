# Integração do GroqProvider

## Proposed Changes

### Configuration
#### [MODIFY] [index.ts]
- Adicionar `GROQ_API_KEY: process.env.GROQ_API_KEY || ''` às configurações.

### Providers
#### [MODIFY] [ProviderFactory.ts](../AdriClaw/src/providers/ProviderFactory.ts)
- Importar `GroqProvider`.
- Adicionar o case `'groq'` no `switch` para retornar `new GroqProvider()`.

#### [NEW] [GroqProvider.ts](../AdriClaw/src/providers/GroqProvider.ts)
- Implementar a interface [ILlmProvider](../AdriClaw/src/providers/ILlmProvider.ts#13-23).
- Instanciar o SDK `Groq` com a chave da API.
- Implementar o método [generate(systemPrompt, messages, availableTools)](../AdriClaw/src/providers/DeepSeekProvider.ts#5-74), adaptando o payload para suportar as ferramentas fornecidas.
- Integrar o código fornecido pelo usuário, realizando streaming das respostas de texto no `process.stdout.write` enquanto acumula o resultado para retornar na [LlmResponse](file:///c:/Users/Neide%20Ferreira/3D%20Objects/AdriClaw/src/providers/ILlmProvider.ts#7-12) esperada pela interface.
- Nota: Como o código fornecido tem `stream: true`, e também possivelmente terá tool calls, vamos iterar sobre o stream e acumular tanto as chamadas de função (se enviadas pelo modelo) quanto o texto. (Alguns modelos no Groq não suportam tools junto com stream perfeitamente dependendo do caso, mas tentaremos seguir a spec base).

### Dependencies
#### [MODIFY] [package.json](../AdriClaw/package.json)
- Verificar e instalar `groq-sdk` caso não esteja presente.

## Verification Plan

### Automated Tests
- Executar a checagem de tipos do TypeScript usando `npx tsc --noEmit` para garantir que o provider satisfaz a interface [ILlmProvider](file:///c:/Users/Neide%20Ferreira/3D%20Objects/AdriClaw/src/providers/ILlmProvider.ts#13-23) corretamente e que não há erros de sintaxe.
- (Opcional) Enviar uma requisição local modificando a variável de provedor padrão no arquivo `.env` para `groq` e verificando se o `npm run dev` inicializa o framework sem crash, e se enviar uma mensagem de teste no Telegram ativa a rotação Groq.

### Manual Verification
- O usuário deverá possuir uma chave válida no `.env` (`GROQ_API_KEY=...`) e colocar `DEFAULT_LLM_PROVIDER=groq`. Ao enviar uma mensagem, o sistema deverá responder processando através do Groq e transmitindo no console as respostas geradas localmente.
