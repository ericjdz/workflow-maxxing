import * as fs from 'fs';
import * as path from 'path';
import { PlatformInstaller } from './index';

export class CopilotInstaller implements PlatformInstaller {
  install(agentPath: string, targetDir: string): void {
    // Copilot expects: .github/copilot-instructions/<name>.md
    // Convert SKILL.md content to markdown instructions
    
    const agentName = path.basename(agentPath);
    const cleanName = agentName.startsWith('@') ? agentName.slice(1) : agentName;
    const targetPath = path.join(targetDir, '.github', 'copilot-instructions', `${cleanName}.md`);
    
    // Ensure target directory exists
    fs.mkdirSync(path.dirname(targetPath), { recursive: true });
    
    // Convert skill to copilot instructions format
    const skillMdPath = path.join(agentPath, 'SKILL.md');
    const skillMd = fs.existsSync(skillMdPath) 
      ? fs.readFileSync(skillMdPath, 'utf-8') 
      : '# Agent\n\nWorkflow agent';
    const instructions = this.convertToCopilotInstructions(skillMd, cleanName);
    
    fs.writeFileSync(targetPath, instructions);
    console.log(`[Copilot] Installed ${cleanName} at: ${targetPath}`);
  }

  getAgentDir(workspacePath: string): string {
    return path.join(workspacePath, '.github', 'copilot-instructions');
  }

  private convertToCopilotInstructions(skillMd: string, agentName: string): string {
    // Extract description from SKILL.md
    const descMatch = skillMd.match(/^description:\s*"(.+)"$/m);
    const triggersMatch = skillMd.match(/^triggers:\s*\[(.+)\]/m);
    
    const desc = descMatch ? descMatch[1] : 'Workflow agent';
    const triggers = triggersMatch ? triggersMatch[1].replace(/["']/g, '').split(',') : [];
    
    let output = `# ${agentName}\n\n${desc}\n\n`;
    
    if (triggers.length > 0) {
      output += `## Trigger Phrases\n\n${triggers.map(t => `- ${t.trim()}`).join('\n')}\n\n`;
    }
    
    output += `## Usage\n\nUse this agent when working with the workspace workflow. Simply mention @${agentName} or use the trigger phrases above.\n\n## Capabilities\n\n- Execute workflow tasks following ICM stage boundaries\n- Process inputs and generate outputs\n- Produce structured markdown artifacts\n`;
    
    return output;
  }
}