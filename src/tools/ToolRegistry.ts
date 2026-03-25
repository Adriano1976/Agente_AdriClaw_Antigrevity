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
