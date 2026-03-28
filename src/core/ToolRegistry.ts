// interface responsável por definir o contrato que toda ferramenta deve seguir.
export interface BaseTool {
    name: string;
    description: string;
    parameters: any; // JSON schema for parameters
    execute(args: any): Promise<any>;
}

// classe responsável por registrar e gerenciar as ferramentas.
export class ToolRegistry {
    private tools: Map<string, BaseTool> = new Map();

    // método responsável por registrar uma ferramenta.
    register(tool: BaseTool) {
        this.tools.set(tool.name, tool);
    }

    // método responsável por obter uma ferramenta pelo nome.
    getTool(name: string): BaseTool | undefined {
        return this.tools.get(name);
    }

    // método responsável por obter todas as ferramentas.
    getAllTools(): BaseTool[] {
        return Array.from(this.tools.values());
    }

    // método responsável por obter os schemas das ferramentas.
    getSchemas(): any[] {
        return this.getAllTools().map(t => ({
            name: t.name,
            description: t.description,
            parameters: t.parameters
        }));
    }
}
