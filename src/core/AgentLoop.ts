import { ProviderFactory } from '../providers/ProviderFactory';
import { globalToolRegistry } from '../tools/ToolRegistry';
import { MemoryManager } from '../memory/MemoryManager';
import { config } from '../config';

// ✅ COLAR ESTE BLOCO INTEIRO ANTES DO "export class AgentLoop":

/**
 * FIX: Algoritmo de Balanceamento de Chaves para extração segura de JSON.
 * A LLM frequentemente envolve o JSON em blocos markdown (```json ... ```)
 * ou adiciona texto antes/depois, quebrando o JSON.parse direto.
 * Este helper rastreia a abertura da primeira chave { e conta as chaves
 * internas para identificar o fechamento exato do objeto principal.
 */
function extractJsonFromText(text: string): string | null {
  if (!text.includes('"action"') && !text.includes('"name"')) return null;
  const startIndex = text.indexOf('{');
  if (startIndex === -1) return null;
  let braces = 0;
  for (let i = startIndex; i < text.length; i++) {
    if (text[i] === '{') braces++;
    else if (text[i] === '}') braces--;
    // Quando a contagem zera, encontramos o objeto completo
    if (braces === 0) {
      return text.substring(startIndex, i + 1);
    }
  }
  return null; // JSON incompleto
}

// classe responsável por executar o loop ReAct e interagir com o LLM.
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

    // prompt do sistema responsável por instruir o LLM sobre como ele deve se comportar.
    const systemPrompt = `
Quando iniciar a interação, você deve se apresentar como AdriClaw, um agente pessoal altamente eficiente.
Você tem acesso a habilidades dinâmicas. O seu processo exige que você use "thought" (pensamento) para decidir e invocar "tools" (ferramentas) quando necessário, ou apenas responda o usuário final se você já tiver a resposta.
Sempre responda em formato de texto simples (plain text), sem utilizar formatação markdown.

CONTEXTO DE HABILIDADE ATUAL (SKILL):
${skillContext || 'Nenhuma habilidade em especial. Reaja naturalmente ao usuário.'}
`;

    // loop responsável por executar a iteração ReAct.
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

      // chama a IA para gerar uma resposta.
      let response = await provider.generate(systemPrompt, rawMessages, tools);

      // verifica se houve erro no LLM.
      if (response.error) {
        console.error(`[AgentLoop] Erro no LLM (${config.DEFAULT_LLM_PROVIDER}): ${response.error}`);
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

        // ✅ ADICIONAR NO LUGAR:
        let observation = '';
        try {
          const tool = globalToolRegistry.getTool(call.name);
          if (!tool) throw new Error(`A ferramenta '${call.name}' não existe no registro.`);

          // FIX: Se arguments for string (JSON bruto da LLM com markdown/ruído),
          // usa o extrator seguro antes de parsear
          let args = call.arguments;
          if (typeof args === 'string') {
            const cleaned = extractJsonFromText(args);
            if (cleaned) {
              try { args = JSON.parse(cleaned); } catch { /* mantém como string */ }
            }
          }

          // executa a tool e armazena o resultado em observation.
          const result = await tool.execute(args);
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

    // lança um erro caso o loop atinja o número máximo de iterações.
    throw new Error("MAX_ITERATIONS atingido. O Agente não conseguiu concluir o pensamento.");
  }
}
