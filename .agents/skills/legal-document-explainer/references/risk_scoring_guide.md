# Guia de Placar de Risco

Este arquivo define os critérios para calcular o placar de risco de um documento jurídico. Consulte-o durante a etapa 4 do fluxo do SKILL.md.

---

## Sistema de Pontuação

Cada cláusula problemática identificada contribui com pontos ao placar. Some todos os pontos ao final e consulte a tabela de classificação.

### Tabela de Pontos por Tipo de Cláusula

| Cláusula | Severidade | Pontos |
|---|---|---|
| Multa desproporcional (> 20% do valor total) | 🔴 Crítico | 3 |
| Multa moderada (10–20% do valor total) | ⚠️ Atenção | 1 |
| Renovação automática sem aviso claro | 🔴 Crítico | 3 |
| Lock-in longo (> 12 meses) | ⚠️ Atenção | 2 |
| Lock-in curto (até 12 meses) | ⚠️ Atenção | 1 |
| Venda/compartilhamento de dados com terceiros | 🔴 Crítico | 3 |
| Coleta excessiva de dados sem base legal clara | 🔴 Crítico | 2 |
| Uso de dados para marketing sem opt-out | ⚠️ Atenção | 1 |
| Limitação total de responsabilidade | 🔴 Crítico | 3 |
| Limitação parcial de responsabilidade | ⚠️ Atenção | 1 |
| Rescisão unilateral sem aviso prévio | 🔴 Crítico | 3 |
| Rescisão unilateral com aviso ≤ 15 dias | ⚠️ Atenção | 2 |
| Foro em outra cidade/estado | ⚠️ Atenção | 2 |
| Arbitragem compulsória com renúncia judicial | 🔴 Crítico | 3 |
| Não-concorrência > 1 ano | 🔴 Crítico | 2 |
| Não-concorrência ≤ 1 ano | ⚠️ Atenção | 1 |
| Modificação unilateral de termos | ⚠️ Atenção | 2 |
| Cessão de propriedade intelectual ampla | 🔴 Crítico | 2 |
| Referência a documentos não fornecidos | ⚠️ Atenção | 1 |
| Ausência de direitos do consumidor (CDC/LGPD) | ⚠️ Atenção | 1 |

---

## Classificação Final

| Pontuação Total | Placar | Emoji | Interpretação |
|---|---|---|---|
| 0–3 | BAIXO | 🟢 | Documento equilibrado, poucos riscos identificados |
| 4–8 | MÉDIO | 🟡 | Alguns pontos merecem atenção e possivelmente negociação |
| 9+ | ALTO | 🔴 | Documento significativamente desfavorável ao usuário |

---

## Critérios de Ajuste Manual

Após calcular a pontuação, aplique estes ajustes:

### Eleve para ALTO independente da pontuação se:
- O documento contém cláusula que é **ilegalmente abusiva** (viola CDC art. 51, CLT, LGPD, ou Código Civil)
- Há **renúncia a direitos irrenunciáveis** (ex: FGTS, férias, 13º salário)
- O documento prevê **cessão de dados biométricos ou sensíveis** sem consentimento explícito
- Há cláusula que **inverte o ônus da prova** em desfavor do consumidor

### Reduza para BAIXO se:
- O documento contém **cláusula de arrependimento** com prazo adequado
- Há menção explícita à **LGPD com base legal clara** para cada tratamento
- Existe **mecanismo de resolução de disputas acessível** (ex: PROCON, plataforma de mediação)
- O documento é **padrão regulatório** (ex: contrato bancário regulado pelo BACEN com cláusulas obrigatórias)

---

## Exemplos de Pontuação por Tipo de Documento

### Contrato de Aluguel Típico (risco médio esperado)
- Multa de 3 meses por rescisão antecipada → 1 ponto
- Renovação automática com aviso de 30 dias → 1 ponto  
- Reajuste por IGPM anual → 0 pontos (padrão de mercado)
- **Total: 2 pontos → 🟢 BAIXO** (se cláusulas razoáveis)

### Termos de Serviço de App Típico (risco alto comum)
- Compartilhamento de dados com parceiros → 3 pontos
- Rescisão unilateral sem aviso → 3 pontos
- Modificação unilateral de termos → 2 pontos
- Arbitragem compulsória → 3 pontos
- **Total: 11 pontos → 🔴 ALTO**

### NDA Equilibrado (risco baixo esperado)
- Escopo claro e limitado → 0 pontos
- Prazo de 2 anos pós-contrato → 1 ponto
- Foro na cidade do usuário → 0 pontos
- **Total: 1 ponto → 🟢 BAIXO**

---

## Como Justificar o Placar

Na justificativa, mencione sempre:
1. **Quantas cláusulas críticas** (🔴) foram encontradas
2. **Quantas cláusulas de atenção** (⚠️) foram encontradas
3. **O principal fator de risco** (a cláusula mais grave)
4. **O que tornou o placar melhor ou pior** do que poderia ser

Exemplo de justificativa para placar MÉDIO:
> "O documento contém 1 cláusula crítica (compartilhamento de dados com terceiros) e 3 cláusulas de atenção (renovação automática, modificação unilateral de termos e foro em outra cidade). A principal preocupação é a cessão de dados a parceiros sem opção de recusa. O placar não atingiu ALTO porque a empresa oferece mecanismo de exclusão de conta e menciona a LGPD."
