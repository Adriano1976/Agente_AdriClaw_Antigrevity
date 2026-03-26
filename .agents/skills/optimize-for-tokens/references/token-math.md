# Token Math — Tabela de Estimativas

## Média de tokens por tipo de linha

| Tipo de arquivo | Tokens/linha (média) | Notas |
|----------------|---------------------|-------|
| TypeScript puro (lógica) | 12–15 | Sem JSX |
| TSX com JSX | 15–20 | Props e tags inflam |
| CSS-in-JS / Tailwind | 10–12 | Classes longas |
| JSON / config | 8–10 | Estrutura repetitiva |
| Markdown / comentários | 6–8 | Mais natural que código |
| GraphQL / SQL | 10–12 | Palavras-chave curtas |

**Estimativa padrão usada pela skill:** `15 tokens/linha` (conservador, cobre a maioria dos casos).

---

## Simulação de economia por cenário

### Cenário A: Componente React monolítico (800 linhas)

**Contexto típico enviado à IA antes da refatoração:**
- Arquivo inteiro: 800 linhas × 15 = **12.000 tokens**

**Após refatoração em 5 módulos:**
| Tarefa | Módulos enviados | Tokens |
|--------|-----------------|--------|
| Corrigir bug visual | Component.tsx (90L) + types (40L) | **1.950** |
| Ajustar lógica de fetch | service.ts (110L) + types (40L) | **2.250** |
| Editar validação | utils.ts (130L) + types (40L) | **2.550** |
| Adicionar campo ao form | hook.ts (150L) + types (40L) | **2.850** |

**Economia média: 78–84%**

---

### Cenário B: Hook complexo (400 linhas)

**Antes:** 400 × 15 = **6.000 tokens** (enviado completo)

**Após divisão:**
- `useFormState.ts` (120L) = 1.800 tokens
- `useFormValidation.ts` (100L) = 1.500 tokens
- `useFormSubmit.ts` (90L) = 1.350 tokens
- `form.types.ts` (60L) = 900 tokens

**Para corrigir validação:** 1.500 + 900 = **2.400 tokens** (60% de economia)

---

### Cenário C: Arquivo de types inline (disperso em componentes)

**Problema:** 20 componentes, cada um com 3 interfaces inline = 60 tipos dispersos

**Impacto:** IA precisa abrir cada arquivo para entender a estrutura de dados

**Após centralização em `types/`:**
- IA acessa 1 arquivo para entender todas as entidades
- Contexto de modelagem: 1 arquivo (~200L) em vez de 20 arquivos (~3.000L total)
- **Economia de contexto: 93%** quando a tarefa é sobre estrutura de dados

---

## Cálculo de ROI por sessão

Fórmula para estimar tokens economizados em uma sessão de desenvolvimento:

```
Sessão típica = 10 operações de edição
Tokens por operação ANTES = N linhas do arquivo × 15
Tokens por operação DEPOIS = N linhas do módulo × 15

Economia da sessão = (antes − depois) × 10 operações
```

**Exemplo com arquivo de 600 linhas dividido em módulos de ~100 linhas:**
- Antes: 600 × 15 × 10 = 90.000 tokens/sessão
- Depois: 100 × 15 × 10 = 15.000 tokens/sessão
- **Economia: 75.000 tokens por sessão (83%)**
