export type Platform = 'opencode' | 'claude' | 'copilot' | 'gemini';

export interface PlatformInstaller {
  install(agentPath: string, targetDir: string): void;
  getAgentDir(workspacePath: string): string;
}

export function detectPlatform(): Platform {
  // Check for platform-specific env vars or files
  if (process.env.OPENCODE_SESSION || process.env.AGENT_MODE === 'opencode') {
    return 'opencode';
  }
  if (process.env.CLAUDE_CODE || process.env.CLAUDE_SESSION) {
    return 'claude';
  }
  if (process.env.COPILOT_AGENT) {
    return 'copilot';
  }
  if (process.env.GEMINI_CLI) {
    return 'gemini';
  }
  // Default to opencode for now
  return 'opencode';
}

export function getPlatformInstaller(platform: Platform): PlatformInstaller {
  switch (platform) {
    case 'opencode':
      return new OpenCodeInstaller();
    case 'claude':
      return new ClaudeInstaller();
    case 'copilot':
      return new CopilotInstaller();
    case 'gemini':
      return new GeminiInstaller();
    default:
      throw new Error(`Unknown platform: ${platform}`);
  }
}

// Import and re-export all platform installers
import { OpenCodeInstaller } from './opencode';
import { ClaudeInstaller } from './claude';
import { CopilotInstaller } from './copilot';
import { GeminiInstaller } from './gemini';