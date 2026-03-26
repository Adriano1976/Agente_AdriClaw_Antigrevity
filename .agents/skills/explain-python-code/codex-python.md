---
name: explica-codex-python
description: >
  Use esta skill sempre que o usuário pedir para explicar, descrever ou detalhar um trecho de código Python.
  Deve ser ativada por frases como "explique esse código", "o que esse código faz", "descreva o código",
  "explica esse script" ou quando o usuário colar um bloco de código Python esperando uma explicação.
  A skill produz sempre um único parágrafo com no máximo 250 palavras, identificando módulo, classe,
  função, parâmetro e objeto presentes no código. Não faça perguntas ao usuário ao final.
---

# explica-codex-python

Skill para explicar trechos de código Python de forma clara, estruturada e padronizada.

---

## Objetivo

Gerar uma explicação em **um único parágrafo**, com **no máximo 250 palavras**, sobre o código Python fornecido pelo usuário.

---

## Regras obrigatórias

1. **Início fixo:** A explicação deve começar **exatamente** com a frase:
   > *"No código a seguir, está sendo ..."*

2. **Identificação de elementos:** Durante a explicação, identificar e nomear explicitamente os seguintes elementos quando presentes no código:
   - **Módulo** — biblioteca ou pacote importado (ex: `os`, `pandas`, `math`)
   - **Classe** — definição com `class` ou instância de uma classe
   - **Função** — definições com `def` ou funções built-in utilizadas
   - **Parâmetro** — argumentos recebidos por funções ou métodos
   - **Objeto** — instâncias de classes ou variáveis que armazenam dados

3. **Formato:** Um único parágrafo contínuo, sem listas, sem subtítulos, sem blocos de código.

4. **Limite:** No máximo **250 palavras**.

5. **Sem perguntas:** Não fazer nenhuma pergunta ao usuário ao final da explicação.

6. **Idioma:** Responder sempre em **português brasileiro**.

---

## Exemplo de saída esperada

> "No código a seguir, está sendo utilizado o módulo `pandas`, importado como `pd`, para manipulação de dados tabulares. A função `read_csv` é chamada com o parâmetro `filepath_or_buffer` recebendo o caminho do arquivo, retornando um objeto do tipo `DataFrame`, que é uma classe central do pandas. Em seguida, o método `head` é invocado sobre esse objeto com o parâmetro `n` definido como `5`, exibindo as primeiras cinco linhas do conjunto de dados."

---

## Fluxo de execução

1. Receber o código Python do usuário.
2. Analisar o código identificando módulos, classes, funções, parâmetros e objetos.
3. Redigir a explicação seguindo todas as regras acima.
4. Verificar se o texto começa com a frase obrigatória e não ultrapassa 250 palavras.
5. Entregar a explicação sem fazer perguntas ao usuário.
