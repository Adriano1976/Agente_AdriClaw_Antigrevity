import { ILlmProvider, LlmResponse, ToolCall } from './ILlmProvider';
import { config } from '../config';

export class OpenRouterProvider implements ILlmProvider {
  private apiKey: string;
  private baseUrl = 'https://openrouter.ai/api/v1';

  constructor() {
    this.apiKey = config.OPENROUTER_API_KEY;
    if (!this.apiKey) throw new Error("OPENROUTER_API_KEY not set");
  }

  public async generate(
    systemPrompt: string,
    messages: { role: 'user' | 'assistant' | 'system' | 'tool'; content: string }[],
    availableTools: any[]
  ): Promise<LlmResponse> {
    try {
      const openRouterMessages: any[] = [
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
        model: "nvidia/nemotron-3-super-120b-a12b:free",
        messages: openRouterMessages,
        temperature: 1,
        max_completion_tokens: 8192,
        top_p: 1,
        stream: true,
        stop: null
      };

      if (toolsConfig) {
        payload.tools = toolsConfig;
      }

      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://adriclaw.local',
          'X-Title': 'AdriClaw'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`OpenRouter API error: ${response.status} - ${errorText}`);
      }

      if (!response.body) {
        throw new Error("No response body from OpenRouter");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullContent = '';
      const toolCallsMap = new Map<number, any>();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || !trimmed.startsWith('data: ')) continue;

          const data = trimmed.slice(6);
          if (data === '[DONE]') {
            return {
              content: fullContent.length > 0 ? fullContent : null,
              toolCalls: Array.from(toolCallsMap.values()).map(tc => ({
                id: tc.id,
                name: tc.name,
                arguments: tc.arguments ? JSON.parse(tc.arguments) : {}
              }))
            };
          }

          try {
            const chunk = JSON.parse(data);
            const choice = chunk.choices?.[0];
            if (!choice) continue;

            const contentDelta = choice.delta?.content;
            if (contentDelta) {
              process.stdout.write(contentDelta);
              fullContent += contentDelta;
            }

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
          } catch (e) {
            // Skip invalid JSON
          }
        }
      }

      if (fullContent.length > 0) {
        process.stdout.write('\n');
      }

      if (toolCallsMap.size > 0) {
        const toolCalls: ToolCall[] = Array.from(toolCallsMap.values()).map(tc => ({
          id: tc.id,
          name: tc.name,
          arguments: tc.arguments ? JSON.parse(tc.arguments) : {}
        }));

        return { content: fullContent.length > 0 ? fullContent : null, toolCalls };
      }

      return { content: fullContent.length > 0 ? fullContent : null, toolCalls: [] };
    } catch (e: any) {
      console.error('OpenRouterProvider Error:', e);
      return { content: null, error: e.message, toolCalls: [] };
    }
  }
}
