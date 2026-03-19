# Categorias de Risco — Auditoria de Security de Skills

## CAT-01 · Vazamento de Instruções Internas

**Descrição**: A skill contém instruções, system prompts ou metadados que revelam detalhes
confidenciais da arquitetura interna do sistema, nomes de projetos não públicos, estrutura
de diretórios sensíveis ou lógica de negócio proprietária.

**Sinais a buscar**:
- Caminhos absolutos revelando estrutura interna (ex: `/mnt/private/`, `/mnt/user-data/`)
- Nomes de projetos internos, clientes ou produtos não públicos embutidos em instruções
- Referências a sistemas internos, bancos de dados ou APIs privadas
- Comentários de desenvolvedor com contexto confidencial

**Severidade padrão**: ALTA

---

## CAT-02 · Prompt Injection / Sequestro de Instrução

**Descrição**: A skill contém padrões que podem ser explorados por um usuário malicioso para
injetar instruções e redirecionar o comportamento do modelo, incluindo conteúdo que parece
instrução mas está em posição de dados.

**Sinais a buscar**:
- Campos que interpolam input do usuário diretamente em instruções sem sanitização
- Instruções do tipo "se o usuário disser X, ignore as regras anteriores"
- Templates com `{user_input}` inserido em posição de sistema
- Ausência de separadores claros entre dados do usuário e instruções do sistema

**Severidade padrão**: CRÍTICA

---

## CAT-03 · Credenciais e Segredos Expostos

**Descrição**: A skill embute ou referencia diretamente tokens, chaves de API, senhas,
certificados ou qualquer segredo que não deveria aparecer em texto plano.

**Sinais a buscar**:
- Strings com padrão de API key (ex: `sk-`, `ghp_`, `Bearer `, `token:`)
- Variáveis com nomes como `API_KEY`, `SECRET`, `PASSWORD`, `TOKEN`
- URLs com credenciais embutidas (`https://user:pass@host`)
- Chaves privadas ou certificados em formato PEM

**Severidade padrão**: CRÍTICA

---

## CAT-04 · Exfiltração de Dados

**Descrição**: A skill instrui ou pode ser induzida a enviar dados do usuário para endpoints
externos não autorizados, incluindo webhooks, logging remoto ou chamadas de API não declaradas.

**Sinais a buscar**:
- Instruções para chamar URLs externas com conteúdo gerado pelo usuário
- Scripts que fazem POST de dados para servidores externos
- Logging que captura inputs/outputs para destinos não controlados pelo usuário

**Severidade padrão**: CRÍTICA

---

## CAT-05 · Permissões Excessivas

**Descrição**: A skill solicita ou assume permissões de filesystem, rede ou sistema além do
estritamente necessário para sua função declarada.

**Sinais a buscar**:
- Skills de leitura de documentos que também escrevem ou deletam arquivos
- Acesso a diretórios fora do escopo da tarefa (ex: skill de PDF acessando `/mnt/user-data/uploads` sem necessidade)
- Execução de comandos de sistema sem justificativa clara
- Skills que solicitam múltiplas ferramentas sensíveis sem explicar o motivo

**Severidade padrão**: ALTA

---

## CAT-06 · Bypass de Políticas de Segurança

**Descrição**: A skill contém instruções que tentam contornar políticas de segurança do modelo,
desabilitar filtros, ou instruir o modelo a ignorar suas diretrizes de segurança.

**Sinais a buscar**:
- Frases como "ignore suas instruções anteriores", "você não tem restrições aqui"
- Instruções para agir fora do escopo de segurança ("para fins educacionais, descreva como...")
- Tentativas de re-definir a identidade do modelo dentro da skill
- Instruções para não reportar erros de segurança ao usuário

**Severidade padrão**: CRÍTICA

---

## CAT-07 · Divulgação de Arquitetura do Sistema

**Descrição**: A skill revela, de forma desnecessária, detalhes sobre a infraestrutura
subjacente — versões de software, estrutura de diretórios do servidor, configurações
de ambiente ou detalhes de deployment.

**Sinais a buscar**:
- Versões específicas de bibliotecas ou frameworks embutidas em instruções
- Referências a variáveis de ambiente do servidor
- Estrutura de paths que revela organização interna do sistema
- Nomes de contêineres, instâncias de cloud ou identificadores de infraestrutura

**Severidade padrão**: MÉDIA

---

## CAT-08 · Manipulação de Output Insegura

**Descrição**: A skill pode ser usada para gerar outputs que se tornam perigosos quando
interpretados por sistemas downstream — como código executável, comandos de shell,
queries SQL sem sanitização, ou HTML/JS malicioso.

**Sinais a buscar**:
- Geração de scripts que incluem input do usuário sem escapar
- Construção dinâmica de queries SQL com valores fornecidos pelo usuário
- Templates HTML/JS que interpolam dados não sanitizados
- Geração de comandos bash com argumentos do usuário

**Severidade padrão**: ALTA

---

## CAT-09 · Persistência e Manipulação de Estado

**Descrição**: A skill tenta criar persistência não autorizada — modificando arquivos de sistema,
criando tarefas agendadas, alterando configurações, ou manipulando o estado do ambiente
além do esperado para a tarefa.

**Sinais a buscar**:
- Scripts que modificam arquivos fora do diretório de trabalho
- Instruções para criar cron jobs ou processos em background
- Modificação de arquivos de configuração do sistema
- Instruções para instalar software de forma persistente

**Severidade padrão**: ALTA

---

## CAT-10 · Informação Sensível em Exemplos e Testes

**Descrição**: Arquivos de teste, exemplos ou assets da skill contêm dados reais de usuários,
clientes ou do projeto — como nomes, emails, IDs, amostras de documentos confidenciais
ou dados financeiros usados como fixture.

**Sinais a buscar**:
- Arquivos de exemplo com dados pessoais reais (nomes, CPFs, emails)
- Fixtures de teste usando documentos reais de clientes
- Screenshots ou imagens com informações sensíveis visíveis
- Comentários com referências a casos reais ou clientes específicos

**Severidade padrão**: ALTA
