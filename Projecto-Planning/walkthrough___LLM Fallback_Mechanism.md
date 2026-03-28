# Walkthrough: LLM Fallback Mechanism

A feature de Fallback foi implementada com sucesso no núcleo do AgentLoop do SandecoClaw!

## Mudanças Realizadas

Aqui está o diff das modificações estruturais que evitam a parada do chat do robô quando a API da DeepSeek ficar sem saldo ou instável (como foi o caso do erro "Insufficient Balance"):
```diff:AgentLoop.ts
import { ProviderFactory } from '../providers/ProviderFactory';
import { globalToolRegistry } from '../tools/ToolRegistry';
import { MemoryManager } from '../memory/MemoryManager';
import { config } from '../config';

export class AgentLoop {
  /**
   * Executa a iteração ReAct
   */
  public static async run(
    userId: string,
    conversationId: string,
    skillContext: string,
    userMessage: string
  ): Promise<string> {
    const provider = ProviderFactory.getProvider(config.DEFAULT_LLM_PROVIDER);
    let iterations = 0;

    // Garante que a conversa exista no banco antes de adicionar mensagens
    MemoryManager.getContext(userId, config.DEFAULT_LLM_PROVIDER, conversationId);

    // Anexa a nova msg de usuário no banco
    MemoryManager.appendMessage(conversationId, 'user', userMessage);

    const systemPrompt = `
Você é o AdriClaw, um agente pessoal altamente eficiente.
Você tem acesso a habilidades dinâmicas. O seu processo exige que você use "thought" (pensamento) para decidir e invocar "tools" (ferramentas) quando necessário, ou apenas responda o usuário final se você já tiver a resposta.
Sempre responda em formato de texto simples (plain text), sem utilizar formatação markdown (como #, **, etc.), a menos que seja especificamente solicitado pelo usuário.

CONTEXTO DE HABILIDADE ATUAL (SKILL):
${skillContext || 'Nenhuma habilidade em especial. Reaja naturalmente ao usuário.'}
`;

    while (iterations < config.MAX_ITERATIONS) {
      iterations++;
      console.log(`[AgentLoop] Iniciando iteração ${iterations} para ${conversationId}...`);

      // Carrega o escopo da janela de memória atual
      const messagesEnv = MemoryManager.getContext(userId, config.DEFAULT_LLM_PROVIDER, conversationId);

      const tools = globalToolRegistry.getToolsSchema();
      const rawMessages = messagesEnv.map(m => ({
        role: m.role as 'user' | 'assistant' | 'system' | 'tool',
        content: m.content
      }));

      // Chamo a IA
      const response = await provider.generate(systemPrompt, rawMessages, tools);

      if (response.error) {
        console.error('LLM Error:', response.error);
        return `Erro interno no LLM: ${response.error}`;
      }

      // 1. Caso o LLM tenha de fato respondido um texto pro usuário (Answer)
      if (response.content) {
        MemoryManager.appendMessage(conversationId, 'assistant', response.content);
        return response.content;
      }

      // 2. Caso ele tenha invocado um Tool (Action)
      if (response.toolCalls && response.toolCalls.length > 0) {
        const call = response.toolCalls[0];
        console.log(`[AgentLoop] Invocando Tool: ${call.name}`);

        let observation = '';
        try {
          const tool = globalToolRegistry.getTool(call.name);
          if (!tool) throw new Error(`A ferramenta '${call.name}' não existe no registro.`);
          const result = await tool.execute(call.arguments);
          observation = typeof result === 'string' ? result : JSON.stringify(result);
        } catch (error: any) {
          observation = `{"error": "${error.message}"}`;
          console.log(`[AgentLoop] Erro na Tool: ${error.message}`);
        }

        // Registra o step temporariamente no banco para a IA ler que executou a tarefa
        MemoryManager.appendMessage(conversationId, 'tool', `Resultado de ${call.name}: ${observation}`);
        // O loop var dar a volta para o LLM raciocinar em cima de "tool"
        continue;
      }

      return "LLM respondeu algo vazio.";
    }

    throw new Error("MAX_ITERATIONS atingido. O Agente não conseguiu concluir o pensamento.");
  }
}
===
import { ProviderFactory } from '../providers/ProviderFactory';
import { globalToolRegistry } from '../tools/ToolRegistry';
import { MemoryManager } from '../memory/MemoryManager';
import { config } from '../config';

export class AgentLoop {
  /**
   * Executa a iteração ReAct
   */
  public static async run(
    userId: string,
    conversationId: string,
    skillContext: string,
    userMessage: string
  ): Promise<string> {
    const provider = ProviderFactory.getProvider(config.DEFAULT_LLM_PROVIDER);
    let iterations = 0;

    // Garante que a conversa exista no banco antes de adicionar mensagens
    MemoryManager.getContext(userId, config.DEFAULT_LLM_PROVIDER, conversationId);

    // Anexa a nova msg de usuário no banco
    MemoryManager.appendMessage(conversationId, 'user', userMessage);

    const systemPrompt = `
Você é o AdriClaw, um agente pessoal altamente eficiente.
Você tem acesso a habilidades dinâmicas. O seu processo exige que você use "thought" (pensamento) para decidir e invocar "tools" (ferramentas) quando necessário, ou apenas responda o usuário final se você já tiver a resposta.
Sempre responda em formato de texto simples (plain text), sem utilizar formatação markdown (como #, **, etc.), a menos que seja especificamente solicitado pelo usuário.

CONTEXTO DE HABILIDADE ATUAL (SKILL):
${skillContext || 'Nenhuma habilidade em especial. Reaja naturalmente ao usuário.'}
`;

    while (iterations < config.MAX_ITERATIONS) {
      iterations++;
      console.log(`[AgentLoop] Iniciando iteração ${iterations} para ${conversationId}...`);

      // Carrega o escopo da janela de memória atual
      const messagesEnv = MemoryManager.getContext(userId, config.DEFAULT_LLM_PROVIDER, conversationId);

      const tools = globalToolRegistry.getToolsSchema();
      const rawMessages = messagesEnv.map(m => ({
        role: m.role as 'user' | 'assistant' | 'system' | 'tool',
        content: m.content
      }));

      // Chamo a IA
      let response = await provider.generate(systemPrompt, rawMessages, tools);

      if (response.error) {
        const fallbackProviderName = config.DEFAULT_LLM_PROVIDER.toLowerCase() === 'deepseek' ? 'gemini' : 'deepseek';
        console.warn(`[AgentLoop] LLM Error com provedor primário (${config.DEFAULT_LLM_PROVIDER}): ${response.error}`);
        console.warn(`[AgentLoop] Tentando fallback para provedor alternativo (${fallbackProviderName})...`);
        
        try {
          const fallbackProvider = ProviderFactory.getProvider(fallbackProviderName);
          response = await fallbackProvider.generate(systemPrompt, rawMessages, tools);
          
          if (response.error) {
            console.error('[AgentLoop] Erro no LLM Fallback também:', response.error);
            return `Erro interno no LLM (após fallback): ${response.error}`;
          }
        } catch (fallbackError: any) {
          console.error('[AgentLoop] Falha catastrófica no Fallback:', fallbackError);
          return `Erro interno no LLM (primário e fallback falharam): ${response.error}`;
        }
      }

      // 1. Caso o LLM tenha de fato respondido um texto pro usuário (Answer)
      if (response.content) {
        MemoryManager.appendMessage(conversationId, 'assistant', response.content);
        return response.content;
      }

      // 2. Caso ele tenha invocado um Tool (Action)
      if (response.toolCalls && response.toolCalls.length > 0) {
        const call = response.toolCalls[0];
        console.log(`[AgentLoop] Invocando Tool: ${call.name}`);

        let observation = '';
        try {
          const tool = globalToolRegistry.getTool(call.name);
          if (!tool) throw new Error(`A ferramenta '${call.name}' não existe no registro.`);
          const result = await tool.execute(call.arguments);
          observation = typeof result === 'string' ? result : JSON.stringify(result);
        } catch (error: any) {
          observation = `{"error": "${error.message}"}`;
          console.log(`[AgentLoop] Erro na Tool: ${error.message}`);
        }

        // Registra o step temporariamente no banco para a IA ler que executou a tarefa
        MemoryManager.appendMessage(conversationId, 'tool', `Resultado de ${call.name}: ${observation}`);
        // O loop var dar a volta para o LLM raciocinar em cima de "tool"
        continue;
      }

      return "LLM respondeu algo vazio.";
    }

    throw new Error("MAX_ITERATIONS atingido. O Agente não conseguiu concluir o pensamento.");
  }
}
```

## Como Validar:

1. Pode manter o arquivo `.env` com o provedor sendo `deepseek` (`DEFAULT_LLM_PROVIDER=deepseek`).
2. Mande uma mensagem normalmente no seu Telegram ("Me dê um resumo do projeto", etc).
3. Ao avaliar o terminal local que está rodando, em vez do programa explodir a execução, você deve ver as seguintes linhas (ou similares):

```bash
[AgentLoop] LLM Error com provedor primário (deepseek): Insufficient Balance
[AgentLoop] Tentando fallback para provedor alternativo (gemini)...
```
4. O bot então fará a requisição para a API do Google Gemini transparecendo a continuidade orgânica do seu pensamento. A reposta surgirá com excelência no Telegram.
