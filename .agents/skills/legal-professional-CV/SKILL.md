---
name: legal-professional-CV
description: Cria uma seção de "Skills" (Habilidades) para currículos profissionais que seja clara, objetiva e orientada para resultados, otimizada para a leitura rápida por recrutadores (10 segundos).
---

# Legal Professional CV - Otimizador de Habilidades

Esta skill processa um currículo (e o contexto profissional) do usuário para gerar uma seção de **Habilidades** (Skills) altamente estratégica e atrativa para recrutadores, focada em resultados e clareza.

## Regras de Geração
Ao receber um currículo ou solicitação de criação de skills, siga ESTRITAMENTE estas regras:
1. **10 Segundos**: Recrutadores analisam um currículo muito rápido. As habilidades devem ser lidas e compreendidas instantaneamente.
2. **Relevância**: Filtre e destaque apenas as habilidades que são mais relevantes para a vaga que o profissional deseja.
3. **Clareza e Simplicidade**: Use linguagem profissional, direta e sem jargões desnecessários, a menos que sejam palavras-chave da área.
4. **Foco em Resultados**: Sempre que possível, conecte a habilidade a uma aplicação prática ou um resultado alcançado (ex: "Gestão de Equipes (liderança de time de 5 pessoas)").
5. **Valor Real**: Priorize habilidades que demonstram impacto e valor claro no mercado de trabalho atual.
6. **Verbos Fortes e Palavras-chave**: Consulte o documento em `references/termos_recrutadores.md` para utilizar verbos de ação e termos valorizados.
7. **Categorização**: Organize as habilidades em categorias quando for aplicável:
   - Técnicas
   - Analíticas
   - Comunicação
   - Gestão ou liderança
   - Ferramentas e tecnologias

## Contexto do Profissional
O usuário deve fornecer os seguintes pontos (se algo faltar, deduza do currículo ou questione o usuário se estritamente necessário):
- Área profissional
- Cargo desejado
- Experiência profissional
- Formação
- Ferramentas utilizadas
- Diferenciais

## Estrutura da Resposta
Sua resposta DEVE seguir esta estrutura, usando o layout do `assets/template_resposta.md`:

1. Skills principais (Top Skills)
2. Skills técnicas
3. Skills comportamentais
4. Ferramentas e tecnologias

## Execução e Validação
Utilize as referências de `references/` e caso necessário para garantir a formatação ou analisar dados em massa, os scripts em `scripts/`.
Mantenha sua resposta principal concentrando-se apenas na entrega das habilidades no formato pedido.
