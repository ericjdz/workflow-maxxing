#!/usr/bin/env node

import * as path from 'path';
import { detectProjectRoot, installSkill, AgentTarget } from './install';
import { scaffoldWorkspace } from './scripts/scaffold';
import { createAgent, generateAgentName, AgentOptions } from './agent-creator';
import { iterateAgent } from './agent-iterator';
import { detectPlatform, getPlatformInstaller } from './platforms';

function showHelp(): void {
  console.log(`
workspace-maxxing — npx-installable skill for AI agents

Usage:
  npx workspace-maxxing [options]

Installation Options:
  --opencode    Install skill for OpenCode agents (default)
  --claude      Install skill for Claude Code agents
  --copilot     Install skill for GitHub Copilot agents
  --gemini      Install skill for Gemini CLI agents

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
  # Install skill for OpenCode
  npx workspace-maxxing --opencode

  # Create workspace with agent
  npx workspace-maxxing --create-workspace --workspace-name "Daily Digest" --stages "01-input,02-process,03-output"

  # Create workspace in specific folder
  npx workspace-maxxing --create-workspace --workspace-name "My Workflow" --output "./my-workspace"

  # Create workspace without agent
  npx workspace-maxxing --create-workspace --workspace-name "My Workflow" --no-agent

  # Create workspace with custom agent name
  npx workspace-maxxing --create-workspace --workspace-name "AI News" --agent-name "@news-agent"
`);
}

function extractOption(args: string[], option: string): string | undefined {
  const idx = args.indexOf(option);
  return idx !== -1 && idx + 1 < args.length ? args[idx + 1] : undefined;
}

function hasFlag(args: string[], flag: string): boolean {
  return args.includes(flag);
}

async function createWorkspace(args: string[]): Promise<void> {
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

  // Step 2: Create agent if enabled
  if (withAgent) {
    console.log('\nStep 2: Creating invokable agent...');
    
    // Generate agent name from workspace name if not provided
    const agentName = agentNameOption ?? generateAgentName(workspaceName);
    
    const agentOptions: AgentOptions = {
      name: agentName,
      purpose: `Execute ${workspaceName} workflow`,
      workspacePath: outputDir,
    };
    
    createAgent(agentOptions);
    
    // Step 3: Run agent self-improvement loop
    console.log('\nStep 3: Running agent self-improvement...');
    const agentDirName = agentName.startsWith('@') ? agentName.slice(1) : agentName;
    const agentPath = path.join(outputDir, '.agents', 'skills', agentDirName);
    
    const iterationResult = await iterateAgent({
      agentPath,
      workspacePath: outputDir,
      threshold,
      maxIterations,
    });
    
    // Step 4: Install for detected platform
    console.log('\nStep 4: Installing for platform...');
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

  // Check for workspace creation
  if (args.includes('--create-workspace')) {
    await createWorkspace(args);
    return;
  }

  // Check for install targets
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

  console.error(`Unknown flag: ${args.find((a) => a.startsWith('--'))}`);
  console.error('Run "npx workspace-maxxing --help" for usage.');
  process.exit(1);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});