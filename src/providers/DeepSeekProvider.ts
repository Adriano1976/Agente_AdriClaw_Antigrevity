import { ILlmProvider, LlmResponse } from './ILlmProvider';
import { config } from '../config';

export class DeepSeekProvider implements ILlmProvider {
  public async generate(
    systemPrompt: string,
    messages: { role: 'user' | 'assistant' | 'system' | 'tool'; content: string }[],
    availableTools: any[]
  ): Promise<LlmResponse> {
    
    // WIP: Integração nativa com a API do DeepSeek, compatível com o formato da OpenAI.
    console.log("[DeepSeekProvider] Iniciando geração...");
    
    // Placeholder para a implementação real de Fetch
    return {
      content: "Eu sou o modelo DeepSeek (integração em desenvolvimento). Recebi sua mensagem!",
    };
  }
}
