import { BaseTool } from './BaseTool';

export class ToolRegistry {
  private tools: Map<string, BaseTool> = new Map();

  register(tool: BaseTool) {
    this.tools.set(tool.name, tool);
  }

  getTool(name: string): BaseTool | undefined {
    return this.tools.get(name);
  }

  getAllTools(): BaseTool[] {
    return Array.from(this.tools.values());
  }

  getToolsSchema() {
    return this.getAllTools().map(t => ({
      name: t.name,
      description: t.description,
      parameters: {
         type: "OBJECT",
         properties: t.parameters
      }
    }));
  }
}
export const globalToolRegistry = new ToolRegistry();
