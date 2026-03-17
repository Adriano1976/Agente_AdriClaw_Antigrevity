import { ConversationRepository } from '../repository/ConversationRepository';
import { MessageRepository, Message } from '../repository/MessageRepository';
import { config } from '../config';

export class MemoryManager {
  /**
   * Obtem a timeline de contexto da conversa atual truncada para caber no bot
   */
  public static getContext(userId: string, defaultProvider: string, conversationId: string): Message[] {
    let conv = ConversationRepository.findByUserId(userId);
    
    if (!conv || conv.id !== conversationId) {
      ConversationRepository.create(conversationId, userId, defaultProvider);
    }
    
    return MessageRepository.getMessages(conversationId, config.MEMORY_WINDOW_SIZE);
  }

  /**
   * Salva uma interação na persistencia
   */
  public static appendMessage(conversationId: string, role: 'user'|'assistant'|'system'|'tool', content: string): void {
    MessageRepository.addMessage(conversationId, role, content);
  }
}
