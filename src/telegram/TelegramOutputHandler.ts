import { Context, InputFile } from 'grammy';
// @ts-ignore - edge-tts-universal pode não ter tipos ou não estar instalado
import { EdgeTTS } from 'edge-tts-universal';
import fs from 'fs';
import path from 'path';

export class TelegramOutputHandler {

    constructor() { }

    async handleOutput(ctx: Context, responseText: string, requiresAudio: boolean) {
        if (requiresAudio) {
            await this.handleAudioOutput(ctx, responseText);
            return;
        }

        // Funcionalidade G-03: Fragmentando respostas longas em vez de retornar Bad Request
        const isMarkdownPayload = responseText.includes('```markdown') && responseText.includes('# ');

        if (isMarkdownPayload) {
            await this.handleFileOutput(ctx, responseText);
        } else {
            await this.handleTextChunking(ctx, responseText);
        }
    }

    private async handleTextChunking(ctx: Context, text: string) {
        const MAX_LEN = 4000;
        const plainText = text.replace(/[#*`_~\[\]]/g, '');
        let remainingText = plainText;

        if (remainingText.length <= MAX_LEN) {
            await ctx.reply(plainText);
            return;
        }

        while (remainingText.length > 0) {
            let chunk = remainingText.substring(0, MAX_LEN);
            // Heurística rápida para evitar cortar o meio das palavras, se possível
            if (remainingText.length > MAX_LEN) {
                const lastSpace = chunk.lastIndexOf(' ');
                if (lastSpace > 0) {
                    chunk = remainingText.substring(0, lastSpace);
                    remainingText = remainingText.substring(lastSpace + 1);
                } else {
                    remainingText = remainingText.substring(MAX_LEN);
                }
            } else {
                remainingText = '';
            }

            await ctx.reply(chunk);
            // Aguarda para evitar o erro 429 (Too Many Requests)
            await new Promise(r => setTimeout(r, 500));
        }
    }

    private async handleFileOutput(ctx: Context, text: string) {
        const tmpDir = path.resolve(process.cwd(), 'tmp');
        if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir);

        const filename = `Document_${Date.now()}.md`;
        const filepath = path.join(tmpDir, filename);

        // Limpeza padrão do wrapper markdown
        let cleanText = text.replace(/```markdown\n/g, '').replace(/```\n*$/g, '');

        try {
            fs.writeFileSync(filepath, cleanText, 'utf-8');
            await ctx.replyWithDocument(new InputFile(filepath));
        } catch (err: any) {
            console.error('[OutputHandler] File write error', err);
            await this.handleError(ctx, "Não consegui gerar o arquivo, segue texto puro...");
            await this.handleTextChunking(ctx, cleanText);
        } finally {
            if (fs.existsSync(filepath)) {
                fs.unlinkSync(filepath);
            }
        }
    }

    private async handleAudioOutput(ctx: Context, text: string) {
        const tmpDir = path.resolve(process.cwd(), 'tmp');
        if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir);

        const filepath = path.join(tmpDir, `Audio_${Date.now()}.ogg`);

        try {
            // Limpa visualmente a formatação markdown para que o bot não fale "cerquilha cerquilha cerquilha"
            const plainText = text.replace(/[#*`_~]/g, '');

            const tts = new EdgeTTS(plainText, 'pt-BR-ThalitaNeural');
            const result = await tts.synthesize();
            const audioBuffer = Buffer.from(await result.audio.arrayBuffer());
            fs.writeFileSync(filepath, audioBuffer);

            await ctx.replyWithVoice(new InputFile(filepath));
        } catch (e: any) {
            console.error('[OutputHandler] TTS Fallback Error', e);
            await this.handleError(ctx, "Ops, falha ao gerar o áudio. Respondendo em texto:");
            await this.handleTextChunking(ctx, text);
        } finally {
            if (fs.existsSync(filepath)) {
                fs.unlinkSync(filepath);
            }
        }
    }

    async handleError(ctx: Context, errorMsg: string) {
        await ctx.reply(`⚠️ Erro: ${errorMsg}`);
    }
}
