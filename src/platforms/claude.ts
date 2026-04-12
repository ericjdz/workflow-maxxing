import * as fs from 'fs';
import * as path from 'path';
import { PlatformInstaller } from './index';

export class ClaudeInstaller implements PlatformInstaller {
  install(agentPath: string, targetDir: string): void {
    // Claude Code expects: .claude/skills/<name>/SKILL.md
    // Need to remove @ prefix for directory name
    
    const agentName = path.basename(agentPath);
    const cleanName = agentName.startsWith('@') ? agentName.slice(1) : agentName;
    const targetPath = path.join(targetDir, '.claude', 'skills', cleanName);
    
    // Ensure target directory exists
    fs.mkdirSync(path.dirname(targetPath), { recursive: true });
    
    this.copyDir(agentPath, targetPath);
    console.log(`[Claude] Installed ${cleanName} at: ${targetPath}`);
  }

  getAgentDir(workspacePath: string): string {
    return path.join(workspacePath, '.claude', 'skills');
  }

  private copyDir(src: string, dest: string): void {
    fs.mkdirSync(dest, { recursive: true });
    const entries = fs.readdirSync(src, { withFileTypes: true });
    
    for (const entry of entries) {
      const srcPath = path.join(src, entry.name);
      const destPath = path.join(dest, entry.name);
      
      if (entry.isDirectory()) {
        this.copyDir(srcPath, destPath);
      } else {
        fs.copyFileSync(srcPath, destPath);
      }
    }
  }
}