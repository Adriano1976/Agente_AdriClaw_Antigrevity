
import { BaseTool } from './BaseTool';
import { AssemblyAI } from 'assemblyai';

// classe responsável por transcrever áudio para texto utilizando a API da AssemblyAI.
export class AudioReaderTool extends BaseTool {
    name = "audio_reader";
    description = "Transcribes the content of an audio file.";
    parameters = {
        type: "object",
        properties: {
            file_path: {
                type: "string",
                description: "The path to the audio file."
            }
        },
        required: ["file_path"]
    };

    private client: AssemblyAI;

    // construtor da classe
    constructor() {
        super();
        // TODO: Replace with your AssemblyAI API key
        this.client = new AssemblyAI({ apiKey: process.env.ASSEMBLYAI_API_KEY || "" });
    }

    // método responsável por transcrever o áudio
    async execute(args: { file_path: string }): Promise<string> {
        try {
            const transcript = await this.client.transcripts.create({
                audio_url: args.file_path
            });

            return transcript.text || "No text found in the audio.";
        } catch (error: any) {
            return `Error transcribing audio file: ${error.message}`;
        }
    }
}
