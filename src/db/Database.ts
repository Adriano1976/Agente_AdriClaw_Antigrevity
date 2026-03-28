import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

// caminho do banco de dados para que possamos trocar de banco de dados sem quebrar o código.
const dbPath = path.resolve(__dirname, '../../data');
if (!fs.existsSync(dbPath)) {
  fs.mkdirSync(dbPath, { recursive: true });
}

// conexão com o banco de dados para que possamos trocar de banco de dados sem quebrar o código.
const db = new Database(path.join(dbPath, 'db.sqlite'));

// habilita o Write-Ahead Logging para melhor performance concorrente.
db.pragma('journal_mode = WAL');

// Initialize schema para que possamos trocar de banco de dados sem quebrar o código.
db.exec(`
  CREATE TABLE IF NOT EXISTS conversations (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    provider TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    conversation_id TEXT NOT NULL,
    role TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE
  );
  
  CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
`);

export default db;
