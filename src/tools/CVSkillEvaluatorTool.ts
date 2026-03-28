import fs from 'fs';
import pdfParse from 'pdf-parse';
import { BaseTool } from './BaseTool';

// classe responsável por ler um arquivo PDF de currículo e extrair/formatar as skills de forma otimizada.
export class CVSkillEvaluatorTool extends BaseTool {
  name = 'evaluate_cv_skills';
  description = 'Lê um arquivo PDF de currículo e gera uma seção de habilidades (Skills) otimizada para recrutadores (baseada na skill legal-cv-skill).';

  parameters = {
    filePath: {
      type: 'string',
      description: 'Caminho do arquivo PDF no sistema de arquivos local (opcional se content já estiver disponível).'
    },
    textReplica: {
      type: 'string',
      description: 'Texto extraído do CV caso o arquivo já tenha sido lido (opcional).'
    },
    targetRole: {
      type: 'string',
      description: 'Vaga ou cargo desejado para o qual o CV será otimizado.'
    }
  };

  // método responsável por executar a ferramenta.
  public async execute(args: { filePath?: string, textReplica?: string, targetRole?: string }): Promise<any> {
    const { filePath, textReplica, targetRole } = args;
    let cvText = textReplica || '';

    // verifica se o arquivo PDF foi fornecido.
    if (filePath && !cvText) {
      if (!fs.existsSync(filePath)) {
        return `Erro: Arquivo não encontrado em ${filePath}`;
      }

      try {
        const dataBuffer = fs.readFileSync(filePath);
        // @ts-ignore - TS types mismatch for pdf-parse commonjs export
        const data = await pdfParse(dataBuffer);
        cvText = data.text;
      } catch (err: any) {
        return `Erro ao ler PDF: ${err.message}`;
      }
    }

    if (!cvText) {
      return "Erro: Nenhum conteúdo de CV fornecido (filePath ou textReplica ausentes).";
    }

    // A avaliação em si será feita pelo LLM no AgentLoop, 
    // mas esta ferramenta prepara o contexto e garante que temos o texto.
    // Retornamos o texto extraído de forma estruturada para o Agent raciocinar.
    return {
      status: 'success',
      message: 'Texto do CV extraído com sucesso. Agora aplique as regras da skill legal-professional-CV para gerar a avaliação.',
      cvContent: cvText,
      targetRole: targetRole || 'Não especificado'
    };
  }
}
