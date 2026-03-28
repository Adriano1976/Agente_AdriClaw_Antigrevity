// interface responsável por definir o contrato que todo provedor de LLM deve seguir.
export interface LLMMessage {
    role: 'user' | 'assistant' | 'system' | 'tool';
    content: string;
    tool_calls?: any[]; // For now generic
}

// interface responsável por definir o contrato que toda resposta de LLM deve seguir.
export interface ProviderResponse {
    content: string;
    tool_calls?: any[];
}

// interface responsável por definir o contrato que todo provedor de LLM deve seguir.
export interface ILLMProvider {
    generateResponse(systemPrompt: string, history: LLMMessage[], tools?: any[]): Promise<ProviderResponse>;
}
