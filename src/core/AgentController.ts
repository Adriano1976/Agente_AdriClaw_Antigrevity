import { Context } from 'grammy';
import { AgentLoop } from '../core/AgentLoop';
import { SkillLoader } from '../skills/SkillLoader';
import { SkillRouter } from '../skills/SkillRouter';

export class AgentController {

  public static async handleMessage(ctx: Context, userId: string, text: string, requiresAudio: boolean = false) {
    try {
      // 1. Notifica o telegram que o bot "está digitando..." ou "gravando áudio..."
      await ctx.replyWithChatAction(requiresAudio ? 'record_voice' : 'typing');

      // 2. Load e rotas (Passo Zero Neural)
      const skills = SkillLoader.loadAllSkills();
      const skillContext = await SkillRouter.determineSkill(text, skills);

      const convId = `telegram_${ctx.chat?.id}`;

      // 3. Loop ReAct real
      const finalReply = await AgentLoop.run(
        userId,
        convId,
        skillContext || '',
        text
      );

      // 4. OutputHandler simplificado
      await this.sendReply(ctx, finalReply, requiresAudio);

    } catch (e: any) {
      console.error("[AgentController] Falha:", e);
      await ctx.reply(`❌ Erro no Loop Interno: ${e.message}`);
    }
  }

  private static async sendReply(ctx: Context, text: string, requiresAudio: boolean = false) {
    // Caso seja áudio, faríamos a ponte com Edge-TTS aqui no futuro.
    if (requiresAudio) {
      console.log(`[Output] Preparando TTS (Thalita) para a resposta...`);
      // Mock: Avisa o user que mandaria áudio
      text = `🎙️ Áudio gerado localmente:\n` + text;
    }

    const plainText = text.replace(/[#*`_~\[\]]/g, '');
    const MAX_LEN = 4000;
    if (plainText.length <= MAX_LEN) {
      await ctx.reply(plainText);
      return;
    }

    // Split primitivo
    for (let i = 0; i < plainText.length; i += MAX_LEN) {
      await ctx.reply(plainText.substring(i, i + MAX_LEN));
    }
  }
}
