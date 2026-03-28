import { Logger } from './core/Logger';
Logger.init(); // Ativa logs automáticos em arquivos na pasta /logs

import { bot } from './telegram/TelegramInputHandler';

// Bootstrapping das tools
import './tools/index';

/**
 * Função responsável por inicializar o bot.
 */
async function bootstrap() {
  // Log de inicialização
  console.log("Inicializando SandecoClaw/AdriClaw Engine...");

  // Tratamento de erros
  process.on('uncaughtException', (err) => {
    console.error('Fatal Error:', err);
  });

  // Inicia o bot
  console.log("Bot iniciando polling local...");
  bot.start({
    onStart: (botInfo) => {
      console.log(`✅ Bot @${botInfo.username} ouvindo requisições na Whitelist.`);
    }
  });
}

bootstrap();
