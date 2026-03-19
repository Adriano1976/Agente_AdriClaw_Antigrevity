# Legal Document Explainer — Skill

> Traduz documentos jurídicos complexos em linguagem simples, destaca cláusulas de risco e orienta o usuário antes de assinar.

---

## O que esta skill faz

Quando você enviar qualquer documento jurídico — contrato de aluguel, termos de serviço, política de privacidade, NDA, contrato de trabalho, financiamento, etc. — esta skill produz automaticamente:

1. **Resumo em linguagem simples** — Entenda em 5 linhas o que o documento realmente diz
2. **Cláusulas problemáticas destacadas** — Multas, renovação automática, coleta de dados, rescisão unilateral e mais
3. **Placar de Risco** — 🟢 Baixo / 🟡 Médio / 🔴 Alto com justificativa detalhada
4. **Perguntas práticas** — O que perguntar para a outra parte ou para um advogado antes de assinar

---

## Estrutura da Skill

```
legal-document-explainer/
├── SKILL.md                          # Instruções principais e fluxo de trabalho
├── README.md                         # Este arquivo
├── scripts/
│   ├── __init__.py
│   └── analyze_document.py           # Extrator de texto para PDF/DOCX/TXT
├── references/
│   ├── clause_patterns.md            # Catálogo de cláusulas problemáticas
│   └── risk_scoring_guide.md         # Critérios do placar de risco
└── assets/
    ├── report_template.md            # Template de saída do relatório
    └── question_bank.md              # Banco de perguntas práticas por categoria
```

---

## Como Instalar

1. Descompacte o arquivo `legal-document-explainer.zip`
2. Coloque a pasta `legal-document-explainer/` em seu diretório de skills
3. A skill será ativada automaticamente quando você mencionar documentos jurídicos

---

## Como Usar o Script de Extração (Opcional)

Para documentos em PDF ou DOCX, use o script auxiliar via terminal:

```bash
# Instalar dependências
pip install pdfplumber python-docx chardet

# Extrair texto de um PDF
python scripts/analyze_document.py meu_contrato.pdf

# Extrair e salvar em arquivo
python scripts/analyze_document.py meu_contrato.pdf --output texto.txt

# Ver estatísticas e pré-análise de risco
python scripts/analyze_document.py meu_contrato.pdf --stats

# Apenas flags de risco em JSON
python scripts/analyze_document.py meu_contrato.pdf --flags-only
```

---

## Exemplos de Uso

**Colar texto diretamente:**
> "Pode analisar esse contrato? [cola o texto]"

**Enviar arquivo:**
> "Analisa esse PDF pra mim antes de eu assinar"

**Trecho específico:**
> "O que significa essa cláusula? 'O presente contrato será renovado automaticamente...'"

**Com tipo específico:**
> "Esse é um contrato de aluguel, consegue me dizer os riscos?"

---

## Limitações

- A análise é informativa e **não substitui orientação jurídica profissional**
- Documentos escaneados (imagem) precisam de OCR antes de serem processados
- A análise é tão boa quanto o texto fornecido — documentos parciais geram análises parciais
- Leis específicas de cada estado/município podem influenciar a análise

---

## Aviso Legal

> ⚖️ Este é um assistente de IA para fins informativos. Não é um escritório de advocacia e não fornece aconselhamento jurídico. Sempre consulte um advogado licenciado para decisões jurídicas importantes.
