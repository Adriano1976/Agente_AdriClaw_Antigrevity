import db from '../db/Database';

export interface Message {
  id?: number;
  conversationId: string;
  role: 'user' | 'assistant' | 'tool' | 'system';
  content: string;
}

export class MessageRepository {
  public static addMessage(conversationId: string, role: string, content: string): void {
    const stmt = db.prepare('INSERT INTO messages (conversation_id, role, content) VALUES (?, ?, ?)');
    stmt.run(conversationId, role, content);
  }

  public static getMessages(conversationId: string, limit: number = 50): Message[] {
    const stmt = db.prepare('SELECT conversation_id as conversationId, role, content FROM (SELECT * FROM messages WHERE conversation_id = ? ORDER BY created_at DESC LIMIT ?) ORDER BY created_at ASC');
    return stmt.all(conversationId, limit) as Message[];
  }
}
