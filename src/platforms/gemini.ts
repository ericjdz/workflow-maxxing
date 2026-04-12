import * as fs from 'fs';
import * as path from 'path';
import { PlatformInstaller } from './index';

export class GeminiInstaller implements PlatformInstaller {
  install(agentPath: string, targetDir: string): void {
    // Gemini expects: .gemini/skills/<name>/instructions.md
    
    const agentName = path.basename(agentPath);
    const cleanName = agentName.startsWith('@') ? agentName.slice(1) : agentName;
    const targetPath = path.join(targetDir, '.gemini', 'skills', cleanName, 'instructions.md');
    
    // Ensure target directory exists
    fs.mkdirSync(path.dirname(targetPath), { recursive: true });
    
    // Convert SKILL.md to Gemini instructions format
    const skillMdPath = path.join(agentPath, 'SKILL.md');
    const skillMd = fs.existsSync(skillMdPath) 
      ? fs.readFileSync(skillMdPath, 'utf-8') 
      : '# Agent\n\nWorkflow agent';
    const instructions = this.convertToGeminiInstructions(skillMd);
    
    fs.writeFileSync(targetPath, instructions);
    console.log(`[Gemini] Installed ${cleanName} at: ${targetPath}`);
  }

  getAgentDir(workspacePath: string): string {
    return path.join(workspacePath, '.gemini', 'skills');
  }

  private convertToGeminiInstructions(skillMd: string): string {
    // Extract key sections from SKILL.md
    const nameMatch = skillMd.match(/^name:\s*(.+)$/m);
    const descMatch = skillMd.match(/^description:\s*"(.+)"$/m);
    const triggersMatch = skillMd.match(/^triggers:\s*\[(.+)\]/m);
    
    const name = nameMatch ? nameMatch[1] : 'Agent';
    const desc = descMatch ? descMatch[1] : 'Workflow agent';
    const triggers = triggersMatch 
      ? triggersMatch[1].replace(/["']/g, '').split(',').map(t => t.trim()) 
      : [];
    
    let output = `# ${name}\n\n${desc}\n\n## How to Invoke\n\n`;
    
    if (triggers.length > 0) {
      output += `Use one of these phrases:\n${triggers.map(t => `- "${t}"`).join('\n')}\n\n`;
    } else {
      output += `Invoke the agent by name.\n\n`;
    }
    
    output += `## Capabilities\n\n- Execute workflow tasks\n- Process inputs and generate outputs\n- Follow ICM stage boundaries\n- Produce markdown artifacts\n\n## Workflow Context\n\nWhen activated, this agent operates within the workspace context:\n- Read SYSTEM.md first\n- Load relevant stage CONTEXT.md\n- Execute the requested task\n- Produce outputs in appropriate folders\n`;
    
    return output;
  }
}