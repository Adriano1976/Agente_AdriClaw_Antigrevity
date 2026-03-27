# AdriClaw (SandecoClaw) Development Tasks

## 1. Project Setup
- [x] Initialize Node.js project (`npm init`)
- [x] Install dependencies (`grammy`, `better-sqlite3`, `dotenv`, `js-yaml`, `pdf-parse` (optional), TypeScript, etc.)
- [x] Setup [tsconfig.json](../AdriClaw/tsconfig.json) and basic project structure
- [x] Create mandatory directories: [data/](../AdriClaw/src/skills/SkillLoader.ts#5-11), `tmp/`, `.agents/skills/`

## 2. Persistence Layer (SQLite)
- [x] Configure `better-sqlite3` Database connection
- [x] Implement `ConversationRepository`
- [x] Implement `MessageRepository`
- [x] Implement `MemoryManager` (Facade) to truncate context (`MEMORY_WINDOW_SIZE`)

## 3. Provider Layer (LLM Abstraction)
- [x] Define `ILlmProvider` interface
- [x] Implement `ProviderFactory`
- [x] Implement mock/basic provider for Gemini and DeepSeek (or Groq for cheap routing)

## 4. Skills Plugin System (Hot-Reload)
- [x] Implement `SkillLoader` (reads `.agents/skills/**/SKILL.md` using `fs` and `js-yaml`)
- [x] Implement `SkillRouter` ("Passo Zero" using cheap LLM)
- [x] Implement `SkillExecutor`

## 5. Tool System
- [x] Define `BaseTool` class / interface
- [x] Implement `ToolRegistry` to register local abilities

## 6. Reasoning Core (ReAct)
- [x] Implement `AgentLoop` (ReAct Engine)
  - Iterate up to `MAX_ITERATIONS`
  - Injects Tool Results (Observations) back to system context

## 7. Telegram Integration
- [x] Implement `TelegramInputHandler` (Whitelist User ID Validator)
- [ ] Módulo Extrapolado: Tratamento de Documentos Textuais (`message:document`)
  - [x] Interceptar arquivo e processar download
  - [x] Roteamento para `pdf-parse` (app/pdf) ou readFile direto (.md)
  - [x] Garantir deleção `finally` sem memory leak (RF-03)
- [x] Módulo Extrapolado: Tratamento de Mídias/Áudio (`message:voice`, `message:audio`)
  - [x] Interceptar áudio, download para pasta /tmp/ com action no grammy
  - [x] Implementar execução via child_process do Whisper CLI (`whisper local`)
  - [x] Acoplar a injeção da flag `requires_audio_reply: true` no metadata
- [x] Implement `TelegramOutputHandler` (Splits large chunks, typing actions)
- [x] Implement `AgentController` (Facade routing `InputHandler` -> `SkillSystem` -> `AgentLoop` -> `OutputHandler`)
- [x] Atualizar o Facade Controller e interface System para suportar persistir as tags flag de resposta em audio no MemoryManager

## 8. Application Entry Point
- [x] Setup `index.ts` to wire up the Telegram polling (`bot.start()`)
