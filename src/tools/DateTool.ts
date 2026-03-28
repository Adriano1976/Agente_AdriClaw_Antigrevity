import { BaseTool } from './BaseTool';

// classe responsável por obter a hora e a data atual do sistema.
export class DateTool implements BaseTool {
  name = 'horario_local';
  description = 'Obtém a hora e a data atual do sistema (útil para responder horários)';
  parameters = {
    formato_curto: {
      type: "boolean",
      description: "Retorna apenas HH:MM em vez da data completa"
    }
  };

  /**
   * Método responsável por executar a ferramenta.
   * @param args - Argumentos da ferramenta.
   * @returns Hora e data atual do sistema.
   */
  async execute(args: any): Promise<any> {
    const raw = new Date().toLocaleString('pt-BR');
    if (args.formato_curto) return new Date().toLocaleTimeString('pt-BR');
    return raw;
  }
}
