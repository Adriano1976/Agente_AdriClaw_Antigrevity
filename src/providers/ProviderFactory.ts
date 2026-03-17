import { ILlmProvider } from './ILlmProvider';
import { GeminiProvider } from './GeminiProvider';
import { DeepSeekProvider } from './DeepSeekProvider';

export class ProviderFactory {
  public static getProvider(providerName: string): ILlmProvider {
    switch (providerName.toLowerCase()) {
      case 'gemini':
        return new GeminiProvider();
      case 'deepseek':
        return new DeepSeekProvider(); // To be implemented later
      default:
        console.warn(`Provider ${providerName} unknown, falling back to gemini`);
        return new GeminiProvider();
    }
  }
}
