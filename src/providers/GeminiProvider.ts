import { ILlmProvider, LlmResponse } from './ILlmProvider';
import { config } from '../config';

// classe responsável por implementar a interface ILlmProvider
export class GeminiProvider implements ILlmProvider {
  async generate(systemPrompt: string, messages: any[], availableTools: any[]): Promise<LlmResponse> {
    const apiKey = config.GEMINI_API_KEY;
    if (!apiKey) throw new Error("GEMINI_API_KEY not set");

    // Simplificacao: API Fetch Google AI Studio
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

    // Converte mensagens no padrao Gemini
    let contents = messages.map(m => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }]
    }));

    const toolsConfig = availableTools && availableTools.length > 0 ? [{
      functionDeclarations: availableTools.map(t => ({
        name: t.name,
        description: t.description,
        parameters: t.parameters
      }))
    }] : undefined;

    const payload: any = {
      system_instruction: { parts: [{ text: systemPrompt }] },
      contents: contents,
    };
    if (toolsConfig) payload.tools = toolsConfig;

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await response.json() as any;
      if (data.error) return { content: null, error: data.error.message };

      const candidate = data.candidates?.[0];
      if (!candidate) return { content: null, error: 'Empty response' };

      const part = candidate.content?.parts?.[0];
      if (part?.functionCall) {
        return {
          content: null,
          toolCalls: [{
            id: `call_${Math.random().toString(36).substr(2, 9)}`,
            name: part.functionCall.name,
            arguments: part.functionCall.args
          }]
        };
      }

      return { content: part?.text || '', toolCalls: [] };
    } catch (e: any) {
      console.error(e);
      return { content: null, error: e.message };
    }
  }
}
