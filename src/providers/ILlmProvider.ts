export interface ToolCall {
  id: string;
  name: string;
  arguments: any;
}

export interface LlmResponse {
  content: string | null;
  toolCalls?: ToolCall[];
  error?: string;
}

export interface ILlmProvider {
  /**
   * Envia uma requisição de preenchimento (chat completion) pro LLM
   */
  generate(
    systemPrompt: string,
    messages: { role: 'user' | 'assistant' | 'system' | 'tool', content: string }[],
    availableTools: any[]
  ): Promise<LlmResponse>;
}
