import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';

export interface SkillMetadata {
  id: string; // nome da pasta, e.g. "github-expert"
  name?: string;
  description?: string;
  content: string; // The markdown body
}

export class SkillLoader {
  private static skillsPath = path.resolve(process.cwd(), '.agents/skills');

  /**
   * Lê todas as pastas dentro de .agents/skills e extrai via YAML Frontmatter
   */
  public static loadAllSkills(): SkillMetadata[] {
    const skills: SkillMetadata[] = [];
    if (!fs.existsSync(this.skillsPath)) return skills;

    const folders = fs.readdirSync(this.skillsPath, { withFileTypes: true })
      .filter(dirent => dirent.isDirectory())
      .map(dirent => dirent.name);

    for (const folder of folders) {
      const mdPath = path.join(this.skillsPath, folder, 'SKILL.md');
      if (!fs.existsSync(mdPath)) continue;

      try {
        const rawContent = fs.readFileSync(mdPath, 'utf8');
        const match = rawContent.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/m);
        
        let parsedMeta = {};
        let bodyContent = rawContent;

        if (match) {
          parsedMeta = yaml.load(match[1]) as any || {};
          bodyContent = match[2];
        }

        skills.push({
          id: folder,
          name: (parsedMeta as any).name || folder,
          description: (parsedMeta as any).description || 'Sem descrição fornecida.',
          content: bodyContent.trim()
        });
      } catch (err) {
        console.error(`Falha estrutural ao ler o frontmatter da skill ${folder}:`, err);
        // EC-03: Rejeita load pontual por null exceptions geradas.
      }
    }
    return skills; // O array retornado implicitamente sobreecreve/puxa ultimo se tivesse chaves hash
  }
}
