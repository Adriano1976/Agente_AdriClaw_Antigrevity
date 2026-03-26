# Implementation Plan: AdriClaw (SandecoClaw)

Esta é a definição da arquitetura para construir o AdriClaw a partir do zero baseado nas specs fornecidas ([PRD.md](file:///c:/Users/Neide%20Ferreira/3D%20Objects/AdriClaw/specs/PRD.md), [architecture.md](file:///c:/Users/Neide%20Ferreira/3D%20Objects/AdriClaw/specs/architecture.md), [agent-loop.md](file:///c:/Users/Neide%20Ferreira/3D%20Objects/AdriClaw/specs/agent-loop.md), [skill-user.md](file:///c:/Users/Neide%20Ferreira/3D%20Objects/AdriClaw/specs/skill-user.md)).

## User Review Required

> [!IMPORTANT]  
> Validar se deseja que inicialize tudo em Typescript via `ts-node`/`tsc`. As specs mencionam Node.js e TypeScript, e irei proceder com essa stack tecnológica. A biblioteca `@ai-sdk/google` (ou similar) não foi explicitada nas specs para consumir as APIs de LLM; eu planejo utilizar abordagens simples baseadas na API Fetch pura ou frameworks adequados modernos, peço que valide isso também. Será criada a pasta `.agents/skills/` conforme pedido.

## Proposed Changes

A estrutura do projeto será a seguinte, utilizando POO e Singleton/Facade Patterns conforme o documento de arquitetura.

### Directory Structure & Settings

- Inicializar `package.json` com `npm init -y`
- Criar `tsconfig.json` para suportar decorators/ES6+ e Output no diretório `dist`
- Inicializar diretórios `data`, `tmp` e `.agents/skills`

### Component Modules (src/)

#### [NEW] `src/config/index.ts`

- Gerenciamento de variáveis de ambiente (`.env`).
- Whitelist de IDs do telegram (`TELEGRAM_ALLOWED_USER_IDS`).

#### [NEW] `src/db/Database.ts`

- Singleton do `better-sqlite3` instanciando as tabelas `conversations` e `messages`.

#### [NEW] `src/repository/ConversationRepository.ts` & `src/repository/MessageRepository.ts`

- Repositórios focados nas queries SQL.

#### [NEW] `src/memory/MemoryManager.ts`

- Facade para salvar e recuperar conversas truncadas para injeção via prompt.

#### [NEW] `src/providers/ILlmProvider.ts` & `src/providers/ProviderFactory.ts`

- Adaptadores abstratos para invocar a IA.

#### [NEW] `src/skills/SkillLoader.ts`, `src/skills/SkillRouter.ts`, `src/skills/SkillExecutor.ts`

- Leitura do `fs` via `js-yaml`, definição de schema de Router, e orquestração de inclusão em master prompt (via Injection).

#### [NEW] `src/tools/BaseTool.ts` & `src/tools/ToolRegistry.ts`

- Registro em singleton das ferramentas ativas/acopladas pelo Agent.

#### [NEW] `src/core/AgentLoop.ts`

- Módulo iterativo máximo (`MAX_ITERATIONS` config) que aplica o ReAct pattern com base nas responses do provider e ferramentas do registro.

#### [NEW] `src/telegram/TelegramInputHandler.ts` & `src/telegram/TelegramOutputHandler.ts`

- Hooks baseados no bot `grammy`. Input filtra blacklist, injeta chat action (typing), Output cuida de split messages muito longas.

#### [NEW] `src/core/AgentController.ts`

- Orquestrador master que interliga a request que vem do Bot, invoca Router -> Executor -> Manda para Loop -> Retorna na view.

#### [NEW] `src/index.ts`

- Main loop rodando `bot.start()` na grammy.

### Sample/Default Skill

#### [NEW] `.agents/skills/example-skill/SKILL.md`

- Markdown simples para provar o sistema de hot-reload.

## Verification Plan

### Automated Tests

- Testar a subida limpa do banco em `/data`.
- Verificação do parser de markdown YAML.
- Validar injeção do token no LLM.

### Manual Verification

1. Ligar o bot via `npm run dev` localmente.
2. Interagir via telegram de um UID Whitelisted e comprovar funcionamento correto do loop.
3. Testar de outro Telegram UID (blacklist) e ver bloqueio.
