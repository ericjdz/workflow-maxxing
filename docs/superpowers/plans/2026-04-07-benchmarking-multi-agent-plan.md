# Benchmarking & Multi-Agent Support Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add weighted benchmark scoring, multi-agent CLI installation targeting, guided iteration reports, and console+JSON benchmark output.

**Architecture:** New `benchmark.ts` script for weighted scoring, enhanced `install.ts` with agent-targeting flags, extended `iterate.ts` with benchmark data in return values, and updated `index.ts` with new CLI flags.

**Tech Stack:** TypeScript, Node.js builtins only (fs, path, process), Jest for testing.

---

### Task 1: Create `src/scripts/benchmark.ts` — Weighted Scoring Engine

**Files:**
- Create: `src/scripts/benchmark.ts`
- Test: `tests/benchmark.test.ts`

- [ ] **Step 1: Write tests for weighted scoring**

```typescript
// tests/benchmark.test.ts
import * as fs from 'fs';
import * as path from 'path';
import { calculateBenchmark, formatBenchmarkTable, BenchmarkResult } from './benchmark';

// Mock fs and path
jest.mock('fs');
jest.mock('path');

const mockFs = fs as jest.Mocked<typeof fs>;
const mockPath = path as jest.Mocked<typeof path>;

describe('calculateBenchmark', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPath.resolve.mockImplementation((p: string) => p);
    mockPath.join.mockImplementation((...args: string[]) => args.join('/'));
  });

  it('returns weighted scores for a workspace with all stages', () => {
    mockFs.existsSync.mockReturnValue(true);
    mockFs.readdirSync.mockReturnValue([
      { name: '00-meta', isDirectory: () => true },
      { name: '01-ideation', isDirectory: () => true },
      { name: '02-research', isDirectory: () => true },
      { name: '03-architecture', isDirectory: () => true },
    ] as fs.Dirent[]);
    mockFs.readFileSync.mockReturnValue('purpose: test\ninput: none\noutput: test\ndependencies: none');

    const result = calculateBenchmark('/test-workspace');

    expect(result.stages).toHaveLength(3);
    expect(result.stages[0].name).toBe('01-ideation');
    expect(result.stages[0].weight).toBe(1.5);
    expect(result.stages[1].name).toBe('02-research');
    expect(result.stages[1].weight).toBe(1.3);
    expect(result.stages[2].name).toBe('03-architecture');
    expect(result.stages[2].weight).toBe(1.2);
  });

  it('excludes missing stages from calculation', () => {
    mockFs.existsSync.mockReturnValue(true);
    mockFs.readdirSync.mockReturnValue([
      { name: '00-meta', isDirectory: () => true },
      { name: '01-ideation', isDirectory: () => true },
    ] as fs.Dirent[]);
    mockFs.readFileSync.mockReturnValue('purpose: test\ninput: none\noutput: test\ndependencies: none');

    const result = calculateBenchmark('/test-workspace');

    expect(result.stages).toHaveLength(1);
    expect(result.stages[0].name).toBe('01-ideation');
  });

  it('normalizes final score to 0-100', () => {
    mockFs.existsSync.mockReturnValue(true);
    mockFs.readdirSync.mockReturnValue([
      { name: '00-meta', isDirectory: () => true },
      { name: '01-ideation', isDirectory: () => true },
    ] as fs.Dirent[]);
    mockFs.readFileSync.mockReturnValue('purpose: test\ninput: none\noutput: test\ndependencies: none');

    const result = calculateBenchmark('/test-workspace');

    expect(result.weightedScore).toBeGreaterThanOrEqual(0);
    expect(result.weightedScore).toBeLessThanOrEqual(100);
  });

  it('returns empty stages for workspace with no numbered folders', () => {
    mockFs.existsSync.mockReturnValue(false);
    mockFs.readdirSync.mockReturnValue([
      { name: '00-meta', isDirectory: () => true },
    ] as fs.Dirent[]);

    const result = calculateBenchmark('/test-workspace');

    expect(result.stages).toHaveLength(0);
    expect(result.weightedScore).toBe(0);
  });
});

describe('formatBenchmarkTable', () => {
  it('formats a benchmark result as a console table', () => {
    const data: BenchmarkResult = {
      workspace: 'test-ws',
      agent: 'opencode',
      timestamp: '2026-04-07T00:00:00Z',
      rawScore: 72,
      weightedScore: 78,
      stages: [
        { name: '01-ideation', raw: 85, weight: 1.5, weighted: 95 },
        { name: '02-research', raw: 60, weight: 1.3, weighted: 58 },
      ],
      fixSuggestions: ['Add research sources'],
      improvementPotential: true,
    };

    const table = formatBenchmarkTable(data);

    expect(table).toContain('01-ideation');
    expect(table).toContain('02-research');
    expect(table).toContain('78');
    expect(table).toContain('TOTAL');
  });

  it('handles empty stages gracefully', () => {
    const data: BenchmarkResult = {
      workspace: 'test-ws',
      agent: 'opencode',
      timestamp: '2026-04-07T00:00:00Z',
      rawScore: 0,
      weightedScore: 0,
      stages: [],
      fixSuggestions: [],
      improvementPotential: false,
    };

    const table = formatBenchmarkTable(data);

    expect(table).toContain('0');
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test -- tests/benchmark.test.ts`
Expected: FAIL with "Cannot find module './benchmark'"

- [ ] **Step 3: Implement `src/scripts/benchmark.ts`**

```typescript
import * as fs from 'fs';
import * as path from 'path';

export interface StageBenchmark {
  name: string;
  raw: number;
  weight: number;
  weighted: number;
}

export interface BenchmarkResult {
  workspace: string;
  agent: string;
  timestamp: string;
  rawScore: number;
  weightedScore: number;
  stages: StageBenchmark[];
  fixSuggestions: string[];
  improvementPotential: boolean;
}

const STAGE_WEIGHTS: Record<string, number> = {
  '01-ideation': 1.5,
  '02-research': 1.3,
  '03-architecture': 1.2,
};

const DEFAULT_WEIGHT = 1.0;
const MAX_RAW_SCORE = 45; // Per-stage cap from validate.ts

export function calculateBenchmark(workspacePath: string): BenchmarkResult {
  const ws = path.resolve(workspacePath);
  const stageFolders = getNumberedFolders(ws);

  const stages: StageBenchmark[] = [];
  let totalWeighted = 0;
  let totalWeight = 0;

  for (const folder of stageFolders) {
    const weight = STAGE_WEIGHTS[folder] ?? DEFAULT_WEIGHT;
    const raw = calculateStageRawScore(ws, folder);
    const weighted = (raw / MAX_RAW_SCORE) * 100 * weight;

    stages.push({ name: folder, raw, weight, weighted });
    totalWeighted += weighted;
    totalWeight += weight;
  }

  const weightedScore = totalWeight > 0 ? totalWeighted / totalWeight : 0;
  const rawScore = stages.reduce((sum, s) => sum + s.raw, 0);

  const fixSuggestions = stages
    .filter((s) => s.raw < MAX_RAW_SCORE)
    .map((s) => `Improve ${s.name}: current score ${s.raw}/${MAX_RAW_SCORE}`);

  return {
    workspace: path.basename(ws),
    agent: 'unknown',
    timestamp: new Date().toISOString(),
    rawScore,
    weightedScore: Math.min(Math.round(weightedScore), 100),
    stages,
    fixSuggestions,
    improvementPotential: stages.some((s) => s.raw < MAX_RAW_SCORE),
  };
}

export function formatBenchmarkTable(data: BenchmarkResult): string {
  const lines: string[] = [];

  lines.push(`\nBenchmark Report: ${data.workspace}`);
  lines.push(`Agent: ${data.agent} | Timestamp: ${data.timestamp}`);
  lines.push('');
  lines.push(
    padRight('Stage', 20) +
    padRight('Raw', 8) +
    padRight('Weight', 10) +
    padRight('Weighted', 12)
  );
  lines.push('-'.repeat(50));

  for (const stage of data.stages) {
    lines.push(
      padRight(stage.name, 20) +
      padRight(String(stage.raw), 8) +
      padRight(stage.weight.toFixed(1) + 'x', 10) +
      padRight(stage.weighted.toFixed(1), 12)
    );
  }

  lines.push('-'.repeat(50));
  lines.push(
    padRight('TOTAL', 20) +
    padRight(String(data.rawScore), 8) +
    padRight('', 10) +
    padRight(data.weightedScore.toFixed(1), 12)
  );
  lines.push('');

  if (data.fixSuggestions.length > 0) {
    lines.push('Suggestions:');
    for (const suggestion of data.fixSuggestions) {
      lines.push(`  - ${suggestion}`);
    }
    lines.push('');
  }

  return lines.join('\n');
}

function calculateStageRawScore(ws: string, folder: string): number {
  const stageContextPath = path.join(ws, folder, 'CONTEXT.md');
  let score = 0;

  if (fs.existsSync(stageContextPath)) {
    const content = fs.readFileSync(stageContextPath, 'utf-8');
    if (content.toLowerCase().includes('purpose') || content.toLowerCase().includes('## purpose')) score += 4;
    if (content.toLowerCase().includes('input')) score += 4;
    if (content.toLowerCase().includes('output')) score += 4;
    if (content.toLowerCase().includes('dependenc')) score += 3;
    // Additional checks for more granular scoring
    if (content.toLowerCase().includes('## success criteria') || content.toLowerCase().includes('success criteria')) score += 5;
    if (content.toLowerCase().includes('## approach') || content.toLowerCase().includes('approach')) score += 5;
    if (content.toLowerCase().includes('## risks') || content.toLowerCase().includes('risks')) score += 5;
    if (content.toLowerCase().includes('## timeline') || content.toLowerCase().includes('timeline')) score += 5;
    if (content.toLowerCase().includes('## resources') || content.toLowerCase().includes('resources')) score += 5;
    if (content.toLowerCase().includes('## validation') || content.toLowerCase().includes('validation')) score += 5;
  }

  return Math.min(score, MAX_RAW_SCORE);
}

function getNumberedFolders(workspacePath: string): string[] {
  if (!fs.existsSync(workspacePath)) return [];
  const entries = fs.readdirSync(workspacePath, { withFileTypes: true });
  return entries
    .filter((e) => e.isDirectory() && /^\d{2}-/.test(e.name) && e.name !== '00-meta')
    .map((e) => e.name);
}

function padRight(str: string, length: number): string {
  return str.padEnd(length);
}

if (require.main === module) {
  const args = process.argv.slice(2);
  const workspace = args.find((_, i) => i > 0 && args[i - 1] === '--workspace') || args[0];

  if (!workspace) {
    console.error('Usage: node benchmark.ts --workspace <path>');
    process.exit(1);
  }

  const result = calculateBenchmark(workspace);
  console.log(formatBenchmarkTable(result));
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test -- tests/benchmark.test.ts`
Expected: All 6 tests pass

- [ ] **Step 5: Commit**

```bash
git add src/scripts/benchmark.ts tests/benchmark.test.ts
git commit -m "feat: add weighted benchmark scoring engine"
```

---

### Task 2: Add `saveBenchmarkReport` Function

**Files:**
- Modify: `src/scripts/benchmark.ts`
- Test: `tests/benchmark.test.ts`

- [ ] **Step 1: Write tests for saveBenchmarkReport**

```typescript
// Add to tests/benchmark.test.ts
import { saveBenchmarkReport } from './benchmark';

describe('saveBenchmarkReport', () => {
  it('saves benchmark report to .workspace-benchmarks directory', () => {
    const data: BenchmarkResult = {
      workspace: 'test-ws',
      agent: 'opencode',
      timestamp: '2026-04-07T00:00:00Z',
      rawScore: 72,
      weightedScore: 78,
      stages: [],
      fixSuggestions: [],
      improvementPotential: false,
    };

    saveBenchmarkReport('/test-workspace', data);

    expect(mockFs.mkdirSync).toHaveBeenCalledWith(
      expect.stringContaining('.workspace-benchmarks'),
      { recursive: true }
    );
    expect(mockFs.writeFileSync).toHaveBeenCalledWith(
      expect.stringContaining('test-ws-'),
      expect.stringContaining('"weightedScore":78'),
      'utf-8'
    );
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- tests/benchmark.test.ts -t "saveBenchmarkReport"`
Expected: FAIL with "saveBenchmarkReport is not defined"

- [ ] **Step 3: Implement saveBenchmarkReport**

Add to `src/scripts/benchmark.ts`:

```typescript
export function saveBenchmarkReport(workspacePath: string, data: BenchmarkResult): string {
  const reportDir = path.join(workspacePath, '.workspace-benchmarks');
  fs.mkdirSync(reportDir, { recursive: true });

  const filename = `${data.workspace}-${data.timestamp.replace(/[:.]/g, '-')}.json`;
  const filePath = path.join(reportDir, filename);

  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
  return filePath;
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test -- tests/benchmark.test.ts`
Expected: All 7 tests pass

- [ ] **Step 5: Commit**

```bash
git add src/scripts/benchmark.ts tests/benchmark.test.ts
git commit -m "feat: add saveBenchmarkReport function"
```

---

### Task 3: Enhance `src/install.ts` with Multi-Agent Targeting

**Files:**
- Modify: `src/install.ts`
- Test: `tests/install.test.ts`

- [ ] **Step 1: Write tests for agent-targeted installation**

```typescript
// Add to tests/install.test.ts
import { getAgentTargetPath } from '../install';

describe('getAgentTargetPath', () => {
  it('returns default path for no agent', () => {
    const result = getAgentTargetPath('/project-root', undefined);
    expect(result).toBe('/project-root/.agents/skills/workspace-maxxing');
  });

  it('returns opencode path for --opencode flag', () => {
    const result = getAgentTargetPath('/project-root', 'opencode');
    expect(result).toBe('/project-root/.agents/skills/workspace-maxxing');
  });

  it('returns claude path for --claude flag', () => {
    const result = getAgentTargetPath('/project-root', 'claude');
    expect(result).toBe('/project-root/.claude/skills');
  });

  it('returns copilot path for --copilot flag', () => {
    const result = getAgentTargetPath('/project-root', 'copilot');
    expect(result).toBe('/project-root/.github/copilot-instructions');
  });

  it('returns gemini path for --gemini flag', () => {
    const result = getAgentTargetPath('/project-root', 'gemini');
    expect(result).toBe('/project-root/.gemini/skills');
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test -- tests/install.test.ts -t "getAgentTargetPath"`
Expected: FAIL with "getAgentTargetPath is not defined"

- [ ] **Step 3: Implement agent targeting in install.ts**

Add to `src/install.ts`:

```typescript
export type AgentTarget = 'opencode' | 'claude' | 'copilot' | 'gemini' | undefined;

const AGENT_PATHS: Record<string, string> = {
  opencode: '.agents/skills/workspace-maxxing',
  claude: '.claude/skills',
  copilot: '.github/copilot-instructions',
  gemini: '.gemini/skills',
};

export function getAgentTargetPath(projectRoot: string, agent: AgentTarget): string {
  const relativePath = AGENT_PATHS[agent ?? 'opencode'];
  return path.join(projectRoot, relativePath);
}
```

Modify `installSkill` to accept agent parameter:

```typescript
export async function installSkill(
  projectRoot: string,
  templatesDir: string,
  agent: AgentTarget = undefined,
): Promise<InstallResult> {
  const skillDir = getAgentTargetPath(projectRoot, agent);
  // ... rest of existing implementation unchanged
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test -- tests/install.test.ts`
Expected: All existing tests + 5 new tests pass

- [ ] **Step 5: Commit**

```bash
git add src/install.ts tests/install.test.ts
git commit -m "feat: add multi-agent installation targeting"
```

---

### Task 4: Update `src/index.ts` with New CLI Flags

**Files:**
- Modify: `src/index.ts`
- Test: `tests/cli.test.ts`

- [ ] **Step 1: Write tests for new CLI flags**

```typescript
// Add to tests/cli.test.ts
describe('CLI flags', () => {
  it('accepts --claude flag', () => {
    const { stdout } = execSync('node dist/index.js --claude', {
      env: { ...process.env, WORKSPACE_MAXXING_TEMPLATES: templatesDir },
    });
    expect(stdout).toContain('Skill installed to');
    expect(stdout).toContain('.claude/skills');
  });

  it('accepts --copilot flag', () => {
    const { stdout } = execSync('node dist/index.js --copilot', {
      env: { ...process.env, WORKSPACE_MAXXING_TEMPLATES: templatesDir },
    });
    expect(stdout).toContain('.github/copilot-instructions');
  });

  it('accepts --gemini flag', () => {
    const { stdout } = execSync('node dist/index.js --gemini', {
      env: { ...process.env, WORKSPACE_MAXXING_TEMPLATES: templatesDir },
    });
    expect(stdout).toContain('.gemini/skills');
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test -- tests/cli.test.ts -t "CLI flags"`
Expected: FAIL (flags not recognized yet)

- [ ] **Step 3: Update CLI flag handling**

Modify `src/index.ts`:

```typescript
import { detectProjectRoot, installSkill, AgentTarget } from './install';

function showHelp(): void {
  console.log(`
workspace-maxxing — npx-installable skill for AI agents

Usage:
  npx workspace-maxxing [options]

Options:
  --opencode    Install skill for OpenCode agents (default)
  --claude      Install skill for Claude Code agents
  --copilot     Install skill for GitHub Copilot agents
  --gemini      Install skill for Gemini CLI agents
  --help        Show this help message

Examples:
  npx workspace-maxxing --opencode
  npx workspace-maxxing --claude
  npx workspace-maxxing --copilot
  npx workspace-maxxing --gemini
`);
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);

  if (args.length === 0 || args.includes('--help')) {
    showHelp();
    process.exit(0);
  }

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
```

- [ ] **Step 4: Build and run tests**

Run: `npm run build && npm test -- tests/cli.test.ts`
Expected: All CLI tests pass

- [ ] **Step 5: Commit**

```bash
git add src/index.ts tests/cli.test.ts
git commit -m "feat: add --claude, --copilot, --gemini CLI flags"
```

---

### Task 5: Extend `src/scripts/iterate.ts` with Benchmark Data

**Files:**
- Modify: `src/scripts/iterate.ts`
- Test: `tests/iterate.test.ts`

- [ ] **Step 1: Write tests for benchmark integration**

```typescript
// Add to tests/iterate.test.ts
import { iterateWorkspace } from '../iterate';
import * as benchmark from '../benchmark';

jest.mock('../benchmark');

describe('iterateWorkspace with benchmark', () => {
  it('includes benchmark data in result', () => {
    (benchmark.calculateBenchmark as jest.Mock).mockReturnValue({
      workspace: 'test-ws',
      agent: 'opencode',
      timestamp: '2026-04-07T00:00:00Z',
      rawScore: 72,
      weightedScore: 78,
      stages: [{ name: '01-ideation', raw: 85, weight: 1.5, weighted: 95 }],
      fixSuggestions: ['Add research sources'],
      improvementPotential: true,
    });

    const result = iterateWorkspace('/test-workspace');

    expect(result.benchmark).toBeDefined();
    expect(result.benchmark?.weightedScore).toBe(78);
    expect(result.benchmark?.improvementPotential).toBe(true);
  });

  it('passes agent flag to benchmark result', () => {
    (benchmark.calculateBenchmark as jest.Mock).mockReturnValue({
      workspace: 'test-ws',
      agent: 'claude',
      timestamp: '2026-04-07T00:00:00Z',
      rawScore: 72,
      weightedScore: 78,
      stages: [],
      fixSuggestions: [],
      improvementPotential: false,
    });

    const result = iterateWorkspace('/test-workspace', { agent: 'claude' });

    expect(result.benchmark?.agent).toBe('claude');
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test -- tests/iterate.test.ts -t "benchmark"`
Expected: FAIL (benchmark integration not implemented)

- [ ] **Step 3: Update IterateResult interface and iterateWorkspace function**

Modify `src/scripts/iterate.ts`:

```typescript
import { calculateBenchmark, BenchmarkResult } from './benchmark';

export interface IterateOptions {
  maxRetries?: number;
  agent?: string;
}

export interface IterateResult {
  passes: {
    validate: ValidatePassResult;
    score: ScorePassResult;
    checklist: ChecklistResult;
  };
  benchmark?: BenchmarkResult;
  escalate: boolean;
}
```

Update `iterateWorkspace` function:

```typescript
export function iterateWorkspace(
  workspacePath: string,
  options: IterateOptions = {},
): IterateResult {
  const { maxRetries = 3, agent = 'unknown' } = options;
  const ws = path.resolve(workspacePath);

  const validateResult = runValidatePass(ws, maxRetries);
  const scoreResult = runScorePass(ws);
  const checklistResult = runChecklist(ws);
  const benchmarkResult = calculateBenchmark(ws);
  benchmarkResult.agent = agent;

  const result: IterateResult = {
    passes: {
      validate: validateResult,
      score: scoreResult,
      checklist: checklistResult,
    },
    benchmark: benchmarkResult,
    escalate: validateResult.status === 'escalated',
  };

  console.log(JSON.stringify(result, null, 2));

  return result;
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test -- tests/iterate.test.ts`
Expected: All iterate tests pass

- [ ] **Step 5: Commit**

```bash
git add src/scripts/iterate.ts tests/iterate.test.ts
git commit -m "feat: integrate benchmark data into iterate results"
```

---

### Task 6: Copy benchmark.ts to Templates

**Files:**
- Modify: `templates/.workspace-templates/scripts/` (copy benchmark.ts here)
- Modify: `src/install.ts` (ensure benchmark.ts is copied during install)

- [ ] **Step 1: Copy benchmark.ts to templates**

```bash
cp src/scripts/benchmark.ts templates/.workspace-templates/scripts/
```

- [ ] **Step 2: Verify installer copies benchmark.ts**

The installer already copies everything from `templates/.workspace-templates/scripts/` to the skill directory. Verify by checking `src/install.ts` line 79-83 — it copies the entire scripts directory recursively, so benchmark.ts will be included automatically.

- [ ] **Step 3: Run full test suite**

Run: `npm test`
Expected: All tests pass (baseline 75 + new tests)

- [ ] **Step 4: Commit**

```bash
git add templates/.workspace-templates/scripts/benchmark.ts
git commit -m "feat: include benchmark script in templates"
```

---

### Task 7: Update Templates SKILL.md

**Files:**
- Modify: `templates/SKILL.md`

- [ ] **Step 1: Add benchmark section to SKILL.md**

Add to `templates/SKILL.md` after the "Autonomous Iteration" section:

```markdown
## Benchmarking

Run benchmarks to assess workspace quality with weighted scoring:

\`\`\`bash
node .agents/skills/workspace-maxxing/scripts/benchmark.ts --workspace <workspace-path>
\`\`\`

**Weights:**
- `01-ideation`: 1.5x (core thinking quality)
- `02-research`: 1.3x (evidence gathering)
- `03-architecture`: 1.2x (structural decisions)
- All other stages: 1.0x

**Output:**
- Console: Formatted table with stage scores and suggestions
- JSON: Saved to `.workspace-benchmarks/<workspace>-<timestamp>.json`

**Integration with Iteration:**
The `iterate.ts` script now includes benchmark data in its return value. Use the `improvementPotential` field to decide whether to continue iterating.
```

- [ ] **Step 2: Update Available Scripts section**

Add benchmark.ts to the "Available Scripts" table in SKILL.md:

```markdown
| `benchmark.ts` | Run weighted benchmark scoring on a workspace |
```

- [ ] **Step 3: Run template tests**

Run: `npm test -- tests/templates.test.ts`
Expected: All template tests pass

- [ ] **Step 4: Commit**

```bash
git add templates/SKILL.md
git commit -m "docs: add benchmarking section to SKILL.md"
```

---

### Task 8: Full Test Suite & Final Commit

- [ ] **Step 1: Run full test suite**

Run: `npm test`
Expected: All tests pass (baseline 75 + all new tests from Tasks 1-7)

- [ ] **Step 2: Run build**

Run: `npm run build`
Expected: Build succeeds

- [ ] **Step 3: Run integration test**

Run: `npm test -- tests/integration.test.ts`
Expected: Integration tests pass

- [ ] **Step 4: Final commit**

```bash
git add .
git commit -m "feat(sub-project-4): complete benchmarking & multi-agent support"
```
