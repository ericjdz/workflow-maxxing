#!/usr/bin/env node

import * as fs from 'fs';
import * as path from 'path';
import { detectProjectRoot, installSkill, AgentTarget } from './install';
import { scaffoldWorkspace } from './scripts/scaffold';
import { createAgent, generateAgentName, AgentOptions } from './agent-creator';
import { iterateAgent } from './agent-iterator';
import { detectPlatform, getPlatformInstaller } from './platforms';

/**
 * Copy sub-skills directory to workspace's .agents/skills/ folder.
 * This enables /skill research, /skill tooling, etc. inside the workspace.
 */
function copySubSkillsToWorkspace(templatesDir: string, workspaceDir: string): void {
  const skillsSrc = path.join(templatesDir, '.workspace-templates', 'skills');
  const skillsDest = path.join(workspaceDir, '.agents', 'skills');
  
  if (!fs.existsSync(skillsSrc)) {
    console.log('Warning: No sub-skills found in templates');
    return;
  }
  
  function copyDir(src: string, dest: string): void {
    fs.mkdirSync(dest, { recursive: true });
    const entries = fs.readdirSync(src, { withFileTypes: true });
    for (const entry of entries) {
      const srcPath = path.join(src, entry.name);
      const destPath = path.join(dest, entry.name);
      if (entry.isDirectory()) {
        copyDir(srcPath, destPath);
      } else {
        fs.copyFileSync(srcPath, destPath);
      }
    }
  }
  
  copyDir(skillsSrc, skillsDest);
  console.log(`Copied sub-skills to: ${skillsDest}`);
}

function showHelp(): void {
  console.log(`
workspace-maxxing — npx-installable skill for AI agents

Usage:
  npx workspace-maxxing [command]

Commands (no flags needed):
  init              Create a new workspace with invokable agent (default)
  install           Install the skill to current project (for OpenCode)

Installation Options:
  --opencode        Install skill for OpenCode agents
  --claude          Install skill for Claude Code agents
  --copilot         Install skill for GitHub Copilot agents
  --gemini          Install skill for Gemini CLI agents

Workspace Creation Options:
  --create-workspace              Create a new workspace with agent
  --workspace-name <name>        Name of the workspace (default: "My Workspace")
  --stages <stages>              Comma-separated stages (default: "01-input,02-process,03-output")
  --output <path>                Output directory (default: "./workspace")
  --agent-name <name>            Custom agent name (default: auto-generated from workspace name)
  --no-agent                     Create workspace without the invokable agent
  --threshold <n>                Robustness threshold for agent (default: 85)
  --max-iterations <n>           Max agent iterations (default: 3)

Examples:
  # Create workspace with agent (recommended)
  npx workspace-maxxing init

  # Create workspace with custom name
  npx workspace-maxxing init --workspace-name "Daily Digest"

  # Create workspace without agent
  npx workspace-maxxing init --no-agent

  # Install skill to OpenCode
  npx workspace-maxxing install
  npx workspace-maxxing --opencode
`);
}

function extractOption(args: string[], option: string): string | undefined {
  const idx = args.indexOf(option);
  return idx !== -1 && idx + 1 < args.length ? args[idx + 1] : undefined;
}

function hasFlag(args: string[], flag: string): boolean {
  return args.includes(flag);
}

async function createWorkspace(args: string[], templatesDir: string): Promise<void> {
  const workspaceName = extractOption(args, '--workspace-name') ?? 'My Workspace';
  const stagesStr = extractOption(args, '--stages') ?? '01-input,02-process,03-output';
  const stages = stagesStr.split(',').map(s => s.trim()).filter(Boolean);
  
  const withAgent = !hasFlag(args, '--no-agent');
  const agentNameOption = extractOption(args, '--agent-name');
  const outputDir = extractOption(args, '--output') 
    ? path.resolve(process.cwd(), extractOption(args, '--output')!)
    : path.resolve(process.cwd(), 'workspace');
  const threshold = extractOption(args, '--threshold') ? parseInt(extractOption(args, '--threshold')!, 10) : 85;
  const maxIterations = extractOption(args, '--max-iterations') ? parseInt(extractOption(args, '--max-iterations')!, 10) : 3;

  console.log('=== Workspace-Maxxing ===');
  console.log(`Creating workspace: ${workspaceName}`);
  console.log(`Stages: ${stages.join(', ')}`);
  console.log(`Output: ${outputDir}`);
  console.log(`With agent: ${withAgent}`);
  console.log('');

  // Step 1: Create workspace folder structure
  console.log('Step 1: Creating workspace folder structure...');
  scaffoldWorkspace({
    name: workspaceName,
    stages,
    output: outputDir,
    force: true,
  });

  // Step 2: Copy sub-skills to workspace for /skill commands
  console.log('\nStep 2: Installing sub-skills to workspace...');
  copySubSkillsToWorkspace(templatesDir, outputDir);
  
  // Step 3: Create agent if enabled
  if (withAgent) {
    console.log('\nStep 3: Creating invokable agent...');
    
    // Generate agent name from workspace name if not provided
    const agentName = agentNameOption ?? generateAgentName(workspaceName);
    
    const agentOptions: AgentOptions = {
      name: agentName,
      purpose: `Execute ${workspaceName} workflow`,
      workspacePath: outputDir,
    };
    
    createAgent(agentOptions);
    
    // Step 4: Run agent self-improvement loop
    console.log('\nStep 4: Running agent self-improvement...');
    const agentDirName = agentName.startsWith('@') ? agentName.slice(1) : agentName;
    const agentPath = path.join(outputDir, '.agents', 'skills', agentDirName);
    
    const iterationResult = await iterateAgent({
      agentPath,
      workspacePath: outputDir,
      threshold,
      maxIterations,
    });
    
    // Step 5: Install for detected platform
    console.log('\nStep 5: Installing for platform...');
    const platform = detectPlatform();
    console.log(`Detected platform: ${platform}`);
    
    const installer = getPlatformInstaller(platform);
    installer.install(agentPath, outputDir);
    
    console.log('\n=== Workspace Creation Complete ===');
    console.log(`Workspace: ${outputDir}`);
    console.log(`Agent: ${agentName}`);
    console.log(`Score: ${iterationResult.score}/${threshold}`);
    console.log(`Iterations: ${iterationResult.iterations}`);
    console.log(`\nTo invoke the agent, use: @${agentName.slice(1)}`);
  } else {
    console.log('\n=== Workspace Creation Complete ===');
    console.log(`Workspace: ${outputDir}`);
    console.log('(Agent creation disabled with --no-agent)');
  }
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);

  if (args.length === 0 || args.includes('--help')) {
    showHelp();
    process.exit(0);
  }

  // Check for init command (create workspace with agent)
  if (args.includes('init') || args.includes('--create-workspace')) {
    // Remove 'init' from args if present, keep other flags
    const cleanArgs = args.filter(a => a !== 'init' && a !== '--create-workspace');
    const templatesDir = process.env.WORKSPACE_MAXXING_TEMPLATES ?? path.join(__dirname, '..', 'templates');
    await createWorkspace(cleanArgs, templatesDir);
    return;
  }

  // Check for install command
  if (args.includes('install')) {
    const cwd = process.cwd();
    const projectRoot = detectProjectRoot(cwd);

    if (projectRoot !== cwd) {
      console.log(`Detected project root: ${projectRoot}`);
    }

    const templatesDir =
      process.env.WORKSPACE_MAXXING_TEMPLATES ??
      path.join(__dirname, '..', 'templates');

    console.log(`Installing workspace-maxxing skill...`);
    const result = await installSkill(projectRoot, templatesDir, 'opencode');

    if (result.success) {
      console.log(`Skill installed to: ${result.skillPath}`);
      console.log(`Open a new OpenCode session and invoke the workspace-maxxing skill to get started.`);
    } else {
      console.error(`Installation failed: ${result.error}`);
      process.exit(1);
    }

    return;
  }

  // Check for install targets (--opencode, --claude, etc.)
  const agentFlags: AgentTarget[] = ['opencode', 'claude', 'copilot', 'gemini'];
  const detectedAgent = agentFlags.find((flag) => args.includes(`--${flag}`));

  if (detectedAgent) {
    const cwd = process.cwd();
    const projectRoot = detectProjectRoot(cwd);

    if (projectRoot !== cwd) {
      console.log(`Detected project root: ${projectRoot}`);
    }

    const templatesDir =
      process.env.WORKSPACE_MAXXING_TEMPLATES ??
      path.join(__dirname, '..', 'templates');

    console.log(`Installing workspace-maxxing skill for ${detectedAgent}...`);
    const result = await installSkill(projectRoot, templatesDir, detectedAgent);

    if (result.success) {
      console.log(`Skill installed to: ${result.skillPath}`);
      console.log(`Open a new ${detectedAgent} session and invoke the workspace-maxxing skill to get started.`);
    } else {
      console.error(`Installation failed: ${result.error}`);
      process.exit(1);
    }

    return;
  }

  // Default: treat as workspace creation (backward compatible)
  const templatesDir = process.env.WORKSPACE_MAXXING_TEMPLATES ?? path.join(__dirname, '..', 'templates');
  await createWorkspace(args, templatesDir);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});