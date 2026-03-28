import { BaseTool } from './BaseTool';

// classe responsável por registrar as tools.
export class ToolRegistry {
  private tools: Map<string, BaseTool> = new Map();

  /**
   * Método responsável por registrar uma tool.
   * @param tool - Tool a ser registrada.
   */
  register(tool: BaseTool) {
    this.tools.set(tool.name, tool);
  }

  /**
   * Método responsável por obter uma tool pelo nome.
   * @param name - Nome da tool.
   * @returns Tool.
   */
  getTool(name: string): BaseTool | undefined {
    return this.tools.get(name);
  }

  /**
   * Método responsável por obter todas as tools.
   * @returns Array de tools.
   */
  getAllTools(): BaseTool[] {
    return Array.from(this.tools.values());
  }

  /**
   * Método responsável por obter o schema das tools.
   * @returns Schema das tools.
   */
  getToolsSchema() {
    return this.getAllTools().map(t => {
      // Avoid double-wrapping if the tool already provides a full schema object
      if (t.parameters && t.parameters.type === 'object') {
        return {
          name: t.name,
          description: t.description,
          parameters: t.parameters
        };
      }

      return {
        name: t.name,
        description: t.description,
        parameters: {
          type: "object",
          properties: t.parameters
        }
      };
    });
  }
}
export const globalToolRegistry = new ToolRegistry();
