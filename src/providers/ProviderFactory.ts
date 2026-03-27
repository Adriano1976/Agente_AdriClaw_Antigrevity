import { ILlmProvider } from './ILlmProvider';
import { GeminiProvider } from './GeminiProvider';
import { GroqProvider } from './GroqProvider';
import { OpenRouterProvider } from './OpenRouterProvider';

export class ProviderFactory {
  public static getProvider(providerName: string): ILlmProvider {
    switch (providerName.toLowerCase()) {
      case 'gemini':
        return new GeminiProvider();
      case 'groq':
        return new GroqProvider();
      case 'openrouter':
        return new OpenRouterProvider();
      default:
        console.warn(`Provider ${providerName} unknown, falling back to gemini`);
        return new GeminiProvider();
    }
  }
}
