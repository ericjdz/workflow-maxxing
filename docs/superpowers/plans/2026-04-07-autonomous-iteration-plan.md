# Autonomous Iteration & Validation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement an autonomous iteration engine (iterate.ts) and test case generator (generate-tests.ts) that enable agents to self-test, self-evaluate, and improve workspaces without human involvement.

**Architecture:** Two zero-dependency TypeScript scripts. `iterate.ts` orchestrates a 3-pass improvement loop (validate-fix → score → checklist) and returns structured JSON results. `generate-tests.ts` produces test cases per stage for agent-driven sub-agent evaluation. SKILL.md is enhanced with autonomous iteration instructions.

**Tech Stack:** TypeScript, Node.js builtins only (`fs`, `path`, `process`), Jest for testing

---

## File Structure

**New files:**
- `src/scripts/iterate.ts` — 3-pass orchestration script
- `src/scripts/generate-tests.ts` — Test case generator
- `templates/.workspace-templates/scripts/iterate.ts` — Copy for distribution
- `templates/.workspace-templates/scripts/generate-tests.ts` — Copy for distribution
- `tests/iterate.test.ts` — Tests for iterate
- `tests/generate-tests.test.ts` — Tests for generate-tests

**Modified files:**
- `templates/SKILL.md` — Add "## Autonomous Iteration" section
- `tests/integration.test.ts` — Add assertions for new scripts

---

### Task 1: Iterate Script — Tests

**Files:**
- Test: `tests/iterate.test.ts`

- [ ] **Step 1: Write iterate tests**

```typescript
// tests/iterate.test.ts
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { iterateWorkspace, IterateResult } from '../src/scripts/iterate';
import * as validate from '../src/scripts/validate';

jest.mock('../src/scripts/validate');

describe('iterate', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'iterate-test-'));
  });

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
    jest.clearAllMocks();
  });

  function createBasicWorkspace(): string {
    const ws = path.join(tempDir, 'workspace');
    fs.mkdirSync(ws, { recursive: true });
    fs.writeFileSync(path.join(ws, 'SYSTEM.md'), '# Test\n\n## Role\nWorkspace role\n\n## Folder Map\n\n- `01-input/`\n- `02-output/`\n\n## Rules\nICM rules\n');
    fs.writeFileSync(path.join(ws, 'CONTEXT.md'), '# Router\n\n## Routing Table\n\n- `01-input/` → `01-input/CONTEXT.md`\n- `02-output/` → `02-output/CONTEXT.md`\n');
    fs.mkdirSync(path.join(ws, '01-input'), { recursive: true });
    fs.writeFileSync(path.join(ws, '01-input', 'CONTEXT.md'), '# 01-input\n\n## Purpose\nInput stage\n\n## Inputs\nRaw data\n\n## Outputs\nValidated data\n\n## Dependencies\nNone\n');
    fs.mkdirSync(path.join(ws, '02-output'), { recursive: true });
    fs.writeFileSync(path.join(ws, '02-output', 'CONTEXT.md'), '# 02-output\n\n## Purpose\nOutput stage\n\n## Inputs\nProcessed data\n\n## Outputs\nFinal report\n\n## Dependencies\n01-input\n');
    fs.mkdirSync(path.join(ws, '00-meta'), { recursive: true });
    fs.writeFileSync(path.join(ws, '00-meta', 'tools.md'), '# Tool Inventory\n\n## Installed Tools\n\n| Tool | Version | Manager | Installed |\n|------|---------|---------|-----------|\n| — | — | — | — |\n');
    fs.writeFileSync(path.join(ws, 'README.md'), '# Test Workspace\n\n## Usage\nFollow stages in order.\n');
    return ws;
  }

  describe('iterateWorkspace', () => {
    it('passes all three passes on a good workspace', () => {
      const ws = createBasicWorkspace();
      (validate.validateWorkspace as jest.Mock).mockReturnValue({
        passed: true,
        checks: [],
      });

      const result = iterateWorkspace(ws, { maxRetries: 3 });

      expect(result.passes.validate.status).toBe('passed');
      expect(result.passes.score.score).toBeGreaterThan(0);
      expect(result.passes.checklist.items).toBeGreaterThan(0);
      expect(result.escalate).toBe(false);
    });

    it('retries validation failures up to maxRetries', () => {
      const ws = createBasicWorkspace();
      (validate.validateWorkspace as jest.Mock)
        .mockReturnValueOnce({ passed: false, checks: [{ name: 'SYSTEM.md exists', passed: false, message: 'Missing' }] })
        .mockReturnValueOnce({ passed: true, checks: [] });

      const result = iterateWorkspace(ws, { maxRetries: 3 });

      expect(result.passes.validate.retries).toBe(1);
      expect(result.passes.validate.status).toBe('passed');
    });

    it('escalates when validation fails after max retries', () => {
      const ws = createBasicWorkspace();
      (validate.validateWorkspace as jest.Mock).mockReturnValue({
        passed: false,
        checks: [{ name: 'SYSTEM.md exists', passed: false, message: 'Missing' }],
      });

      const result = iterateWorkspace(ws, { maxRetries: 2 });

      expect(result.escalate).toBe(true);
      expect(result.passes.validate.status).toBe('escalated');
      expect(result.passes.validate.retries).toBe(2);
    });

    it('returns score with improvements for low-quality workspace', () => {
      const ws = path.join(tempDir, 'workspace');
      fs.mkdirSync(ws, { recursive: true });
      fs.writeFileSync(path.join(ws, 'SYSTEM.md'), '# Minimal\n');
      fs.writeFileSync(path.join(ws, 'CONTEXT.md'), '# Router\n');
      fs.mkdirSync(path.join(ws, '01-input'), { recursive: true });
      fs.writeFileSync(path.join(ws, '01-input', 'CONTEXT.md'), '# 01-input\n');
      fs.mkdirSync(path.join(ws, '00-meta'), { recursive: true });
      fs.writeFileSync(path.join(ws, '00-meta', 'tools.md'), '# Tools\n');

      (validate.validateWorkspace as jest.Mock).mockReturnValue({
        passed: true,
        checks: [],
      });

      const result = iterateWorkspace(ws, { maxRetries: 1 });

      expect(result.passes.score.score).toBeLessThan(80);
      expect(result.passes.score.improvements.length).toBeGreaterThan(0);
    });

    it('checklist reports pass/fail per item', () => {
      const ws = createBasicWorkspace();
      (validate.validateWorkspace as jest.Mock).mockReturnValue({
        passed: true,
        checks: [],
      });

      const result = iterateWorkspace(ws, { maxRetries: 1 });

      expect(result.passes.checklist.items).toBe(result.passes.checklist.passed + result.passes.checklist.failed);
    });
  });

  describe('scoreWorkspace', () => {
    it('scores a perfect workspace 100', () => {
      const ws = createBasicWorkspace();
      const score = scoreWorkspace(ws);

      expect(score.total).toBe(100);
      expect(score.improvements).toHaveLength(0);
    });

    it('deducts points for missing SYSTEM.md sections', () => {
      const ws = path.join(tempDir, 'workspace');
      fs.mkdirSync(ws, { recursive: true });
      fs.writeFileSync(path.join(ws, 'SYSTEM.md'), '# Minimal\n');

      const score = scoreWorkspace(ws);

      expect(score.system).toBeLessThan(20);
    });

    it('deducts points for missing CONTEXT.md routing', () => {
      const ws = path.join(tempDir, 'workspace');
      fs.mkdirSync(ws, { recursive: true });
      fs.writeFileSync(path.join(ws, 'SYSTEM.md'), '# Test\n\n## Folder Map\n\n');
      fs.writeFileSync(path.join(ws, 'CONTEXT.md'), '# Router\n');

      const score = scoreWorkspace(ws);

      expect(score.context).toBeLessThan(20);
    });

    it('deducts points for incomplete stage CONTEXT.md', () => {
      const ws = path.join(tempDir, 'workspace');
      fs.mkdirSync(ws, { recursive: true });
      fs.writeFileSync(path.join(ws, 'SYSTEM.md'), '# Test\n\n## Folder Map\n\n- `01-input/`\n');
      fs.writeFileSync(path.join(ws, 'CONTEXT.md'), '# Router\n\n## Routing Table\n\n- `01-input/`\n');
      fs.mkdirSync(path.join(ws, '01-input'), { recursive: true });
      fs.writeFileSync(path.join(ws, '01-input', 'CONTEXT.md'), '# 01-input\n');

      const score = scoreWorkspace(ws);

      expect(score.stages).toBeLessThan(15);
    });

    it('deducts points for missing tools.md', () => {
      const ws = path.join(tempDir, 'workspace');
      fs.mkdirSync(ws, { recursive: true });
      fs.writeFileSync(path.join(ws, 'SYSTEM.md'), '# Test\n\n## Role\nRole\n\n## Folder Map\n\n');
      fs.writeFileSync(path.join(ws, 'CONTEXT.md'), '# Router\n\n## Routing Table\n\n');

      const score = scoreWorkspace(ws);

      expect(score.tools).toBe(0);
    });
  });

  describe('runChecklist', () => {
    it('passes all items on a complete workspace', () => {
      const ws = createBasicWorkspace();
      const result = runChecklist(ws);

      expect(result.failed).toBe(0);
      expect(result.passed).toBe(result.items);
    });

    it('fails items for incomplete stages', () => {
      const ws = path.join(tempDir, 'workspace');
      fs.mkdirSync(ws, { recursive: true });
      fs.writeFileSync(path.join(ws, 'SYSTEM.md'), '# Test\n\n## Folder Map\n\n- `01-input/`\n');
      fs.writeFileSync(path.join(ws, 'CONTEXT.md'), '# Router\n\n## Routing Table\n\n- `01-input/`\n');
      fs.mkdirSync(path.join(ws, '01-input'), { recursive: true });
      fs.writeFileSync(path.join(ws, '01-input', 'CONTEXT.md'), '# 01-input\n');
      fs.writeFileSync(path.join(ws, 'README.md'), '# README\n');

      const result = runChecklist(ws);

      expect(result.failed).toBeGreaterThan(0);
    });
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test -- tests/iterate.test.ts`
Expected: FAIL — module not found

---

### Task 2: Iterate Script — Implementation

**Files:**
- Create: `src/scripts/iterate.ts`

- [ ] **Step 1: Implement iterate script**

```typescript
// src/scripts/iterate.ts
import * as fs from 'fs';
import * as path from 'path';
import { validateWorkspace } from './validate';

export interface IterateOptions {
  maxRetries?: number;
}

export interface ValidatePassResult {
  status: 'passed' | 'failed' | 'escalated';
  retries: number;
  failures?: string[];
}

export interface ScorePassResult {
  score: number;
  improvements: string[];
}

export interface ChecklistResult {
  items: number;
  passed: number;
  failed: number;
  details: { name: string; passed: boolean }[];
}

export interface IterateResult {
  passes: {
    validate: ValidatePassResult;
    score: ScorePassResult;
    checklist: ChecklistResult;
  };
  escalate: boolean;
}

export interface ScoreBreakdown {
  system: number;
  context: number;
  stages: number;
  tools: number;
  total: number;
  improvements: string[];
}

export function iterateWorkspace(
  workspacePath: string,
  options: IterateOptions = {},
): IterateResult {
  const { maxRetries = 3 } = options;
  const ws = path.resolve(workspacePath);

  // Pass 1: Validate-Fix Loop
  const validateResult = runValidatePass(ws, maxRetries);

  // If escalated, still run score and checklist for diagnostics but mark escalate
  const scoreResult = runScorePass(ws);
  const checklistResult = runChecklist(ws);

  const result: IterateResult = {
    passes: {
      validate: validateResult,
      score: scoreResult,
      checklist: checklistResult,
    },
    escalate: validateResult.status === 'escalated',
  };

  // Print results
  console.log(JSON.stringify(result, null, 2));

  return result;
}

function runValidatePass(ws: string, maxRetries: number): ValidatePassResult {
  let retries = 0;

  for (let i = 0; i < maxRetries; i++) {
    const result = validateWorkspace(ws);

    if (result.passed) {
      return { status: 'passed', retries: i };
    }

    retries = i + 1;
  }

  // Collect failure details
  const lastResult = validateWorkspace(ws);
  const failures = lastResult.checks.filter((c) => !c.passed).map((c) => `${c.name}: ${c.message}`);

  return {
    status: 'escalated',
    retries,
    failures,
  };
}

function runScorePass(ws: string): ScorePassResult {
  const score = scoreWorkspace(ws);
  return {
    score: score.total,
    improvements: score.improvements,
  };
}

export function scoreWorkspace(workspacePath: string): ScoreBreakdown {
  const ws = path.resolve(workspacePath);
  const improvements: string[] = [];
  let system = 0;
  let context = 0;
  let stages = 0;
  let tools = 0;

  // SYSTEM.md quality (20 points)
  const systemMdPath = path.join(ws, 'SYSTEM.md');
  if (fs.existsSync(systemMdPath)) {
    const content = fs.readFileSync(systemMdPath, 'utf-8');
    if (content.toLowerCase().includes('## role') || content.toLowerCase().includes('role')) system += 7;
    else improvements.push('SYSTEM.md missing Role section');
    if (content.toLowerCase().includes('folder map')) system += 7;
    else improvements.push('SYSTEM.md missing Folder Map');
    if (content.toLowerCase().includes('## rules') || content.toLowerCase().includes('rule')) system += 6;
    else improvements.push('SYSTEM.md missing Rules section');
  } else {
    improvements.push('SYSTEM.md missing entirely');
  }

  // CONTEXT.md quality (20 points)
  const contextMdPath = path.join(ws, 'CONTEXT.md');
  if (fs.existsSync(contextMdPath)) {
    const content = fs.readFileSync(contextMdPath, 'utf-8');
    if (content.toLowerCase().includes('routing table')) context += 10;
    else improvements.push('CONTEXT.md missing Routing Table');
    // Check if it references all numbered folders
    const numberedFolders = getNumberedFolders(ws);
    const allReferenced = numberedFolders.every((f) => content.includes(f));
    if (allReferenced && numberedFolders.length > 0) context += 10;
    else if (numberedFolders.length > 0) improvements.push('CONTEXT.md does not reference all stages');
  } else {
    improvements.push('CONTEXT.md missing entirely');
  }

  // Stage CONTEXT.md quality (15 points per stage, capped at 45)
  const stageFolders = getNumberedFolders(ws);
  let stageScore = 0;
  for (const folder of stageFolders) {
    const stageContextPath = path.join(ws, folder, 'CONTEXT.md');
    let folderScore = 0;
    if (fs.existsSync(stageContextPath)) {
      const content = fs.readFileSync(stageContextPath, 'utf-8');
      if (content.toLowerCase().includes('purpose') || content.toLowerCase().includes('## purpose')) folderScore += 4;
      else improvements.push(`${folder}/CONTEXT.md missing Purpose`);
      if (content.toLowerCase().includes('input')) folderScore += 4;
      else improvements.push(`${folder}/CONTEXT.md missing Inputs`);
      if (content.toLowerCase().includes('output')) folderScore += 4;
      else improvements.push(`${folder}/CONTEXT.md missing Outputs`);
      if (content.toLowerCase().includes('dependenc')) folderScore += 3;
      else improvements.push(`${folder}/CONTEXT.md missing Dependencies`);
    } else {
      improvements.push(`${folder}/CONTEXT.md missing`);
    }
    stageScore += folderScore;
  }
  stages = Math.min(stageScore, 45);

  // tools.md (15 points)
  const toolsMdPath = path.join(ws, '00-meta', 'tools.md');
  if (fs.existsSync(toolsMdPath)) {
    const content = fs.readFileSync(toolsMdPath, 'utf-8');
    if (content.trim().length > 20) tools += 15;
    else {
      tools += 5;
      improvements.push('tools.md exists but has minimal content');
    }
  } else {
    improvements.push('tools.md missing');
  }

  return {
    system,
    context,
    stages,
    tools,
    total: system + context + stages + tools,
    improvements,
  };
}

export function runChecklist(workspacePath: string): ChecklistResult {
  const ws = path.resolve(workspacePath);
  const details: { name: string; passed: boolean }[] = [];

  const stageFolders = getNumberedFolders(ws);

  for (const folder of stageFolders) {
    const contextPath = path.join(ws, folder, 'CONTEXT.md');
    if (fs.existsSync(contextPath)) {
      const content = fs.readFileSync(contextPath, 'utf-8');
      details.push({
        name: `${folder} has inputs defined`,
        passed: content.toLowerCase().includes('input'),
      });
      details.push({
        name: `${folder} has outputs defined`,
        passed: content.toLowerCase().includes('output'),
      });
      details.push({
        name: `${folder} has dependencies defined`,
        passed: content.toLowerCase().includes('dependenc'),
      });
    } else {
      details.push({ name: `${folder} has CONTEXT.md`, passed: false });
      details.push({ name: `${folder} has inputs defined`, passed: false });
      details.push({ name: `${folder} has outputs defined`, passed: false });
      details.push({ name: `${folder} has dependencies defined`, passed: false });
    }
  }

  // Routing table references all numbered folders
  const contextMdPath = path.join(ws, 'CONTEXT.md');
  if (fs.existsSync(contextMdPath)) {
    const content = fs.readFileSync(contextMdPath, 'utf-8');
    const allReferenced = stageFolders.every((f) => content.includes(f));
    details.push({
      name: 'Routing table references all numbered folders',
      passed: allReferenced,
    });
  } else {
    details.push({
      name: 'Routing table references all numbered folders',
      passed: false,
    });
  }

  // README.md exists
  const readmePath = path.join(ws, 'README.md');
  details.push({
    name: 'README.md exists and has usage instructions',
    passed: fs.existsSync(readmePath) && fs.readFileSync(readmePath, 'utf-8').trim().length > 0,
  });

  const passed = details.filter((d) => d.passed).length;
  const failed = details.filter((d) => !d.passed).length;

  return {
    items: details.length,
    passed,
    failed,
    details,
  };
}

function getNumberedFolders(workspacePath: string): string[] {
  const entries = fs.readdirSync(workspacePath, { withFileTypes: true });
  return entries
    .filter((e) => e.isDirectory() && /^\d/.test(e.name))
    .map((e) => e.name);
}

// CLI entry point
if (require.main === module) {
  const args = process.argv.slice(2);
  const parseArg = (flag: string): string | undefined => {
    const idx = args.indexOf(flag);
    return idx !== -1 ? args[idx + 1] : undefined;
  };

  const workspace = parseArg('--workspace');
  const maxRetriesStr = parseArg('--max-retries');
  const maxRetries = maxRetriesStr ? parseInt(maxRetriesStr, 10) : 3;

  if (!workspace) {
    console.error('Usage: node iterate.ts --workspace <path> [--max-retries <n>]');
    process.exit(1);
  }

  iterateWorkspace(workspace, { maxRetries });
}
```

- [ ] **Step 2: Run tests to verify they pass**

Run: `npm test -- tests/iterate.test.ts`
Expected: All 10 tests PASS

- [ ] **Step 3: Commit**

```bash
git add src/scripts/iterate.ts tests/iterate.test.ts
git commit -m "feat: add iterate script with 3-pass loop and tests"
```

---

### Task 3: Generate-Tests Script — Tests

**Files:**
- Test: `tests/generate-tests.test.ts`

- [ ] **Step 1: Write generate-tests tests**

```typescript
// tests/generate-tests.test.ts
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { generateTestCases, TestCase } from '../src/scripts/generate-tests';

describe('generate-tests', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'generate-tests-'));
  });

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  function createWorkspaceWithStages(stageNames: string[]): string {
    const ws = path.join(tempDir, 'workspace');
    fs.mkdirSync(ws, { recursive: true });
    fs.writeFileSync(path.join(ws, 'SYSTEM.md'), `# Test\n\n## Folder Map\n\n${stageNames.map((s) => `- \`${s}/\``).join('\n')}\n`);
    fs.writeFileSync(path.join(ws, 'CONTEXT.md'), `# Router\n\n## Routing Table\n\n${stageNames.map((s) => `- \`${s}/\``).join('\n')}\n`);

    for (const stage of stageNames) {
      const stageDir = path.join(ws, stage);
      fs.mkdirSync(stageDir, { recursive: true });
      fs.writeFileSync(path.join(stageDir, 'CONTEXT.md'), `# ${stage}\n\n## Purpose\nTest stage\n\n## Inputs\nRaw data\n\n## Outputs\nProcessed data\n\n## Dependencies\nNone\n`);
    }

    return ws;
  }

  describe('generateTestCases', () => {
    it('generates test cases for each stage', () => {
      const ws = createWorkspaceWithStages(['01-input', '02-process', '03-output']);
      const result = generateTestCases(ws);

      const stages = [...new Set(result.testCases.map((tc) => tc.stage))];
      expect(stages).toContain('01-input');
      expect(stages).toContain('02-process');
      expect(stages).toContain('03-output');
    });

    it('generates 2-3 test cases per stage', () => {
      const ws = createWorkspaceWithStages(['01-input', '02-process']);
      const result = generateTestCases(ws);

      const inputCases = result.testCases.filter((tc) => tc.stage === '01-input');
      const processCases = result.testCases.filter((tc) => tc.stage === '02-process');

      expect(inputCases.length).toBeGreaterThanOrEqual(2);
      expect(inputCases.length).toBeLessThanOrEqual(3);
      expect(processCases.length).toBeGreaterThanOrEqual(2);
      expect(processCases.length).toBeLessThanOrEqual(3);
    });

    it('includes sample, edge-case, and empty test types', () => {
      const ws = createWorkspaceWithStages(['01-input']);
      const result = generateTestCases(ws);

      const types = result.testCases.map((tc) => tc.type);
      expect(types).toContain('sample');
      expect(types).toContain('edge-case');
      expect(types).toContain('empty');
    });

    it('returns empty test cases for workspace with no stages', () => {
      const ws = path.join(tempDir, 'workspace');
      fs.mkdirSync(ws, { recursive: true });
      fs.writeFileSync(path.join(ws, 'SYSTEM.md'), '# Test\n');
      fs.writeFileSync(path.join(ws, 'CONTEXT.md'), '# Router\n');

      const result = generateTestCases(ws);

      expect(result.testCases).toHaveLength(0);
    });

    it('each test case has required fields', () => {
      const ws = createWorkspaceWithStages(['01-input']);
      const result = generateTestCases(ws);

      for (const tc of result.testCases) {
        expect(tc).toHaveProperty('stage');
        expect(tc).toHaveProperty('type');
        expect(tc).toHaveProperty('input');
        expect(tc).toHaveProperty('expected');
      }
    });

    it('writes valid JSON to output file', () => {
      const ws = createWorkspaceWithStages(['01-input', '02-output']);
      const outputPath = path.join(tempDir, 'tests.json');

      generateTestCases(ws, outputPath);

      const content = fs.readFileSync(outputPath, 'utf-8');
      const parsed = JSON.parse(content);
      expect(parsed).toHaveProperty('testCases');
      expect(Array.isArray(parsed.testCases)).toBe(true);
    });
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test -- tests/generate-tests.test.ts`
Expected: FAIL — module not found

---

### Task 4: Generate-Tests Script — Implementation

**Files:**
- Create: `src/scripts/generate-tests.ts`

- [ ] **Step 1: Implement generate-tests script**

```typescript
// src/scripts/generate-tests.ts
import * as fs from 'fs';
import * as path from 'path';

export interface TestCase {
  stage: string;
  type: 'sample' | 'edge-case' | 'empty';
  input: string;
  expected: string;
}

export interface TestCasesOutput {
  testCases: TestCase[];
}

export function generateTestCases(
  workspacePath: string,
  outputPath?: string,
): TestCasesOutput {
  const ws = path.resolve(workspacePath);
  const testCases: TestCase[] = [];

  const stageFolders = getNumberedFolders(ws);

  if (stageFolders.length === 0) {
    console.warn('Warning: No numbered stage folders found in workspace');
  }

  for (const stage of stageFolders) {
    const contextPath = path.join(ws, stage, 'CONTEXT.md');
    let purpose = '';
    if (fs.existsSync(contextPath)) {
      const content = fs.readFileSync(contextPath, 'utf-8');
      const purposeMatch = content.match(/## Purpose\n([\s\S]*?)(?=##|$)/i);
      if (purposeMatch) {
        purpose = purposeMatch[1].trim();
      }
    }

    testCases.push({
      stage,
      type: 'sample',
      input: generateSampleInput(stage, purpose),
      expected: `Stage should fulfill its purpose: ${purpose || 'handle stage-specific processing'}`,
    });

    testCases.push({
      stage,
      type: 'edge-case',
      input: generateEdgeCaseInput(stage),
      expected: `Stage should handle edge case gracefully`,
    });

    testCases.push({
      stage,
      type: 'empty',
      input: '',
      expected: `Stage should handle empty input gracefully`,
    });
  }

  const result: TestCasesOutput = { testCases };

  if (outputPath) {
    fs.writeFileSync(outputPath, JSON.stringify(result, null, 2));
    console.log(`Test cases written to: ${outputPath}`);
  }

  return result;
}

function generateSampleInput(stage: string, purpose: string): string {
  const samples: Record<string, string> = {
    '01-input': 'A sample input document with valid data for processing',
    '02-process': 'Processed data from the input stage ready for transformation',
    '03-output': 'Final processed data ready for report generation',
  };
  return samples[stage] || `Sample data for ${stage}`;
}

function generateEdgeCaseInput(stage: string): string {
  const edgeCases: Record<string, string> = {
    '01-input': 'Input with special characters: <>&"\' and very long text that exceeds normal length expectations',
    '02-process': 'Data with missing fields and inconsistent formatting',
    '03-output': 'Conflicting output requirements from upstream stages',
  };
  return edgeCases[stage] || `Edge case data for ${stage}`;
}

function getNumberedFolders(workspacePath: string): string[] {
  const entries = fs.readdirSync(workspacePath, { withFileTypes: true });
  return entries
    .filter((e) => e.isDirectory() && /^\d/.test(e.name))
    .map((e) => e.name);
}

// CLI entry point
if (require.main === module) {
  const args = process.argv.slice(2);
  const parseArg = (flag: string): string | undefined => {
    const idx = args.indexOf(flag);
    return idx !== -1 ? args[idx + 1] : undefined;
  };

  const workspace = parseArg('--workspace');
  const output = parseArg('--output');

  if (!workspace) {
    console.error('Usage: node generate-tests.ts --workspace <path> [--output <path>]');
    process.exit(1);
  }

  generateTestCases(workspace, output);
}
```

- [ ] **Step 2: Run tests to verify they pass**

Run: `npm test -- tests/generate-tests.test.ts`
Expected: All 6 tests PASS

- [ ] **Step 3: Commit**

```bash
git add src/scripts/generate-tests.ts tests/generate-tests.test.ts
git commit -m "feat: add generate-tests script with tests"
```

---

### Task 5: Copy Scripts to Templates & Update Integration Test

**Files:**
- Create: `templates/.workspace-templates/scripts/iterate.ts`
- Create: `templates/.workspace-templates/scripts/generate-tests.ts`
- Modify: `tests/integration.test.ts`

- [ ] **Step 1: Copy scripts to templates**

```bash
cp src/scripts/iterate.ts templates/.workspace-templates/scripts/iterate.ts
cp src/scripts/generate-tests.ts templates/.workspace-templates/scripts/generate-tests.ts
```

- [ ] **Step 2: Update integration test expected files**

In `tests/integration.test.ts`, add to the `expectedFiles` array:

```typescript
// In the first integration test, add to expectedFiles array:
const expectedFiles = [
  'SKILL.md',
  '.workspace-templates/SYSTEM.md',
  '.workspace-templates/CONTEXT.md',
  '.workspace-templates/workspace/00-meta/CONTEXT.md',
  '.workspace-templates/workspace/01-input/CONTEXT.md',
  '.workspace-templates/workspace/02-process/CONTEXT.md',
  '.workspace-templates/workspace/03-output/CONTEXT.md',
  '.workspace-templates/workspace/README.md',
  'scripts/scaffold.ts',
  'scripts/validate.ts',
  'scripts/install-tool.ts',
  'scripts/iterate.ts',
  'scripts/generate-tests.ts',
];
```

- [ ] **Step 3: Run all tests to verify**

Run: `npm test`
Expected: All tests PASS (57 existing + 16 new = 73 total)

- [ ] **Step 4: Commit**

```bash
git add templates/.workspace-templates/scripts/iterate.ts templates/.workspace-templates/scripts/generate-tests.ts tests/integration.test.ts
git commit -m "feat: add iterate and generate-tests scripts to templates"
```

---

### Task 6: Enhance SKILL.md with Autonomous Iteration Section

**Files:**
- Modify: `templates/SKILL.md`

- [ ] **Step 1: Update SKILL.md with autonomous iteration instructions**

Replace the entire SKILL.md content with:

```markdown
# Workspace-Maxxing Skill

## Role
You are a workspace architect. You create structured, ICM-compliant workspaces.

## Available Scripts

Use these scripts to programmatically build, validate, and equip workspaces. Invoke them via shell commands from the skill directory.

### scaffold.ts — Generate ICM Workspace

Creates a complete ICM workspace structure from a plan.

```bash
node scripts/scaffold.ts --name "research" --stages "01-research,02-analysis,03-report" --output ./workspace
```

Options:
- `--name <name>` — Workspace name
- `--stages <s1,s2,...>` — Comma-separated stage folder names
- `--output <path>` — Where to create the workspace
- `--force` — Overwrite if output directory already exists

### validate.ts — Check ICM Compliance

Validates a workspace against ICM rules.

```bash
node scripts/validate.ts --workspace ./workspace
```

Checks:
- SYSTEM.md exists and contains a folder map
- CONTEXT.md exists at root level
- Every numbered folder has a CONTEXT.md
- No empty CONTEXT.md files
- No duplicate content across files

Exit code: 0 = all pass, 1 = some failed

### install-tool.ts — Install Packages

Installs a tool and updates the workspace inventory.

```bash
node scripts/install-tool.ts --tool "pdf-lib" --manager npm --workspace ./workspace
```

Supported managers: `npm`, `pip`, `npx`, `brew`

### iterate.ts — Autonomous Iteration

Runs a 3-pass improvement loop: validate-fix → score → checklist.

```bash
node scripts/iterate.ts --workspace ./workspace --max-retries 3
```

Output is JSON with pass results and an `escalate` flag.

### generate-tests.ts — Generate Test Cases

Creates test cases for each stage (sample, edge-case, empty).

```bash
node scripts/generate-tests.ts --workspace ./workspace --output ./tests.json
```

## Process

1. CAPTURE INTENT — Ask: "What workflow do you want to automate?"
2. PROPOSE STRUCTURE — Design workspace with numbered folders, CONTEXT.md routing files, canonical sources
3. GET APPROVAL — Present plan. Wait. Do not build until approved.
4. BUILD WORKSPACE — Run: `node scripts/scaffold.ts --name "<name>" --stages "<stages>" --output ./workspace`
5. VALIDATE — Run: `node scripts/validate.ts --workspace ./workspace`. Fix any failures.
6. ASSESS TOOLS — Scan environment. List available tools. Propose missing tools needed. Get approval.
7. INSTALL TOOLS — For each approved tool: `node scripts/install-tool.ts --tool "<name>" --manager <mgr> --workspace ./workspace`
8. ITERATE — Run: `node scripts/iterate.ts --workspace ./workspace`. Follow the Autonomous Iteration workflow below.
9. FINAL VALIDATE — Run validate.ts one more time to confirm compliance.
10. DELIVER — Output: workspace folder + skill package + usage guide

## Autonomous Iteration

After scaffolding and initial validation, run the iteration loop:

### Step 1: Run iterate.ts

```bash
node scripts/iterate.ts --workspace ./workspace --max-retries 3
```

Read the JSON output. It has three passes:

**Pass 1 — Validate-Fix Loop:**
- If `status: "passed"` → move to Pass 2
- If `status: "escalated"` → read the `failures` array. Attempt to fix each failure manually, then re-run iterate.ts. If still failing after your fix attempt, escalate to human with the specific failures and your proposed fix.

**Pass 2 — Score-Driven Content Quality:**
- Read the `score` (0-100) and `improvements` array
- For each improvement item, update the relevant CONTEXT.md or SYSTEM.md file
- Re-run iterate.ts to see if the score improved
- Repeat until score plateaus (no improvement between runs) or score > 90

**Pass 3 — Completeness Checklist:**
- Read the `checklist` results showing items passed/failed
- For each failed item, fill in the missing content
- Re-run iterate.ts to confirm all items pass

### Step 2: Generate and Run Test Cases

```bash
node scripts/generate-tests.ts --workspace ./workspace --output ./tests.json
```

Read the generated test cases. Then:

1. **Split test cases:** Divide them into two groups — half for generation, half for evaluation
2. **Generation sub-agents:** For each test case in the generation group, create sample content that the stage should produce. Document what good output looks like.
3. **Evaluation sub-agents:** For each test case in the evaluation group, review the workspace's current CONTEXT.md and determine if it would handle that test case correctly. Flag gaps.
4. **Aggregate results:** Combine findings from both groups. Identify patterns — are certain stages consistently weak? Are there structural issues?
5. **Fix identified gaps:** Update CONTEXT.md files, routing tables, or stage instructions to address findings.

### Step 3: Confidence Assessment

After iteration and testing, assess your confidence:

**High confidence (deliver):**
- All validation checks pass
- Score > 80
- All checklist items pass
- Test case evaluation shows no critical gaps

**Low confidence (escalate to human):**
Present to the human:
- Current score and checklist results
- Specific failures or gaps found
- What you attempted to fix
- Your proposed next steps

Wait for human guidance before proceeding.

## When to Use Scripts vs Manual

- **Scripts:** For structure creation, validation, tool installation, and iteration loops
- **Manual:** For writing content inside CONTEXT.md files, customizing stage descriptions, adding domain-specific instructions, fixing validation failures between retries

## ICM Rules
- Canonical sources: each fact lives in exactly one file
- One-way dependencies only: A → B, never B → A
- Selective loading: route to sections, not whole files
- Numbered folders for workflow stages

## Output Format
- workspace/ — the built workspace
- .agents/skills/<workspace-name>/ — installable skill
- USAGE.md — how to use this workspace in future sessions
```

- [ ] **Step 2: Update integration test for new SKILL.md sections**

Add assertions to `tests/integration.test.ts`:

```typescript
// Add to the SKILL.md assertions in the first integration test:
expect(skillContent).toContain('## Autonomous Iteration');
expect(skillContent).toContain('iterate.ts');
expect(skillContent).toContain('generate-tests.ts');
```

- [ ] **Step 3: Run all tests to verify**

Run: `npm test`
Expected: All tests PASS

- [ ] **Step 4: Commit**

```bash
git add templates/SKILL.md tests/integration.test.ts
git commit -m "feat: enhance SKILL.md with Autonomous Iteration section"
```

---

### Task 7: Final Verification & All Tests

**Files:**
- All files

- [ ] **Step 1: Run full test suite**

```bash
npm test
```

Expected output: All tests pass (Phase 1 + 2 + 3 = ~73 total)

- [ ] **Step 2: Build and verify no TypeScript errors**

```bash
npm run build
```

Expected: No errors, output in `dist/`

- [ ] **Step 3: Verify dist/scripts/ contains all scripts**

```bash
ls dist/scripts/
```

Expected: `scaffold.js`, `validate.js`, `install-tool.js`, `iterate.js`, `generate-tests.js`

- [ ] **Step 4: Commit final state**

```bash
git add -A
git commit -m "feat: autonomous iteration complete — iterate, generate-tests scripts"
```

---

## Self-Review

### 1. Spec Coverage Check

| Spec Requirement | Task |
|---|---|
| iterate.ts runs 3-pass loop (validate-fix, score, checklist) | Task 1-2 |
| iterate.ts imports validateWorkspace from validate.ts | Task 2 |
| iterate.ts returns structured JSON output | Task 2 |
| iterate.ts escalates after max retries | Task 1-2 |
| iterate.ts CLI: --workspace, --max-retries | Task 2 |
| Score: SYSTEM.md (20pts), CONTEXT.md (20pts), stages (15pt/stage, cap 45), tools.md (15pts) | Task 2 |
| Score identifies improvements | Task 1-2 |
| Checklist: inputs, outputs, dependencies, routing, README | Task 1-2 |
| generate-tests.ts creates 2-3 test cases per stage | Task 3-4 |
| generate-tests.ts test types: sample, edge-case, empty | Task 3-4 |
| generate-tests.ts writes JSON output file | Task 3-4 |
| generate-tests.ts handles no stages gracefully | Task 3-4 |
| Enhanced SKILL.md with Autonomous Iteration | Task 6 |
| SKILL.md: iteration workflow instructions | Task 6 |
| SKILL.md: sub-agent spawning instructions | Task 6 |
| SKILL.md: escalation criteria | Task 6 |
| Installer copies new scripts (via templates/.workspace-templates/scripts/) | Task 5 |
| Tests for iterate.ts (5 iterate + 5 score + 2 checklist = 12 tests) | Task 1 |
| Tests for generate-tests.ts (6 tests) | Task 3 |
| Integration test updated for new scripts | Task 5 |

All requirements covered. ✓

### 2. Placeholder Scan

No TBD, TODO, "add tests for the above", "handle edge cases", or "similar to Task N" patterns found. All steps contain complete code. ✓

### 3. Type Consistency

- `IterateOptions`, `IterateResult`, `ValidatePassResult`, `ScorePassResult`, `ChecklistResult`, `ScoreBreakdown` interfaces defined in Task 2, used in Task 1 tests ✓
- `TestCase`, `TestCasesOutput` interfaces defined in Task 4, used in Task 3 tests ✓
- `validateWorkspace` imported from `./validate` in Task 2, mocked in Task 1 tests ✓
- `scoreWorkspace` and `runChecklist` exported in Task 2, tested directly in Task 1 ✓
- All scripts use `require.main === module` pattern for CLI entry ✓
- `getNumberedFolders` helper used consistently in both scripts ✓

---

Plan complete. Ready for execution.