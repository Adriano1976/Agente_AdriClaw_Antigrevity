import { ILlmProvider, LlmResponse } from './ILlmProvider';
import { config } from '../config';

export class DeepSeekProvider implements ILlmProvider {
  public async generate(
    systemPrompt: string,
    messages: { role: 'user' | 'assistant' | 'system' | 'tool'; content: string }[],
    availableTools: any[]
  ): Promise<LlmResponse> {
    const apiKey = config.DEEPSEEK_API_KEY;
    if (!apiKey) throw new Error("DEEPSEEK_API_KEY not set");

    const url = 'https://api.deepseek.com/chat/completions';
    
    // Converte e insere prompt do sistema
    const openaiMessages: any[] = [
      { role: 'system', content: systemPrompt },
      ...messages.map(m => ({
        role: m.role,
        content: m.content
      }))
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

    const payload: any = {
      model: 'deepseek-chat',
      messages: openaiMessages,
    };
    if (toolsConfig) payload.tools = toolsConfig;

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify(payload)
      });
      const data = await response.json() as any;
      if (data.error) return { content: null, error: data.error.message };
      
      const choice = data.choices?.[0];
      if (!choice) return { content: null, error: 'Empty response' };

      const message = choice.message;
      if (message?.tool_calls && message.tool_calls.length > 0) {
        return {
          content: null,
          toolCalls: message.tool_calls.map((tc: any) => ({
             id: tc.id,
             name: tc.function.name,
             arguments: JSON.parse(tc.function.arguments)
          }))
        };
      }
      
      return { content: message?.content || '', toolCalls: [] };
    } catch (e: any) {
      console.error(e);
      return { content: null, error: e.message };
    }
  }
}
