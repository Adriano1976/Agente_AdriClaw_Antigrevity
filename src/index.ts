import { bot } from './telegram/TelegramInputHandler';

// Tools bootsrapping
import './tools/index';

async function bootstrap() {
  console.log("Inicializando SandecoClaw/AdriClaw Engine...");
  
  process.on('uncaughtException', (err) => {
    console.error('Fatal Error:', err);
  });

  console.log("Bot iniciando polling local...");
  bot.start({
    onStart: (botInfo) => {
      console.log(`✅ Bot @${botInfo.username} ouvindo requisições na Whitelist.`);
    }
  });
}

bootstrap();
