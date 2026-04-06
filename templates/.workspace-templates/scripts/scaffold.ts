import * as fs from 'fs';
import * as path from 'path';

export interface ScaffoldOptions {
  name: string;
  stages: string[];
  output: string;
  force?: boolean;
}

export function scaffoldWorkspace(options: ScaffoldOptions): void {
  const { name, stages, output, force = false } = options;

  if (!stages || stages.length === 0) {
    throw new Error('stages list cannot be empty');
  }

  const outputDir = path.resolve(output);

  if (fs.existsSync(outputDir)) {
    if (!force) {
      throw new Error(`Output directory already exists: ${outputDir} (use --force to overwrite)`);
    }
    fs.rmSync(outputDir, { recursive: true, force: true });
  }

  fs.mkdirSync(outputDir, { recursive: true });

  const systemMd = generateSystemMd(name, stages);
  fs.writeFileSync(path.join(outputDir, 'SYSTEM.md'), systemMd);

  const contextMd = generateContextMd(name, stages);
  fs.writeFileSync(path.join(outputDir, 'CONTEXT.md'), contextMd);

  const metaDir = path.join(outputDir, '00-meta');
  fs.mkdirSync(metaDir, { recursive: true });
  fs.writeFileSync(path.join(metaDir, 'tools.md'), generateToolsMd());
  fs.writeFileSync(path.join(metaDir, 'CONTEXT.md'), `# 00-meta Context\n\nMetadata and tool inventory for the ${name} workspace.\n`);

  for (const stage of stages) {
    const stageDir = path.join(outputDir, stage);
    fs.mkdirSync(stageDir, { recursive: true });
    fs.writeFileSync(
      path.join(stageDir, 'CONTEXT.md'),
      generateStageContextMd(name, stage),
    );
  }

  fs.writeFileSync(path.join(outputDir, 'README.md'), generateReadmeMd(name, stages));

  console.log(`Workspace "${name}" scaffolded at: ${outputDir}`);
}

function generateSystemMd(name: string, stages: string[]): string {
  return `# ${name} — System Prompt

## Role
You are an AI assistant working within the ${name} workspace.

## Folder Map

${stages.map((s) => `- \`${s}/\` — ${stageDescription(s)}`).join('\n')}
- \`00-meta/\` — Metadata and tool inventory

## Rules
- Follow ICM methodology: canonical sources, one-way dependencies, selective loading
- Each numbered folder is a workflow stage with its own CONTEXT.md for routing
- Do not create content outside the defined structure
`;
}

function generateContextMd(name: string, stages: string[]): string {
  return `# ${name} — Context Router

## Routing Table

${stages.map((s) => `- \`${s}/\` → \`${s}/CONTEXT.md\``).join('\n')}
- \`00-meta/\` → \`00-meta/tools.md\`

## How to Use
When working on a task, load only the CONTEXT.md for the relevant stage.
Do not load the entire workspace. Route to specific sections.
`;
}

function generateStageContextMd(name: string, stage: string): string {
  return `# ${stage} — Context

## Purpose
This folder handles the ${stage} stage of the ${name} workflow.

## Inputs
- Define what inputs this stage expects

## Outputs
- Define what outputs this stage produces

## Dependencies
- List upstream stages this stage depends on
`;
}

function generateToolsMd(): string {
  return `## Tool Inventory

## Installed Tools

| Tool | Version | Manager | Installed |
|------|---------|---------|-----------|
| — | — | — | — |

## Pending Tools

List tools that are proposed but not yet approved.
`;
}

function generateReadmeMd(name: string, stages: string[]): string {
  return `# ${name} Workspace

## Structure

${stages.map((s) => `- \`${s}/\``).join('\n')}
- \`00-meta/\`

## Usage

1. Follow the workflow stages in order
2. Load CONTEXT.md files selectively — only what you need
3. Update tools.md when installing new tools
4. Run validate.ts to check ICM compliance
`;
}

function stageDescription(stage: string): string {
  const descriptions: Record<string, string> = {
    '01-input': 'Input collection and validation',
    '02-process': 'Processing and transformation',
    '03-output': 'Output generation and delivery',
  };
  return descriptions[stage] || `Stage: ${stage}`;
}

if (require.main === module) {
  const args = process.argv.slice(2);
  const parseArg = (flag: string): string | undefined => {
    const idx = args.indexOf(flag);
    return idx !== -1 ? args[idx + 1] : undefined;
  };

  const hasFlag = (flag: string): boolean => args.includes(flag);

  const name = parseArg('--name');
  const stagesStr = parseArg('--stages');
  const output = parseArg('--output');

  if (!name || !stagesStr || !output) {
    console.error('Usage: node scaffold.ts --name <name> --stages <s1,s2,...> --output <path> [--force]');
    process.exit(1);
  }

  const stages = stagesStr.split(',').map((s) => s.trim()).filter(Boolean);

  scaffoldWorkspace({
    name,
    stages,
    output,
    force: hasFlag('--force'),
  });
}
