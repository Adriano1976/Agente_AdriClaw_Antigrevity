import { BaseTool } from './BaseTool';

export class DateTool implements BaseTool {
  name = 'horario_local';
  description = 'Obtém a hora e a data atual do sistema (útil para responder horários)';
  parameters = {
    formato_curto: {
       type: "boolean",
       description: "Retorna apenas HH:MM em vez da data completa"
    }
  };

  async execute(args: any): Promise<any> {
    const raw = new Date().toLocaleString('pt-BR');
    if (args.formato_curto) return new Date().toLocaleTimeString('pt-BR');
    return raw;
  }
}
