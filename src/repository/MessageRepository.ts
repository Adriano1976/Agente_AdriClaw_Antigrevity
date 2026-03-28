import db from '../db/Database';

// interface para que possamos trocar de banco de dados sem quebrar o código.
export interface Message {
  id?: number;
  conversationId: string;
  role: 'user' | 'assistant' | 'tool' | 'system';
  content: string;
}

// classe responsável por gerenciar as mensagens no banco de dados.
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
