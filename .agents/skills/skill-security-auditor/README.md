# Skill Security Auditor

> Audita skills de IA em busca de vulnerabilidades de segurança, prompt injection, vazamento de dados e padrões inseguros de código.

---

## O que esta skill faz

Recebe o caminho de uma pasta de skill e produz um **relatório de segurança em `.md`** cobrindo:

| Categoria | O que é verificado |
|---|---|
| **Prompt Injection** | Instruções que permitem conteúdo externo subverter a skill |
| **Vazamento de Sistema** | Credenciais, paths internos, dados pessoais hardcoded |
| **Execução Insegura** | `eval`, `exec`, subprocess sem sanitização, pickle |
| **Exfiltração de Dados** | Envio não autorizado de dados a URLs externas |
| **Supply Chain** | Dependências sem versão fixada, instalação dinâmica |
| **Escalada de Privilégio** | Acesso a ferramentas/arquivos além do escopo da skill |

---

## Estrutura da Skill

```
skill-security-auditor/
├── SKILL.md                             ← Fluxo de auditoria e instruções
├── README.md                            ← Este arquivo
├── scripts/
│   ├── __init__.py
│   └── audit_skill.py                   ← Scanner estático automatizado
├── references/
│   ├── attack_vectors.md                ← Catálogo de vetores de ataque com exemplos
│   ├── severity_rubric.md               ← Classificação e algoritmo de score
│   └── secure_patterns.md              ← Padrões seguros para referência e recomendações
└── assets/
    └── report_template.md               ← Template do relatório final
```

---

## Como Usar

### Via Claude (modo conversacional)

Basta enviar:
> "Audite a skill em `/caminho/para/minha-skill/`"

ou

> "Tem algo inseguro nessa skill? [pasta da skill]"

### Via Script Direto (modo terminal)

```bash
# Mapear estrutura da skill
python scripts/audit_skill.py /caminho/para/skill --map

# Scan completo com relatório automático
python scripts/audit_skill.py /caminho/para/skill --scan-all

# Especificar arquivo de saída
python scripts/audit_skill.py /caminho/para/skill --scan-all --output relatorio.md

# Output também em JSON
python scripts/audit_skill.py /caminho/para/skill --scan-all --json
```

### Saída do Script

O script gera automaticamente o arquivo no diretório pai da skill:
```
security-report-<nome-da-skill>-<YYYYMMDD>.md
```

---

## O que o Relatório Inclui

1. **Sumário executivo** — score de risco (0–100), contagem por severidade
2. **Veredicto** — recomendação clara em linguagem simples
3. **Mapa de arquivos** — todos os arquivos inspecionados
4. **Achados detalhados** — por severidade, com evidência, impacto e recomendação
5. **Pontos positivos** — o que a skill faz bem
6. **Plano de remediação** — ações priorizadas e ordenadas

---

## Interpretação do Score

| Score | Significado | Ação |
|---|---|---|
| 0–15 | ✅ Seguro | Pronto para uso |
| 16–35 | 🟡 Atenção | Corrija achados médios antes de produção |
| 36–60 | 🟠 Risco Significativo | Corrija achados altos antes de qualquer uso |
| 61–85 | 🔴 Risco Alto | Não use em produção |
| 86–100 | ⛔ Crítico | Não use em nenhuma circunstância |

---

## Limitações

- A análise é **estática** — não executa o código, portanto pode haver falsos positivos
- Não detecta vulnerabilidades que dependem de runtime ou configuração externa
- Foca em padrões comuns; threats muito específicos de domínio podem não ser cobertos
- Para ambientes de alto risco, complemente com revisão humana especializada
