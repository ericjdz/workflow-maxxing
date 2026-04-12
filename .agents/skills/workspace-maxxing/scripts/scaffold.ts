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
  fs.writeFileSync(path.join(metaDir, 'execution-log.md'), generateExecutionLogMd(stages));
  fs.writeFileSync(path.join(metaDir, 'CONTEXT.md'), `# 00-meta Context\n\nMetadata and tool inventory for the ${name} workspace.\n`);

  for (const stage of stages) {
    const stageDir = path.join(outputDir, stage);
    fs.mkdirSync(stageDir, { recursive: true });
    fs.writeFileSync(
      path.join(stageDir, 'CONTEXT.md'),
      generateStageContextMd(name, stage, stages),
    );
  }

  fs.writeFileSync(path.join(outputDir, 'README.md'), generateReadmeMd(name, stages));

  console.log(`Workspace "${name}" scaffolded at: ${outputDir}`);
}

function generateSystemMd(name: string, stages: string[]): string {
  const folderRows = stages
    .map((stage, index) => `| ${index + 1} | \`${stage}/\` | ${stageDescription(stage)} |`)
    .join('\n');

  return `# ${name} — System Prompt

## Role
You are an AI assistant operating inside the ${name} workspace. Follow stage boundaries and route tasks through stage-specific CONTEXT files.

## Folder Map

| Stage | Folder | Purpose |
|------:|--------|---------|
${folderRows}
| meta | \`00-meta/\` | Workspace configuration, tool inventory, and session notes |

## Workflow Rules
1. Read \`SYSTEM.md\` first, then root \`CONTEXT.md\`.
2. Load only one stage \`CONTEXT.md\` at a time unless handoff explicitly requires another stage.
3. Keep information canonical; do not duplicate facts across files.
4. Maintain one-way stage dependencies from earlier stage numbers to later stage numbers.

## Scope Guardrails
- Build and maintain workflow documentation, not product implementation code.
- Keep stage outputs as markdown artifacts (plans, checklists, prompts, routing notes).
- If asked to build the product itself, capture that request as workflow requirements and stay in ICM workspace scope.

## Sequential Execution Protocol
1. Complete stages strictly in ascending numeric order.
2. Record stage completion in \`00-meta/execution-log.md\` before moving to the next stage.
3. Do not produce final deliverables until all prior stage checkboxes are complete.

## Stage Boundaries
- Each numbered folder is an execution stage.
- A stage may consume upstream outputs but must not redefine upstream facts.
- Cross-stage jumps require explicit routing through root \`CONTEXT.md\`.

## Tooling Policy
- Check \`00-meta/tools.md\` before proposing tool installation.
- Document approved tooling changes in \`00-meta/tools.md\`.
`;
}

function generateContextMd(name: string, stages: string[]): string {
  const routingRows = stages
    .map((stage) => `| Work in ${stage} tasks | \`${stage}/CONTEXT.md\` | Stage contract and required outputs |`)
    .join('\n');

  const handoffs = stages
    .map((stage, index) => {
      const nextStage = stages[index + 1];
      return nextStage
        ? `- \`${stage}\` -> \`${nextStage}\` when completion criteria are met`
        : `- \`${stage}\` -> deliver final output and close loop`;
    })
    .join('\n');

  return `# ${name} — Context Router

## How to Use This File
Use this file to route each task to the smallest required context scope.

## Task Routing
This routing table maps task intent to the correct stage context.

| When you need to... | Load | Why |
|---------------------|------|-----|
| Understand workspace constraints | \`SYSTEM.md\` | Global rules and stage boundaries |
${routingRows}
| Check available tools | \`00-meta/tools.md\` | Tool inventory and approval status |

## Loading Order
1. \`SYSTEM.md\` (always)
2. This root \`CONTEXT.md\`
3. One relevant stage \`CONTEXT.md\`
4. Only the task files needed for that stage

## Scope Guardrails
- Route domain requests into workflow design steps and markdown deliverables.
- Do not scaffold backend, frontend, or runtime product source files from this router.
- Keep outputs file-structured and markdown-first across numbered workflow folders.

## Sequential Routing Contract
- Route only to the earliest incomplete stage in \`00-meta/execution-log.md\`.
- Refuse jumps to later stages when earlier stages are not marked complete.
- Append handoff notes for each completed stage before routing onward.

## Stage Handoff Routing
${handoffs}

## Escalation
Escalate when required sections are missing, dependencies are contradictory, or no valid stage route can satisfy the task.
`;
}

function generateStageContextMd(name: string, stage: string, stages: string[]): string {
  const stageIndex = stages.indexOf(stage);
  const previousStage = stageIndex > 0 ? stages[stageIndex - 1] : undefined;
  const nextStage = stageIndex >= 0 && stageIndex < stages.length - 1
    ? stages[stageIndex + 1]
    : undefined;

  const dependencyLine = previousStage
    ? `- ${previousStage}`
    : '- None (entry stage)';

  const handoffLine = nextStage
    ? `- After completion, hand off outputs to ${nextStage}`
    : '- This is the terminal stage. Package and deliver final output.';

  return `# ${stage} — Context

## Purpose
This folder executes the ${stage} stage of the ${name} workflow.

## Inputs
- Required data artifacts for ${stage}
- Upstream context from previous stage when applicable

## Outputs
- Stage-specific deliverables for downstream consumption
- Updated markdown artifacts needed by the next stage

## Dependencies
${dependencyLine}

## Required Evidence
- Update \`00-meta/execution-log.md\` to mark ${stage} complete before handoff.
- Link or reference the markdown artifacts produced in this stage.

## Completion Criteria
- Required outputs are produced and non-empty
- Outputs conform to stage purpose and markdown-first workflow format
- Handoff notes are updated for downstream stage

## Handoff
${handoffLine}
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

function generateExecutionLogMd(stages: string[]): string {
  return `# Execution Log

## Stage Checklist

${stages.map((stage) => `- [ ] ${stage}`).join('\n')}

## Rules

1. Mark a stage complete only after its completion criteria are satisfied.
2. Stages must be checked in ascending numerical order.
3. Every checked stage must have corresponding evidence notes.

## Evidence Notes

${stages.map((stage) => `### ${stage}\n- Artifacts:\n- Handoff Summary:\n`).join('\n')}`;
}

function generateReadmeMd(name: string, stages: string[]): string {
  return `# ${name} Workspace

## Structure

${stages.map((s) => `- \`${s}/\``).join('\n')}
- \`00-meta/\`

## Usage

1. Follow the workflow stages in order
2. Load CONTEXT.md files selectively — only what you need
3. Update 00-meta/execution-log.md after each completed stage
4. Keep outputs in stage folders as markdown workflow artifacts
5. Run validate.ts to check ICM compliance
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
