import { BaseTool } from './BaseTool';
import * as fs from 'fs';
import pdfParse = require('pdf-parse');

// classe responsável por ler o conteúdo de um arquivo PDF.
export class PDFReaderTool extends BaseTool {
    name = "pdf_reader";
    description = "Reads the text content of a PDF file.";
    parameters = {
        type: "object",
        properties: {
            file_path: {
                type: "string",
                description: "The path to the PDF file."
            }
        },
        required: ["file_path"]
    };

    /**
     * Método responsável por executar a ferramenta.
     * @param args - Argumentos da ferramenta.
     * @returns Texto contido no arquivo PDF.
     */
    async execute(args: { file_path: string }): Promise<string> {
        try {
            const dataBuffer = fs.readFileSync(args.file_path);
            const data = await pdfParse(dataBuffer);
            return data.text;
        } catch (error) {
            return `Error reading PDF file: ${(error as Error).message}`;
        }
    }
}
