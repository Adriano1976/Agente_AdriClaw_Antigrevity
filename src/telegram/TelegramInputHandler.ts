import { Bot, Context, NextFunction } from 'grammy';
import { config } from '../config';
import { AgentController } from '../core/AgentController';
import fs from 'fs';
import path from 'path';
import https from 'https';
import { exec } from 'child_process';
import { promisify } from 'util';
import pdfParse from 'pdf-parse';

const execAsync = promisify(exec);

// Helper for downloading files
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
    request.setTimeout(15000, () => {
      request.destroy();
      reject(new Error("Timeout de 15 segundos excedido (EC-05)."));
    });
    request.on('error', (err) => {
      fs.unlink(destPath, () => {});
      reject(err);
    });
  });
}

export const bot = new Bot(config.TELEGRAM_BOT_TOKEN);

// RF-02 e EC-01: Valida Whitelist Strict
bot.use(async (ctx: Context, next: NextFunction) => {
  const userId = ctx.from?.id.toString();
  if (!userId || !config.TELEGRAM_ALLOWED_USER_IDS.includes(userId)) {
    console.log(`[Auth] Ignorando requisição de ID não autorizado: ${userId}`);
    return; // RF-02: Recebe ignore instantaneo; nenhum log sensivel alem deste.
  }
  await next();
});

// Listener principal
bot.on('message:text', async (ctx) => {
  const userId = ctx.from?.id.toString();
  const text = ctx.message.text;
  if (!userId || !text) return;

  console.log(`\n[Telegram] Recebido de ${userId}: "${text}"`);
  await AgentController.handleMessage(ctx, userId, text);
});

// Listener para Documentos (PDF, MD)
bot.on('message:document', async (ctx) => {
  const userId = ctx.from?.id.toString();
  const document = ctx.message.document;
  if (!userId || !document) return;

  const mime = document.mime_type;
  const filename = document.file_name || '';

  if (mime !== 'application/pdf' && !filename.endsWith('.md')) {
    await ctx.reply("⚠️ No momento, só consigo processar texto estruturado (.md), áudio e PDF.");
    return; // EC-01
  }

  const tmpPath = path.resolve(process.cwd(), `tmp/${document.file_id}_${filename}`);
  try {
    const file = await ctx.api.getFile(document.file_id);
    if (!file.file_path) throw new Error("Telegram API didn't return a file_path");

    const url = `https://api.telegram.org/file/bot${config.TELEGRAM_BOT_TOKEN}/${file.file_path}`;
    await downloadFile(url, tmpPath);

    let parsedText = '';
    if (filename.endsWith('.md')) {
      parsedText = fs.readFileSync(tmpPath, 'utf8');
    } else if (mime === 'application/pdf') {
      const dataBuffer = fs.readFileSync(tmpPath);
      // @ts-ignore - TS types mismatch for pdf-parse commonjs export
      const data = await pdfParse(dataBuffer);
      parsedText = data.text;
    }

    const caption = ctx.message.caption || '';
    const finalText = `[Conteúdo do Documento ${filename}]:\n${parsedText}\n\n[Mensagem do Usuário]: ${caption}`;
    
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

// Listener para Áudio e Voz (STT via Whisper)
bot.on(['message:voice', 'message:audio'], async (ctx) => {
  const userId = ctx.from?.id.toString();
  const audio = ctx.message.voice || ctx.message.audio;
  if (!userId || !audio) return;

  const tmpPath = path.resolve(process.cwd(), `tmp/audio_${audio.file_id}.ogg`);
  try {
    const file = await ctx.api.getFile(audio.file_id);
    if (!file.file_path) throw new Error("Telegram API didn't return a file_path");

    const url = `https://api.telegram.org/file/bot${config.TELEGRAM_BOT_TOKEN}/${file.file_path}`;
    await downloadFile(url, tmpPath);

    await ctx.replyWithChatAction('record_voice');
    
    console.log(`\n[Telegram] Transcrevendo áudio via Whisper... (${audio.file_id})`);
    
    // Supondo que o Whisper CLI esteja instalado. --language pt pode ser adicionado.
    // Usamos o model tiny ou base dependendo da spec de desempenho local.
    const { stdout, stderr } = await execAsync(`whisper "${tmpPath}" --model tiny --language pt --output_format txt --output_dir tmp/`);
    
    // Ler o TXT gerado
    const txtPath = path.resolve(process.cwd(), `tmp/audio_${audio.file_id}.txt`);
    
    if (!fs.existsSync(txtPath)) {
      throw new Error("Transcriber falhou silenciosamente.");
    }

    const transcript = fs.readFileSync(txtPath, 'utf8').trim();
    
    // Cleanup extra txt
    fs.unlinkSync(txtPath);

    if (!transcript) {
       await ctx.reply("Áudio vazio ou ininteligível captado. Pode reenviar?"); // EC-03
       return;
    }

    console.log(`[Telegram] STT Transcrito: "${transcript}"`);

    // Injeta na memoria setando REQUIRES_AUDIO_REPLY = true (G-05 / RF-06)
    await AgentController.handleMessage(ctx, userId, transcript, true);

  } catch (err: any) {
    console.error("[TelegramInput] Falha ao processar áudio:", err);
    await ctx.reply(`⚠️ Falha ao processar o áudio: arquivo grande demais ou falha no serviço STT.`); // EC-02
  } finally {
    if (fs.existsSync(tmpPath)) {
      fs.unlinkSync(tmpPath); // RF-03
    }
  }
});
