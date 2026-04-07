# Workflow Prompt Hardening Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Harden scaffolded `SYSTEM.md` and `CONTEXT.md` generation so agents reliably follow stage workflow, and enforce the same contracts with stricter validation checks.

**Architecture:** Keep the existing scaffold-and-validate architecture and upgrade it with explicit section contracts and workflow-semantic checks. Generation remains in `scaffold.ts`, enforcement remains in `validate.ts`, and templates are aligned to the same contract. Implementation follows strict TDD: failing tests first, minimal implementation, then regression verification.

**Tech Stack:** TypeScript, Node.js built-ins (`fs`, `path`), Jest.

---

## File Responsibility Map

- `src/scripts/scaffold.ts`: Generate robust root and stage prompts with explicit workflow contracts.
- `src/scripts/validate.ts`: Enforce required prompt sections and stage workflow consistency rules.
- `templates/.workspace-templates/SYSTEM.md`: Canonical root system prompt template.
- `templates/.workspace-templates/CONTEXT.md`: Canonical root router prompt template.
- `templates/.workspace-templates/workspace/01-input/CONTEXT.md`: Canonical stage 1 prompt contract.
- `templates/.workspace-templates/workspace/02-process/CONTEXT.md`: Canonical stage 2 prompt contract.
- `templates/.workspace-templates/workspace/03-output/CONTEXT.md`: Canonical stage 3 prompt contract.
- `tests/scaffold.test.ts`: TDD coverage for generated prompt contracts.
- `tests/validate.test.ts`: TDD coverage for strict structure and workflow checks.
- `tests/templates.test.ts`: Ensure shipped templates include required robust prompt sections.

---

### Task 1: Harden Root Prompt Generation in Scaffold

**Files:**
- Modify: `tests/scaffold.test.ts`
- Modify: `src/scripts/scaffold.ts`

- [ ] **Step 1: Write failing tests for robust root SYSTEM and CONTEXT generation**

Add these tests to `tests/scaffold.test.ts`:

```typescript
it('creates robust SYSTEM.md sections for workflow-following prompts', () => {
  const outputDir = path.join(tempDir, 'workspace');
  scaffoldWorkspace({
    name: 'research',
    stages: ['01-research', '02-analysis', '03-report'],
    output: outputDir,
  });

  const systemMd = fs.readFileSync(path.join(outputDir, 'SYSTEM.md'), 'utf-8');
  expect(systemMd).toContain('## Role');
  expect(systemMd).toContain('## Folder Map');
  expect(systemMd).toContain('## Workflow Rules');
  expect(systemMd).toContain('## Stage Boundaries');
  expect(systemMd).toContain('## Tooling Policy');
});

it('creates robust root CONTEXT.md routing and loading order', () => {
  const outputDir = path.join(tempDir, 'workspace');
  scaffoldWorkspace({
    name: 'research',
    stages: ['01-research', '02-analysis', '03-report'],
    output: outputDir,
  });

  const contextMd = fs.readFileSync(path.join(outputDir, 'CONTEXT.md'), 'utf-8');
  expect(contextMd).toContain('## How to Use This File');
  expect(contextMd).toContain('## Task Routing');
  expect(contextMd).toContain('## Loading Order');
  expect(contextMd).toContain('## Stage Handoff Routing');
  expect(contextMd).toContain('## Escalation');

  expect(contextMd).toContain('01-research/CONTEXT.md');
  expect(contextMd).toContain('02-analysis/CONTEXT.md');
  expect(contextMd).toContain('03-report/CONTEXT.md');
  expect(contextMd).toContain('SYSTEM.md');
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run:

```bash
npx jest tests/scaffold.test.ts -t "robust" -v
```

Expected: FAIL with missing headings such as `## Workflow Rules` and `## How to Use This File`.

- [ ] **Step 3: Implement minimal root prompt generation changes**

Update `generateSystemMd` and `generateContextMd` in `src/scripts/scaffold.ts`:

```typescript
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

## Stage Handoff Routing
${handoffs}

## Escalation
Escalate when required sections are missing, dependencies are contradictory, or no valid stage route can satisfy the task.
`;
}
```

- [ ] **Step 4: Run tests to verify pass**

Run:

```bash
npx jest tests/scaffold.test.ts -t "robust" -v
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add tests/scaffold.test.ts src/scripts/scaffold.ts
git commit -m "feat(scaffold): generate robust root workflow prompts"
```

---

### Task 2: Harden Stage CONTEXT Generation in Scaffold

**Files:**
- Modify: `tests/scaffold.test.ts`
- Modify: `src/scripts/scaffold.ts`

- [ ] **Step 1: Write failing tests for stage section contracts and handoff details**

Add this test to `tests/scaffold.test.ts`:

```typescript
it('creates stage CONTEXT.md files with completion and handoff contracts', () => {
  const outputDir = path.join(tempDir, 'workspace');
  const stages = ['01-research', '02-analysis', '03-report'];

  scaffoldWorkspace({
    name: 'research',
    stages,
    output: outputDir,
  });

  for (let i = 0; i < stages.length; i++) {
    const stage = stages[i];
    const nextStage = stages[i + 1];
    const stageContext = fs.readFileSync(path.join(outputDir, stage, 'CONTEXT.md'), 'utf-8');

    expect(stageContext).toContain('## Purpose');
    expect(stageContext).toContain('## Inputs');
    expect(stageContext).toContain('## Outputs');
    expect(stageContext).toContain('## Dependencies');
    expect(stageContext).toContain('## Completion Criteria');
    expect(stageContext).toContain('## Handoff');

    if (nextStage) {
      expect(stageContext).toContain(nextStage);
    } else {
      expect(stageContext.toLowerCase()).toContain('final output');
    }
  }
});
```

- [ ] **Step 2: Run test to verify fail**

Run:

```bash
npx jest tests/scaffold.test.ts -t "completion and handoff" -v
```

Expected: FAIL because generated stage contexts do not contain `## Completion Criteria` and `## Handoff`.

- [ ] **Step 3: Implement stage generation changes**

Update stage loop and `generateStageContextMd` in `src/scripts/scaffold.ts`:

```typescript
for (const stage of stages) {
  const stageDir = path.join(outputDir, stage);
  fs.mkdirSync(stageDir, { recursive: true });
  fs.writeFileSync(
    path.join(stageDir, 'CONTEXT.md'),
    generateStageContextMd(name, stage, stages),
  );
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
- Updated artifacts needed by the next stage

## Dependencies
${dependencyLine}

## Completion Criteria
- Required outputs are produced and non-empty
- Outputs conform to stage purpose and expected format
- Handoff notes are updated for downstream stage

## Handoff
${handoffLine}
`;
}
```

- [ ] **Step 4: Run test to verify pass**

Run:

```bash
npx jest tests/scaffold.test.ts -t "completion and handoff" -v
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add tests/scaffold.test.ts src/scripts/scaffold.ts
git commit -m "feat(scaffold): add stage completion and handoff contracts"
```

---

### Task 3: Align Shipped Template Prompt Files and Template Tests

**Files:**
- Modify: `tests/templates.test.ts`
- Modify: `templates/.workspace-templates/SYSTEM.md`
- Modify: `templates/.workspace-templates/CONTEXT.md`
- Modify: `templates/.workspace-templates/workspace/01-input/CONTEXT.md`
- Modify: `templates/.workspace-templates/workspace/02-process/CONTEXT.md`
- Modify: `templates/.workspace-templates/workspace/03-output/CONTEXT.md`

- [ ] **Step 1: Write failing template tests for robust section contracts**

Add tests to `tests/templates.test.ts`:

```typescript
it('SYSTEM.md includes robust workflow sections', () => {
  const systemPath = path.join(templatesDir, '.workspace-templates', 'SYSTEM.md');
  const content = fs.readFileSync(systemPath, 'utf-8');

  expect(content).toContain('## Role');
  expect(content).toContain('## Folder Map');
  expect(content).toContain('## Workflow Rules');
  expect(content).toContain('## Stage Boundaries');
  expect(content).toContain('## Tooling Policy');
});

it('root CONTEXT.md includes routing, loading order, and handoff routing', () => {
  const contextPath = path.join(templatesDir, '.workspace-templates', 'CONTEXT.md');
  const content = fs.readFileSync(contextPath, 'utf-8');

  expect(content).toContain('## How to Use This File');
  expect(content).toContain('## Task Routing');
  expect(content).toContain('## Loading Order');
  expect(content).toContain('## Stage Handoff Routing');
  expect(content).toContain('## Escalation');
});

it('stage context templates include completion and handoff sections', () => {
  const stageFiles = [
    '.workspace-templates/workspace/01-input/CONTEXT.md',
    '.workspace-templates/workspace/02-process/CONTEXT.md',
    '.workspace-templates/workspace/03-output/CONTEXT.md',
  ];

  for (const file of stageFiles) {
    const content = fs.readFileSync(path.join(templatesDir, file), 'utf-8');
    expect(content).toContain('## Purpose');
    expect(content).toContain('## Inputs');
    expect(content).toContain('## Outputs');
    expect(content).toContain('## Dependencies');
    expect(content).toContain('## Completion Criteria');
    expect(content).toContain('## Handoff');
  }
});
```

- [ ] **Step 2: Run tests to verify fail**

Run:

```bash
npx jest tests/templates.test.ts -t "robust|handoff" -v
```

Expected: FAIL due missing robust sections in template files.

- [ ] **Step 3: Update template prompt files to match contract**

Replace `templates/.workspace-templates/SYSTEM.md` with:

```markdown
# System — Workspace Root

## Role
You are an AI assistant operating inside this workspace. Follow stage contracts, route tasks through stage contexts, and keep information canonical.

## Folder Map

| Folder | Purpose |
|--------|---------|
| 00-meta/ | Workspace configuration, tool inventory, session notes |
| 01-input/ | Source materials, intake, and validation |
| 02-process/ | Analysis, transformation, and drafting |
| 03-output/ | Final deliverables and publication artifacts |

## Workflow Rules
1. Read this file first every session.
2. Read root `CONTEXT.md` before loading stage files.
3. Load only the stage context and task files required for the current step.
4. Keep one canonical source for each fact; do not duplicate content across stages.

## Stage Boundaries
- Execute stages in order unless explicit handoff says otherwise.
- One-way dependencies only: upstream -> downstream.
- Downstream stages may reference upstream outputs, never reverse.

## Tooling Policy
- Tool inventory is tracked in `00-meta/tools.md`.
- Check inventory before proposing installs.
- Record approved tool changes in `00-meta/tools.md`.
```

Replace `templates/.workspace-templates/CONTEXT.md` with:

```markdown
# Routing Table

## How to Use This File
Map each task to the smallest required context and avoid loading unrelated files.

## Task Routing

| When you need to... | Go to | Load |
|---------------------|-------|------|
| Understand workspace constraints | SYSTEM.md | Always loaded first |
| Gather or validate inputs | 01-input/CONTEXT.md | Input stage contract |
| Analyze, process, or draft | 02-process/CONTEXT.md | Processing stage contract |
| Finalize and deliver outputs | 03-output/CONTEXT.md | Output stage contract |
| Check available tools | 00-meta/tools.md | Tool inventory |

## Loading Order
1. SYSTEM.md (always)
2. This root CONTEXT.md
3. One relevant stage CONTEXT.md
4. Only the task files needed for that stage

## Stage Handoff Routing
- 01-input -> 02-process when input completion criteria are met
- 02-process -> 03-output when processing completion criteria are met
- 03-output -> delivery and closure

## Escalation
Escalate when required sections are missing, routing is ambiguous, or dependencies conflict with stage order.
```

Replace `templates/.workspace-templates/workspace/01-input/CONTEXT.md` with:

```markdown
# 01-input CONTEXT.md

## Purpose
Collect, validate, and normalize workflow inputs.

## Inputs
- Raw user input and source artifacts
- Intake constraints and acceptance boundaries

## Outputs
- Validated input package ready for processing
- Input assumptions and constraints summary

## Dependencies
- None (entry stage)

## Completion Criteria
- Inputs are validated and normalized
- Required fields are present
- Handoff package is complete

## Handoff
- Hand off validated package to 02-process
```

Replace `templates/.workspace-templates/workspace/02-process/CONTEXT.md` with:

```markdown
# 02-process CONTEXT.md

## Purpose
Transform validated inputs into structured working outputs.

## Inputs
- Validated package from 01-input
- Processing requirements and quality constraints

## Outputs
- Processed artifacts ready for final delivery
- Decision log for key transformations

## Dependencies
- 01-input

## Completion Criteria
- Required transformations are complete
- Output structure is consistent and reviewable
- Handoff package is ready for output stage

## Handoff
- Hand off processed artifacts to 03-output
```

Replace `templates/.workspace-templates/workspace/03-output/CONTEXT.md` with:

```markdown
# 03-output CONTEXT.md

## Purpose
Assemble, finalize, and deliver workflow outputs.

## Inputs
- Processed artifacts from 02-process
- Delivery requirements and formatting rules

## Outputs
- Final deliverable package
- Delivery notes and validation summary

## Dependencies
- 02-process

## Completion Criteria
- Final outputs satisfy delivery requirements
- Validation summary is complete
- Artifacts are ready for handoff to user

## Handoff
- Final output stage: deliver package and close the workflow loop
```

- [ ] **Step 4: Run tests to verify pass**

Run:

```bash
npx jest tests/templates.test.ts -v
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add tests/templates.test.ts templates/.workspace-templates/SYSTEM.md templates/.workspace-templates/CONTEXT.md templates/.workspace-templates/workspace/01-input/CONTEXT.md templates/.workspace-templates/workspace/02-process/CONTEXT.md templates/.workspace-templates/workspace/03-output/CONTEXT.md
git commit -m "docs(templates): align prompt templates to robust workflow contract"
```

---

### Task 4: Add Strict Structural Validation Tests and Implement Checks

**Files:**
- Modify: `tests/validate.test.ts`
- Modify: `src/scripts/validate.ts`

- [ ] **Step 1: Write failing tests for required root and stage sections**

In `tests/validate.test.ts`, update `createValidWorkspace()` and add tests:

```typescript
function createValidWorkspace(): string {
  const ws = path.join(tempDir, 'workspace');
  fs.mkdirSync(ws, { recursive: true });

  fs.writeFileSync(path.join(ws, 'SYSTEM.md'), [
    '# Test',
    '',
    '## Role',
    'Workspace role.',
    '',
    '## Folder Map',
    '- 01-input/',
    '- 02-output/',
    '',
    '## Workflow Rules',
    'Follow selective loading and canonical source rules.',
    '',
    '## Stage Boundaries',
    'One-way dependencies only.',
    '',
    '## Tooling Policy',
    'Use tools.md for inventory.',
    '',
  ].join('\n'));

  fs.writeFileSync(path.join(ws, 'CONTEXT.md'), [
    '# Router',
    '',
    '## How to Use This File',
    'Route tasks by stage.',
    '',
    '## Task Routing',
    '- 01-input/CONTEXT.md',
    '- 02-output/CONTEXT.md',
    '',
    '## Loading Order',
    '1. SYSTEM.md',
    '2. CONTEXT.md',
    '3. Stage CONTEXT.md',
    '4. Task files only',
    '',
    '## Stage Handoff Routing',
    '01-input -> 02-output',
    '',
    '## Escalation',
    'Escalate when routing is ambiguous.',
    '',
  ].join('\n'));

  fs.mkdirSync(path.join(ws, '01-input'), { recursive: true });
  fs.writeFileSync(path.join(ws, '01-input', 'CONTEXT.md'), [
    '# 01-input',
    '',
    '## Purpose',
    'Input stage.',
    '',
    '## Inputs',
    'Raw data.',
    '',
    '## Outputs',
    'Validated data.',
    '',
    '## Dependencies',
    'None.',
    '',
    '## Completion Criteria',
    'Inputs validated.',
    '',
    '## Handoff',
    'Hand off to 02-output.',
    '',
  ].join('\n'));

  fs.mkdirSync(path.join(ws, '02-output'), { recursive: true });
  fs.writeFileSync(path.join(ws, '02-output', 'CONTEXT.md'), [
    '# 02-output',
    '',
    '## Purpose',
    'Output stage.',
    '',
    '## Inputs',
    'Validated data.',
    '',
    '## Outputs',
    'Final report.',
    '',
    '## Dependencies',
    '01-input.',
    '',
    '## Completion Criteria',
    'Output complete.',
    '',
    '## Handoff',
    'Deliver final output.',
    '',
  ].join('\n'));

  fs.mkdirSync(path.join(ws, '00-meta'), { recursive: true });
  fs.writeFileSync(path.join(ws, '00-meta', 'CONTEXT.md'), '# 00-meta\n\nMeta content.\n');
  fs.writeFileSync(path.join(ws, '00-meta', 'tools.md'), '# Tools\n\n| Tool | Version |\n|------|---------|\n');

  return ws;
}

it('fails when SYSTEM.md misses required workflow sections', () => {
  const ws = createValidWorkspace();
  fs.writeFileSync(path.join(ws, 'SYSTEM.md'), '# Test\n\n## Role\nRole only\n');

  const result = validateWorkspace(ws);

  expect(result.passed).toBe(false);
  expect(result.checks.some((c) => c.name.includes('SYSTEM.md contains ## Workflow Rules') && !c.passed)).toBe(true);
});

it('fails when root CONTEXT.md misses required router sections', () => {
  const ws = createValidWorkspace();
  fs.writeFileSync(path.join(ws, 'CONTEXT.md'), '# Router\n\n## Task Routing\n- 01-input/CONTEXT.md\n');

  const result = validateWorkspace(ws);

  expect(result.passed).toBe(false);
  expect(result.checks.some((c) => c.name.includes('CONTEXT.md contains ## Loading Order') && !c.passed)).toBe(true);
});

it('fails when stage CONTEXT.md misses completion and handoff sections', () => {
  const ws = createValidWorkspace();
  fs.writeFileSync(path.join(ws, '01-input', 'CONTEXT.md'), '# 01-input\n\n## Purpose\nInput stage\n');

  const result = validateWorkspace(ws);

  expect(result.passed).toBe(false);
  expect(result.checks.some((c) => c.name.includes('01-input/CONTEXT.md contains ## Completion Criteria') && !c.passed)).toBe(true);
  expect(result.checks.some((c) => c.name.includes('01-input/CONTEXT.md contains ## Handoff') && !c.passed)).toBe(true);
});
```

- [ ] **Step 2: Run tests to verify fail**

Run:

```bash
npx jest tests/validate.test.ts -t "required workflow sections|required router sections|completion and handoff" -v
```

Expected: FAIL because validation does not check these section contracts yet.

- [ ] **Step 3: Implement structural contract checks in validate.ts**

Add constants and helper functions in `src/scripts/validate.ts`:

```typescript
const REQUIRED_SYSTEM_HEADINGS = [
  '## Role',
  '## Folder Map',
  '## Workflow Rules',
  '## Stage Boundaries',
  '## Tooling Policy',
];

const REQUIRED_ROOT_CONTEXT_HEADINGS = [
  '## How to Use This File',
  '## Task Routing',
  '## Loading Order',
  '## Stage Handoff Routing',
  '## Escalation',
];

const REQUIRED_STAGE_CONTEXT_HEADINGS = [
  '## Purpose',
  '## Inputs',
  '## Outputs',
  '## Dependencies',
  '## Completion Criteria',
  '## Handoff',
];

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function hasHeading(content: string, heading: string): boolean {
  return new RegExp(`^${escapeRegExp(heading)}\\s*$`, 'im').test(content);
}

function addRequiredHeadingChecks(
  fileLabel: string,
  content: string,
  headings: string[],
  checks: CheckResult[],
): void {
  for (const heading of headings) {
    const found = hasHeading(content, heading);
    checks.push({
      name: `${fileLabel} contains ${heading}`,
      passed: found,
      message: found ? 'Found' : `Missing ${heading}`,
    });
  }
}
```

Integrate into `validateWorkspace()` after reading files:

```typescript
if (systemExists) {
  const systemContent = fs.readFileSync(systemMdPath, 'utf-8');
  addRequiredHeadingChecks('SYSTEM.md', systemContent, REQUIRED_SYSTEM_HEADINGS, checks);
}

if (contextExists) {
  const contextContent = fs.readFileSync(contextMdPath, 'utf-8');
  addRequiredHeadingChecks('CONTEXT.md', contextContent, REQUIRED_ROOT_CONTEXT_HEADINGS, checks);
}

for (const folder of numberedFolders) {
  const contextPath = path.join(ws, folder, 'CONTEXT.md');
  const exists = fs.existsSync(contextPath);
  // existing exists/non-empty checks

  if (exists) {
    const content = fs.readFileSync(contextPath, 'utf-8');
    addRequiredHeadingChecks(`${folder}/CONTEXT.md`, content, REQUIRED_STAGE_CONTEXT_HEADINGS, checks);
  }
}
```

- [ ] **Step 4: Run tests to verify pass**

Run:

```bash
npx jest tests/validate.test.ts -t "required workflow sections|required router sections|completion and handoff" -v
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add tests/validate.test.ts src/scripts/validate.ts
git commit -m "feat(validate): enforce required prompt section contracts"
```

---

### Task 5: Add Workflow-Semantic Validation (Routing Coverage + Dependency Direction)

**Files:**
- Modify: `tests/validate.test.ts`
- Modify: `src/scripts/validate.ts`

- [ ] **Step 1: Write failing tests for routing coverage and dependency direction**

Add tests to `tests/validate.test.ts`:

```typescript
it('fails when root routing misses a numbered stage folder', () => {
  const ws = createValidWorkspace();
  fs.writeFileSync(path.join(ws, 'CONTEXT.md'), [
    '# Router',
    '',
    '## How to Use This File',
    'Route tasks by stage.',
    '',
    '## Task Routing',
    '- 01-input/CONTEXT.md',
    '',
    '## Loading Order',
    '1. SYSTEM.md',
    '2. CONTEXT.md',
    '3. Stage CONTEXT.md',
    '4. Task files only',
    '',
    '## Stage Handoff Routing',
    '01-input -> 02-output',
    '',
    '## Escalation',
    'Escalate when routing is ambiguous.',
    '',
  ].join('\n'));

  const result = validateWorkspace(ws);

  expect(result.passed).toBe(false);
  expect(result.checks.some((c) => c.name.includes('Root routing references all numbered stages') && !c.passed)).toBe(true);
});

it('fails when stage dependencies point to a later stage number', () => {
  const ws = createValidWorkspace();
  fs.writeFileSync(path.join(ws, '01-input', 'CONTEXT.md'), [
    '# 01-input',
    '',
    '## Purpose',
    'Input stage.',
    '',
    '## Inputs',
    'Raw data.',
    '',
    '## Outputs',
    'Validated data.',
    '',
    '## Dependencies',
    '02-output',
    '',
    '## Completion Criteria',
    'Inputs validated.',
    '',
    '## Handoff',
    'Hand off to 02-output.',
    '',
  ].join('\n'));

  const result = validateWorkspace(ws);

  expect(result.passed).toBe(false);
  expect(result.checks.some((c) => c.name.includes('01-input dependencies do not point to later stages') && !c.passed)).toBe(true);
});
```

- [ ] **Step 2: Run tests to verify fail**

Run:

```bash
npx jest tests/validate.test.ts -t "routing misses|later stage number" -v
```

Expected: FAIL because routing coverage and dependency direction checks do not exist yet.

- [ ] **Step 3: Implement routing and dependency semantic checks**

In `src/scripts/validate.ts`, add helpers:

```typescript
function getNumberedStageFolders(workspacePath: string): string[] {
  const entries = fs.readdirSync(workspacePath, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isDirectory() && /^\d{2}-/.test(entry.name) && entry.name !== '00-meta')
    .map((entry) => entry.name);
}

function extractDependenciesSection(content: string): string {
  const match = content.match(/## Dependencies\s*([\s\S]*?)(?=\n##\s|$)/i);
  return match ? match[1] : '';
}

function extractStageRefs(content: string): string[] {
  const refs = new Set<string>();
  const regex = /(\d{2}-[A-Za-z0-9-_]+)/g;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(content)) !== null) {
    refs.add(match[1]);
  }
  return Array.from(refs);
}
```

Then in `validateWorkspace()`:

```typescript
const numberedFolders = getNumberedStageFolders(ws);

if (contextExists) {
  const rootContext = fs.readFileSync(contextMdPath, 'utf-8');
  const allReferenced = numberedFolders.every((folder) => rootContext.includes(`${folder}/CONTEXT.md`));
  checks.push({
    name: 'Root routing references all numbered stages',
    passed: allReferenced,
    message: allReferenced ? 'All numbered stages are routed' : 'Missing one or more numbered stage routes',
  });

  const enforcesSelectiveLoading =
    /## Loading Order/i.test(rootContext) &&
    /SYSTEM\.md/i.test(rootContext) &&
    /Only the task files needed/i.test(rootContext);

  checks.push({
    name: 'Root loading order enforces selective loading',
    passed: enforcesSelectiveLoading,
    message: enforcesSelectiveLoading ? 'Selective loading guidance found' : 'Loading order lacks selective-loading guidance',
  });
}

for (const folder of numberedFolders) {
  const stagePath = path.join(ws, folder, 'CONTEXT.md');
  if (!fs.existsSync(stagePath)) {
    continue;
  }

  const stageContent = fs.readFileSync(stagePath, 'utf-8');
  const deps = extractStageRefs(extractDependenciesSection(stageContent));
  const currentNum = parseInt(folder.slice(0, 2), 10);
  const pointsToLaterStage = deps.some((dep) => parseInt(dep.slice(0, 2), 10) > currentNum);

  checks.push({
    name: `${folder} dependencies do not point to later stages`,
    passed: !pointsToLaterStage,
    message: !pointsToLaterStage ? 'Dependency direction valid' : 'Found dependency on later-numbered stage',
  });
}
```

- [ ] **Step 4: Run tests to verify pass**

Run:

```bash
npx jest tests/validate.test.ts -t "routing misses|later stage number" -v
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add tests/validate.test.ts src/scripts/validate.ts
git commit -m "feat(validate): enforce routing coverage and dependency direction"
```

---

### Task 6: Full Regression Verification

**Files:**
- Verify-only: no planned file edits

- [ ] **Step 1: Run focused prompt-hardening suites**

Run:

```bash
npx jest tests/scaffold.test.ts tests/validate.test.ts tests/templates.test.ts -v
```

Expected: PASS for all targeted suites.

- [ ] **Step 2: Run full test suite**

Run:

```bash
npm test
```

Expected: PASS with 0 failing suites.

- [ ] **Step 3: Run TypeScript build**

Run:

```bash
npm run build
```

Expected: `tsc` completes with no errors.

- [ ] **Step 4: Final verification commit (only if additional fixes were needed during regression)**

```bash
git status
git add -A
git commit -m "chore: finalize workflow prompt hardening verification"
```
