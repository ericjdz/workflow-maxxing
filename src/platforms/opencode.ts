import * as fs from 'fs';
import * as path from 'path';
import { PlatformInstaller } from './index';

export class OpenCodeInstaller implements PlatformInstaller {
  install(agentPath: string, targetDir: string): void {
    // OpenCode expects: .agents/skills/@agent-name/SKILL.md
    // Already in correct format from agent-creator
    
    const agentName = path.basename(agentPath);
    const targetPath = path.join(targetDir, '.agents', 'skills', agentName);
    
    // Ensure target directory exists
    fs.mkdirSync(path.dirname(targetPath), { recursive: true });
    
    // Copy entire agent directory
    this.copyDir(agentPath, targetPath);
    
    console.log(`[OpenCode] Installed @${agentName} at: ${targetPath}`);
  }

  getAgentDir(workspacePath: string): string {
    return path.join(workspacePath, '.agents', 'skills');
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