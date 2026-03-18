# 🤖 AdriClaw — Agente de IA Pessoal via Telegram

[![Node.js](https://img.shields.io/badge/Node.js-v20%2B-green?logo=node.js)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue?logo=typescript)](https://www.typescriptlang.org/)
[![grammy](https://img.shields.io/badge/grammy-1.x-orange?logo=telegram)](https://grammy.dev/)
[![SQLite](https://img.shields.io/badge/SQLite-better--sqlite3-lightblue?logo=sqlite)](https://github.com/WiseLibs/better-sqlite3)
[![License: ISC](https://img.shields.io/badge/License-ISC-yellow)](https://opensource.org/licenses/ISC)

> **AdriClaw** é um agente pessoal de Inteligência Artificial que opera **100% localmente** no seu desktop Windows. Ele recebe comandos exclusivamente pelo **Telegram**, processa-os com múltiplos LLMs (Gemini, DeepSeek), suporta entradas em texto, PDF, Markdown e voz, e responde de forma inteligente — tudo isso com dados e privacidade sob seu controle total.

---

## ✨ Funcionalidades Principais

- 💬 **Interface via Telegram** — Toda interação acontece por DM no Telegram. Sem UI web.
- 🧠 **Motor ReAct (Reasoning + Acting)** — Loop de raciocínio iterativo com suporte a chamada de ferramentas (Tool Calls).
- 🔄 **Multi-LLM Dinâmico** — Troca de provedores de IA (Gemini, DeepSeek) via configuração, sem reiniciar o sistema.
- 🔌 **Skills por Hot-Reload** — Adicione ou atualize habilidades apenas colocando arquivos `.md` na pasta `.agents/skills/`, sem reiniciar o processo.
- 📄 **Entradas Multimodais** — Aceita texto, arquivos PDF, Markdown e mensagens de voz (transcritas localmente via Whisper).
- 🔊 **Respostas em Áudio (TTS)** — Responde em voz com `pt-BR-ThalitaMultilingualNeural` via Edge-TTS quando solicitado.
- 💾 **Memória Persistente (SQLite)** — Histórico de conversas persistido localmente, com janela de contexto inteligente.
- 🔐 **Acesso Restrito por Whitelist** — Apenas usuários com ID autorizado no `.env` têm acesso ao agente.

---

## 🛠️ Stack de Tecnologia

| Componente | Tecnologia | Versão |
|---|---|---|
| **Linguagem** | TypeScript (Node.js) | `^5.9.3` |
| **Runtime** | tsx (dev) / Node.js | `^4.21.0` / `v20+ LTS` |
| **Interface Telegram** | grammy | `^1.41.1` |
| **Banco de Dados** | SQLite (`better-sqlite3`) | `^12.8.0` |
| **Parsing de PDF** | pdf-parse | `^2.4.5` |
| **Parsing de YAML** | js-yaml | `^4.1.1` |
| **LLMs Suportados** | Google Gemini, DeepSeek | via API |
| **STT (Voz para Texto)** | Whisper Local | — |
| **TTS (Texto para Voz)** | Microsoft Edge-TTS | `pt-BR-ThalitaMultilingualNeural` |
| **Paradigma** | Orientação a Objetos + Design Patterns | — |

---

## 🏗️ Arquitetura

O AdriClaw adota um estilo **Monolito Modular com Sistema de Plugins**, garantindo baixa latência, fácil manutenção e extensibilidade via skills.

### Diagrama de Contexto

```mermaid
graph TB
    User(["Usuário"])
    Telegram["Telegram Client"]
    System["AdriClaw Engine"]
    LLM["LLM APIs - Gemini e DeepSeek"]
    Whisper["Whisper Local - STT"]
    EdgeTTS["Edge-TTS - TTS"]

    User -->|"Envia Msg/Voz/Doc"| Telegram
    Telegram -->|"Polling/Reply"| System
    System -->|"Reply"| Telegram
    Telegram -->|"Resposta"| User
    System -->|"Prompt"| LLM
    LLM -->|"Response"| System
    System -->|"Processa Audio"| Whisper
    System -->|"Gera Audio"| EdgeTTS
```

### Diagrama de Componentes

```mermaid
graph TB
    subgraph Interface
        InputH[TelegramInputHandler]
        OutputH[TelegramOutputHandler]
    end

    subgraph Core
        Controller[AgentController]
        Loop[AgentLoop ReAct]
        Registry[ToolSkill Registry]
    end

    subgraph Skills
        SkillL[SkillLoader]
        SkillR[SkillRouter]
        SkillE[SkillExecutor]
    end

    subgraph Memory
        MemM[MemoryManager]
        ConvR[ConversationRepository]
        MsgR[MessageRepository]
        DB[(SQLite)]
    end

    InputH --> Controller
    Controller --> SkillL
    SkillL --> SkillR
    SkillR --> SkillE
    SkillE --> Loop
    Loop --> MemM
    Loop --> Registry
    Registry --> Loop
    MemM --> ConvR
    MemM --> MsgR
    ConvR --> DB
    MsgR --> DB
    Loop --> OutputH
```

### Fluxo de Processamento de Mensagem

```mermaid
sequenceDiagram
    participant U as Usuario Telegram
    participant I as TelegramInputHandler
    participant C as AgentController
    participant S as SkillSystem
    participant L as AgentLoop ReAct
    participant LLM as Provider AI
    participant M as MemoryManager

    U->>I: Envia Mensagem texto, voz ou doc
    I->>I: Valida Whitelist
    I->>C: Repassa Input Processado
    C->>S: Router - Identifica Skill
    S-->>C: Retorna Prompt da Skill
    C->>L: Inicia Ciclo de Raciocinio
    loop ReAct Loop ate MAX_ITERATIONS
        L->>LLM: Solicita Inferencia
        LLM-->>L: Retorna Thought ou Tool Call
        L->>L: Executa Tool se houver
    end
    L->>M: Persiste Resposta Final
    L->>U: Envia Resposta via OutputHandler
```

### Design Patterns Utilizados

| Pattern | Onde é aplicado |
|---|---|
| **Facade** | `AgentController`, `MemoryManager` |
| **Factory** | `ProviderFactory` (LLMs), `ToolFactory` (Ferramentas) |
| **Repository** | `ConversationRepository`, `MessageRepository` |
| **Singleton** | Conexão com o banco de dados SQLite |
| **Strategy** | `TelegramOutputHandler` (texto, chunks, arquivo, áudio) |
| **Registry** | Sistema de Skills e Tools para registro dinâmico |

---

## 🚀 Getting Started

### Pré-requisitos

- [Node.js](https://nodejs.org/) **v20+ LTS**
- [Git](https://git-scm.com/)
- Conta no Telegram e um **Bot Token** (criado via [@BotFather](https://t.me/BotFather))
- Chave de API para **Gemini** e/ou **DeepSeek**
- (Opcional) [Whisper](https://github.com/openai/whisper) instalado localmente para transcrição de voz
- (Opcional) [FFmpeg](https://ffmpeg.org/) instalado no sistema para suporte a áudio

### Instalação

1. **Clone o repositório:**

   ```bash
   git clone https://github.com/Adriano1976/Agente_AdriClaw_Antigrevity.git
   cd Agente_AdriClaw_Antigrevity
   ```

2. **Instale as dependências:**

   ```bash
   npm install
   ```

3. **Configure as variáveis de ambiente:**

   ```bash
   cp .env.exemplo .env
   ```

   Edite o arquivo `.env` com suas credenciais:

   ```env
   # Telegram
   TELEGRAM_BOT_TOKEN=seu_token_aqui
   TELEGRAM_ALLOWED_USER_IDS=123456789,987654321

   # LLM Provider (gemini | deepseek)
   LLM_PROVIDER=gemini
   GEMINI_API_KEY=sua_chave_gemini
   DEEPSEEK_API_KEY=sua_chave_deepseek

   # Agent Config
   MAX_ITERATIONS=5
   MEMORY_WINDOW_SIZE=20
   ```

4. **Inicie o agente em modo de desenvolvimento:**

   ```bash
   npm run dev
   ```

### Scripts Disponíveis

| Comando | Descrição |
|---|---|
| `npm run dev` | Inicia o agente em modo de desenvolvimento (tsx) |
| `npm run build` | Compila o TypeScript para JavaScript em `./dist/` |
| `npm start` | Executa a versão compilada em produção |

---

## 📁 Estrutura do Projeto

```
AdriClaw/
├── .agents/
│   └── skills/             # 🔌 Plugins de Skills (Hot-Reload) — adicione pastas com SKILL.md
├── data/                   # 💾 Banco de dados SQLite (db.sqlite) — não versionado
├── dist/                   # 📦 Build compilado (gerado por `npm run build`)
├── specs/                  # 📋 Documentação de specs e PRDs do projeto
│   ├── PRD.md
│   ├── architecture.md
│   ├── agent-loop.md
│   ├── memory.md
│   ├── skill-user.md
│   ├── telegram-input.md
│   └── telegram-output.md
├── src/                    # 🧠 Código-fonte principal
│   ├── config/             # Configurações e variáveis de ambiente
│   ├── core/               # AgentController e AgentLoop (motor ReAct)
│   ├── db/                 # Conexão com o SQLite (Singleton)
│   ├── memory/             # MemoryManager e Repositories
│   ├── providers/          # Provedores de LLM (Gemini, DeepSeek)
│   ├── repository/         # ConversationRepository, MessageRepository
│   ├── skills/             # SkillLoader, SkillRouter, SkillExecutor
│   ├── telegram/           # TelegramInputHandler, TelegramOutputHandler
│   ├── tools/              # BaseTool, ToolRegistry e ferramentas
│   └── index.ts            # Ponto de entrada da aplicação
├── tmp/                    # Arquivos temporários (PDFs, áudios) — auto-limpo
├── .env                    # Variáveis de ambiente (NÃO versionar)
├── .env.exemplo            # Exemplo de variáveis de ambiente
├── .gitignore
├── package.json
├── tsconfig.json
└── README.md
```

---

## 🔌 Sistema de Skills (Plugins)

O AdriClaw usa um sistema de plugins que permite adicionar habilidades ao agente **sem reiniciar** o processo.

### Como criar uma nova Skill

1. Crie uma nova pasta dentro de `.agents/skills/`:

   ```
   .agents/skills/minha-skill/
   └── SKILL.md
   ```

2. O `SKILL.md` deve começar com um frontmatter YAML:

   ```markdown
   ---
   name: minha-skill
   description: 'Descrição concisa do que essa skill faz, usada pelo Router LLM para seleção.'
   ---

   # Instruções da Skill

   Descreva aqui o comportamento detalhado que o agente deve seguir ao usar esta skill.
   ```

3. O `SkillLoader` detecta e carrega a skill automaticamente na próxima interação.

> O `SkillRouter` usa a `description` (frontmatter) para selecionar a skill correta com base na intenção do usuário. O conteúdo completo só é injetado no contexto quando a skill é ativada — economizando tokens em conversas simples.

---

## 💾 Modelo de Dados (SQLite)

O banco de dados é criado automaticamente no caminho `./data/db.sqlite` no primeiro start.

```sql
-- Conversas por usuário
conversations {
  id: TEXT      -- UUID único da thread do usuário
  user_id: TEXT -- ID do usuário Telegram (whitelisted)
  provider: TEXT -- ex: 'gemini'
}

-- Mensagens individuais
messages {
  conversation_id: TEXT  -- Referência à conversa
  role: TEXT             -- 'user' | 'assistant' | 'system' | 'tool'
  content: TEXT          -- Payload da mensagem
}
```

> **Importante:** O arquivo `db.sqlite` e a pasta `data/` **nunca devem ser comitados** no Git (já configurado no `.gitignore`).

---

## 🧩 Provedores de LLM

Os provedores são intercambiáveis via variável de ambiente `LLM_PROVIDER`. O `ProviderFactory` instancia o provedor correto sem necessidade de alterar o código.

| Provedor | Variável de Env | Status |
|---|---|---|
| Google Gemini | `GEMINI_API_KEY` | ✅ Suportado |
| DeepSeek | `DEEPSEEK_API_KEY` | ✅ Suportado |

---

## 📥 Tipos de Input Suportados

| Tipo | Descrição |
|---|---|
| **Texto** | Mensagens de chat padrão via Telegram |
| **PDF** | Documentos `.pdf` — o conteúdo é extraído e processado |
| **Markdown** | Arquivos `.md` — lidos como texto puro |
| **Voz / Áudio** | Mensagens de voz e áudios transcritos localmente via Whisper |

> Envios de imagens, DOCX, XLS e outros formatos não suportados retornam uma mensagem de aviso ao usuário.

---

## 📤 Estratégias de Output

O `TelegramOutputHandler` implementa o padrão **Strategy** para escolher a melhor forma de responder:

| Estratégia | Quando é usada |
|---|---|
| **TextOutputStrategy** | Respostas de texto (fragmentadas em chunks de 4096 chars se necessário) |
| **FileOutputStrategy** | Quando a resposta é um documento `.md` (enviado como arquivo anexo) |
| **AudioOutputStrategy** | Quando `isAudio: true` — envia Voice Note via Edge-TTS |
| **ErrorOutputStrategy** | Formata e envia avisos de erro com emoji `⚠️` |

---

## 🔐 Segurança

- **Whitelist estrita** baseada em `TELEGRAM_ALLOWED_USER_IDS` no `.env` — usuários não cadastrados são ignorados silenciosamente.
- **Processamento local** — áudios e documentos são processados na máquina local; nada é enviado para serviços externos além das APIs de LLM para inferência.
- **Sem secrets em logs** — erros de API expõem apenas o nome do provedor, nunca as chaves.
- **Arquivos temporários** deletados após uso via bloco `finally` no tratamento de exceções.

---

## 🤝 Contribuindo

Contribuições são bem-vindas! Para contribuir:

1. Faça um fork do repositório
2. Crie uma branch para sua feature: `git checkout -b feat/minha-feature`
3. Siga os padrões de código: **POO com Classes, Interfaces e Design Patterns** (sem funções soltas no core)
4. Garanta que novas Skills sejam documentadas com `SKILL.md` + frontmatter YAML válido
5. Abra um Pull Request descrevendo claramente a mudança

### Padrões de Código

- **TypeScript** com `strict: true` (a partir do `tsconfig.json`)
- **Paradigma obrigatório:** Classes e Interfaces (Programação Orientada a Objetos)
- Toda nova ferramenta deve herdar de `BaseTool` e ser registrada no `ToolRegistry`
- Novos provedores de LLM devem implementar a interface `ILlmProvider`
- Variáveis de ambiente sensíveis **nunca** devem ser hardcodadas no código

---

## 📚 Documentação de Referência

Todos os documentos de especificação estão na pasta [`specs/`](./specs/):

| Documento | Descrição |
|---|---|
| [PRD.md](./specs/PRD.md) | Documento de Requisitos do Produto (visão geral e objetivos) |
| [architecture.md](./specs/architecture.md) | Arquitetura detalhada, diagramas e decisões de tecnologia |
| [agent-loop.md](./specs/agent-loop.md) | Especificação do Motor ReAct (AgentLoop) |
| [memory.md](./specs/memory.md) | Especificação do Módulo de Memória (SQLite) |
| [skill-user.md](./specs/skill-user.md) | Especificação do Sistema de Skills (Hot-Reload) |
| [telegram-input.md](./specs/telegram-input.md) | Especificação do Módulo de Input do Telegram |
| [telegram-output.md](./specs/telegram-output.md) | Especificação do Módulo de Output do Telegram |

---

## 📄 Licença

Distribuído sob a licença **ISC**. Veja o arquivo `package.json` para detalhes.

---

<div align="center">
  <sub>Construído com ❤️ por Adriano · Powered by Gemini & DeepSeek · Interface via Telegram</sub>
</div>
<br>

---

<br>
<div align="center">
  <p><b><h3> Contagem de visitantes </h3></b></p>  
  <img src="https://vbr.nathanchung.dev/badge?page_id=Adriano1976/Agente_AdriClaw_Antigrevity" style="height: 30px;" />
   <br>
  <img width="100%" src="https://capsule-render.vercel.app/api?type=waving&color=87CEFA&height=120&section=footer"/>
</div>
