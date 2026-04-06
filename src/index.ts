#!/usr/bin/env node

import * as path from 'path';
import { detectProjectRoot, installSkill } from './install';

function showHelp(): void {
  console.log(`
workspace-maxxing — npx-installable skill for AI agents

Usage:
  npx workspace-maxxing [options]

Options:
  --opencode    Install skill for OpenCode agents
  --help        Show this help message

Examples:
  npx workspace-maxxing --opencode
`);
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);

  if (args.length === 0 || args.includes('--help')) {
    showHelp();
    process.exit(0);
  }

  if (args.includes('--opencode')) {
    const cwd = process.cwd();
    const projectRoot = detectProjectRoot(cwd);

    if (projectRoot !== cwd) {
      console.log(`Detected project root: ${projectRoot}`);
    }

    const templatesDir =
      process.env.WORKSPACE_MAXXING_TEMPLATES ??
      path.join(__dirname, '..', 'templates');

    console.log('Installing workspace-maxxing skill...');
    const result = await installSkill(projectRoot, templatesDir);

    if (result.success) {
      console.log(`Skill installed to: ${result.skillPath}`);
      console.log('Open a new OpenCode session and invoke the workspace-maxxing skill to get started.');
    } else {
      console.error(`Installation failed: ${result.error}`);
      process.exit(1);
    }

    return;
  }

  console.error(`Unknown flag: ${args.find((a) => a.startsWith('--'))}`);
  console.error('Run "npx workspace-maxxing --help" for usage.');
  process.exit(1);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
