// classe responsável por definir a estrutura das ferramentas que serão utilizadas pelo agente.
export abstract class BaseTool {

  abstract name: string;
  abstract description: string;
  abstract parameters: Record<string, any>;

  // método responsável por executar a ferramenta
  abstract execute(args: Record<string, any>): Promise<any>;
}
