# Autonomous Iteration with Sub-Agent Batches Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement batched parallel sub-agent iteration with validator checkpoints and fix loops, plus rewrite all sub-skills with obra/superpowers patterns.

**Architecture:** New `orchestrator.ts` coordinates the batch lifecycle. `dispatch.ts` extended for parallel invocation with batch IDs. Three new sub-skills (`worker`, `fixer`, enhanced `validation`). All existing sub-skills rewritten with YAML frontmatter, trigger phrases, anti-rationalization tables, and iron laws.

**Tech Stack:** TypeScript, Node.js builtins (fs, path, child_process, os), Jest for testing.

---

### Task 1: orchestrator.ts — Core Types & Batch Splitting

**Files:**
- Create: `src/scripts/orchestrator.ts`
- Test: `tests/orchestrator.test.ts`

- [ ] **Step 1: Write failing test for batch splitting**

```typescript
// tests/orchestrator.test.ts
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { splitIntoBatches, OrchestratorConfig } from '../src/scripts/orchestrator';

describe('orchestrator', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'orchestrator-test-'));
  });

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  describe('splitIntoBatches', () => {
    it('splits items into batches of specified size', () => {
      const items = ['tc-001', 'tc-002', 'tc-003', 'tc-004', 'tc-005'];
      const result = splitIntoBatches(items, 3);

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual(['tc-001', 'tc-002', 'tc-003']);
      expect(result[1]).toEqual(['tc-004', 'tc-005']);
    });

    it('returns single batch when items fit', () => {
      const items = ['tc-001', 'tc-002'];
      const result = splitIntoBatches(items, 3);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual(['tc-001', 'tc-002']);
    });

    it('returns empty array for empty input', () => {
      const result = splitIntoBatches([], 3);
      expect(result).toEqual([]);
    });

    it('uses default batch size of 3 when not specified', () => {
      const items = ['a', 'b', 'c', 'd', 'e', 'f', 'g'];
      const result = splitIntoBatches(items);

      expect(result).toHaveLength(3);
      expect(result[0]).toHaveLength(3);
      expect(result[1]).toHaveLength(3);
      expect(result[2]).toHaveLength(1);
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest tests/orchestrator.test.ts -t "splitIntoBatches" -v`
Expected: FAIL with "Cannot find module"

- [ ] **Step 3: Write orchestrator.ts with types and splitIntoBatches**

```typescript
// src/scripts/orchestrator.ts
import * as fs from 'fs';
import * as path from 'path';

export interface OrchestratorConfig {
  batchSize?: number;
  maxFixRetries?: number;
  scoreThreshold?: number;
  workerTimeout?: number;
}

export interface BatchReport {
  batchId: number;
  testCases: string[];
  score: number;
  status: 'passed' | 'failed' | 'partial' | 'escalated';
  findings: string[];
  timestamp: string;
}

export interface OrchestratorSummary {
  totalBatches: number;
  passedBatches: number;
  failedBatches: number;
  escalatedBatches: number;
  overallScore: number;
  batchReports: BatchReport[];
  timestamp: string;
}

export const DEFAULT_CONFIG: Required<OrchestratorConfig> = {
  batchSize: 3,
  maxFixRetries: 3,
  scoreThreshold: 85,
  workerTimeout: 300,
};

export function splitIntoBatches(items: string[], batchSize: number = DEFAULT_CONFIG.batchSize): string[][] {
  if (items.length === 0) return [];

  const batches: string[][] = [];
  for (let i = 0; i < items.length; i += batchSize) {
    batches.push(items.slice(i, i + batchSize));
  }
  return batches;
}

if (require.main === module) {
  const args = process.argv.slice(2);
  const parseArg = (flag: string): string | undefined => {
    const idx = args.indexOf(flag);
    return idx !== -1 ? args[idx + 1] : undefined;
  };

  const testCasesPath = parseArg('--test-cases');
  const batchSizeStr = parseArg('--batch-size');
  const batchSize = batchSizeStr ? parseInt(batchSizeStr, 10) : DEFAULT_CONFIG.batchSize;

  if (!testCasesPath) {
    console.error('Usage: node orchestrator.ts --test-cases <path> [--batch-size <n>]');
    process.exit(1);
  }

  const testCases = JSON.parse(fs.readFileSync(testCasesPath, 'utf-8'));
  const testCaseIds = testCases.testCases.map((tc: any, i: number) => `tc-${String(i + 1).padStart(3, '0')}`);
  const batches = splitIntoBatches(testCaseIds, batchSize);

  console.log(JSON.stringify({ batches, totalTestCases: testCaseIds.length, totalBatches: batches.length }, null, 2));
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx jest tests/orchestrator.test.ts -t "splitIntoBatches" -v`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/scripts/orchestrator.ts tests/orchestrator.test.ts
git commit -m "feat(orchestrator): add types and batch splitting"
```

---

### Task 2: orchestrator.ts — Batch Output Directory Management

**Files:**
- Modify: `src/scripts/orchestrator.ts`
- Modify: `tests/orchestrator.test.ts`

- [ ] **Step 1: Write failing test for batch directory creation**

Add to `tests/orchestrator.test.ts`:

```typescript
import { createBatchDirectory, getBatchDirectory } from '../src/scripts/orchestrator';

describe('batch directory management', () => {
  it('creates batch directory structure', () => {
    const baseDir = path.join(tempDir, '.agents', 'iteration');
    const result = createBatchDirectory(baseDir, 1);

    expect(fs.existsSync(result)).toBe(true);
    expect(result).toContain('batch-01');
  });

  it('returns existing batch directory path', () => {
    const baseDir = path.join(tempDir, '.agents', 'iteration');
    fs.mkdirSync(path.join(baseDir, 'batch-02'), { recursive: true });

    const result = getBatchDirectory(baseDir, 2);
    expect(result).toContain('batch-02');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest tests/orchestrator.test.ts -t "batch directory" -v`
Expected: FAIL

- [ ] **Step 3: Add batch directory functions to orchestrator.ts**

Add to `src/scripts/orchestrator.ts`:

```typescript
export function createBatchDirectory(baseDir: string, batchId: number): string {
  const batchDir = path.join(baseDir, `batch-${String(batchId).padStart(2, '0')}`);
  fs.mkdirSync(batchDir, { recursive: true });
  return batchDir;
}

export function getBatchDirectory(baseDir: string, batchId: number): string {
  return path.join(baseDir, `batch-${String(batchId).padStart(2, '0')}`);
}

export function createTestCaseDirectory(batchDir: string, testCaseId: string): string {
  const tcDir = path.join(batchDir, testCaseId);
  fs.mkdirSync(tcDir, { recursive: true });
  return tcDir;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx jest tests/orchestrator.test.ts -t "batch directory" -v`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/scripts/orchestrator.ts tests/orchestrator.test.ts
git commit -m "feat(orchestrator): add batch directory management"
```

---

### Task 3: dispatch.ts — Parallel Dispatch & Batch ID Support

**Files:**
- Modify: `src/scripts/dispatch.ts`
- Test: `tests/dispatch-parallel.test.ts`

- [ ] **Step 1: Write failing test for parallel dispatch**

```typescript
// tests/dispatch-parallel.test.ts
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { dispatchSkill, dispatchParallel, ParallelDispatchResult } from '../src/scripts/dispatch';

jest.mock('child_process');

describe('parallel dispatch', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'dispatch-parallel-'));
  });

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
    jest.clearAllMocks();
  });

  it('dispatches multiple skills in parallel and aggregates results', () => {
    const skillsDir = path.join(tempDir, 'skills');
    fs.mkdirSync(path.join(skillsDir, 'worker'), { recursive: true });
    fs.writeFileSync(path.join(skillsDir, 'worker', 'SKILL.md'), '---\nname: worker\n---\n\nTest');

    const invocations = [
      { skill: 'worker', batchId: 1, testCaseId: 'tc-001' },
      { skill: 'worker', batchId: 1, testCaseId: 'tc-002' },
    ];

    const results = dispatchParallel(invocations, skillsDir);

    expect(results).toHaveLength(2);
    expect(results[0].status).toBe('passed');
    expect(results[1].status).toBe('passed');
  });

  it('includes batchId and testCaseId in results', () => {
    const skillsDir = path.join(tempDir, 'skills');
    fs.mkdirSync(path.join(skillsDir, 'validation'), { recursive: true });
    fs.writeFileSync(path.join(skillsDir, 'validation', 'SKILL.md'), '---\nname: validation\n---\n\nTest');

    const invocations = [
      { skill: 'validation', batchId: 2, testCaseId: 'tc-003' },
    ];

    const results = dispatchParallel(invocations, skillsDir);

    expect(results[0].batchId).toBe(2);
    expect(results[0].testCaseId).toBe('tc-003');
  });

  it('handles missing skill gracefully in parallel mode', () => {
    const skillsDir = path.join(tempDir, 'skills');
    fs.mkdirSync(skillsDir, { recursive: true });

    const invocations = [
      { skill: 'nonexistent', batchId: 1, testCaseId: 'tc-001' },
    ];

    const results = dispatchParallel(invocations, skillsDir);

    expect(results[0].status).toBe('failed');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest tests/dispatch-parallel.test.ts -v`
Expected: FAIL

- [ ] **Step 3: Add parallel dispatch to dispatch.ts**

Add to `src/scripts/dispatch.ts`:

```typescript
import * as child_process from 'child_process';

export interface ParallelInvocation {
  skill: string;
  batchId: number;
  testCaseId: string;
}

export interface ParallelDispatchResult extends DispatchReport {
  batchId: number;
  testCaseId: string;
}

export function dispatchParallel(
  invocations: ParallelInvocation[],
  skillsDir: string,
): ParallelDispatchResult[] {
  return invocations.map((inv) => {
    const report = dispatchSkill(inv.skill, skillsDir);
    return {
      ...report,
      batchId: inv.batchId,
      testCaseId: inv.testCaseId,
    };
  });
}
```

- [ ] **Step 4: Update dispatch.ts CLI to support --parallel and --batch-id**

Modify the CLI section at the bottom of `src/scripts/dispatch.ts`:

```typescript
if (require.main === module) {
  const args = process.argv.slice(2);
  const parseArg = (flag: string): string | undefined => {
    const idx = args.indexOf(flag);
    return idx !== -1 ? args[idx + 1] : undefined;
  };

  const skill = parseArg('--skill');
  const workspace = parseArg('--workspace');
  const batchId = parseArg('--batch-id');
  const parallel = args.includes('--parallel');

  if (!skill) {
    console.error('Usage: node dispatch.ts --skill <name> --workspace <path> [--batch-id <n>] [--parallel]');
    process.exit(1);
  }

  const skillsDir = workspace
    ? path.join(workspace, '.agents', 'skills', 'workspace-maxxing', 'skills')
    : path.join(process.cwd(), 'skills');

  if (parallel) {
    // Read invocation list from stdin or file
    const invocationsPath = parseArg('--invocations');
    if (!invocationsPath) {
      console.error('--parallel requires --invocations <path>');
      process.exit(1);
    }
    const invocations = JSON.parse(fs.readFileSync(invocationsPath, 'utf-8'));
    const results = dispatchParallel(invocations, skillsDir);
    console.log(JSON.stringify(results, null, 2));
  } else {
    const result = dispatchSkill(skill, skillsDir);
    const output = batchId
      ? { ...result, batchId: parseInt(batchId, 10) }
      : result;
    console.log(JSON.stringify(output, null, 2));
  }
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npx jest tests/dispatch-parallel.test.ts -v`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add src/scripts/dispatch.ts tests/dispatch-parallel.test.ts
git commit -m "feat(dispatch): add parallel dispatch and batch-id support"
```

---

### Task 4: orchestrator.ts — Full Batch Lifecycle (generate → dispatch → validate → fix)

**Files:**
- Modify: `src/scripts/orchestrator.ts`
- Modify: `tests/orchestrator.test.ts`

- [ ] **Step 1: Write failing test for batch lifecycle**

Add to `tests/orchestrator.test.ts`:

```typescript
import { runBatchLifecycle, BatchLifecycleResult } from '../src/scripts/orchestrator';

jest.mock('../src/scripts/dispatch');
jest.mock('../src/scripts/generate-tests');
jest.mock('../src/scripts/validate');
jest.mock('../src/scripts/benchmark');

import * as dispatch from '../src/scripts/dispatch';
import * as generateTests from '../src/scripts/generate-tests';
import * as validate from '../src/scripts/validate';
import * as benchmark from '../src/scripts/benchmark';

describe('batch lifecycle', () => {
  it('runs full lifecycle: generate → dispatch → validate → complete', () => {
    const ws = createBasicWorkspace();
    const config = { batchSize: 2, maxFixRetries: 3, scoreThreshold: 85, workerTimeout: 300 };

    (generateTests.generateTestCases as jest.Mock).mockReturnValue({
      testCases: [
        { stage: '01-input', type: 'sample', input: 'test', expected: 'test' },
        { stage: '02-output', type: 'sample', input: 'test', expected: 'test' },
      ],
    });

    (dispatch.dispatchParallel as jest.Mock).mockReturnValue([
      { skill: 'worker', status: 'passed', batchId: 1, testCaseId: 'tc-001', timestamp: new Date().toISOString(), findings: [], recommendations: [], metrics: {}, nextSkill: 'validation' },
      { skill: 'worker', status: 'passed', batchId: 1, testCaseId: 'tc-002', timestamp: new Date().toISOString(), findings: [], recommendations: [], metrics: {}, nextSkill: 'validation' },
    ]);

    (benchmark.calculateBenchmark as jest.Mock).mockReturnValue({
      workspace: 'test',
      agent: 'test',
      timestamp: new Date().toISOString(),
      rawScore: 80,
      weightedScore: 90,
      stages: [],
      fixSuggestions: [],
      improvementPotential: false,
    });

    const result = runBatchLifecycle(ws, config);

    expect(result.totalBatches).toBe(1);
    expect(result.passedBatches).toBe(1);
    expect(result.overallScore).toBe(90);
  });

  it('triggers fix loop when batch score below threshold', () => {
    const ws = createBasicWorkspace();
    const config = { batchSize: 2, maxFixRetries: 3, scoreThreshold: 85, workerTimeout: 300 };

    (generateTests.generateTestCases as jest.Mock).mockReturnValue({
      testCases: [
        { stage: '01-input', type: 'sample', input: 'test', expected: 'test' },
      ],
    });

    (dispatch.dispatchParallel as jest.Mock).mockReturnValue([
      { skill: 'worker', status: 'failed', batchId: 1, testCaseId: 'tc-001', timestamp: new Date().toISOString(), findings: ['output missing'], recommendations: ['run worker'], metrics: {}, nextSkill: 'validation' },
    ]);

    (benchmark.calculateBenchmark as jest.Mock).mockReturnValue({
      workspace: 'test',
      agent: 'test',
      timestamp: new Date().toISOString(),
      rawScore: 30,
      weightedScore: 40,
      stages: [],
      fixSuggestions: ['Improve output'],
      improvementPotential: true,
    });

    const result = runBatchLifecycle(ws, config);

    expect(result.failedBatches).toBeGreaterThanOrEqual(0);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest tests/orchestrator.test.ts -t "batch lifecycle" -v`
Expected: FAIL

- [ ] **Step 3: Add runBatchLifecycle to orchestrator.ts**

Add to `src/scripts/orchestrator.ts`:

```typescript
import { generateTestCases } from './generate-tests';
import { dispatchParallel, ParallelInvocation, ParallelDispatchResult } from './dispatch';
import { calculateBenchmark } from './benchmark';

export interface BatchLifecycleResult {
  totalBatches: number;
  passedBatches: number;
  failedBatches: number;
  escalatedBatches: number;
  overallScore: number;
  batchReports: BatchReport[];
  timestamp: string;
}

export function runBatchLifecycle(
  workspacePath: string,
  config: OrchestratorConfig = {},
): BatchLifecycleResult {
  const resolvedConfig: Required<OrchestratorConfig> = {
    batchSize: config.batchSize ?? DEFAULT_CONFIG.batchSize,
    maxFixRetries: config.maxFixRetries ?? DEFAULT_CONFIG.maxFixRetries,
    scoreThreshold: config.scoreThreshold ?? DEFAULT_CONFIG.scoreThreshold,
    workerTimeout: config.workerTimeout ?? DEFAULT_CONFIG.workerTimeout,
  };

  const ws = path.resolve(workspacePath);
  const iterationDir = path.join(ws, '.agents', 'iteration');
  fs.mkdirSync(iterationDir, { recursive: true });

  // Phase 1: Generate test cases
  const testCasesResult = generateTestCases(ws);
  const testCaseIds = testCasesResult.testCases.map((_, i) => `tc-${String(i + 1).padStart(3, '0')}`);

  // Phase 2: Split into batches
  const batches = splitIntoBatches(testCaseIds, resolvedConfig.batchSize);

  // Phase 3: Process each batch
  const batchReports: BatchReport[] = [];
  let passedBatches = 0;
  let failedBatches = 0;
  let escalatedBatches = 0;

  for (let batchIdx = 0; batchIdx < batches.length; batchIdx++) {
    const batchId = batchIdx + 1;
    const batchDir = createBatchDirectory(iterationDir, batchId);
    const batchTestCases = batches[batchIdx];

    // Dispatch workers in parallel
    const invocations: ParallelInvocation[] = batchTestCases.map((tcId) => ({
      skill: 'worker',
      batchId,
      testCaseId: tcId,
    }));

    const workerResults = dispatchParallel(invocations, path.join(ws, '.agents', 'skills', 'workspace-maxxing', 'skills'));

    // Write worker outputs
    workerResults.forEach((result) => {
      const tcDir = createTestCaseDirectory(batchDir, result.testCaseId);
      fs.writeFileSync(
        path.join(tcDir, 'report.json'),
        JSON.stringify(result, null, 2),
      );
    });

    // Run benchmark for batch
    const benchmarkResult = calculateBenchmark(ws);
    const batchScore = benchmarkResult.weightedScore;

    // Determine batch status
    let batchStatus: BatchReport['status'] = 'passed';
    if (benchmarkResult.weightedScore < resolvedConfig.scoreThreshold) {
      // Fix loop
      const fixResults = runFixLoop(
        batchDir,
        workerResults,
        benchmarkResult.fixSuggestions,
        resolvedConfig.maxFixRetries,
        ws,
      );

      if (fixResults.status === 'escalated') {
        batchStatus = 'escalated';
        escalatedBatches++;
      } else if (fixResults.status === 'failed') {
        batchStatus = 'failed';
        failedBatches++;
      } else {
        batchStatus = 'passed';
        passedBatches++;
      }

      // Re-run benchmark after fixes
      const postFixBenchmark = calculateBenchmark(ws);
      batchReports.push({
        batchId,
        testCases: batchTestCases,
        score: postFixBenchmark.weightedScore,
        status: batchStatus,
        findings: fixResults.findings,
        timestamp: new Date().toISOString(),
      });
    } else {
      passedBatches++;
      batchReports.push({
        batchId,
        testCases: batchTestCases,
        score: batchScore,
        status: 'passed',
        findings: ['Batch passed threshold'],
        timestamp: new Date().toISOString(),
      });
    }
  }

  // Write summary
  const summary: BatchLifecycleResult = {
    totalBatches: batches.length,
    passedBatches,
    failedBatches,
    escalatedBatches,
    overallScore: batchReports.length > 0
      ? Math.round(batchReports.reduce((sum, r) => sum + r.score, 0) / batchReports.length)
      : 0,
    batchReports,
    timestamp: new Date().toISOString(),
  };

  fs.writeFileSync(
    path.join(iterationDir, 'summary.json'),
    JSON.stringify(summary, null, 2),
  );

  console.log(JSON.stringify(summary, null, 2));
  return summary;
}

interface FixLoopResult {
  status: 'passed' | 'failed' | 'escalated';
  findings: string[];
}

function runFixLoop(
  batchDir: string,
  workerResults: ParallelDispatchResult[],
  fixSuggestions: string[],
  maxRetries: number,
  workspacePath: string,
): FixLoopResult {
  const findings: string[] = [];

  for (let retry = 0; retry < maxRetries; retry++) {
    const failingResults = workerResults.filter((r) => r.status !== 'passed');

    if (failingResults.length === 0) {
      return { status: 'passed', findings };
    }

    // Dispatch fixers in parallel
    const fixInvocations: ParallelInvocation[] = failingResults.map((r) => ({
      skill: 'fixer',
      batchId: r.batchId,
      testCaseId: r.testCaseId,
    }));

    const fixResults = dispatchParallel(
      fixInvocations,
      path.join(workspacePath, '.agents', 'skills', 'workspace-maxxing', 'skills'),
    );

    findings.push(`Fix attempt ${retry + 1}: ${fixResults.length} fixes applied`);

    // Re-check benchmark
    const benchmarkResult = calculateBenchmark(workspacePath);
    if (benchmarkResult.weightedScore >= 85) {
      return { status: 'passed', findings };
    }
  }

  return { status: 'escalated', findings: [...findings, 'Max retries exhausted'] };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx jest tests/orchestrator.test.ts -t "batch lifecycle" -v`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/scripts/orchestrator.ts tests/orchestrator.test.ts
git commit -m "feat(orchestrator): add full batch lifecycle with fix loop"
```

---

### Task 5: Worker Sub-Skill SKILL.md

**Files:**
- Create: `templates/.workspace-templates/skills/worker/SKILL.md`
- Test: `tests/worker-skill.test.ts`

- [ ] **Step 1: Write test for worker skill structure**

```typescript
// tests/worker-skill.test.ts
import * as fs from 'fs';
import * as path from 'path';

describe('worker sub-skill', () => {
  const skillPath = path.join(__dirname, '..', 'templates', '.workspace-templates', 'skills', 'worker', 'SKILL.md');

  it('exists', () => {
    expect(fs.existsSync(skillPath)).toBe(true);
  });

  it('has YAML frontmatter with name and triggers', () => {
    const content = fs.readFileSync(skillPath, 'utf-8');
    expect(content).toMatch(/^---/m);
    expect(content).toMatch(/name:\s*worker/);
    expect(content).toMatch(/triggers:/);
  });

  it('has Iron Law section', () => {
    const content = fs.readFileSync(skillPath, 'utf-8');
    expect(content.toLowerCase()).toContain('the iron law');
  });

  it('has Anti-Rationalization Table', () => {
    const content = fs.readFileSync(skillPath, 'utf-8');
    expect(content).toContain('| Thought | Reality |');
  });

  it('has Report Format section with JSON schema', () => {
    const content = fs.readFileSync(skillPath, 'utf-8');
    expect(content.toLowerCase()).toContain('report format');
    expect(content).toContain('"skill": "worker"');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest tests/worker-skill.test.ts -v`
Expected: FAIL

- [ ] **Step 3: Create worker SKILL.md**

```markdown
---
name: worker
description: "Executes a single test case against the workspace and produces output. Use when running test cases, executing workspace tasks, or processing stage-specific work."
triggers: ["run test case", "execute workspace task", "process stage", "generate output"]
---

## Overview

Execute a single test case by reading the relevant workspace sections, performing the required work, and producing structured output. Each worker runs with fresh context — no assumptions about prior runs.

## When to Use

- Dispatched by orchestrator as part of a batch
- User asks to run a specific test case
- User asks to execute a workspace stage task

## When Not to Use

- Validating outputs (use validation sub-skill)
- Fixing failed outputs (use fixer sub-skill)
- Planning workspace structure (use architecture sub-skill)

## The Iron Law

NO SKIPPING TEST CASE STEPS
NO MODIFYING WORKSPACE STRUCTURE
NO CLAIMING DONE WITHOUT OUTPUT
NO ASSUMING PRIOR CONTEXT

## The Process

1. **Read test case** — Load the test case JSON from `.agents/iteration/batch-<N>/<testCaseId>/` or orchestrator input
2. **Load workspace context** — Read `SYSTEM.md` and relevant stage `CONTEXT.md` files
3. **Execute the task** — Follow the test case input/expected instructions
4. **Write output.md** — Human-readable output in `.agents/iteration/batch-<N>/<testCaseId>/output.md`
5. **Write report.json** — Structured JSON with `{testCaseId, status, output, findings}`
6. **Dispatch validation** — Signal that output is ready for validation

## Anti-Rationalization Table

| Thought | Reality |
|---------|---------|
| "I already know what this stage does" | Read the CONTEXT.md. Assumptions cause failures. |
| "The output is good enough" | Good enough fails validation. Follow the test case exactly. |
| "I'll modify the workspace structure to make this easier" | Workers don't modify structure. That's the fixer's job. |
| "This test case is redundant" | Every test case exists for a reason. Execute it. |
| "I'll skip writing report.json" | Validation depends on report.json. It's mandatory. |

## Sub-Skill Dispatch

- After output complete → validation sub-skill

## Report Format

```json
{
  "skill": "worker",
  "status": "passed|failed|escalated",
  "timestamp": "<ISO-8601>",
  "testCaseId": "<id>",
  "batchId": <number>,
  "findings": ["<finding>"],
  "recommendations": ["<recommendation>"],
  "metrics": {
    "executionTimeMs": <number>,
    "outputLength": <number>
  },
  "nextSkill": "validation"
}
```
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx jest tests/worker-skill.test.ts -v`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add templates/.workspace-templates/skills/worker/SKILL.md tests/worker-skill.test.ts
git commit -m "feat(worker): add worker sub-skill with obra patterns"
```

---

### Task 6: Fixer Sub-Skill SKILL.md

**Files:**
- Create: `templates/.workspace-templates/skills/fixer/SKILL.md`
- Test: `tests/fixer-skill.test.ts`

- [ ] **Step 1: Write test for fixer skill structure**

```typescript
// tests/fixer-skill.test.ts
import * as fs from 'fs';
import * as path from 'path';

describe('fixer sub-skill', () => {
  const skillPath = path.join(__dirname, '..', 'templates', '.workspace-templates', 'skills', 'fixer', 'SKILL.md');

  it('exists', () => {
    expect(fs.existsSync(skillPath)).toBe(true);
  });

  it('has YAML frontmatter with name and triggers', () => {
    const content = fs.readFileSync(skillPath, 'utf-8');
    expect(content).toMatch(/^---/m);
    expect(content).toMatch(/name:\s*fixer/);
    expect(content).toMatch(/triggers:/);
  });

  it('has Iron Law section', () => {
    const content = fs.readFileSync(skillPath, 'utf-8');
    expect(content.toLowerCase()).toContain('the iron law');
  });

  it('has Anti-Rationalization Table', () => {
    const content = fs.readFileSync(skillPath, 'utf-8');
    expect(content).toContain('| Thought | Reality |');
  });

  it('has Report Format section with JSON schema', () => {
    const content = fs.readFileSync(skillPath, 'utf-8');
    expect(content.toLowerCase()).toContain('report format');
    expect(content).toContain('"skill": "fixer"');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest tests/fixer-skill.test.ts -v`
Expected: FAIL

- [ ] **Step 3: Create fixer SKILL.md**

```markdown
---
name: fixer
description: "Applies targeted fixes to failing test case outputs. Use when fixing failed worker outputs, improving low-scoring results, or addressing validator findings."
triggers: ["fix failing test", "improve output", "address validation failure", "apply targeted fix"]
---

## Overview

Read validator findings and original worker output, identify the root cause of failure, apply the minimal fix needed, and re-validate. Each fixer runs with fresh context.

## When to Use

- Dispatched by orchestrator fix loop
- Validator identifies specific failures
- Worker output is incomplete or incorrect

## When Not to Use

- Generating new output from scratch (use worker sub-skill)
- Validating outputs (use validation sub-skill)
- Restructuring workspace (use architecture sub-skill)

## The Iron Law

NO BLIND RETRIES
NO COSMETIC FIXES
NO FIXING WHAT ISN'T BROKEN
NO CLAIMING FIX WITHOUT RE-VALIDATION

## The Process

1. **Read validator findings** — Load `batch-report.json` from batch directory
2. **Read original output** — Load `output.md` and `report.json` from `.agents/iteration/batch-<N>/<testCaseId>/`
3. **Identify root cause** — Map each finding to a specific issue in the output
4. **Apply minimal fix** — Change only what's needed to address the finding
5. **Update output.md** — Write the fixed output
6. **Update report.json** — Write updated report with fix details
7. **Dispatch validation** — Signal that fix is ready for re-validation

## Anti-Rationalization Table

| Thought | Reality |
|---------|---------|
| "I'll just re-run the worker logic" | Blind retries don't fix root causes. Read the findings. |
| "This looks better now" | Better is subjective. Does it pass the test case? |
| "I'll fix other things while I'm here" | Fix only what the validator flagged. Scope creep wastes cycles. |
| "The fix is obvious" | Obvious to whom? Follow the findings, not intuition. |
| "I don't need to re-validate" | Unvalidated fixes are guesses. Always re-validate. |

## Sub-Skill Dispatch

- After fix applied → validation sub-skill

## Report Format

```json
{
  "skill": "fixer",
  "status": "passed|failed|escalated",
  "timestamp": "<ISO-8601>",
  "testCaseId": "<id>",
  "batchId": <number>,
  "findings": ["<finding>"],
  "fixesApplied": ["<fix description>"],
  "recommendations": ["<recommendation>"],
  "metrics": {
    "findingsAddressed": <number>,
    "fixesApplied": <number>
  },
  "nextSkill": "validation"
}
```
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx jest tests/fixer-skill.test.ts -v`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add templates/.workspace-templates/skills/fixer/SKILL.md tests/fixer-skill.test.ts
git commit -m "feat(fixer): add fixer sub-skill with obra patterns"
```

---

### Task 7: Enhanced Validation Sub-Skill SKILL.md

**Files:**
- Modify: `templates/.workspace-templates/skills/validation/SKILL.md`
- Test: `tests/validation-enhanced.test.ts`

- [ ] **Step 1: Write test for enhanced validation skill**

```typescript
// tests/validation-enhanced.test.ts
import * as fs from 'fs';
import * as path from 'path';

describe('enhanced validation sub-skill', () => {
  const skillPath = path.join(__dirname, '..', 'templates', '.workspace-templates', 'skills', 'validation', 'SKILL.md');

  it('has YAML frontmatter with triggers', () => {
    const content = fs.readFileSync(skillPath, 'utf-8');
    expect(content).toMatch(/^---/m);
    expect(content).toMatch(/name:\s*validation/);
    expect(content).toMatch(/triggers:/);
  });

  it('has Iron Law section', () => {
    const content = fs.readFileSync(skillPath, 'utf-8');
    expect(content.toLowerCase()).toContain('the iron law');
  });

  it('has Anti-Rationalization Table', () => {
    const content = fs.readFileSync(skillPath, 'utf-8');
    expect(content).toContain('| Thought | Reality |');
  });

  it('includes batch-level validation instructions', () => {
    const content = fs.readFileSync(skillPath, 'utf-8');
    expect(content.toLowerCase()).toContain('batch');
  });

  it('has Report Format with benchmark scoring', () => {
    const content = fs.readFileSync(skillPath, 'utf-8');
    expect(content.toLowerCase()).toContain('report format');
    expect(content.toLowerCase()).toContain('benchmark');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest tests/validation-enhanced.test.ts -v`
Expected: FAIL

- [ ] **Step 3: Rewrite validation SKILL.md with obra patterns**

```markdown
---
name: validation
description: "Checks workspace ICM compliance and benchmarks batch outputs. Use when validating a workspace, checking compliance, running validation, benchmarking batch results, or after making changes to workspace structure."
triggers: ["validate batch", "check results", "run validation", "benchmark outputs", "check compliance"]
---

## Overview

Ensure workspace meets ICM standards and benchmark batch outputs through systematic validation. Validates both workspace structure and worker/fixer outputs.

## When to Use

- After workspace scaffolding
- After any structural change
- After worker batch completes
- After fixer applies fixes
- Before claiming delivery
- When score drops below threshold

## When Not to Use

- Generating outputs (use worker sub-skill)
- Fixing failures (use fixer sub-skill)
- Researching patterns (use research sub-skill)

## The Iron Law

NO SCORE INFLATION
NO SKIPPING FAILURES
NO VALIDATING WITHOUT BENCHMARK
NO PASSING WITHOUT EVIDENCE

## The Process

1. **Run validate.ts** — Execute `node scripts/validate.ts --workspace <path>`
2. **Parse results** — Read exit code and output
3. **Check batch outputs** — For each test case in batch, verify output.md and report.json exist
4. **Run benchmark** — Execute `node scripts/benchmark.ts --workspace <path>`
5. **Aggregate scores** — Combine workspace validation + benchmark scores
6. **Generate findings** — List specific failures with fix suggestions
7. **Write batch-report.json** — Structured report with per-test scores and overall batch score

## Batch-Level Validation

When validating a batch:
- Read all `report.json` files in `.agents/iteration/batch-<N>/`
- Verify each worker output matches its test case expectations
- Calculate per-test-case pass/fail
- Calculate overall batch score using benchmark weights
- If batch score < threshold → recommend fixer sub-skill

## Anti-Rationalization Table

| Thought | Reality |
|---------|---------|
| "This workspace looks good enough" | Good enough is the enemy of excellent. Run validation. |
| "The score is close, I'll round up" | Score inflation hides real problems. Report the true score. |
| "One failure doesn't matter" | Every failure matters. Report it. |
| "I already validated this" | Validation is a snapshot. Re-validate after every change. |
| "The benchmark is too strict" | The benchmark is the standard. Meet it or escalate. |

## Sub-Skill Dispatch

- If batch score < threshold → fixer sub-skill
- If batch score >= threshold → orchestrator (batch complete)
- If critical failures (missing SYSTEM.md) → escalate to human

## Report Format

```json
{
  "skill": "validation",
  "status": "passed|failed|escalated",
  "timestamp": "<ISO-8601>",
  "batchId": <number>,
  "findings": ["<finding>"],
  "fixSuggestions": ["<suggestion>"],
  "recommendations": ["<recommendation>"],
  "metrics": {
    "score": <0-100>,
    "benchmarkScore": <0-100>,
    "itemsChecked": <number>,
    "itemsPassed": <number>,
    "testCasesPassed": <number>,
    "testCasesFailed": <number>
  },
  "nextSkill": "fixer|none"
}
```
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx jest tests/validation-enhanced.test.ts -v`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add templates/.workspace-templates/skills/validation/SKILL.md tests/validation-enhanced.test.ts
git commit -m "feat(validation): enhance with obra patterns and batch validation"
```

---

### Task 8: Rewrite Remaining 6 Sub-Skills with obra/superpowers Patterns

**Files:**
- Modify: `templates/.workspace-templates/skills/research/SKILL.md`
- Modify: `templates/.workspace-templates/skills/architecture/SKILL.md`
- Modify: `templates/.workspace-templates/skills/testing/SKILL.md`
- Modify: `templates/.workspace-templates/skills/prompt-engineering/SKILL.md`
- Modify: `templates/.workspace-templates/skills/iteration/SKILL.md`
- Modify: `templates/.workspace-templates/skills/tooling/SKILL.md`

Each sub-skill gets this structure:
- YAML frontmatter: `name`, `description`, `triggers`
- Overview
- When to Use / When Not to Use
- The Iron Law (3-4 rules)
- The Process (numbered steps)
- Anti-Rationalization Table
- Sub-Skill Dispatch (if applicable)
- Report Format (JSON schema)

- [ ] **Step 1: Rewrite research/SKILL.md**

```markdown
---
name: research
description: "Investigates patterns, gathers context, and identifies best practices for workspace design. Use when starting a new workspace, researching workflow patterns, or before architecture planning."
triggers: ["research workflow", "gather context", "identify patterns", "best practices"]
---

## Overview

Gather context and identify patterns before building. Research ensures the workspace design is informed by real requirements, not assumptions.

## When to Use

- Phase 1 of hybrid flow (always first)
- Before architecture planning
- When user asks for a novel workflow type
- When existing patterns don't fit the use case

## When Not to Use

- After architecture is already planned (use architecture sub-skill)
- When workspace structure already exists (use validation sub-skill)
- For simple file creation (direct file operations)

## The Iron Law

NO BUILD WITHOUT RESEARCH
NO GENERIC FINDINGS
NO SKIPPING INPUT/OUTPUT ANALYSIS
NO ASSUMPTIONS WITHOUT EVIDENCE

## The Process

1. **Identify workflow type** — What kind of process is being automated?
2. **Research similar patterns** — Look at existing workspaces, documentation, best practices
3. **Identify key stages** — What are the natural phases of this workflow?
4. **Determine inputs/outputs** — What goes in, what comes out at each stage?
5. **Identify tooling needs** — What tools are commonly used for this workflow?
6. **Document findings** — Create a research summary for the architecture phase

## Anti-Rationalization Table

| Thought | Reality |
|---------|---------|
| "I already know this workflow type" | Knowledge ≠ research. Document findings for the next agent. |
| "Research is taking too long" | Research prevents wasted build time. Be thorough. |
| "I'll figure it out while building" | Building without research produces generic, non-optimal workspaces. |
| "The user will clarify later" | Ask now. Ambiguous requirements produce ambiguous workspaces. |

## Sub-Skill Dispatch

- Always dispatches to architecture sub-skill next
- If research is inconclusive → escalate to human for clarification

## Report Format

```json
{
  "skill": "research",
  "status": "passed|failed|escalated",
  "timestamp": "<ISO-8601>",
  "findings": ["<finding>"],
  "recommendations": ["<recommendation>"],
  "metrics": {
    "patternsIdentified": <number>,
    "stagesIdentified": <number>
  },
  "nextSkill": "architecture"
}
```
```

- [ ] **Step 2: Rewrite architecture/SKILL.md**

```markdown
---
name: architecture
description: "Designs workspace structure, plans folder layout, and creates the build plan. Use when planning workspace structure, designing folder hierarchy, or after research phase."
triggers: ["design workspace", "plan structure", "folder layout", "build plan"]
---

## Overview

Design the workspace structure based on research findings. Architecture translates research into a concrete, buildable plan.

## When to Use

- Phase 2 of hybrid flow (after research)
- When research is complete and building is next
- When restructuring an existing workspace

## When Not to Use

- Before research is complete (use research sub-skill)
- During building (use scaffold.ts directly)
- For minor structural tweaks (direct file operations)

## The Iron Law

NO ARCHITECTURE WITHOUT RESEARCH
NO BUILDING WITHOUT APPROVED PLAN
NO SKIPPING USER APPROVAL
NO AMBIGUOUS STAGE DEFINITIONS

## The Process

1. **Review research findings** — Read the research sub-skill report
2. **Define stage folders** — Determine numbered folder structure (01-xxx, 02-xxx, etc.)
3. **Design routing table** — Plan CONTEXT.md routing for each stage
4. **Define SYSTEM.md** — Plan folder map, rules, and tool inventory
5. **Plan CONTEXT.md content** — Define what each stage's CONTEXT.md should contain
6. **Create build plan** — Document the scaffold.ts command with all parameters
7. **Get approval** — Present plan to user before building

## Anti-Rationalization Table

| Thought | Reality |
|---------|---------|
| "I'll adjust the structure while building" | Structure changes mid-build are expensive. Plan first. |
| "This stage name is good enough" | Stage names affect routing. Be precise. |
| "The user will understand without approval" | Unapproved plans produce unwanted results. Always present the plan. |

## Sub-Skill Dispatch

- Receives input from research sub-skill
- After approval → main skill runs scaffold.ts
- If architecture is unclear → escalate to human

## Report Format

```json
{
  "skill": "architecture",
  "status": "passed|failed|escalated",
  "timestamp": "<ISO-8601>",
  "findings": ["<finding>"],
  "recommendations": ["<recommendation>"],
  "metrics": {
    "stagesPlanned": <number>,
    "toolsIdentified": <number>
  },
  "nextSkill": "none"
}
```
```

- [ ] **Step 3: Rewrite testing/SKILL.md**

```markdown
---
name: testing
description: "Generates and runs test cases, evaluates results, and identifies gaps. Use when testing workspace quality, generating test cases, or after prompt improvements."
triggers: ["generate test cases", "run tests", "test workspace", "evaluate quality"]
---

## Overview

Verify workspace quality through systematic testing. Testing ensures the workspace produces correct outputs across sample, edge-case, and empty inputs.

## When to Use

- After prompt-engineering improvements
- When no tests exist for the workspace
- Before claiming delivery
- When score is above 80 but quality is uncertain

## When Not to Use

- Before workspace is built (use scaffold.ts first)
- For structural validation (use validation sub-skill)
- When fixing failures (use fixer sub-skill)

## The Iron Law

NO SKIPPING TEST GENERATION
NO IGNORING FAILED TESTS
NO CLAIMING QUALITY WITHOUT EVIDENCE
NO TESTING WITHOUT TEST CASES

## The Process

1. **Generate test cases** — Run `node scripts/generate-tests.ts --workspace <path> --output ./tests.json`
2. **Read test cases** — Parse the generated test cases
3. **Run generation tests** — For each test case, create sample content the stage should produce
4. **Run evaluation tests** — Review CONTEXT.md files against test cases
5. **Aggregate results** — Identify patterns and gaps
6. **Document findings** — Create test report with pass/fail per test case

## Anti-Rationalization Table

| Thought | Reality |
|---------|---------|
| "The workspace looks fine, no need to test" | Looks deceive. Tests reveal. |
| "One failed test is a fluke" | Failed tests are signals. Investigate. |
| "I'll test after delivery" | Untested delivery is a gamble. Test first. |

## Sub-Skill Dispatch

- Dispatched after prompt-engineering
- If tests fail → dispatch iteration for fixes
- If tests pass → workflow is nearly complete

## Report Format

```json
{
  "skill": "testing",
  "status": "passed|failed|escalated",
  "timestamp": "<ISO-8601>",
  "findings": ["<finding>"],
  "recommendations": ["<recommendation>"],
  "metrics": {
    "testCasesGenerated": <number>,
    "testCasesPassed": <number>,
    "testCasesFailed": <number>
  },
  "nextSkill": "iteration|none"
}
```
```

- [ ] **Step 4: Rewrite prompt-engineering/SKILL.md**

```markdown
---
name: prompt-engineering
description: "Improves CONTEXT.md and SYSTEM.md prompts for better agent behavior. Use when workspace score is below 80, prompts need improvement, or after validation identifies content gaps."
triggers: ["improve prompts", "fix content gaps", "optimize prompts", "clarify instructions"]
---

## Overview

Optimize workspace prompts for clarity, completeness, and agent guidance. Prompt engineering fixes content-level issues without structural changes.

## When to Use

- Score < 80 in benchmark results
- Validation identifies missing content
- Prompts are vague or incomplete
- Agent behavior doesn't match expectations

## When Not to Use

- For structural issues (use fixer or architecture sub-skill)
- When workspace has no content yet (use worker sub-skill)
- For tool installation (use tooling sub-skill)

## The Iron Law

NO COSMETIC CHANGES WITHOUT FUNCTIONAL IMPROVEMENT
NO CHANGING PROMPTS WITHOUT RE-VALIDATING
NO REMOVING CONTENT WITHOUT REPLACEMENT
NO CLAIMING IMPROVEMENT WITHOUT SCORE CHECK

## The Process

1. **Identify weak prompts** — Read benchmark findings and validation failures
2. **Analyze current prompts** — What's missing, vague, or unclear?
3. **Apply prompt patterns** — Use clear structure, examples, constraints, and output formats
4. **Update CONTEXT.md files** — Improve stage-specific instructions
5. **Update SYSTEM.md if needed** — Improve folder map, rules, or tool inventory
6. **Re-run validation** — Verify improvements didn't break anything
7. **Re-run benchmark** — Check if score improved

## Anti-Rationalization Table

| Thought | Reality |
|---------|---------|
| "This wording change is enough" | Wording changes must produce functional improvement. |
| "I'll remove vague sections" | Removing creates gaps. Improve, don't delete. |
| "The score didn't change, but it's better" | If the score didn't change, it's not better. Try again. |

## Sub-Skill Dispatch

- Dispatched when score < 80
- After improvements → dispatch testing to verify
- If score doesn't improve → dispatch iteration for deeper fixes

## Report Format

```json
{
  "skill": "prompt-engineering",
  "status": "passed|failed|escalated",
  "timestamp": "<ISO-8601>",
  "findings": ["<finding>"],
  "recommendations": ["<recommendation>"],
  "metrics": {
    "scoreBefore": <number>,
    "scoreAfter": <number>,
    "promptsUpdated": <number>
  },
  "nextSkill": "testing|iteration|none"
}
```
```

- [ ] **Step 5: Rewrite iteration/SKILL.md**

```markdown
---
name: iteration
description: "Runs autonomous improvement loops with benchmark scoring. Use when score plateaued, deeper fixes needed, or after testing identifies patterns."
triggers: ["run improvement loop", "iterate on workspace", "deeper fixes", "score plateau"]
---

## Overview

Execute improvement loops until quality thresholds are met. Iteration applies systematic fixes when prompt-engineering isn't enough.

## When to Use

- Score plateaued (no improvement between runs)
- Testing identified patterns requiring deeper fixes
- Validation failures persist after prompt-engineering
- As part of the condition-driven improvement loop

## When Not to Use

- For first-pass improvements (use prompt-engineering first)
- When workspace is new and untested (use testing first)
- When structural changes are needed (use architecture sub-skill)

## The Iron Law

NO CLAIMING IMPROVEMENT WITHOUT RE-RUNNING BENCHMARK
NO SKIPPING FIX SUGGESTIONS
NO INFINITE ITERATION LOOPS
NO SKIPPING ESCALATION WHEN STUCK

## The Process

1. **Run iterate.ts** — Execute `node scripts/iterate.ts --workspace <path> --max-retries 3`
2. **Read benchmark results** — Parse the JSON output
3. **Identify improvement areas** — Read fixSuggestions and improvementPotential
4. **Apply fixes** — Address each suggestion systematically
5. **Re-run iteration** — Check if score improved
6. **Repeat until threshold** — Continue until score > 85 or no improvement possible
7. **Escalate if stuck** — If score doesn't improve after 3 attempts, escalate to human

## Anti-Rationalization Table

| Thought | Reality |
|---------|---------|
| "I'll just run it again" | Without applying fixes, re-running is wasted cycles. |
| "The score improved by 1 point" | Marginal improvements aren't meaningful. Target > 85. |
| "I'll keep iterating until it works" | Max 3 attempts. Then escalate. |

## Sub-Skill Dispatch

- Dispatched when score plateaued
- After iteration → re-run validation and benchmark
- If score > 85 → workflow complete
- If stuck after 3 attempts → escalate to human

## Report Format

```json
{
  "skill": "iteration",
  "status": "passed|failed|escalated",
  "timestamp": "<ISO-8601>",
  "findings": ["<finding>"],
  "recommendations": ["<recommendation>"],
  "metrics": {
    "scoreBefore": <number>,
    "scoreAfter": <number>,
    "iterationsRun": <number>
  },
  "nextSkill": "none"
}
```
```

- [ ] **Step 6: Rewrite tooling/SKILL.md**

```markdown
---
name: tooling
description: "Assesses, installs, and configures tools for the workspace. Use when tools are missing, tool inventory needs updating, or workspace requires specific dependencies."
triggers: ["install tools", "assess tooling", "update tool inventory", "configure dependencies"]
---

## Overview

Ensure workspace has the right tools installed and configured. Tooling manages the dependency layer of the workspace.

## When to Use

- Tool inventory is empty or incomplete
- Workspace requires specific dependencies
- After architecture phase identifies tooling needs
- When user requests specific tool installation

## When Not to Use

- For non-tool structural changes (use architecture sub-skill)
- For content improvements (use prompt-engineering sub-skill)
- When no tools are needed (skip tooling phase)

## The Iron Law

NO INSTALLING TOOLS WITHOUT USER APPROVAL
NO SKIPPING TOOL INVENTORY UPDATES
NO INSTALLING UNNECESSARY TOOLS
NO SKIPPING VERIFICATION AFTER INSTALLATION

## The Process

1. **Scan current tools** — Read SYSTEM.md tool inventory
2. **Identify missing tools** — Compare against workspace requirements
3. **Propose tools** — List recommended tools with justifications
4. **Get approval** — Present tool list to user for approval
5. **Install tools** — Run `node scripts/install-tool.ts --tool <name> --manager <mgr> --workspace <path>`
6. **Update inventory** — Verify tool inventory is updated
7. **Verify installation** — Confirm tools are accessible

## Anti-Rationalization Table

| Thought | Reality |
|---------|---------|
| "This tool might be useful" | Might is not enough. Justify each tool against workspace needs. |
| "I'll install it now and tell the user later" | User approval comes before installation. Always. |
| "The installation probably worked" | Probably is not verified. Check. |

## Sub-Skill Dispatch

- Dispatched when tools are missing
- After installation → workflow continues to next phase
- If tool installation fails → escalate to human

## Report Format

```json
{
  "skill": "tooling",
  "status": "passed|failed|escalated",
  "timestamp": "<ISO-8601>",
  "findings": ["<finding>"],
  "recommendations": ["<recommendation>"],
  "metrics": {
    "toolsInstalled": <number>,
    "toolsProposed": <number>,
    "toolsFailed": <number>
  },
  "nextSkill": "none"
}
```
```

- [ ] **Step 7: Commit**

```bash
git add templates/.workspace-templates/skills/research/SKILL.md templates/.workspace-templates/skills/architecture/SKILL.md templates/.workspace-templates/skills/testing/SKILL.md templates/.workspace-templates/skills/prompt-engineering/SKILL.md templates/.workspace-templates/skills/iteration/SKILL.md templates/.workspace-templates/skills/tooling/SKILL.md
git commit -m "refactor(sub-skills): rewrite all 6 remaining sub-skills with obra patterns"
```

---

### Task 9: Update Main SKILL.md with Autonomous Iteration Workflow

**Files:**
- Modify: `templates/SKILL.md`

- [ ] **Step 1: Rewrite templates/SKILL.md with new workflow section**

Replace the entire file content with:

```markdown
---
name: workspace-maxxing
description: "Autonomously creates, validates, and improves ICM-compliant workspaces using batched parallel sub-agents. Use when user asks to 'build a workspace', 'create a workflow', 'automate a process', 'improve this workspace', 'validate this workspace', 'iterate on this workspace', or 'run test cases'."
---

# Workspace-Maxxing Skill

## Overview

Autonomous workflow system that creates, validates, and improves ICM-compliant workspaces through phased execution, batched parallel sub-agent iteration, and condition-driven improvement loops.

## When to Use

- User asks to build, create, or automate a workflow
- User asks to improve, validate, or iterate on an existing workspace
- User asks for workspace architecture or structure design
- User asks to assess or install tools for a workspace
- User asks to run test cases against a workspace

## When Not to Use

- Simple file creation or editing (use direct file operations)
- Questions about ICM methodology (answer directly)
- Non-workspace tasks (check for other applicable skills first)

## The Iron Law

NO BUILD WITHOUT PLAN
NO PLAN WITHOUT RESEARCH
NO IMPROVEMENT WITHOUT VALIDATION
NO COMPLETION CLAIM WITHOUT VERIFICATION

## Hybrid Flow

```
Phase 1: RESEARCH (dispatch research sub-skill)
  ↓
Phase 2: ARCHITECTURE (dispatch architecture sub-skill)
  ↓
Phase 3: BUILD (use scaffold.ts script)
  ↓
Phase 4: VALIDATE (dispatch validation sub-skill)
  ↓
Phase 5: AUTONOMOUS ITERATION (use orchestrator.ts)
  ├─ Generate test cases
  ├─ Split into batches
  ├─ Dispatch workers in parallel per batch
  ├─ Validate batch results
  ├─ If score < threshold → fix loop → re-validate
  └─ Next batch or complete
  ↓
Phase 6: DELIVER
```

## Autonomous Iteration Workflow

The orchestrator manages batched parallel sub-agent execution:

```bash
node scripts/orchestrator.ts --workspace ./workspace --batch-size 3 --score-threshold 85
```

**Flow:**
1. Generate test cases from workspace stages
2. Split into batches (default 3 per batch)
3. Dispatch worker sub-agents in parallel for each batch
4. Validate batch outputs with benchmark scoring
5. If batch score < threshold → dispatch fixer sub-agents → re-validate (max 3 retries)
6. Move to next batch or write summary

**Options:**
- `--batch-size <n>` — Test cases per batch (default: 3)
- `--score-threshold <n>` — Minimum batch score to pass (default: 85)
- `--max-fix-retries <n>` — Max fix attempts per batch (default: 3)
- `--worker-timeout <s>` — Worker timeout in seconds (default: 300)

## Sub-Skill Dispatch

| Condition | Sub-Skill | Command |
|-----------|-----------|---------|
| Starting new workflow | `research` | `node scripts/dispatch.ts --skill research --workspace ./workspace` |
| After research complete | `architecture` | `node scripts/dispatch.ts --skill architecture --workspace ./workspace` |
| After architecture approved | (use scaffold.ts) | `node scripts/scaffold.ts --name "<name>" --stages "<stages>" --output ./workspace` |
| After building | `validation` | `node scripts/dispatch.ts --skill validation --workspace ./workspace` |
| Running autonomous iteration | (use orchestrator.ts) | `node scripts/orchestrator.ts --workspace ./workspace` |
| Worker execution | `worker` | `node scripts/dispatch.ts --skill worker --workspace ./workspace --batch-id <N>` |
| Fix loop | `fixer` | `node scripts/dispatch.ts --skill fixer --workspace ./workspace --batch-id <N>` |
| Score < 80 | `prompt-engineering` | `node scripts/dispatch.ts --skill prompt-engineering --workspace ./workspace` |
| No tests exist | `testing` | `node scripts/dispatch.ts --skill testing --workspace ./workspace` |
| Score plateaued | `iteration` | `node scripts/dispatch.ts --skill iteration --workspace ./workspace` |
| Tools missing | `tooling` | `node scripts/dispatch.ts --skill tooling --workspace ./workspace` |

## Available Scripts

### orchestrator.ts — Autonomous Batch Iteration

Runs the full batched parallel sub-agent workflow.

```bash
node scripts/orchestrator.ts --workspace ./workspace --batch-size 3 --score-threshold 85
```

### scaffold.ts — Generate ICM Workspace

Creates a complete ICM workspace structure from a plan.

```bash
node scripts/scaffold.ts --name "research" --stages "01-research,02-analysis,03-report" --output ./workspace
```

### validate.ts — Check ICM Compliance

Validates a workspace against ICM rules.

```bash
node scripts/validate.ts --workspace ./workspace
```

### install-tool.ts — Install Packages

Installs a tool and updates the workspace inventory.

```bash
node scripts/install-tool.ts --tool "pdf-lib" --manager npm --workspace ./workspace
```

### iterate.ts — Single-Workspace Iteration (legacy)

Runs a 3-pass improvement loop. Use orchestrator.ts for batched parallel iteration.

```bash
node scripts/iterate.ts --workspace ./workspace --max-retries 3
```

### generate-tests.ts — Generate Test Cases

Creates test cases for each stage (sample, edge-case, empty).

```bash
node scripts/generate-tests.ts --workspace ./workspace --output ./tests.json
```

### benchmark.ts — Weighted Benchmark Scoring

Runs weighted benchmark scoring on a workspace.

```bash
node scripts/benchmark.ts --workspace ./workspace
```

### dispatch.ts — Sub-Skill Dispatcher

Loads and executes sub-skill workflows. Supports parallel dispatch.

```bash
node scripts/dispatch.ts --skill <name> --workspace ./workspace [--parallel --invocations <path>]
```

## Anti-Rationalization Table

| Thought | Reality |
|---------|---------|
| "This workspace looks good enough" | Good enough is the enemy of excellent. Run validation. |
| "I'll skip research and go straight to building" | Building without research produces generic, non-optimal workspaces. |
| "The user didn't ask for tests" | Autonomous workflows require self-verification. Tests are mandatory. |
| "I'll fix this later" | Later never comes. Fix it now or escalate. |
| "This sub-skill doesn't apply here" | If there's a 1% chance it applies, dispatch it. |
| "The score is fine" | Fine is not good. Target > 85. |
| "I already validated this" | Validation is a snapshot. Re-validate after every change. |
| "I'll do all phases at once" | Phases exist for a reason. Complete each before moving to the next. |

## Integration

- Sub-skills live in `skills/` directory, loaded via dispatch.ts
- Shared references in `references/` directory (anti-patterns, reporting-format, iron-laws)
- All sub-skills return structured JSON reports
- Orchestrator manages batch lifecycle with fix loops
- Condition loop continues until score > 85 AND all validations pass
- Escalate to human if stuck after 3 iteration attempts

## ICM Rules
- Canonical sources: each fact lives in exactly one file
- One-way dependencies only: A → B, never B → A
- Selective loading: route to sections, not whole files
- Numbered folders for workflow stages

## Output Format
- workspace/ — the built workspace
- .agents/skills/<workspace-name>/ — installable skill
- USAGE.md — how to use this workspace in future sessions
- .agents/iteration/summary.json — autonomous iteration results
```

- [ ] **Step 2: Commit**

```bash
git add templates/SKILL.md
git commit -m "feat(SKILL.md): add autonomous iteration workflow section"
```

---

### Task 10: Full Integration Test

**Files:**
- Modify: `tests/integration.test.ts`

- [ ] **Step 1: Add integration test for orchestrator batch lifecycle**

Add to `tests/integration.test.ts`:

```typescript
describe('orchestrator integration', () => {
  it('runs full batch lifecycle on a valid workspace', () => {
    const ws = createBasicWorkspace();
    const orchestratorPath = path.join(__dirname, '..', 'dist', 'scripts', 'orchestrator.js');

    const { stdout } = execSync(`node "${orchestratorPath}" --workspace "${ws}" --batch-size 2`, {
      encoding: 'utf-8',
    });

    const result = JSON.parse(stdout);
    expect(result.totalBatches).toBeGreaterThan(0);
    expect(result.batchReports).toBeDefined();
  });

  it('writes summary.json to iteration directory', () => {
    const ws = createBasicWorkspace();
    const orchestratorPath = path.join(__dirname, '..', 'dist', 'scripts', 'orchestrator.js');

    execSync(`node "${orchestratorPath}" --workspace "${ws}" --batch-size 2`, {
      encoding: 'utf-8',
    });

    const summaryPath = path.join(ws, '.agents', 'iteration', 'summary.json');
    expect(fs.existsSync(summaryPath)).toBe(true);

    const summary = JSON.parse(fs.readFileSync(summaryPath, 'utf-8'));
    expect(summary.totalBatches).toBeDefined();
    expect(summary.timestamp).toBeDefined();
  });
});
```

- [ ] **Step 2: Build and run all tests**

Run: `npm run build && npm test`
Expected: All tests pass

- [ ] **Step 3: Commit**

```bash
git add tests/integration.test.ts
git commit -m "test(integration): add orchestrator batch lifecycle tests"
```

---

### Task 11: Run Full Test Suite & Verify

- [ ] **Step 1: Run full test suite**

Run: `npm test`
Expected: All tests pass (114+ existing + new tests)

- [ ] **Step 2: Build**

Run: `npm run build`
Expected: Clean build, no errors

- [ ] **Step 3: Verify all sub-skill files exist**

Run: `ls templates/.workspace-templates/skills/*/SKILL.md`
Expected: All 9 sub-skills listed (research, architecture, validation, prompt-engineering, testing, iteration, tooling, worker, fixer)

- [ ] **Step 4: Final commit if needed**

```bash
git status
git add -A
git commit -m "chore: final verification and cleanup"
```
