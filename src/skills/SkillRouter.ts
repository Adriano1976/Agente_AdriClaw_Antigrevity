import { ProviderFactory } from '../providers/ProviderFactory';
import { SkillMetadata } from './SkillLoader';
import { config } from '../config';

export class SkillRouter {
  /**
   * "Passo Zero" da rede neural. Usa LLM pra ver se precisa de alguma skill
   */
  public static async determineSkill(userIntent: string, availableSkills: SkillMetadata[]): Promise<string | null> {
    if (availableSkills.length === 0) return null;

    const provider = ProviderFactory.getProvider(config.DEFAULT_LLM_PROVIDER);
    const skillsDescriptions = availableSkills.map(s => `- ${s.name} (${s.id}): ${s.description}`).join('\n');

    const prompt = `
Você é o roteador inicial. O usuário vai dizer algo. Você deve decidir se alguma dessas HABILIDADES (Skills) é PERFEITA para responder.
HABILIDADES DISPONÍVEIS:
${skillsDescriptions}

Obrigatório: Responda APENAS com um JSON simples no formato {"skillName": "id_da_skill"} caso sirva, ou {"skillName": null} se for conversa fiada/geral. Nunca adicione crases ou markdown format blocks adicionais.
`;

    try {
      // Pedindo no formato mais raw possível
      const response = await provider.generate(prompt, [{ role: 'user', content: userIntent }], []);
      if (!response.content) return null;

      const raw = response.content.replace(/\`\`\`json/g, '').replace(/\`\`\`/g, '').trim();
      const parsed = JSON.parse(raw);
      
      const found = availableSkills.find(s => s.id === parsed.skillName);
      if (found) {
         console.log(`[Router] Skill Casada: ${found.id}`);
         return found.content; // Retorna o body completo da spec injetável
      }
      return null;
    } catch (e) {
      console.error("[Router] Falha no JSON Schema, caindo pro fallback bot:", e);
      return null; // Fallback
    }
  }
}
