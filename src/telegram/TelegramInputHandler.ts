import { Bot, Context, NextFunction } from 'grammy';
import { config } from '../config';
import { AgentController } from '../core/AgentController';
import fs from 'fs';
import path from 'path';
import https from 'https';
import { exec } from 'child_process';
import { promisify } from 'util';

// ✅ ADICIONAR NO LUGAR:
// FIX: pdf-parse é CJS puro — o import ESM via tsx corrompe o export principal.
// Não importamos aqui. Usamos eval('require') no ponto de uso para bypassar o compilador.
// import pdfParse from 'pdf-parse';

const execAsync = promisify(exec);

// Função auxiliar para baixar arquivos.
async function downloadFile(url: string, destPath: string): Promise<void> {
    return new Promise((resolve, reject) => {
        const file = fs.createWriteStream(destPath);
        const request = https.get(url, (response) => {
            if (response.statusCode !== 200) {
                return reject(new Error(`Falha no download. Código: ${response.statusCode}`));
            }
            response.pipe(file);
            file.on('finish', () => {
                file.close();
                resolve();
            });
        });
        // Timeout de 15 segundos para evitar que o download fique travado.
        request.setTimeout(15000, () => {
            request.destroy();
            reject(new Error("Timeout de 15 segundos excedido (EC-05)."));
        });
        // Tratamento de erro de download.
        request.on('error', (err) => {
            fs.unlink(destPath, () => { });
            reject(err);
        });
    });
}

// Instância do bot.
export const bot = new Bot(config.TELEGRAM_BOT_TOKEN);

/**
 * Middleware de Segurança (Whitelist Strict)
 * RF-02: Garante que apenas IDs configurados em TELEGRAM_ALLOWED_USER_IDS possam interagir.
 * EC-01: Tratamento de erro silencioso para usuários não autorizados, 
 * evitando exposição de logs sensíveis ou processamento desnecessário.
 */
bot.use(async (ctx: Context, next: NextFunction) => {
    const userId = ctx.from?.id.toString();
    if (!userId || !config.TELEGRAM_ALLOWED_USER_IDS.includes(userId)) {
        console.log(`[Auth] Ignorando requisição de ID não autorizado: ${userId}`);
        return; // RF-02: Recebe ignore instantaneo; nenhum log sensivel alem deste.
    }
    await next();
});

/**
 * Listener principal para mensagens de texto.
 * RF-01: Captura a entrada do usuário e a encaminha para o AgentController.
 * G-01: Ponto de entrada para interações baseadas em linguagem natural.
 */
bot.on('message:text', async (ctx) => {
    const userId = ctx.from?.id.toString();
    const text = ctx.message.text;
    if (!userId || !text) return;

    // Log da mensagem recebida.
    console.log(`\n[Telegram] Recebido de ${userId}: "${text}"`);
    await AgentController.handleMessage(ctx, userId, text);
});

/**
 * Listener para Documentos (PDF, MD).
 * RF-03: Processa arquivos enviados, extraindo texto de PDFs ou Markdown.
 * EC-04: Valida tipos de arquivo permitidos e gerencia erros de parsing.
 * O conteúdo extraído é concatenado com a legenda (caption) e enviado ao AgentController
 * como uma entrada de texto enriquecida.
 */
bot.on('message:document', async (ctx) => {
    const userId = ctx.from?.id.toString();
    const document = ctx.message.document;
    if (!userId || !document) return;

    // Log do documento recebido.
    const mime = document.mime_type;
    const filename = document.file_name || '';

    // Validação de tipos de arquivo permitidos.
    if (mime !== 'application/pdf' && !filename.endsWith('.md')) {
        await ctx.reply("⚠️ No momento, só consigo processar texto estruturado (.md), áudio e PDF.");
        return; // EC-01
    }

    // Caminho temporário para salvar o arquivo.
    const tmpPath = path.resolve(process.cwd(), `tmp/${document.file_id}_${filename}`);
    try {
        const file = await ctx.api.getFile(document.file_id);
        if (!file.file_path) throw new Error("Telegram API didn't return a file_path");

        // URL do arquivo.
        const url = `https://api.telegram.org/file/bot${config.TELEGRAM_BOT_TOKEN}/${file.file_path}`;
        await downloadFile(url, tmpPath);

        // Parse do arquivo PDF ou MD.
        let parsedText = '';
        if (filename.endsWith('.md')) {
            parsedText = fs.readFileSync(tmpPath, 'utf8');
            // ✅ ADICIONAR NO LUGAR:
        } else if (mime === 'application/pdf') {
            // FIX DEFINITIVO ESM/CJS: Escondendo o require do compilador TSX.
            // O TypeScript ignora o conteúdo de eval estaticamente, e o Node.js
            // executa em runtime puxando a função CJS intacta sem corrupção do .default
            const pdfParseRaw = eval('require')('pdf-parse');
            const dataBuffer = fs.readFileSync(tmpPath);
            const PDFParseClass = pdfParseRaw.PDFParse || pdfParseRaw.default?.PDFParse;

            if (PDFParseClass) {
                // Nova versão do pdf-parse (v2.4.5+)
                const parser = new PDFParseClass({ data: dataBuffer });
                const data = await parser.getText();
                parsedText = data.text;
                if (typeof parser.destroy === 'function') {
                    await parser.destroy();
                }
            } else {
                // Versão antiga (v1.1.1)
                const pdfParse = pdfParseRaw.default || pdfParseRaw;
                const data = await pdfParse(dataBuffer);
                parsedText = data.text;
            }
        }

        // Concatenação do texto extraído com a legenda.
        const caption = ctx.message.caption || '';
        const finalText = `[Conteúdo do Documento ${filename}]:\n${parsedText}\n\n[Mensagem do Usuário]: ${caption}`;

        // Log do texto extraído.
        console.log(`\n[Telegram] Lido Documento '${filename}' de ${userId}`);
        await AgentController.handleMessage(ctx, userId, finalText);

    } catch (err: any) {
        console.error("[TelegramInput] Falha ao processar doc:", err);
        await ctx.reply(`⚠️ Falha ao baixar ou processar arquivo: ${err.message}`); // EC-04
    } finally {
        if (fs.existsSync(tmpPath)) {
            fs.unlinkSync(tmpPath); // RF-03
        }
    }
});

/**
 * Listener para Áudio e Voz (STT - Speech-to-Text).
 * RF-06: Captura mensagens de voz ou arquivos de áudio.
 * EC-02: Realiza o download e utiliza o Whisper CLI para transcrição local.
 * G-05: Após a transcrição, o texto é enviado ao AgentController com a flag 
 * 'requiresAudioReply' ativa, sinalizando que a resposta deve ser preferencialmente em áudio.
 * Realiza limpeza automática de arquivos temporários (.ogg e .txt) após o processamento.
 */
bot.on(['message:voice', 'message:audio'], async (ctx) => {
    const userId = ctx.from?.id.toString();
    const audio = ctx.message.voice || ctx.message.audio;
    if (!userId || !audio) return;

    // Log do áudio recebido.
    const tmpPath = path.resolve(process.cwd(), `tmp/audio_${audio.file_id}.ogg`);
    try {
        const file = await ctx.api.getFile(audio.file_id);
        if (!file.file_path) throw new Error("Telegram API didn't return a file_path");

        // URL do arquivo.
        const url = `https://api.telegram.org/file/bot${config.TELEGRAM_BOT_TOKEN}/${file.file_path}`;
        await downloadFile(url, tmpPath);

        // Log do áudio transcrito.
        await ctx.replyWithChatAction('record_voice');

        console.log(`\n[Telegram] Transcrevendo áudio via Whisper... (${audio.file_id})`);

        // Supondo que o Whisper CLI esteja instalado. --language pt pode ser adicionado.
        // Usamos o model tiny ou base dependendo da spec de desempenho local.
        const { stdout, stderr } = await execAsync(`python -m whisper "${tmpPath}" --model base --language pt --output_format txt --output_dir tmp/`);

        // Ler o TXT gerado
        const txtPath = path.resolve(process.cwd(), `tmp/audio_${audio.file_id}.txt`);

        if (!fs.existsSync(txtPath)) {
            const hasFfmpegError = stderr.includes('FileNotFoundError') || stderr.includes('ffmpeg');
            if (hasFfmpegError) {
                throw new Error("FFMPEG_MISSING");
            }
            throw new Error("Transcriber falhou silenciosamente. STDERR: " + stderr);
        }

        // Ler o TXT gerado.
        const transcript = fs.readFileSync(txtPath, 'utf8').trim();

        // Limpeza do TXT gerado.
        fs.unlinkSync(txtPath);

        // Verificação de áudio vazio ou ininteligível.
        if (!transcript) {
            await ctx.reply("Áudio vazio ou ininteligível captado. Pode reenviar?"); // EC-03
            return;
        }

        // Log do áudio transcrito.
        console.log(`[Telegram] STT Transcrito: "${transcript}"`);

        // Injeta na memoria setando REQUIRES_AUDIO_REPLY = true (G-05 / RF-06)
        // Adicionamos um prefixo para o AgentLoop saber que isso veio de uma transcrição e pode conter ruidos.
        const enrichedText = `[Transcrição de voz]: ${transcript}`;
        await AgentController.handleMessage(ctx, userId, enrichedText, true);

    } catch (err: any) {
        console.error("[TelegramInput] Falha ao processar áudio:", err);

        // Mensagem de erro genérica.
        let errorMessage = `⚠️ Falha ao processar o áudio: arquivo grande demais ou falha no serviço STT.`;
        if (err.message === "FFMPEG_MISSING") {
            errorMessage = `⚠️ Falha no processamento de áudio: O 'FFmpeg' não está instalado no seu Windows ou não está no PATH. O Whisper precisa dele para ler áudios. Por favor, instale o FFmpeg (ex: 'winget install ffmpeg').`;
        } else if (err.message && (err.message.includes("'whisper'") || err.message.includes("is not recognized") || err.message.includes("não é reconhecido"))) {
            errorMessage = `⚠️ O comando 'whisper' não foi encontrado no servidor local. Por favor, instale-o executando: 'pip install openai-whisper setuptools-rust' e garanta que o FFmpeg esteja acessível no PATH.`;
        }

        // Resposta de erro ao usuário.
        await ctx.reply(errorMessage); // EC-02
    } finally {
        // Limpeza de arquivos temporários.
        if (fs.existsSync(tmpPath)) {
            fs.unlinkSync(tmpPath); // RF-03
        }
    }
});
