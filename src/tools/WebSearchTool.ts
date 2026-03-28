import { BaseTool } from './BaseTool';

/**
 * WebSearchTool — Ferramenta de busca na web via Tavily API.
 *
 * Por que Tavily?
 * - API REST simples, sem SDK pesado
 * - Retorna resultados já resumidos e limpos (ideal para contexto de LLM)
 * - Plano gratuito: 1.000 buscas/mês
 * - Chave: https://app.tavily.com
 *
 * Adicione no .env:
 *   TAVILY_API_KEY=tvly-xxxxxxxxxxxxxxxx
 */
export class WebSearchTool extends BaseTool {
  name = 'web_search';
  description =
    'Busca informações atualizadas na internet. Use quando precisar de dados em tempo real, notícias recentes, preços, clima, eventos ou qualquer informação que o seu treinamento possa não ter. Retorna um resumo dos resultados mais relevantes.';

  parameters = {
    type: 'object',
    properties: {
      query: {
        type: 'string',
        description: 'Consulta de busca em linguagem natural. Seja específico para obter melhores resultados.',
      },
      max_results: {
        type: 'number',
        description: 'Número máximo de resultados a retornar (padrão: 5, máximo: 10).',
      },
      search_depth: {
        type: 'string',
        enum: ['basic', 'advanced'],
        description:
          '"basic" para buscas rápidas e gerais. "advanced" para pesquisas mais detalhadas que consomem mais tokens (padrão: "basic").',
      },
    },
    required: ['query'],
  };

  /**
   * Método responsável por executar a ferramenta.
   * @param args - Argumentos
   */
  async execute(args: {
    query: string;
    max_results?: number;
    search_depth?: 'basic' | 'advanced';
  }): Promise<string> {
    const apiKey = process.env.TAVILY_API_KEY;

    // Validação da chave da API
    if (!apiKey) {
      return '[WebSearchTool] Erro: TAVILY_API_KEY não configurada no .env. Obtenha sua chave gratuita em https://app.tavily.com';
    }

    // Validação dos argumentos
    const { query, max_results = 5, search_depth = 'basic' } = args;
    const clampedResults = Math.min(Math.max(max_results, 1), 10);

    console.log(`[WebSearchTool] Buscando: "${query}" (depth=${search_depth}, max=${clampedResults})`);

    // Requisição à API Tavily
    try {
      const response = await fetch('https://api.tavily.com/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          query,
          max_results: clampedResults,
          search_depth,
          include_answer: true,       // Resposta sintetizada pela Tavily
          include_raw_content: false,  // Evita contexto massivo desnecessário
          include_images: false,
        }),
      });

      // Validação da resposta
      if (!response.ok) {
        const errorBody = await response.text();
        console.error(`[WebSearchTool] API Error ${response.status}:`, errorBody);
        return `[WebSearchTool] Erro na API Tavily (${response.status}). Tente novamente mais tarde.`;
      }

      // Formatação dos resultados
      const data = (await response.json()) as TavilyResponse;

      return this.formatResults(query, data);
    } catch (err: any) {
      console.error('[WebSearchTool] Falha na requisição:', err.message);
      return `[WebSearchTool] Falha ao conectar à API de busca: ${err.message}`;
    }
  }

  // ─── Formatação ────────────────────────────────────────────────────────────

  private formatResults(query: string, data: TavilyResponse): string {
    const lines: string[] = [];

    lines.push(`Resultados da busca para: "${query}"`);
    lines.push('');

    // Resposta sintetizada pela Tavily (quando disponível)
    if (data.answer) {
      lines.push('RESUMO:');
      lines.push(data.answer);
      lines.push('');
    }

    // Validação dos resultados
    if (!data.results || data.results.length === 0) {
      lines.push('Nenhum resultado encontrado.');
      return lines.join('\n');
    }

    // Formatação dos resultados
    lines.push('FONTES:');
    data.results.forEach((result, index) => {
      lines.push(`${index + 1}. ${result.title}`);
      lines.push(`   URL: ${result.url}`);
      if (result.content) {
        // Trunca o conteúdo para não estourar o contexto do LLM
        const snippet = result.content.length > 400
          ? result.content.substring(0, 400) + '...'
          : result.content;
        lines.push(`   ${snippet}`);
      }
      lines.push('');
    });

    return lines.join('\n').trim();
  }
}

// ─── Tipos da resposta Tavily ────────────────────────────────────────────────

interface TavilyResult {
  title: string;
  url: string;
  content: string;
  score: number;
}

interface TavilyResponse {
  query: string;
  answer?: string;
  results: TavilyResult[];
}
