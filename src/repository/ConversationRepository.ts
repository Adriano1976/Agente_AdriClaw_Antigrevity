import db from '../db/Database';

export interface Conversation {
  id: string; // UUID ou hash único
  userId: string;
  provider: string;
}

// classe responsável por gerenciar as conversas
export class ConversationRepository {
  public static create(id: string, userId: string, provider: string): void {
    const stmt = db.prepare('INSERT OR IGNORE INTO conversations (id, user_id, provider) VALUES (?, ?, ?)');
    stmt.run(id, userId, provider);
  }

  public static findByUserId(userId: string): Conversation | undefined {
    // Para um agente pessoal, vamos pegar a conversa mais recente do usuário
    const stmt = db.prepare('SELECT id, user_id as userId, provider FROM conversations WHERE user_id = ? ORDER BY created_at DESC LIMIT 1');
    return stmt.get(userId) as Conversation | undefined;
  }
}
