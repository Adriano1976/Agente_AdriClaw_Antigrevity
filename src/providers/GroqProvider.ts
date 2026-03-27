import { ILlmProvider, LlmResponse, ToolCall } from './ILlmProvider';
import { config } from '../config';
import { Groq } from 'groq-sdk';

export class GroqProvider implements ILlmProvider {
  private groq: Groq;

  constructor() {
    const apiKey = config.GROQ_API_KEY;
    if (!apiKey) throw new Error("GROQ_API_KEY not set");
    this.groq = new Groq({ apiKey });
  }

  public async generate(
    systemPrompt: string,
    messages: { role: 'user' | 'assistant' | 'system' | 'tool'; content: string }[],
    availableTools: any[]
  ): Promise<LlmResponse> {
    try {
      // FIX: A Groq exige 'tool_call_id' em mensagens role:'tool', mas o
      // MemoryManager armazena resultados de ferramentas sem esse campo.
      // Convertemos role:'tool' para role:'user' com prefixo de contexto,
      // mantendo a informação acessível para a LLM raciocinar.
      const groqMessages: any[] = [
        { role: 'system', content: systemPrompt },
        ...messages.map(m => {
          if (m.role === 'tool') {
            return { role: 'user', content: `[Observação de Ferramenta]: ${m.content}` };
          }
          return { role: m.role, content: m.content };
        })
      ];

      const toolsConfig = availableTools && availableTools.length > 0
        ? availableTools.map(t => ({
          type: 'function',
          function: {
            name: t.name,
            description: t.description,
            parameters: t.parameters
          }
        }))
        : undefined;

      //✅ Modificar o modelo aqui:
      const payload: any = {
        model: "openai/gpt-oss-20b",
        messages: groqMessages,
        temperature: 1,
        max_completion_tokens: 8192,
        top_p: 1,
        stream: true,
        stop: null
      };

      if (toolsConfig) {
        payload.tools = toolsConfig;
      }

      const chatCompletion = await this.groq.chat.completions.create(payload) as any;

      let fullContent = '';
      const toolCallsMap = new Map<number, any>();

      for await (const chunk of chatCompletion) {
        const choice = chunk.choices?.[0];
        if (!choice) continue;

        // Streaming do delta de texto via process.stdout
        const contentDelta = choice.delta?.content;
        if (contentDelta) {
          process.stdout.write(contentDelta);
          fullContent += contentDelta;
        }

        // Acumula tool calls (se presentes no chunk)
        const toolCallsDelta = choice.delta?.tool_calls;
        if (toolCallsDelta) {
          for (const tc of toolCallsDelta) {
            if (!toolCallsMap.has(tc.index)) {
              toolCallsMap.set(tc.index, {
                id: tc.id,
                name: tc.function?.name || '',
                arguments: tc.function?.arguments || ''
              });
            } else {
              const existing = toolCallsMap.get(tc.index);
              if (tc.function?.name) existing.name += tc.function.name;
              if (tc.function?.arguments) existing.arguments += tc.function.arguments;
            }
          }
        }
      }

      // Adiciona uma quebra de linha após o termino do stream se retornou texto
      if (fullContent.length > 0) {
        process.stdout.write('\n');
      }

      if (toolCallsMap.size > 0) {
        const toolCalls: ToolCall[] = Array.from(toolCallsMap.values()).map(tc => ({
          id: tc.id,
          name: tc.name, // The tool parser shouldn't strictly require full parsing immediately, but let's parse args
          arguments: tc.arguments ? JSON.parse(tc.arguments) : {}
        }));

        return { content: fullContent.length > 0 ? fullContent : null, toolCalls };
      }

      return { content: fullContent.length > 0 ? fullContent : null, toolCalls: [] };
    } catch (e: any) {
      console.error('GroqProvider Error:', e);
      return { content: null, error: e.message, toolCalls: [] };
    }
  }
}
