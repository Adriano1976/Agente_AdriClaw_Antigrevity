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
- [x] Implement `TelegramOutputHandler` (Splits large chunks, typing actions)
- [x] Implement `AgentController` (Facade routing `InputHandler` -> `SkillSystem` -> `AgentLoop` -> `OutputHandler`)

## 8. Application Entry Point
- [x] Setup `index.ts` to wire up the Telegram polling (`bot.start()`)
