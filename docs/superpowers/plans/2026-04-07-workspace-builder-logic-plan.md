# Workspace Builder Logic Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement three helper scripts (scaffold, validate, install-tool) that programmatically generate, validate, and equip ICM-compliant workspaces, plus update the installer and SKILL.md to integrate them.

**Architecture:** Three zero-dependency TypeScript scripts in `src/scripts/` that export both CLI entry points and testable functions. Scripts are compiled to `dist/scripts/` and copied to `templates/.workspace-templates/scripts/` during install. The installer (`src/install.ts`) is modified to include the scripts directory in its copy list.

**Tech Stack:** TypeScript, Node.js builtins only (`fs`, `path`, `process`, `child_process`), Jest for testing

---

## File Structure

**New files:**
- `src/scripts/scaffold.ts` — Generates ICM workspace from JSON plan
- `src/scripts/validate.ts` — Checks workspace for ICM compliance
- `src/scripts/install-tool.ts` — Installs packages and updates tool inventory
- `templates/.workspace-templates/scripts/scaffold.ts` — Copy for distribution
- `templates/.workspace-templates/scripts/validate.ts` — Copy for distribution
- `templates/.workspace-templates/scripts/install-tool.ts` — Copy for distribution
- `tests/scaffold.test.ts` — Tests for scaffold
- `tests/validate.test.ts` — Tests for validate
- `tests/install-tool.test.ts` — Tests for install-tool

**Modified files:**
- `src/install.ts` — Add scripts directory to copy list
- `templates/SKILL.md` — Add "## Available Scripts" section
- `package.json` — Add `scripts:build` command to compile scripts

---

### Task 1: Scaffold Script — Tests

**Files:**
- Test: `tests/scaffold.test.ts`

- [ ] **Step 1: Write scaffold tests**

```typescript
// tests/scaffold.test.ts
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { scaffoldWorkspace, ScaffoldOptions } from '../src/scripts/scaffold';

describe('scaffold', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'scaffold-test-'));
  });

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  describe('scaffoldWorkspace', () => {
    it('creates output directory', () => {
      const outputDir = path.join(tempDir, 'workspace');
      const options: ScaffoldOptions = {
        name: 'research',
        stages: ['01-research', '02-analysis', '03-report'],
        output: outputDir,
      };

      scaffoldWorkspace(options);

      expect(fs.existsSync(outputDir)).toBe(true);
    });

    it('creates SYSTEM.md with folder map', () => {
      const outputDir = path.join(tempDir, 'workspace');
      const options: ScaffoldOptions = {
        name: 'research',
        stages: ['01-research', '02-analysis', '03-report'],
        output: outputDir,
      };

      scaffoldWorkspace(options);

      const systemMd = fs.readFileSync(path.join(outputDir, 'SYSTEM.md'), 'utf-8');
      expect(systemMd).toContain('## Folder Map');
      expect(systemMd).toContain('01-research');
      expect(systemMd).toContain('02-analysis');
      expect(systemMd).toContain('03-report');
    });

    it('creates CONTEXT.md at root level', () => {
      const outputDir = path.join(tempDir, 'workspace');
      const options: ScaffoldOptions = {
        name: 'research',
        stages: ['01-research', '02-analysis', '03-report'],
        output: outputDir,
      };

      scaffoldWorkspace(options);

      const contextMd = fs.readFileSync(path.join(outputDir, 'CONTEXT.md'), 'utf-8');
      expect(contextMd).toContain('## Routing Table');
      expect(contextMd).toContain('01-research');
      expect(contextMd).toContain('02-analysis');
      expect(contextMd).toContain('03-report');
    });

    it('creates numbered stage folders with CONTEXT.md', () => {
      const outputDir = path.join(tempDir, 'workspace');
      const options: ScaffoldOptions = {
        name: 'research',
        stages: ['01-research', '02-analysis', '03-report'],
        output: outputDir,
      };

      scaffoldWorkspace(options);

      for (const stage of options.stages) {
        const stageDir = path.join(outputDir, stage);
        expect(fs.existsSync(stageDir)).toBe(true);
        const contextMd = fs.readFileSync(path.join(stageDir, 'CONTEXT.md'), 'utf-8');
        expect(contextMd.trim().length).toBeGreaterThan(0);
        expect(contextMd).toContain(stage);
      }
    });

    it('creates 00-meta folder with tools.md', () => {
      const outputDir = path.join(tempDir, 'workspace');
      const options: ScaffoldOptions = {
        name: 'research',
        stages: ['01-research'],
        output: outputDir,
      };

      scaffoldWorkspace(options);

      const toolsMd = path.join(outputDir, '00-meta', 'tools.md');
      expect(fs.existsSync(toolsMd)).toBe(true);
      const content = fs.readFileSync(toolsMd, 'utf-8');
      expect(content).toContain('## Tool Inventory');
    });

    it('creates README.md', () => {
      const outputDir = path.join(tempDir, 'workspace');
      const options: ScaffoldOptions = {
        name: 'research',
        stages: ['01-research'],
        output: outputDir,
      };

      scaffoldWorkspace(options);

      const readme = fs.readFileSync(path.join(outputDir, 'README.md'), 'utf-8');
      expect(readme.trim().length).toBeGreaterThan(0);
    });

    it('throws if output directory already exists', () => {
      const outputDir = path.join(tempDir, 'workspace');
      fs.mkdirSync(outputDir, { recursive: true });

      const options: ScaffoldOptions = {
        name: 'research',
        stages: ['01-research'],
        output: outputDir,
      };

      expect(() => scaffoldWorkspace(options)).toThrow('already exists');
    });

    it('overwrites if force is true', () => {
      const outputDir = path.join(tempDir, 'workspace');
      fs.mkdirSync(outputDir, { recursive: true });
      fs.writeFileSync(path.join(outputDir, 'existing.txt'), 'data');

      const options: ScaffoldOptions = {
        name: 'research',
        stages: ['01-research'],
        output: outputDir,
        force: true,
      };

      scaffoldWorkspace(options);

      const systemMd = path.join(outputDir, 'SYSTEM.md');
      expect(fs.existsSync(systemMd)).toBe(true);
    });

    it('throws if stages list is empty', () => {
      const outputDir = path.join(tempDir, 'workspace');
      const options: ScaffoldOptions = {
        name: 'research',
        stages: [],
        output: outputDir,
      };

      expect(() => scaffoldWorkspace(options)).toThrow('stages');
    });
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npm test -- tests/scaffold.test.ts
```

Expected: FAIL — module not found or function not defined

---

### Task 2: Scaffold Script — Implementation

**Files:**
- Create: `src/scripts/scaffold.ts`

- [ ] **Step 1: Implement scaffold script**

```typescript
// src/scripts/scaffold.ts
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

  // Validate inputs
  if (!stages || stages.length === 0) {
    throw new Error('Stages list cannot be empty');
  }

  const outputDir = path.resolve(output);

  // Check if output directory exists
  if (fs.existsSync(outputDir)) {
    if (!force) {
      throw new Error(`Output directory already exists: ${outputDir} (use --force to overwrite)`);
    }
    fs.rmSync(outputDir, { recursive: true, force: true });
  }

  // Create directory structure
  fs.mkdirSync(outputDir, { recursive: true });

  // Create SYSTEM.md
  const systemMd = generateSystemMd(name, stages);
  fs.writeFileSync(path.join(outputDir, 'SYSTEM.md'), systemMd);

  // Create CONTEXT.md
  const contextMd = generateContextMd(name, stages);
  fs.writeFileSync(path.join(outputDir, 'CONTEXT.md'), contextMd);

  // Create 00-meta folder with tools.md
  const metaDir = path.join(outputDir, '00-meta');
  fs.mkdirSync(metaDir, { recursive: true });
  fs.writeFileSync(path.join(metaDir, 'tools.md'), generateToolsMd());
  fs.writeFileSync(path.join(metaDir, 'CONTEXT.md'), `# 00-meta Context\n\nMetadata and tool inventory for the ${name} workspace.\n`);

  // Create stage folders
  for (const stage of stages) {
    const stageDir = path.join(outputDir, stage);
    fs.mkdirSync(stageDir, { recursive: true });
    fs.writeFileSync(
      path.join(stageDir, 'CONTEXT.md'),
      generateStageContextMd(name, stage),
    );
  }

  // Create README.md
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
  return `# Tool Inventory

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

// CLI entry point
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
```

- [ ] **Step 2: Run tests to verify they pass**

```bash
npm test -- tests/scaffold.test.ts
```

Expected: All 9 tests PASS

- [ ] **Step 3: Commit**

```bash
git add src/scripts/scaffold.ts tests/scaffold.test.ts
git commit -m "feat: add scaffold script with tests"
```

---

### Task 3: Validate Script — Tests

**Files:**
- Test: `tests/validate.test.ts`

- [ ] **Step 1: Write validate tests**

```typescript
// tests/validate.test.ts
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { validateWorkspace, ValidationResult } from '../src/scripts/validate';

describe('validate', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'validate-test-'));
  });

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  function createValidWorkspace(): string {
    const ws = path.join(tempDir, 'workspace');
    fs.mkdirSync(ws, { recursive: true });

    fs.writeFileSync(path.join(ws, 'SYSTEM.md'), '# Test\n\n## Folder Map\n\n- `01-input/`\n- `02-output/`\n');
    fs.writeFileSync(path.join(ws, 'CONTEXT.md'), '# Router\n\n## Routing Table\n\n- `01-input/`\n');
    fs.mkdirSync(path.join(ws, '01-input'), { recursive: true });
    fs.writeFileSync(path.join(ws, '01-input', 'CONTEXT.md'), '# 01-input\n\nContent here.\n');
    fs.mkdirSync(path.join(ws, '02-output'), { recursive: true });
    fs.writeFileSync(path.join(ws, '02-output', 'CONTEXT.md'), '# 02-output\n\nContent here.\n');
    fs.mkdirSync(path.join(ws, '00-meta'), { recursive: true });
    fs.writeFileSync(path.join(ws, '00-meta', 'tools.md'), '# Tools\n\n| Tool | Version |\n|------|---------|\n');

    return ws;
  }

  describe('validateWorkspace', () => {
    it('passes for a valid workspace', () => {
      const ws = createValidWorkspace();
      const result = validateWorkspace(ws);

      expect(result.passed).toBe(true);
      expect(result.checks.every((c) => c.passed)).toBe(true);
    });

    it('fails if SYSTEM.md is missing', () => {
      const ws = createValidWorkspace();
      fs.unlinkSync(path.join(ws, 'SYSTEM.md'));

      const result = validateWorkspace(ws);

      expect(result.passed).toBe(false);
      const systemCheck = result.checks.find((c) => c.name === 'SYSTEM.md exists');
      expect(systemCheck?.passed).toBe(false);
    });

    it('fails if SYSTEM.md has no folder map', () => {
      const ws = createValidWorkspace();
      fs.writeFileSync(path.join(ws, 'SYSTEM.md'), '# Test\n\nNo folder map here.\n');

      const result = validateWorkspace(ws);

      expect(result.passed).toBe(false);
      const check = result.checks.find((c) => c.name.includes('folder map'));
      expect(check?.passed).toBe(false);
    });

    it('fails if CONTEXT.md is missing at root', () => {
      const ws = createValidWorkspace();
      fs.unlinkSync(path.join(ws, 'CONTEXT.md'));

      const result = validateWorkspace(ws);

      expect(result.passed).toBe(false);
      const check = result.checks.find((c) => c.name.includes('CONTEXT.md exists'));
      expect(check?.passed).toBe(false);
    });

    it('fails if a numbered folder is missing CONTEXT.md', () => {
      const ws = createValidWorkspace();
      fs.unlinkSync(path.join(ws, '01-input', 'CONTEXT.md'));

      const result = validateWorkspace(ws);

      expect(result.passed).toBe(false);
      const check = result.checks.find((c) => c.name.includes('CONTEXT.md'));
      expect(check?.passed).toBe(false);
    });

    it('fails if a CONTEXT.md is empty', () => {
      const ws = createValidWorkspace();
      fs.writeFileSync(path.join(ws, '01-input', 'CONTEXT.md'), '');

      const result = validateWorkspace(ws);

      expect(result.passed).toBe(false);
      const check = result.checks.find((c) => c.name.includes('empty'));
      expect(check?.passed).toBe(false);
    });

    it('fails if duplicate content exists across files', () => {
      const ws = createValidWorkspace();
      const duplicateText = 'This is a long duplicate text block that appears in multiple files and should be flagged as a potential duplicate content issue for testing purposes.';
      fs.appendFileSync(path.join(ws, '01-input', 'CONTEXT.md'), duplicateText);
      fs.appendFileSync(path.join(ws, '02-output', 'CONTEXT.md'), duplicateText);

      const result = validateWorkspace(ws);

      expect(result.passed).toBe(false);
      const check = result.checks.find((c) => c.name.includes('duplicate'));
      expect(check?.passed).toBe(false);
    });

    it('returns structured output with all check names', () => {
      const ws = createValidWorkspace();
      const result = validateWorkspace(ws);

      const checkNames = result.checks.map((c) => c.name);
      expect(checkNames).toContain('SYSTEM.md exists');
      expect(checkNames).toContain('CONTEXT.md exists at root');
    });
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npm test -- tests/validate.test.ts
```

Expected: FAIL — module not found

---

### Task 4: Validate Script — Implementation

**Files:**
- Create: `src/scripts/validate.ts`

- [ ] **Step 1: Implement validate script**

```typescript
// src/scripts/validate.ts
import * as fs from 'fs';
import * as path from 'path';

export interface CheckResult {
  name: string;
  passed: boolean;
  message: string;
}

export interface ValidationResult {
  passed: boolean;
  checks: CheckResult[];
}

export function validateWorkspace(workspacePath: string): ValidationResult {
  const ws = path.resolve(workspacePath);
  const checks: CheckResult[] = [];

  // Check 1: SYSTEM.md exists
  const systemMdPath = path.join(ws, 'SYSTEM.md');
  const systemExists = fs.existsSync(systemMdPath);
  checks.push({
    name: 'SYSTEM.md exists',
    passed: systemExists,
    message: systemExists ? 'Found' : 'Missing',
  });

  // Check 2: SYSTEM.md contains folder map
  if (systemExists) {
    const systemContent = fs.readFileSync(systemMdPath, 'utf-8');
    const hasFolderMap = systemContent.toLowerCase().includes('folder map');
    checks.push({
      name: 'SYSTEM.md contains folder map',
      passed: hasFolderMap,
      message: hasFolderMap ? 'Found' : 'Missing "folder map" reference',
    });
  } else {
    checks.push({
      name: 'SYSTEM.md contains folder map',
      passed: false,
      message: 'Cannot check — SYSTEM.md missing',
    });
  }

  // Check 3: CONTEXT.md exists at root
  const contextMdPath = path.join(ws, 'CONTEXT.md');
  const contextExists = fs.existsSync(contextMdPath);
  checks.push({
    name: 'CONTEXT.md exists at root',
    passed: contextExists,
    message: contextExists ? 'Found' : 'Missing',
  });

  // Check 4: Every numbered folder has CONTEXT.md
  const entries = fs.readdirSync(ws, { withFileTypes: true });
  const numberedFolders = entries
    .filter((e) => e.isDirectory() && /^\d/.test(e.name))
    .map((e) => e.name);

  for (const folder of numberedFolders) {
    const contextPath = path.join(ws, folder, 'CONTEXT.md');
    const exists = fs.existsSync(contextPath);
    checks.push({
      name: `${folder}/CONTEXT.md exists`,
      passed: exists,
      message: exists ? 'Found' : 'Missing',
    });

    // Check 5: No empty CONTEXT.md files
    if (exists) {
      const content = fs.readFileSync(contextPath, 'utf-8');
      const notEmpty = content.trim().length > 0;
      checks.push({
        name: `${folder}/CONTEXT.md is not empty`,
        passed: notEmpty,
        message: notEmpty ? `${content.trim().length} chars` : 'File is empty',
      });
    }
  }

  // Check 6: No duplicate content across files
  const allFiles = getAllMarkdownFiles(ws);
  const duplicateCheck = checkDuplicateContent(allFiles);
  checks.push(duplicateCheck);

  const passed = checks.every((c) => c.passed);

  // Print results
  console.log(`\nValidation: ${ws}`);
  console.log('='.repeat(50));
  for (const check of checks) {
    const icon = check.passed ? '✓' : '✗';
    console.log(`  ${icon} ${check.name}: ${check.message}`);
  }
  console.log('='.repeat(50));
  console.log(passed ? '✓ All checks passed' : '✗ Some checks failed');

  return { passed, checks };
}

function getAllMarkdownFiles(dir: string): string[] {
  const results: string[] = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...getAllMarkdownFiles(fullPath));
    } else if (entry.name.endsWith('.md')) {
      results.push(fullPath);
    }
  }

  return results;
}

function checkDuplicateContent(files: string[]): CheckResult {
  const MIN_DUPLICATE_LENGTH = 50;
  const duplicates: string[] = [];

  for (let i = 0; i < files.length; i++) {
    for (let j = i + 1; j < files.length; j++) {
      const contentA = fs.readFileSync(files[i], 'utf-8');
      const contentB = fs.readFileSync(files[j], 'utf-8');

      // Check for identical text blocks > 50 characters
      const linesA = contentA.split('\n');
      const linesB = contentB.split('\n');

      for (const lineA of linesA) {
        const trimmed = lineA.trim();
        if (trimmed.length > MIN_DUPLICATE_LENGTH) {
          for (const lineB of linesB) {
            if (lineB.trim() === trimmed) {
              duplicates.push(trimmed.substring(0, 60) + '...');
              break;
            }
          }
        }
      }
    }
  }

  if (duplicates.length > 0) {
    return {
      name: 'No duplicate content across files',
      passed: false,
      message: `Found ${duplicates.length} duplicate text block(s)`,
    };
  }

  return {
    name: 'No duplicate content across files',
    passed: true,
    message: 'No duplicates found',
  };
}

// CLI entry point
if (require.main === module) {
  const args = process.argv.slice(2);
  const workspaceIdx = args.indexOf('--workspace');
  const workspace = workspaceIdx !== -1 ? args[workspaceIdx + 1] : undefined;

  if (!workspace) {
    console.error('Usage: node validate.ts --workspace <path>');
    process.exit(1);
  }

  const result = validateWorkspace(workspace);
  process.exit(result.passed ? 0 : 1);
}
```

- [ ] **Step 2: Run tests to verify they pass**

```bash
npm test -- tests/validate.test.ts
```

Expected: All 8 tests PASS

- [ ] **Step 3: Commit**

```bash
git add src/scripts/validate.ts tests/validate.test.ts
git commit -m "feat: add validate script with tests"
```

---

### Task 5: Install-Tool Script — Tests

**Files:**
- Test: `tests/install-tool.test.ts`

- [ ] **Step 1: Write install-tool tests**

```typescript
// tests/install-tool.test.ts
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { installTool, InstallToolOptions } from '../src/scripts/install-tool';

jest.mock('child_process', () => ({
  execSync: jest.fn(),
}));

const { execSync } = require('child_process');

describe('install-tool', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'install-tool-test-'));
    // Create minimal workspace
    const metaDir = path.join(tempDir, '00-meta');
    fs.mkdirSync(metaDir, { recursive: true });
    fs.writeFileSync(
      path.join(metaDir, 'tools.md'),
      '# Tool Inventory\n\n## Installed Tools\n\n| Tool | Version | Manager | Installed |\n|------|---------|---------|-----------|\n| — | — | — | — |\n',
    );
  });

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
    jest.clearAllMocks();
  });

  describe('installTool', () => {
    it('runs correct npm install command', () => {
      (execSync as jest.Mock).mockReturnValue('');

      const options: InstallToolOptions = {
        tool: 'pdf-lib',
        manager: 'npm',
        workspace: tempDir,
      };

      installTool(options);

      expect(execSync).toHaveBeenCalledWith(
        'npm install pdf-lib',
        expect.objectContaining({ cwd: tempDir, stdio: 'inherit' }),
      );
    });

    it('runs correct pip install command', () => {
      (execSync as jest.Mock).mockReturnValue('');

      const options: InstallToolOptions = {
        tool: 'requests',
        manager: 'pip',
        workspace: tempDir,
      };

      installTool(options);

      expect(execSync).toHaveBeenCalledWith(
        'pip install requests',
        expect.objectContaining({ cwd: tempDir, stdio: 'inherit' }),
      );
    });

    it('runs correct npx install command', () => {
      (execSync as jest.Mock).mockReturnValue('');

      const options: InstallToolOptions = {
        tool: 'create-next-app',
        manager: 'npx',
        workspace: tempDir,
      };

      installTool(options);

      expect(execSync).toHaveBeenCalledWith(
        'npx create-next-app',
        expect.objectContaining({ cwd: tempDir, stdio: 'inherit' }),
      );
    });

    it('runs correct brew install command', () => {
      (execSync as jest.Mock).mockReturnValue('');

      const options: InstallToolOptions = {
        tool: 'ffmpeg',
        manager: 'brew',
        workspace: tempDir,
      };

      installTool(options);

      expect(execSync).toHaveBeenCalledWith(
        'brew install ffmpeg',
        expect.objectContaining({ cwd: tempDir, stdio: 'inherit' }),
      );
    });

    it('updates tools.md with installed tool', () => {
      (execSync as jest.Mock).mockReturnValue('');

      const options: InstallToolOptions = {
        tool: 'pdf-lib',
        manager: 'npm',
        workspace: tempDir,
      };

      installTool(options);

      const toolsMd = fs.readFileSync(path.join(tempDir, '00-meta', 'tools.md'), 'utf-8');
      expect(toolsMd).toContain('pdf-lib');
      expect(toolsMd).toContain('npm');
    });

    it('throws if install command fails', () => {
      (execSync as jest.Mock).mockImplementation(() => {
        const err = new Error('Command failed');
        (err as any).status = 1;
        throw err;
      });

      const options: InstallToolOptions = {
        tool: 'nonexistent-package',
        manager: 'npm',
        workspace: tempDir,
      };

      expect(() => installTool(options)).toThrow('Command failed');
    });

    it('throws for unsupported manager', () => {
      const options: InstallToolOptions = {
        tool: 'something',
        manager: 'unknown' as any,
        workspace: tempDir,
      };

      expect(() => installTool(options)).toThrow('Unsupported package manager');
    });
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npm test -- tests/install-tool.test.ts
```

Expected: FAIL — module not found

---

### Task 6: Install-Tool Script — Implementation

**Files:**
- Create: `src/scripts/install-tool.ts`

- [ ] **Step 1: Implement install-tool script**

```typescript
// src/scripts/install-tool.ts
import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

export type PackageManager = 'npm' | 'pip' | 'npx' | 'brew';

export interface InstallToolOptions {
  tool: string;
  manager: PackageManager;
  workspace: string;
}

export function installTool(options: InstallToolOptions): void {
  const { tool, manager, workspace } = options;
  const ws = path.resolve(workspace);

  // Validate package manager
  const validManagers: PackageManager[] = ['npm', 'pip', 'npx', 'brew'];
  if (!validManagers.includes(manager)) {
    throw new Error(`Unsupported package manager: ${manager}. Supported: ${validManagers.join(', ')}`);
  }

  // Build install command
  const command = `${manager} install ${tool}`;

  console.log(`Installing ${tool} via ${manager}...`);
  try {
    execSync(command, { cwd: ws, stdio: 'inherit' });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to install ${tool}: ${message}`);
  }

  // Update tools.md
  updateToolsMd(ws, tool, manager);

  console.log(`✓ ${tool} installed and added to tool inventory`);
}

function updateToolsMd(workspace: string, tool: string, manager: string): void {
  const toolsMdPath = path.join(workspace, '00-meta', 'tools.md');

  if (!fs.existsSync(toolsMdPath)) {
    throw new Error(`tools.md not found at: ${toolsMdPath}`);
  }

  const content = fs.readFileSync(toolsMdPath, 'utf-8');
  const now = new Date().toISOString().split('T')[0];

  // Replace the placeholder row or add new row
  const placeholderRow = '| — | — | — | — |';
  const newRow = `| ${tool} | latest | ${manager} | ${now} |`;

  let updated: string;
  if (content.includes(placeholderRow)) {
    updated = content.replace(placeholderRow, `${placeholderRow}\n${newRow}`);
  } else {
    // Insert before the "## Pending Tools" section or at end
    const pendingIdx = content.indexOf('## Pending Tools');
    if (pendingIdx !== -1) {
      updated = content.slice(0, pendingIdx) + newRow + '\n\n' + content.slice(pendingIdx);
    } else {
      updated = content + '\n' + newRow + '\n';
    }
  }

  fs.writeFileSync(toolsMdPath, updated);
}

// CLI entry point
if (require.main === module) {
  const args = process.argv.slice(2);
  const parseArg = (flag: string): string | undefined => {
    const idx = args.indexOf(flag);
    return idx !== -1 ? args[idx + 1] : undefined;
  };

  const tool = parseArg('--tool');
  const manager = parseArg('--manager') as PackageManager;
  const workspace = parseArg('--workspace');

  if (!tool || !manager || !workspace) {
    console.error('Usage: node install-tool.ts --tool <name> --manager <npm|pip|npx|brew> --workspace <path>');
    process.exit(1);
  }

  installTool({ tool, manager, workspace });
}
```

- [ ] **Step 2: Run tests to verify they pass**

```bash
npm test -- tests/install-tool.test.ts
```

Expected: All 7 tests PASS

- [ ] **Step 3: Commit**

```bash
git add src/scripts/install-tool.ts tests/install-tool.test.ts
git commit -m "feat: add install-tool script with tests"
```

---

### Task 7: Update Installer to Copy Scripts

**Files:**
- Modify: `src/install.ts`

- [ ] **Step 1: Modify install.ts to also copy scripts directory**

The current `installSkill` function copies SKILL.md and `.workspace-templates/`. We need to ensure the scripts directory inside `.workspace-templates/` is also copied. Since the existing code already does a recursive copy of `.workspace-templates/` via `copyDirSync`, scripts will be included automatically once we add them to `templates/.workspace-templates/scripts/`.

However, we also need to copy the scripts to the skill directory root so agents can invoke them directly. Add a new copy operation:

```typescript
// src/install.ts — add after the .workspace-templates copy block (before the return statement)

    // Copy scripts to skill root for direct invocation
    const scriptsSrc = path.join(templatesDir, '.workspace-templates', 'scripts');
    if (fs.existsSync(scriptsSrc)) {
      const scriptsDest = path.join(skillDir, 'scripts');
      copyDirSync(scriptsSrc, scriptsDest);
    }
```

Full modified file:

```typescript
import * as fs from 'fs';
import * as path from 'path';

export interface InstallResult {
  success: boolean;
  skillPath: string;
  error?: string;
}

/**
 * Walk up from startDir looking for package.json or .git directory.
 * Returns the first parent containing a marker, or startDir if none found.
 */
export function detectProjectRoot(startDir: string): string {
  let current = path.resolve(startDir);
  const root = path.parse(current).root;

  while (current !== root) {
    const hasPackageJson = fs.existsSync(path.join(current, 'package.json'));
    const hasGit = fs.existsSync(path.join(current, '.git'));

    if (hasPackageJson || hasGit) {
      return current;
    }

    current = path.dirname(current);
  }

  return startDir;
}

/**
 * Recursively copy a directory, overwriting existing files.
 */
function copyDirSync(src: string, dest: string): void {
  if (!fs.existsSync(src)) {
    throw new Error(`Source directory not found: ${src}`);
  }

  fs.mkdirSync(dest, { recursive: true });

  const entries = fs.readdirSync(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      copyDirSync(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

/**
 * Install the workspace-maxxing skill into a project.
 * Copies SKILL.md, .workspace-templates/, and scripts/ to .agents/skills/workspace-maxxing/
 */
export async function installSkill(
  projectRoot: string,
  templatesDir: string,
): Promise<InstallResult> {
  const skillDir = path.join(projectRoot, '.agents', 'skills', 'workspace-maxxing');

  try {
    // Copy SKILL.md
    const skillMdSrc = path.join(templatesDir, 'SKILL.md');
    const skillMdDest = path.join(skillDir, 'SKILL.md');
    fs.mkdirSync(path.dirname(skillMdDest), { recursive: true });
    fs.copyFileSync(skillMdSrc, skillMdDest);

    // Copy .workspace-templates/
    const workspaceTemplatesSrc = path.join(templatesDir, '.workspace-templates');
    const workspaceTemplatesDest = path.join(skillDir, '.workspace-templates');
    copyDirSync(workspaceTemplatesSrc, workspaceTemplatesDest);

    // Copy scripts to skill root for direct invocation
    const scriptsSrc = path.join(templatesDir, '.workspace-templates', 'scripts');
    if (fs.existsSync(scriptsSrc)) {
      const scriptsDest = path.join(skillDir, 'scripts');
      copyDirSync(scriptsSrc, scriptsDest);
    }

    return { success: true, skillPath: skillDir };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { success: false, skillPath: skillDir, error: message };
  }
}
```

- [ ] **Step 2: Update integration test to verify scripts are copied**

Modify `tests/integration.test.ts` — add scripts to the expected files list:

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
];
```

- [ ] **Step 3: Run all tests to verify**

```bash
npm test
```

Expected: All tests PASS (existing + new)

- [ ] **Step 4: Commit**

```bash
git add src/install.ts tests/integration.test.ts
git commit -m "feat: update installer to copy scripts directory"
```

---

### Task 8: Copy Scripts to Templates Directory

**Files:**
- Create: `templates/.workspace-templates/scripts/scaffold.ts`
- Create: `templates/.workspace-templates/scripts/validate.ts`
- Create: `templates/.workspace-templates/scripts/install-tool.ts`

- [ ] **Step 1: Copy compiled script content to templates**

The templates directory contains the files that get distributed. Copy the content from `src/scripts/` to `templates/.workspace-templates/scripts/`. These should be identical copies — the same TypeScript source that gets compiled and tested.

Create the scripts directory:
```bash
mkdir -p templates/.workspace-templates/scripts
```

Copy each file:
```bash
cp src/scripts/scaffold.ts templates/.workspace-templates/scripts/scaffold.ts
cp src/scripts/validate.ts templates/.workspace-templates/scripts/validate.ts
cp src/scripts/install-tool.ts templates/.workspace-templates/scripts/install-tool.ts
```

- [ ] **Step 2: Run all tests to verify**

```bash
npm test
```

Expected: All tests PASS (integration test now verifies scripts are copied)

- [ ] **Step 3: Commit**

```bash
git add templates/.workspace-templates/scripts/
git commit -m "feat: add scripts to workspace templates for distribution"
```

---

### Task 9: Enhance SKILL.md with Available Scripts Section

**Files:**
- Modify: `templates/SKILL.md`

- [ ] **Step 1: Update SKILL.md with scripts documentation**

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

## Process

1. CAPTURE INTENT — Ask: "What workflow do you want to automate?"
2. PROPOSE STRUCTURE — Design workspace with numbered folders, CONTEXT.md routing files, canonical sources
3. GET APPROVAL — Present plan. Wait. Do not build until approved.
4. BUILD WORKSPACE — Run: `node scripts/scaffold.ts --name "<name>" --stages "<stages>" --output ./workspace`
5. VALIDATE — Run: `node scripts/validate.ts --workspace ./workspace`. Fix any failures.
6. ASSESS TOOLS — Scan environment. List available tools. Propose missing tools needed. Get approval.
7. INSTALL TOOLS — For each approved tool: `node scripts/install-tool.ts --tool "<name>" --manager <mgr> --workspace ./workspace`
8. FINAL VALIDATE — Run validate.ts one more time to confirm compliance.
9. DELIVER — Output: workspace folder + skill package + usage guide

## When to Use Scripts vs Manual

- **Scripts:** For structure creation, validation, and tool installation
- **Manual:** For writing content inside CONTEXT.md files, customizing stage descriptions, adding domain-specific instructions

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

Add assertions to `tests/integration.test.ts` for the new SKILL.md sections:

```typescript
// Add to the SKILL.md assertions in the first integration test:
expect(skillContent).toContain('## Available Scripts');
expect(skillContent).toContain('scaffold.ts');
expect(skillContent).toContain('validate.ts');
expect(skillContent).toContain('install-tool.ts');
```

- [ ] **Step 3: Run all tests to verify**

```bash
npm test
```

Expected: All tests PASS

- [ ] **Step 4: Commit**

```bash
git add templates/SKILL.md tests/integration.test.ts
git commit -m "feat: enhance SKILL.md with Available Scripts section"
```

---

### Task 10: Final Verification & All Tests

**Files:**
- All files

- [ ] **Step 1: Run full test suite**

```bash
npm test
```

Expected output: All tests pass (Phase 1: 33 tests + Phase 2: ~24 new tests = ~57 total)

- [ ] **Step 2: Build and verify no TypeScript errors**

```bash
npm run build
```

Expected: No errors, output in `dist/`

- [ ] **Step 3: Verify dist/scripts/ exists**

```bash
ls dist/scripts/
```

Expected: `scaffold.js`, `validate.js`, `install-tool.js`

- [ ] **Step 4: Commit final state**

```bash
git add -A
git commit -m "feat: workspace builder logic complete — scaffold, validate, install-tool"
```

---

## Self-Review

### 1. Spec Coverage Check

| Spec Requirement | Task |
|---|---|
| scaffold.ts generates ICM workspace from JSON plan | Task 1-2 |
| scaffold.ts CLI: --name, --stages, --output, --force | Task 2 |
| scaffold.ts creates SYSTEM.md, CONTEXT.md, stage folders, 00-meta, README.md | Task 1-2 |
| scaffold.ts dependencies: Node.js builtins only | Task 2 |
| validate.ts checks SYSTEM.md exists with folder map | Task 3-4 |
| validate.ts checks CONTEXT.md at root | Task 3-4 |
| validate.ts checks numbered folders have CONTEXT.md | Task 3-4 |
| validate.ts checks no empty CONTEXT.md | Task 3-4 |
| validate.ts checks no duplicate content (>50 chars) | Task 3-4 |
| validate.ts exit code 0/1, structured output | Task 4 |
| install-tool.ts runs install command | Task 5-6 |
| install-tool.ts updates 00-meta/tools.md | Task 5-6 |
| install-tool.ts supports npm, pip, npx, brew | Task 5-6 |
| install-tool.ts fails on non-zero exit | Task 5-6 |
| Enhanced SKILL.md with Available Scripts | Task 9 |
| Installer copies scripts | Task 7-8 |
| Tests for all three scripts | Tasks 1, 3, 5 |
| Integration: scaffold → validate → pass | Covered by scaffold tests + integration test |

All requirements covered. ✓

### 2. Placeholder Scan

No TBD, TODO, "add tests for the above", "handle edge cases", or "similar to Task N" patterns found. All steps contain complete code. ✓

### 3. Type Consistency

- `ScaffoldOptions` interface defined in Task 2, used in Task 1 tests ✓
- `ValidationResult` and `CheckResult` interfaces defined in Task 4, used in Task 3 tests ✓
- `InstallToolOptions` and `PackageManager` type defined in Task 6, used in Task 5 tests ✓
- All scripts use `require.main === module` pattern for CLI entry ✓
- All exported functions match test imports ✓

---

Plan complete. Ready for execution.