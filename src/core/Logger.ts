import fs from 'fs';
import path from 'path';
import { config } from '../config';

/**
 * Utilitário para salvar logs de erro e alertas de forma segura.
 * Filtra dados sensíveis (tokens, chaves, caminhos) antes de gravar em arquivo.
 */
export class Logger {
  public static init() {
    const logDir = path.resolve(process.cwd(), 'logs');
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }

    const dateStr = new Date().toISOString().split('T')[0];
    const logFile = path.resolve(logDir, `${dateStr}.log`);
    const logStream = fs.createWriteStream(logFile, { flags: 'a' });

    /**
     * Helper para formatar a linha de log com data e hora.
     */
    /**
     * Oculta dados sensíveis de uma string antes de gravar no arquivo.
     */
    const redact = (text: string) => {
      let redacted = text;

      // 1. Oculta Chaves de API e Tokens conhecidos para segurança.
      const sensitiveKeys = [
        config.TELEGRAM_BOT_TOKEN,
        config.GEMINI_API_KEY,
        config.GROQ_API_KEY
      ].filter(k => k && k.length > 5); // Apenas chaves reais para segurança.

      sensitiveKeys.forEach(key => {
        redacted = redacted.split(key).join('[SENSITIVE_REDACTED]');
      });

      // 2. Oculta nomes de usuários em caminhos do Windows/Linux para segurança.
      const homePath = process.env.USERPROFILE || process.env.HOME || '';
      if (homePath) {
        // Encontra o nome do usuário no final do caminho do home para ocultá-lo.
        const userName = path.basename(homePath);
        if (userName.length > 2) {
          redacted = redacted.split(userName).join('USER_REDACTED');
        }
      }

      return redacted;
    };

    // formata a mensagem de log.
    const formatMsg = (args: any[]) => {
      return args.map(arg => {
        if (arg instanceof Error) {
          return `${arg.message}\n${arg.stack}`;
        }
        if (typeof arg === 'object' && arg !== null) {
          try {
            return JSON.stringify(arg, null, 2);
          } catch (e) {
            return '[Object/Circular]';
          }
        }
        return String(arg);
      }).join(' ');
    };

    // escreve no arquivo de log.
    const writeToLogFile = (type: 'LOG' | 'WARN' | 'ERROR', args: any[]) => {
      // ⚠️ Segurança: Console Normal (LOG) NÃO é salvo em arquivo por privacidade.
      if (type === 'LOG') return;

      const timestamp = new Date().toLocaleString('pt-BR');
      const msg = formatMsg(args);
      const logLine = `[${timestamp}] [${type}] ${redact(msg)}\n`;
      logStream.write(logLine);
    };

    // Backup dos métodos originais do console para que possamos sobrescrevê-los.
    const originalLog = console.log;
    const originalError = console.error;
    const originalWarn = console.warn;

    // Sobrescrita para intercepção global
    console.log = (...args: any[]) => {
      // LOG apenas no terminal p/ privacidade das conversas e segurança.
      originalLog.apply(console, args);
    };

    // Sobrescrita para intercepção global de erros.
    console.error = (...args: any[]) => {
      writeToLogFile('ERROR', args);
      originalError.apply(console, args);
    };

    // Sobrescrita para intercepção global de warnings.
    console.warn = (...args: any[]) => {
      writeToLogFile('WARN', args);
      originalWarn.apply(console, args);
    };

    // Log informando que o sistema de segurança está ativo
    originalLog.apply(console, [`[Logger] Escudo de Segurança ativo em: ${logFile}`]);
  }
}
