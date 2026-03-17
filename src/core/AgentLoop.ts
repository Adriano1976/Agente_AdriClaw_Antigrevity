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
Você é o SandecoClaw/AdriClaw, um agente pessoal altamente eficiente.
Você tem acesso a habilidades dinâmicas. O seu processo exige que você use "thought" (pensamento) para decidir e invocar "tools" (ferramentas) quando necessário, ou apenas responda o usuário final se você já tiver a resposta.

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
        role: m.role as 'user'|'assistant'|'system'|'tool', 
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
